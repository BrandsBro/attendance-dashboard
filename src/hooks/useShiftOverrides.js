'use client'

import { useState, useEffect, useCallback } from 'react'
import {
  loadShiftOverrides, addShiftOverride, removeShiftOverride
} from '@/lib/shiftOverrides'

export function useShiftOverrides() {
  const [overrides, setOverrides] = useState({})

  useEffect(() => {
    setOverrides(loadShiftOverrides())
  }, [])

  const addOverride = useCallback((userId, entry) => {
    setOverrides(prev => addShiftOverride(prev, userId, entry))
  }, [])

  const removeOverride = useCallback((userId, id) => {
    setOverrides(prev => removeShiftOverride(prev, userId, id))
  }, [])

  return { overrides, addOverride, removeOverride }
}
