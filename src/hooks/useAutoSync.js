'use client'

import { useEffect, useRef, useCallback } from 'react'
import { syncAll } from '@/lib/googleSheetSync'
import { loadRawRecords } from '@/lib/storage'
import { calcPayroll } from '@/lib/payroll'

const DEBOUNCE_MS = 3000 // wait 3s after last change before syncing

export function useAutoSync({
  summary, schedules, holidays,
  profiles, leaveRecords, payrollSettings,
  shiftOverrides, getSettings,
}) {
  const timerRef  = useRef(null)
  const syncingRef = useRef(false)

  const doSync = useCallback(async () => {
    if (syncingRef.current) return
    syncingRef.current = true
    try {
      const employees    = summary?.employees ?? []
      const rawRecords   = loadRawRecords()

      const payrollSummary = employees.map(emp => {
        const s  = getSettings ? getSettings(emp.userId) : {}
        const lr = leaveRecords?.[emp.userId] ?? []
        const p  = calcPayroll(emp, s, lr)
        return { ...p, userId: emp.userId, name: emp.name, currency: s.currency || 'BDT' }
      })

      await syncAll({
        employees:          profiles,
        attendanceRecords:  rawRecords,
        attendanceSummary:  summary,
        leaveRecords,
        payrollSettings,
        payrollSummary,
        shiftOverrides,
        holidays,
        schedules,
      })
    } catch(e) {
      console.warn('Auto-sync failed:', e.message)
    } finally {
      syncingRef.current = false
    }
  }, [summary, schedules, holidays, profiles, leaveRecords, payrollSettings, shiftOverrides, getSettings])

  // Debounced auto-sync on any data change
  useEffect(() => {
    if (!profiles || Object.keys(profiles).length === 0) return
    if (timerRef.current) clearTimeout(timerRef.current)
    timerRef.current = setTimeout(doSync, DEBOUNCE_MS)
    return () => clearTimeout(timerRef.current)
  }, [
    JSON.stringify(profiles),
    JSON.stringify(leaveRecords),
    JSON.stringify(payrollSettings),
    JSON.stringify(shiftOverrides),
    JSON.stringify(holidays),
    JSON.stringify(schedules),
    summary?.processedAt,
  ])
}
