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
  // On load — if no local data, try fetching from Sheets
  useEffect(() => {
    async function fetchFromSheets() {
      try {
        const res  = await fetch('/api/sheets?action=read&sheet=Attendance_Records')
        const data = await res.json()
        if (!data.rows || data.rows.length === 0) return

        // Convert sheet rows back to summary format
        const empMap = {}

        const parseMin = s => {
          if (!s || s === '0m') return 0
          const h = parseInt((String(s).match(/(\d+)h/) || [0,0])[1]) || 0
          const m = parseInt((String(s).match(/(\d+)m/) || [0,0])[1]) || 0
          return h * 60 + m
        }

        const fixDate = d => {
          if (!d) return ''
          const s = String(d)
          if (s.includes('T')) {
            // Google Sheets UTC date — add 6 hours for BD timezone
            const dt = new Date(s)
            dt.setUTCHours(dt.getUTCHours() + 6)
            return dt.toISOString().slice(0, 10)
          }
          const match = s.match(/^(\d{4}-\d{2}-\d{2})/)
          return match ? match[1] : s
        }

        const timeToISO = (dateStr, timeStr) => {
          if (!timeStr || timeStr === '' || timeStr === '0') return null
          try {
            const s = String(timeStr)
            // Google Sheets returns times as 1899-12-30T... ISO strings
            if (s.includes('1899-12-30')) {
              const t   = new Date(s)
              // Extract hours/minutes in UTC and apply to correct date
              const h   = t.getUTCHours()
              const m   = t.getUTCMinutes()
              const dt  = new Date(dateStr + 'T00:00:00.000Z')
              dt.setUTCHours(h, m, 0, 0)
              return dt.toISOString()
            }
            // Regular time string like "10:07 AM"
            const dt = new Date(dateStr + ' ' + s)
            if (isNaN(dt.getTime())) return null
            return dt.toISOString()
          } catch { return null }
        }

        for (const row of data.rows) {
          const uid  = String(row['User ID'] || '').trim()
          if (!uid) continue
          const date = fixDate(row['Date'])
          if (!date) continue

          if (!empMap[uid]) {
            empMap[uid] = {
              userId: uid,
              name: String(row['Name'] || ''),
              department: String(row['Department'] || ''),
              shift: String(row['Shift'] || ''),
              days: [],
              workingDays: 0,
              totalPresenceMinutes: 0,
              totalLateMinutes: 0,
              totalOvertimeMinutes: 0,
              lateDays: 0,
            }
          }

          const isOff    = row['Status'] === 'Weekend' || row['Status'] === 'Holiday'
          const presence = parseMin(row['Presence'])
          const late     = parseMin(row['Late'])
          const ot       = parseMin(row['OT'])

          empMap[uid].days.push({
            date,
            inTime:          timeToISO(date, row['In']),
            outTime:         timeToISO(date, row['Out']),
            presenceMinutes: presence,
            lateMinutes:     late,
            overtimeMinutes: ot,
            isWeekend:       row['Status'] === 'Weekend',
            isHoliday:       row['Status'] === 'Holiday',
            effectiveLogin:  row['Scheduled In']  || '09:00',
            effectiveLogout: row['Scheduled Out'] || '18:00',
            manualIn: false,
            manualOut: false,
          })

          if (!isOff && row['Status'] !== 'Absent') {
            empMap[uid].workingDays++
            empMap[uid].totalPresenceMinutes += presence
          }
          empMap[uid].totalLateMinutes     += late
          empMap[uid].totalOvertimeMinutes += ot
          if (late > 0) empMap[uid].lateDays++
        }

        const employees = Object.values(empMap)
        if (employees.length === 0) return

        const allDates = data.rows.map(r => fixDate(r['Date'])).filter(Boolean).sort()
        const s = {
          employees,
          source: 'sheets',
          sourceLabel: 'Google Sheets',
          dateRange: { from: allDates[0], to: allDates[allDates.length-1] },
          totalPresenceMinutes: employees.reduce((a,e) => a + e.totalPresenceMinutes, 0),
          totalLateMinutes:     employees.reduce((a,e) => a + e.totalLateMinutes, 0),
          totalOvertimeMinutes: employees.reduce((a,e) => a + e.totalOvertimeMinutes, 0),
        }
        setSummary(s)
        setStatus('done')
        console.log('✅ Loaded from Google Sheets:', employees.length, 'employees')
      } catch(e) {
        console.warn('Could not load from Sheets:', e.message)
      }
    }

    // Only fetch from sheets if no local data
    const cached = loadCache()
    if (!cached?.summary) {
      setStatus('loading')
      fetchFromSheets()
    }
  }, [])

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
