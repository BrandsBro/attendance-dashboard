'use client'

import { useState, useEffect, useCallback } from 'react'
import { loadPayrollSettings, savePayrollSettings, DEFAULT_SETTINGS } from '@/lib/payroll'
import { syncPayrollSettings } from '@/lib/googleSheetSync'

export function usePayrollSettings() {
  const [settings, setSettings] = useState({})

  useEffect(() => { setSettings(loadPayrollSettings()) }, [])

  const updateSettings = useCallback((userId, data) => {
    setSettings(prev => {
      const next = { ...prev, [userId]: { ...DEFAULT_SETTINGS, ...(prev[userId] ?? {}), ...data } }
      savePayrollSettings(next)
      syncPayrollSettings(next).catch(() => {})
      return next
    })
  }, [])

  const updateGlobal = useCallback((data) => {
    setSettings(prev => {
      const next = { ...prev, _global: { ...DEFAULT_SETTINGS, ...(prev._global ?? {}), ...data } }
      savePayrollSettings(next)
      syncPayrollSettings(next).catch(() => {})
      return next
    })
  }, [])

  function getSettings(userId) {
    return { ...DEFAULT_SETTINGS, ...(settings._global ?? {}), ...(settings[userId] ?? {}) }
  }

  return { settings, updateSettings, updateGlobal, getSettings }
}
