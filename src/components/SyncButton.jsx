'use client'

import { useState }             from 'react'
import { useAttendanceData }    from '@/hooks/useAttendanceData'
import { useEmployeeProfiles }  from '@/hooks/useEmployeeProfiles'
import { useLeaveRecords }      from '@/hooks/useLeaveRecords'
import { usePayrollSettings }   from '@/hooks/usePayrollSettings'
import { useShiftOverrides }    from '@/hooks/useShiftOverrides'
import { syncAll }              from '@/lib/sheetsSync'

export default function SyncButton() {
  const { summary, schedules, holidays }       = useAttendanceData()
  const { profiles, options }                  = useEmployeeProfiles(summary?.employees ?? [])
  const { records: leaveRecords }              = useLeaveRecords()
  const { settings: payrollSettings }          = usePayrollSettings()
  const { overrides: shiftOverrides }          = useShiftOverrides()

  const [syncing,   setSyncing]   = useState(false)
  const [lastSync,  setLastSync]  = useState(null)
  const [syncError, setSyncError] = useState(null)

  async function handleSync() {
    setSyncing(true)
    setSyncError(null)

    try {
      // Debug — log exactly what we have
      console.log('profiles:', Object.keys(profiles).length)
      console.log('summary employees:', summary?.employees?.length ?? 0)
      console.log('leaveRecords:', Object.keys(leaveRecords).length)
      console.log('payrollSettings:', Object.keys(payrollSettings).length)
      console.log('shiftOverrides:', Object.keys(shiftOverrides).length)
      console.log('holidays:', holidays?.length ?? 0)
      console.log('schedules:', Object.keys(schedules ?? {}).length)
      console.log('options:', Object.keys(options).length)

      const result = await syncAll({
        profiles,
        summary,
        leaveRecords,
        payrollSettings,
        shiftOverrides,
        holidays,
        schedules,
        options,
      })

      console.log('Sync result:', result)

      if (result.ok) {
        setLastSync(new Date().toISOString())
      } else {
        setSyncError(result.error || 'Sync failed')
      }
    } catch(e) {
      console.error('Sync error:', e)
      setSyncError(e.message)
    } finally {
      setSyncing(false)
    }
  }

  return (
    <div className="sync-wrap">
      <button
        className={'btn sync-btn' + (syncing ? ' syncing' : '')}
        onClick={handleSync}
        disabled={syncing}
      >
        <span className={'sync-icon' + (syncing ? ' spin' : '')}>⟳</span>
        {syncing ? 'Syncing…' : 'Sync to Sheets'}
      </button>
      {lastSync && !syncing && (
        <span className="sync-last">
          Synced {new Date(lastSync).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })}
        </span>
      )}
      {syncError && (
        <span className="sync-error" title={syncError}>⚠ {syncError}</span>
      )}
    </div>
  )
}
