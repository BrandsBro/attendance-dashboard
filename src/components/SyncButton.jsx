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
  const { profiles, options } = useEmployeeProfiles()
  const { records: leaveRecords }              = useLeaveRecords()
  const { settings: payrollSettings }          = usePayrollSettings()
  const { overrides: shiftOverrides }          = useShiftOverrides()

  const [syncing,   setSyncing]   = useState(false)
  const [lastSync,  setLastSync]  = useState(null)
  const [syncError, setSyncError] = useState(null)

  async function handleSync() {
    setSyncing(true)
    setSyncError(null)

    console.group('🔄 SYNC TO GOOGLE SHEETS')

    try {
      // ── 1. Log raw data ──────────────────────────────────
      console.group('📦 Raw data check')
      console.log('profiles type:', typeof profiles, '| keys:', Object.keys(profiles).length)
      console.log('profiles sample:', Object.values(profiles)[0] ?? 'EMPTY')
      console.log('summary:', summary ? `✓ ${summary.employees?.length} employees` : '✗ null')
      console.log('leaveRecords type:', typeof leaveRecords, '| keys:', Object.keys(leaveRecords).length)
      console.log('payrollSettings type:', typeof payrollSettings, '| keys:', Object.keys(payrollSettings).length)
      console.log('shiftOverrides type:', typeof shiftOverrides, '| keys:', Object.keys(shiftOverrides).length)
      console.log('holidays:', Array.isArray(holidays) ? `✓ array [${holidays.length}]` : `✗ ${typeof holidays}`)
      console.log('schedules type:', typeof schedules, '| keys:', Object.keys(schedules ?? {}).length)
      console.log('options type:', typeof options, '| keys:', Object.keys(options).length)
      console.groupEnd()

      // ── 2. Build payload ──────────────────────────────────
      console.group('🏗️ Building payload')
      const payload = {
        profiles,
        summary,
        leaveRecords,
        payrollSettings,
        shiftOverrides,
        holidays,
        schedules,
        options,
      }
      console.log('Payload keys:', Object.keys(payload))
      console.groupEnd()

      // ── 3. Call syncAll ───────────────────────────────────
      console.group('📡 Calling syncAll')
      console.time('sync duration')
      const result = await syncAll(payload)
      console.timeEnd('sync duration')
      console.log('Result:', result)
      console.groupEnd()

      // ── 4. Handle result ──────────────────────────────────
      if (result?.ok) {
        console.log('✅ Sync successful!', result)
        setLastSync(new Date().toISOString())
      } else {
        const err = result?.error || 'Unknown error'
        console.error('❌ Sync failed:', err)
        setSyncError(err)
      }

    } catch(e) {
      console.error('💥 Sync exception:', e)
      console.error('Stack:', e.stack)
      setSyncError(e.message)
    } finally {
      setSyncing(false)
      console.groupEnd()
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
