'use client'
import { loadDashSettings, saveDashSettings } from '@/components/EmployeeDetail'

import { useState, useCallback, useEffect } from 'react'
import { parseFile, parseCsv }              from '@/lib/parseAttendance'
import { calculateStats }                   from '@/lib/calculateStats'
import { fetchSheetCsv, isValidSheetsUrl }  from '@/lib/googleSheets'
import { syncSchedules, syncHolidays, syncAttendanceSummary, syncAll } from '@/lib/googleSheetSync'
import { loadCache, saveCache, clearCache, saveRawRecords, loadRawRecords } from '@/lib/storage'
import { DEFAULT_LOGIN_TIME, DEFAULT_LOGOUT_TIME, DEFAULT_GRACE_MINUTES }   from '@/lib/constants'

export function useAttendanceData() {
  const [summary,     setSummary]     = useState(null)
  const [schedules,   setSchedules]   = useState({})
  const [settingsVer,  setSettingsVer]  = useState(0)
  const [holidays,    setHolidays]    = useState([])
  const [rawRecords,  setRawRecords]  = useState(null)
  const [timeEdits,   setTimeEdits]   = useState({}) // { userId: { date: { in, out } } }
  const [status,      setStatus]      = useState('idle')
  const [errorMsg,    setErrorMsg]    = useState('')

  // Listen for dashboard settings changes
  useEffect(() => {
    function onSettingsChange() { setSettingsVer(v => v + 1) }
    window.addEventListener('dashSettingsChanged', onSettingsChange)
    return () => window.removeEventListener('dashSettingsChanged', onSettingsChange)
  }, [])

  // Recalculate when settings change
  useEffect(() => {
    if (settingsVer === 0) return // skip initial
    const records = loadRawRecords()
    if (!records || records.length === 0) return
    const dashSetts = loadDashSettings()
    const mergedDash = {}
    for (const [userId, s] of Object.entries(dashSetts)) {
      if (userId === '_global' || userId.includes('_rows')) continue
      const g = dashSetts._global ?? {}
      mergedDash[userId] = {
        ...(schedules[userId] ?? {}),
        scheduledLoginTime:  s.loginTime   ?? g.loginTime   ?? '09:00',
        scheduledLogoutTime: s.logoutTime  ?? g.logoutTime  ?? '18:00',
        gracePeriodMinutes:  s.gracePeriod ?? g.gracePeriod ?? 0,
      }
    }
    const merged = { ...schedules, ...mergedDash }
    const s = calculateStats(records, merged, summary?.source ?? 'upload', summary?.sourceLabel ?? '', holidays, timeEdits)
    setSummary(s)
    setSchedules(merged)
  }, [settingsVer])

  useEffect(() => {
    const cached = loadCache()
    if (cached) {
      setSummary(cached.summary)
      setSchedules(cached.schedules ?? {})
      setHolidays(cached.holidays   ?? [])
      setTimeEdits(cached.timeEdits  ?? {})
      setStatus('done')
    }
    const records = loadRawRecords()
    if (records) setRawRecords(records)
  }, [])

  function buildDefaultSchedules(records) {
    const defaults = {}
    for (const r of records) {
      if (!defaults[r.userId]) {
        defaults[r.userId] = {
          userId:              r.userId,
          name:                r.name,
          scheduledLoginTime:  DEFAULT_LOGIN_TIME,
          scheduledLogoutTime: DEFAULT_LOGOUT_TIME,
          gracePeriodMinutes:  DEFAULT_GRACE_MINUTES,
          shift:               null,
        }
      }
    }
    return defaults
  }

  function persist(s, sc, hols, te, records) {
    saveCache({ summary: s, schedules: sc, holidays: hols, timeEdits: te })
    if (records) saveRawRecords(records)
  }

  function runCalc(records, sc, hols, te) {
    const s = calculateStats(
      records, sc,
      summary?.source ?? 'upload',
      summary?.sourceLabel ?? '',
      hols, te
    )
    setSummary(s)
    return s
  }

  const processFile = useCallback(async (file) => {
    setStatus('loading')
    setErrorMsg('')
    try {
      const records = await parseFile(file)
      const initSc  = buildDefaultSchedules(records)
      // Merge dashboard_settings_v1 into schedules
      const dashSetts = loadDashSettings()
      const mergedDash = {}
      for (const [userId, s] of Object.entries(dashSetts)) {
        if (userId === '_global' || userId.includes('_rows')) continue
        const global = dashSetts._global ?? {}
        mergedDash[userId] = {
          ...(schedules[userId] ?? {}),
          scheduledLoginTime:  s.loginTime   ?? global.loginTime   ?? '09:00',
          scheduledLogoutTime: s.logoutTime  ?? global.logoutTime  ?? '18:00',
          gracePeriodMinutes:  s.gracePeriod ?? global.gracePeriod ?? 0,
        }
      }
      const merged  = { ...initSc, ...schedules, ...mergedDash }
      const s       = calculateStats(records, merged, 'upload', file.name, holidays, timeEdits)
      setSummary(s); setRawRecords(records); setSchedules(merged)
      persist(s, merged, holidays, timeEdits, records)
      // Clear all row overrides on new upload — keep only global settings
      const uploadDashSetts = loadDashSettings()
      const cleanSetts = { _global: uploadDashSetts._global ?? {} }
      saveDashSettings(cleanSetts)
      window.dispatchEvent(new CustomEvent('dashSettingsChanged'))
      setStatus('done')
      // Auto sync ALL data to Google Sheets
      try {
        // Build attendance records rows
        const attRows = records.map(r => ({
          'Serial No':  String(r.serialNo  ?? ''),
          'User ID':    String(r.userId    || ''),
          'Name':       String(r.name      || ''),
          'Department': String(r.department|| ''),
          'Date/Time':  r.dateTime instanceof Date ? r.dateTime.toISOString() : String(r.dateTime || ''),
          'Status':     String(r.status    || ''),
        }))

        // Build summary rows
        const summaryRows = s.employees.map(e => ({
          'User ID':        String(e.userId               || ''),
          'Name':           String(e.name                 || ''),
          'Department':     String(e.department           || ''),
          'Shift':          String(e.shift                || ''),
          'Working Days':   Number(e.workingDays          ?? 0),
          'Presence (min)': Number(e.totalPresenceMinutes ?? 0),
          'Late (min)':     Number(e.totalLateMinutes     ?? 0),
          'Overtime (min)': Number(e.totalOvertimeMinutes ?? 0),
          'Late Days':      Number(e.lateDays             ?? 0),
          'Date From':      String(s.dateRange?.from      || ''),
          'Date To':        String(s.dateRange?.to        || ''),
          'Last Updated':   new Date().toISOString(),
        }))

        // Build schedules rows
        const schedRows = Object.values(merged).map(sc => ({
          'User ID':     String(sc.userId              || ''),
          'Name':        String(sc.name                || ''),
          'Login Time':  String(sc.scheduledLoginTime  || '09:00'),
          'Logout Time': String(sc.scheduledLogoutTime || '18:00'),
          'Grace (min)': Number(sc.gracePeriodMinutes  ?? 0),
          'Shift':       String(sc.shift               || ''),
          'Last Updated': new Date().toISOString(),
        }))

        const data = {}
        if (attRows.length > 0)     data['Attendance_Records']  = { headers: Object.keys(attRows[0]),    rows: attRows }
        if (summaryRows.length > 0) data['Attendance_Summary']  = { headers: Object.keys(summaryRows[0]), rows: summaryRows }
        if (schedRows.length > 0)   data['Schedules']           = { headers: Object.keys(schedRows[0]),  rows: schedRows }

        await fetch('/api/sheets', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ action: 'syncAll', data })
        })
        console.log('✅ Attendance data synced to Sheets')
      } catch(e) { console.warn('Auto-sync after upload failed:', e.message) }
    } catch (e) { setErrorMsg(String(e)); setStatus('error') }
  }, [schedules, holidays, timeEdits, settingsVer])

  const processSheetUrl = useCallback(async (url) => {
    if (!isValidSheetsUrl(url)) { setErrorMsg('Invalid Google Sheets URL.'); setStatus('error'); return }
    setStatus('loading'); setErrorMsg('')
    try {
      const csv     = await fetchSheetCsv(url)
      const records = parseCsv(csv)
      const initSc  = buildDefaultSchedules(records)
      const dashSetts2 = loadDashSettings()
      const mergedDash2 = {}
      for (const [userId, s] of Object.entries(dashSetts2)) {
        if (userId === '_global' || userId.includes('_rows')) continue
        const global2 = dashSetts2._global ?? {}
        mergedDash2[userId] = {
          ...(schedules[userId] ?? {}),
          scheduledLoginTime:  s.loginTime   ?? global2.loginTime   ?? '09:00',
          scheduledLogoutTime: s.logoutTime  ?? global2.logoutTime  ?? '18:00',
          gracePeriodMinutes:  s.gracePeriod ?? global2.gracePeriod ?? 0,
        }
      }
      const merged  = { ...initSc, ...schedules, ...mergedDash2 }
      const s       = calculateStats(records, merged, 'sheets', url, holidays, timeEdits)
      setSummary(s); setRawRecords(records); setSchedules(merged)
      persist(s, merged, holidays, timeEdits, records)
      setStatus('done')
    } catch (e) { setErrorMsg(String(e)); setStatus('error') }
  }, [schedules, holidays, timeEdits, settingsVer])

  const updateSchedule = useCallback((userId, schedule) => {
    setSchedules(prev => {
      const next    = { ...prev, [userId]: schedule }
      const records = rawRecords ?? loadRawRecords()
      if (records) {
        const s = calculateStats(records, next, summary?.source ?? 'upload', summary?.sourceLabel ?? '', holidays, timeEdits)
        setSummary(s)
        persist(s, next, holidays, timeEdits, null)
        syncSchedules(next).catch(() => {})
      }
      return next
    })
  }, [rawRecords, holidays, summary, timeEdits])

  // Single handler for in/out time edits per day
  const updateLogoutOverride = useCallback((userId, date, isoStr, _r, _a, field = 'out') => {
    setTimeEdits(prev => {
      const next = {
        ...prev,
        [userId]: {
          ...(prev[userId] ?? {}),
          [date]: {
            ...(prev[userId]?.[date] ?? {}),
            [field]: isoStr,
          },
        },
      }
      const records = rawRecords ?? loadRawRecords()
      if (records) {
        const s = calculateStats(records, schedules, summary?.source ?? 'upload', summary?.sourceLabel ?? '', holidays, next)
        setSummary(s)
        persist(s, schedules, holidays, next, null)
      }
      return next
    })
  }, [rawRecords, schedules, holidays, summary])

  const updateHolidays = useCallback((newHolidays) => {
    setHolidays(newHolidays)
    const records = rawRecords ?? loadRawRecords()
    if (records) {
      const s = calculateStats(records, schedules, summary?.source ?? 'upload', summary?.sourceLabel ?? '', newHolidays, timeEdits)
      setSummary(s)
      persist(s, schedules, newHolidays, timeEdits, null)
      syncHolidays(newHolidays).catch(() => {})
    }
  }, [rawRecords, schedules, summary, timeEdits])

  const clearData = useCallback(async () => {
    clearCache()
    setSummary(null); setSchedules({}); setHolidays([])
    setTimeEdits({}); setRawRecords(null)
    setStatus('idle'); setErrorMsg('')
    // Clear row overrides but keep global settings
    const dashSetts = loadDashSettings()
    const cleanSetts = { _global: dashSetts._global ?? {} }
    saveDashSettings(cleanSetts)
    window.dispatchEvent(new CustomEvent('dashSettingsChanged'))
    // Clear Google Sheets data tabs
    try {
      const sheetsToClean = ['Attendance_Records', 'Attendance_Summary', 'Schedules', 'Shift_Overrides', 'Sync_Log']
      for (const sheet of sheetsToClean) {
        await fetch('/api/sheets', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            action: 'sync',
            data: { [sheet]: { headers: [], rows: [] } }
          })
        })
      }
    } catch(e) { console.warn('Could not clear sheets:', e.message) }
  }, [])

  return {
    summary, schedules, holidays, status, errorMsg,
    processFile, processSheetUrl, updateSchedule,
    updateLogoutOverride, updateHolidays, clearData,
  }
}
