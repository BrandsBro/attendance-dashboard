'use client'

import { useState, useEffect, useCallback } from 'react'
import { loadShiftOverrides, addShiftOverride, removeShiftOverride } from '@/lib/shiftOverrides'
import { syncShiftOverrides } from '@/lib/googleSheetSync'

export function useShiftOverrides() {
  const [overrides, setOverrides] = useState({})

  useEffect(() => { setOverrides(loadShiftOverrides()) }, [])

  const addOverride = useCallback((userId, entry) => {
    setOverrides(prev => {
      const next = addShiftOverride(prev, userId, entry)
      syncShiftOverrides(next).catch(() => {})
      return next
    })
  }, [])

  const removeOverride = useCallback((userId, id) => {
    setOverrides(prev => {
      const next = removeShiftOverride(prev, userId, id)
      syncShiftOverrides(next).catch(() => {})
      return next
    })
  }, [])

  return { overrides, addOverride, removeOverride }
}
