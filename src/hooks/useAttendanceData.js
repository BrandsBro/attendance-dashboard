'use client'

import { useState, useCallback, useEffect } from 'react'
import { parseFile, parseCsv } from '@/lib/parseAttendance'
import { calculateStats } from '@/lib/calculateStats'
import { fetchSheetCsv, isValidSheetsUrl } from '@/lib/googleSheets'
import {
  loadCache, saveCache, clearCache,
  saveRawRecords, loadRawRecords,
} from '@/lib/storage'
import { DEFAULT_LOGIN_TIME, DEFAULT_LOGOUT_TIME } from '@/lib/constants'

export function useAttendanceData() {
  const [summary,    setSummary]    = useState(null)
  const [schedules,  setSchedules]  = useState({})
  const [overrides,  setOverrides]  = useState({})
  const [rawRecords, setRawRecords] = useState(null)
  const [status,     setStatus]     = useState('idle')
  const [errorMsg,   setErrorMsg]   = useState('')

  useEffect(() => {
    const cached = loadCache()
    if (cached) {
      setSummary(cached.summary)
      setSchedules(cached.schedules ?? {})
      setOverrides(cached.overrides ?? {})
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
          userId: r.userId,
          name:   r.name,
          scheduledLoginTime:  DEFAULT_LOGIN_TIME,
          scheduledLogoutTime: DEFAULT_LOGOUT_TIME,
        }
      }
    }
    return defaults
  }

  function persist(s, sc, ov, records) {
    saveCache({ summary: s, schedules: sc, overrides: ov })
    if (records) saveRawRecords(records)
  }

  function recalc(records, sc, ov, source, sourceLabel) {
    const newSummary = calculateStats(records, sc, source, sourceLabel, ov)
    setSummary(newSummary)
    return newSummary
  }

  const processFile = useCallback(async (file) => {
    setStatus('loading')
    setErrorMsg('')
    try {
      const records   = await parseFile(file)
      const initSched = buildDefaultSchedules(records)
      const merged    = { ...initSched, ...schedules }
      const newSum    = recalc(records, merged, overrides, 'upload', file.name)
      setRawRecords(records)
      setSchedules(merged)
      persist(newSum, merged, overrides, records)
      setStatus('done')
    } catch (e) {
      setErrorMsg(String(e))
      setStatus('error')
    }
  }, [schedules, overrides])

  const processSheetUrl = useCallback(async (url) => {
    if (!isValidSheetsUrl(url)) {
      setErrorMsg('Please enter a valid Google Sheets URL.')
      setStatus('error')
      return
    }
    setStatus('loading')
    setErrorMsg('')
    try {
      const csv       = await fetchSheetCsv(url)
      const records   = parseCsv(csv)
      const initSched = buildDefaultSchedules(records)
      const merged    = { ...initSched, ...schedules }
      const newSum    = recalc(records, merged, overrides, 'sheets', url)
      setRawRecords(records)
      setSchedules(merged)
      persist(newSum, merged, overrides, records)
      setStatus('done')
    } catch (e) {
      setErrorMsg(String(e))
      setStatus('error')
    }
  }, [schedules, overrides])

  const updateSchedule = useCallback((userId, schedule) => {
    setSchedules(prev => {
      const next    = { ...prev, [userId]: schedule }
      const records = rawRecords ?? loadRawRecords()
      if (records) {
        const newSum = recalc(records, next, overrides, summary?.source ?? 'upload', summary?.sourceLabel ?? '')
        persist(newSum, next, overrides, null)
      }
      return next
    })
  }, [rawRecords, overrides, summary])

  // Called when user manually picks In/Out for a specific day
  const updateOverride = useCallback((userId, date, inTime, outTime) => {
    setOverrides(prev => {
      const next = {
        ...prev,
        [userId]: {
          ...prev[userId],
          [date]: { inTime, outTime },
        },
      }
      const records = rawRecords ?? loadRawRecords()
      if (records) {
        const newSum = recalc(records, schedules, next, summary?.source ?? 'upload', summary?.sourceLabel ?? '')
        persist(newSum, schedules, next, null)
      }
      return next
    })
  }, [rawRecords, schedules, summary])

  const clearData = useCallback(() => {
    clearCache()
    setSummary(null)
    setSchedules({})
    setOverrides({})
    setRawRecords(null)
    setStatus('idle')
    setErrorMsg('')
  }, [])

  return {
    summary, schedules, overrides, status, errorMsg,
    processFile, processSheetUrl, updateSchedule, updateOverride, clearData,
  }
}
