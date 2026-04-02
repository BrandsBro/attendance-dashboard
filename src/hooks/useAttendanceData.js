'use client'

import { useState, useCallback, useEffect } from 'react'
import { parseFile, parseCsv }              from '@/lib/parseAttendance'
import { calculateStats }                   from '@/lib/calculateStats'
import { fetchSheetCsv, isValidSheetsUrl }  from '@/lib/googleSheets'
import { loadCache, saveCache, clearCache, saveRawRecords, loadRawRecords } from '@/lib/storage'
import { DEFAULT_LOGIN_TIME, DEFAULT_LOGOUT_TIME, DEFAULT_GRACE_MINUTES }   from '@/lib/constants'

export function useAttendanceData() {
  const [summary,     setSummary]     = useState(null)
  const [schedules,   setSchedules]   = useState({})
  const [holidays,    setHolidays]    = useState([])
  const [rawRecords,  setRawRecords]  = useState(null)
  const [timeEdits,   setTimeEdits]   = useState({}) // { userId: { date: { in, out } } }
  const [status,      setStatus]      = useState('idle')
  const [errorMsg,    setErrorMsg]    = useState('')

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
      const merged  = { ...initSc, ...schedules }
      const s       = calculateStats(records, merged, 'upload', file.name, holidays, timeEdits)
      setSummary(s); setRawRecords(records); setSchedules(merged)
      persist(s, merged, holidays, timeEdits, records)
      setStatus('done')
    } catch (e) { setErrorMsg(String(e)); setStatus('error') }
  }, [schedules, holidays, timeEdits])

  const processSheetUrl = useCallback(async (url) => {
    if (!isValidSheetsUrl(url)) { setErrorMsg('Invalid Google Sheets URL.'); setStatus('error'); return }
    setStatus('loading'); setErrorMsg('')
    try {
      const csv     = await fetchSheetCsv(url)
      const records = parseCsv(csv)
      const initSc  = buildDefaultSchedules(records)
      const merged  = { ...initSc, ...schedules }
      const s       = calculateStats(records, merged, 'sheets', url, holidays, timeEdits)
      setSummary(s); setRawRecords(records); setSchedules(merged)
      persist(s, merged, holidays, timeEdits, records)
      setStatus('done')
    } catch (e) { setErrorMsg(String(e)); setStatus('error') }
  }, [schedules, holidays, timeEdits])

  const updateSchedule = useCallback((userId, schedule) => {
    setSchedules(prev => {
      const next    = { ...prev, [userId]: schedule }
      const records = rawRecords ?? loadRawRecords()
      if (records) {
        const s = calculateStats(records, next, summary?.source ?? 'upload', summary?.sourceLabel ?? '', holidays, timeEdits)
        setSummary(s)
        persist(s, next, holidays, timeEdits, null)
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
    }
  }, [rawRecords, schedules, summary, timeEdits])

  const clearData = useCallback(() => {
    clearCache()
    setSummary(null); setSchedules({}); setHolidays([])
    setTimeEdits({}); setRawRecords(null)
    setStatus('idle'); setErrorMsg('')
  }, [])

  return {
    summary, schedules, holidays, status, errorMsg,
    processFile, processSheetUrl, updateSchedule,
    updateLogoutOverride, updateHolidays, clearData,
  }
}
