'use client'

import { useState, useCallback } from 'react'
import {
  pingSheets, syncAll,
  syncEmployees, syncLeaveRecords,
  syncHolidays, syncSchedules,
  syncShiftOverrides, syncPayrollSettings,
} from '@/lib/sheetsSync'

export function useGoogleSync() {
  const [syncing,  setSyncing]  = useState(false)
  const [lastSync, setLastSync] = useState(null)
  const [syncError,setSyncError]= useState(null)

  const sync = useCallback(async (payload) => {
    setSyncing(true)
    setSyncError(null)
    try {
      const result = await syncAll(payload)
      if (result.ok) {
        setLastSync(new Date().toISOString())
      } else {
        setSyncError(result.error || 'Sync failed')
      }
      return result
    } catch(e) {
      setSyncError(e.message)
      return { ok: false, error: e.message }
    } finally {
      setSyncing(false)
    }
  }, [])

  const ping = useCallback(async () => {
    const result = await pingSheets()
    return result.ok
  }, [])

  return { sync, ping, syncing, lastSync, syncError }
}
