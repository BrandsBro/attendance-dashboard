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
  const [summary,   setSummary]   = useState(null)
  const [schedules, setSchedules] = useState({})
  const [rawRecords, setRawRecords] = useState(null)
  const [status,    setStatus]    = useState('idle')   // idle | loading | done | error
  const [errorMsg,  setErrorMsg]  = useState('')

  // Load cache on mount
  useEffect(() => {
    const cached = loadCache()
    if (cached) {
      setSummary(cached.summary)
      setSchedules(cached.schedules ?? {})
      setStatus('done')
    }
    const records = loadRawRecords()
    if (records) setRawRecords(records)
  }, [])

  function buildDefaultSchedules(employees) {
    const defaults = {}
    for (const emp of employees) {
      defaults[emp.userId] = {
        userId: emp.userId,
        name:   emp.name,
        scheduledLoginTime:  DEFAULT_LOGIN_TIME,
        scheduledLogoutTime: DEFAULT_LOGOUT_TIME,
      }
    }
    return defaults
  }

  function persist(s, sc, records) {
    saveCache({ summary: s, schedules: sc })
    if (records) saveRawRecords(records)
  }

  const processFile = useCallback(async (file) => {
    setStatus('loading')
    setErrorMsg('')
    try {
      const records    = await parseFile(file)
      const initSched  = buildDefaultSchedules(
        [...new Map(records.map(r => [r.userId, r])).values()]
      )
      const merged     = { ...initSched, ...schedules }
      const newSummary = calculateStats(records, merged, 'upload', file.name)
      setSummary(newSummary)
      setRawRecords(records)
      setSchedules(merged)
      persist(newSummary, merged, records)
      setStatus('done')
    } catch (e) {
      setErrorMsg(String(e))
      setStatus('error')
    }
  }, [schedules])

  const processSheetUrl = useCallback(async (url) => {
    if (!isValidSheetsUrl(url)) {
      setErrorMsg('Please enter a valid Google Sheets URL.')
      setStatus('error')
      return
    }
    setStatus('loading')
    setErrorMsg('')
    try {
      const csv        = await fetchSheetCsv(url)
      const records    = parseCsv(csv)
      const initSched  = buildDefaultSchedules(
        [...new Map(records.map(r => [r.userId, r])).values()]
      )
      const merged     = { ...initSched, ...schedules }
      const newSummary = calculateStats(records, merged, 'sheets', url)
      setSummary(newSummary)
      setRawRecords(records)
      setSchedules(merged)
      persist(newSummary, merged, records)
      setStatus('done')
    } catch (e) {
      setErrorMsg(String(e))
      setStatus('error')
    }
  }, [schedules])

  // Recalculates instantly when a schedule changes — no re-upload needed
  const updateSchedule = useCallback((userId, schedule) => {
    setSchedules(prev => {
      const next = { ...prev, [userId]: schedule }
      const records = rawRecords ?? loadRawRecords()
      if (records) {
        const newSummary = calculateStats(
          records, next,
          summary?.source ?? 'upload',
          summary?.sourceLabel ?? ''
        )
        setSummary(newSummary)
        persist(newSummary, next, null)
      } else {
        saveCache({ summary, schedules: next })
      }
      return next
    })
  }, [rawRecords, summary])

  const clearData = useCallback(() => {
    clearCache()
    setSummary(null)
    setSchedules({})
    setRawRecords(null)
    setStatus('idle')
    setErrorMsg('')
  }, [])

  return {
    summary, schedules, status, errorMsg,
    processFile, processSheetUrl, updateSchedule, clearData,
  }
}
