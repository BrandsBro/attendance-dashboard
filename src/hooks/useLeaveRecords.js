'use client'

import { useState, useEffect, useCallback } from 'react'
import {
  loadLeaveRecords, addLeaveRecord,
  removeLeaveRecord, updateLeaveRecord
} from '@/lib/leaveRecords'

export function useLeaveRecords() {
  const [records, setRecords] = useState({})

  useEffect(() => {
    setRecords(loadLeaveRecords())
  }, [])

  const addRecord = useCallback((userId, entry) => {
    setRecords(prev => addLeaveRecord(prev, userId, entry))
  }, [])

  const removeRecord = useCallback((userId, id) => {
    setRecords(prev => removeLeaveRecord(prev, userId, id))
  }, [])

  const updateRecord = useCallback((userId, id, data) => {
    setRecords(prev => updateLeaveRecord(prev, userId, id, data))
  }, [])

  return { records, addRecord, removeRecord, updateRecord }
}
