'use client'

import { useState, useEffect, useCallback } from 'react'
import { loadLeaveRecords, addLeaveRecord, removeLeaveRecord, updateLeaveRecord } from '@/lib/leaveRecords'
import { syncLeaveRecords } from '@/lib/googleSheetSync'

export function useLeaveRecords() {
  const [records, setRecords] = useState({})

  useEffect(() => { setRecords(loadLeaveRecords()) }, [])

  const addRecord = useCallback((userId, entry) => {
    setRecords(prev => {
      const next = addLeaveRecord(prev, userId, entry)
      syncLeaveRecords(next).catch(() => {})
      return next
    })
  }, [])

  const removeRecord = useCallback((userId, id) => {
    setRecords(prev => {
      const next = removeLeaveRecord(prev, userId, id)
      syncLeaveRecords(next).catch(() => {})
      return next
    })
  }, [])

  const updateRecord = useCallback((userId, id, data) => {
    setRecords(prev => {
      const next = updateLeaveRecord(prev, userId, id, data)
      syncLeaveRecords(next).catch(() => {})
      return next
    })
  }, [])

  return { records, addRecord, removeRecord, updateRecord }
}
