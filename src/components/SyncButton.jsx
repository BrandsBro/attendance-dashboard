'use client'

import { useGoogleSync }       from '@/hooks/useGoogleSync'
import { useAttendanceData }   from '@/hooks/useAttendanceData'
import { useEmployeeProfiles } from '@/hooks/useEmployeeProfiles'
import { useLeaveRecords }     from '@/hooks/useLeaveRecords'
import { usePayrollSettings }  from '@/hooks/usePayrollSettings'
import { useShiftOverrides }   from '@/hooks/useShiftOverrides'
import { loadRawRecords }      from '@/lib/storage'

export default function SyncButton() {
  const { summary, schedules, holidays }          = useAttendanceData()
  const { profiles, options }                      = useEmployeeProfiles(summary?.employees ?? [])
  const { records: leaveRecords }                  = useLeaveRecords()
  const { settings: payrollSettings }              = usePayrollSettings()
  const { overrides: shiftOverrides }              = useShiftOverrides()
  const { sync, syncing, lastSync, syncError }     = useGoogleSync()

  async function handleSync() {
    await sync({
      profiles,
      summary,
      leaveRecords,
      payrollSettings,
      shiftOverrides,
      holidays,
      schedules,
      options,
    })
  }

  return (
    <div className="sync-wrap">
      <button
        className={'btn sync-btn' + (syncing ? ' syncing' : '')}
        onClick={handleSync}
        disabled={syncing}
        title="Sync all data to Google Sheets"
      >
        <span className={'sync-icon' + (syncing ? ' spin' : '')}>⟳</span>
        {syncing ? 'Syncing…' : 'Sync to Sheets'}
      </button>
      {lastSync && !syncing && (
        <span className="sync-last">
          Last sync {new Date(lastSync).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })}
        </span>
      )}
      {syncError && (
        <span className="sync-error" title={syncError}>⚠ Sync failed</span>
      )}
    </div>
  )
}
