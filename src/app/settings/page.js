'use client'

import { useState, useEffect } from 'react'
import { useAttendanceData }   from '@/hooks/useAttendanceData'
import { useEmployeeProfiles } from '@/hooks/useEmployeeProfiles'
import { useLeaveRecords }     from '@/hooks/useLeaveRecords'
import { usePayrollSettings }  from '@/hooks/usePayrollSettings'
import { useShiftOverrides }   from '@/hooks/useShiftOverrides'
import { loadRawRecords }      from '@/lib/storage'
import { calcPayroll }         from '@/lib/payroll'
import Sidebar                 from '@/components/Sidebar'

import {
  getSheetsUrl, setSheetsUrl,
  pingSheets, syncAll,
} from '@/lib/googleSheetSync'
import { useSheetsImport } from '@/hooks/useSheetsImport'
import { useAutoSync } from '@/hooks/useAutoSync'

// ── Status badge ──────────────────────────────────────────────
function StatusDot({ status }) {
  const MAP = {
    idle:    { color: '#9ca3af', label: 'Not synced' },
    syncing: { color: '#3b82f6', label: 'Syncing…'   },
    ok:      { color: '#10b981', label: 'Synced ✓'   },
    error:   { color: '#ef4444', label: 'Error'       },
  }
  const s = MAP[status] ?? MAP.idle
  return (
    <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6, fontSize: 12, fontWeight: 500, color: s.color }}>
      <span style={{ width: 8, height: 8, borderRadius: '50%', background: s.color, display: 'inline-block',
        boxShadow: status === 'syncing' ? `0 0 0 3px ${s.color}33` : 'none',
        animation: status === 'syncing' ? 'pulse 1.5s infinite' : 'none' }} />
      {s.label}
    </span>
  )
}

// ── Result row ────────────────────────────────────────────────
function ResultRow({ label, result }) {
  if (!result) return null
  const ok = result.ok !== false && !result.error
  return (
    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center',
      padding: '6px 10px', borderRadius: 6,
      background: ok ? '#f0fdf4' : '#fef2f2', fontSize: 12 }}>
      <span style={{ fontWeight: 500, color: ok ? '#065f46' : '#991b1b' }}>{label}</span>
      <span style={{ color: ok ? '#059669' : '#dc2626', fontFamily: 'DM Mono, monospace' }}>
        {ok ? `✓ ${result.rows ?? 0} rows` : `✗ ${result.error || 'failed'}`}
      </span>
    </div>
  )
}

export default function SettingsPage() {
  const { summary, schedules, holidays }             = useAttendanceData()
  const { profiles }                                  = useEmployeeProfiles()
  const { records: leaveRecords }                     = useLeaveRecords()
  const { settings: payrollSettings, getSettings }    = usePayrollSettings()
  const { overrides }                                 = useShiftOverrides()
  const { importFromSheets, status: importStatus, message: importMessage } = useSheetsImport()

  // Auto-sync on any data change
  useAutoSync({
    summary, schedules, holidays,
    profiles, leaveRecords,
    payrollSettings, shiftOverrides: overrides,
    getSettings,
  })

  const [pingStatus, setPingStatus] = useState('idle')
  const [syncStatus, setSyncStatus] = useState('idle')
  const [syncMsg,    setSyncMsg]    = useState('')
  const [results,    setResults]    = useState(null)
  const [lastSync,   setLastSync]   = useState(null)

  const [syncEmp,    setSyncEmp]    = useState(true)
  const [syncAtt,    setSyncAtt]    = useState(true)
  const [syncLeave,  setSyncLeave]  = useState(true)
  const [syncPay,    setSyncPay]    = useState(true)
  const [syncShift,  setSyncShift]  = useState(true)
  const [syncHols,   setSyncHols]   = useState(true)
  const [syncSched,  setSyncSched]  = useState(true)

  useEffect(() => {
    const ls = localStorage.getItem('last_sheets_sync')
    if (ls) setLastSync(new Date(ls).toLocaleString())
  }, [])

  async function handlePing() {
    setPingStatus('syncing')
    try {
      await pingSheets()
      setPingStatus('ok')
    } catch(e) {
      setPingStatus('error')
      setSyncMsg(e.message)
    }
    setTimeout(() => setPingStatus('idle'), 3000)
  }

  async function handleSync() {
    setSyncStatus('syncing')
    setSyncMsg('')
    setResults(null)

    try {
      const employees = summary?.employees ?? []
      const rawRecords = loadRawRecords()

      // Build payroll summary rows
      const payrollSummary = employees.map(emp => {
        const s  = getSettings(emp.userId)
        const lr = leaveRecords[emp.userId] ?? []
        const p  = calcPayroll(emp, s, lr)
        return { ...p, userId: emp.userId, name: emp.name, currency: s.currency || 'BDT' }
      })

      const payload = {}
      if (syncEmp)   payload.employees          = profiles // sends all employees
      if (syncAtt && rawRecords) {
        payload.attendanceRecords = rawRecords
        payload.attendanceSummary = summary
      }
      if (syncLeave)  payload.leaveRecords      = leaveRecords
      if (syncPay) {
        payload.payrollSettings   = payrollSettings
        payload.payrollSummary    = payrollSummary
      }
      if (syncShift)  payload.shiftOverrides    = overrides
      if (syncHols)   payload.holidays          = holidays
      if (syncSched)  payload.schedules         = schedules

      const res = await syncAll(payload)
      setResults(res.results)
      setSyncStatus('ok')
      setSyncMsg('All selected data synced successfully!')
      const now = new Date().toISOString()
      localStorage.setItem('last_sheets_sync', now)
      setLastSync(new Date(now).toLocaleString())
    } catch(e) {
      setSyncStatus('error')
      setSyncMsg(e.message)
    }
  }

  const employees = summary?.employees ?? []

  return (
    <div className="app-shell">
      <Sidebar active="settings" summary={summary} />
      <div className="main-content">
        <div className="topbar">
          <div className="topbar-left">
            <div className="topbar-title">Settings</div>
            <div className="topbar-sub">Google Sheets sync & preferences</div>
          </div>
          {lastSync && (
            <div className="topbar-right" style={{ fontSize: 11, color: 'var(--text-muted)' }}>
              Last sync: {lastSync}
            </div>
          )}
        </div>

        <div className="page-body" style={{ maxWidth: 760 }}>

          {/* ── Google Sheets Connection ── */}
          <div className="card">
            <div className="card-header">
              <span className="card-title">📊 Google Sheets Connection</span>
              <StatusDot status={pingStatus} />
            </div>
            <div className="card-body" style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>

              <div style={{ background: '#f0fdf4', borderRadius: 8, padding: '12px 14px', fontSize: 12, color: '#065f46', lineHeight: 1.7, border: '1px solid #86efac' }}>
                <strong>✓ Google Sheets is connected and ready.</strong><br />
                Data syncs automatically when you make changes. You can also manually sync below.
              </div>

              <div style={{ display: 'flex', gap: 8, alignItems: 'center', background: 'var(--bg)', borderRadius: 8, padding: '10px 14px', border: '1px solid var(--border)' }}>
                <span style={{ fontSize: 11, color: '#059669', fontWeight: 600 }}>● Connected</span>
                <span style={{ fontSize: 12, color: 'var(--text-muted)', fontFamily: 'DM Mono, monospace', flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  HR Management Sheet — Auto-sync enabled
                </span>
                <button className="btn btn-ghost" onClick={handlePing}>
                  Test Connection
                </button>
              </div>

              {pingStatus === 'error' && (
                <div className="error-banner">{syncMsg}</div>
              )}

            </div>
          </div>

          {/* ── Sync Options ── */}
          <div className="card">
            <div className="card-header">
              <span className="card-title">⬆ Sync to Sheets</span>
              <StatusDot status={syncStatus} />
            </div>
            <div className="card-body" style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
                {[
                  { label: '👥 Employees',         checked: syncEmp,   set: setSyncEmp,   count: Object.keys(profiles).length     },
                  { label: '📋 Attendance',         checked: syncAtt,   set: setSyncAtt,   count: employees.length + ' employees'  },
                  { label: '🏖 Leave Records',      checked: syncLeave, set: setSyncLeave, count: Object.values(leaveRecords).flat().length + ' records' },
                  { label: '💰 Payroll',            checked: syncPay,   set: setSyncPay,   count: employees.length + ' employees'  },
                  { label: '⇄ Shift Overrides',    checked: syncShift, set: setSyncShift, count: Object.values(overrides).flat().length + ' records'   },
                  { label: '🗓 Holidays',           checked: syncHols,  set: setSyncHols,  count: holidays.length + ' days'        },
                  { label: '◷ Schedules',          checked: syncSched, set: setSyncSched, count: Object.keys(schedules).length    },
                ].map(({ label, checked, set, count }) => (
                  <label key={label} style={{
                    display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                    padding: '10px 14px', borderRadius: 8, cursor: 'pointer',
                    border: `1.5px solid ${checked ? 'var(--accent)' : 'var(--border)'}`,
                    background: checked ? 'var(--accent-light)' : 'var(--surface)',
                    transition: 'all .15s',
                  }}>
                    <span style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <input type="checkbox" checked={checked} onChange={e => set(e.target.checked)}
                        style={{ accentColor: 'var(--accent)' }} />
                      <span style={{ fontSize: 13, fontWeight: 500 }}>{label}</span>
                    </span>
                    <span style={{ fontSize: 11, color: 'var(--text-muted)', fontFamily: 'DM Mono, monospace' }}>
                      {count}
                    </span>
                  </label>
                ))}
              </div>

              {syncMsg && (
                <div className={syncStatus === 'error' ? 'error-banner' : 'loading-banner'}
                  style={{ background: syncStatus === 'ok' ? '#f0fdf4' : undefined,
                    color: syncStatus === 'ok' ? '#059669' : undefined,
                    border: syncStatus === 'ok' ? '1px solid #a7f3d0' : undefined }}>
                  {syncMsg}
                </div>
              )}

              {results && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                  <ResultRow label="Employees"          result={results.employees} />
                  <ResultRow label="Attendance Records" result={results.attendanceRecords} />
                  <ResultRow label="Attendance Summary" result={results.attendanceSummary} />
                  <ResultRow label="Leave Records"      result={results.leaveRecords} />
                  <ResultRow label="Payroll Settings"   result={results.payrollSettings} />
                  <ResultRow label="Payroll Summary"    result={results.payrollSummary} />
                  <ResultRow label="Shift Overrides"    result={results.shiftOverrides} />
                  <ResultRow label="Holidays"           result={results.holidays} />
                  <ResultRow label="Schedules"          result={results.schedules} />
                </div>
              )}

              <button
                className="btn btn-primary"
                style={{ width: '100%', padding: '10px', fontSize: 14 }}
                disabled={syncStatus === 'syncing'}
                onClick={handleSync}
              >
                {syncStatus === 'syncing' ? '⟳ Syncing…' : '⬆ Sync Now to Google Sheets'}
              </button>

              {!summary && (
                <div style={{ fontSize: 12, color: 'var(--amber)', textAlign: 'center' }}>
                  ⚠ Load attendance data first for full sync
                </div>
              )}

            </div>
          </div>

          {/* ── Sheet names reference ── */}
          <div className="card">
            <div className="card-header">
              <span className="card-title">📑 Sheet Tabs Created</span>
            </div>
            <div className="card-body">
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
                {[
                  { name: 'Employees',           color: '#4f46e5', cols: 18 },
                  { name: 'Attendance_Records',  color: '#0891b2', cols: 6  },
                  { name: 'Attendance_Summary',  color: '#059669', cols: 12 },
                  { name: 'Leave_Records',       color: '#d97706', cols: 9  },
                  { name: 'Payroll_Settings',    color: '#7c3aed', cols: 8  },
                  { name: 'Payroll_Summary',     color: '#dc2626', cols: 16 },
                  { name: 'Shift_Overrides',     color: '#db2777', cols: 10 },
                  { name: 'Holidays',            color: '#f59e0b', cols: 3  },
                  { name: 'Schedules',           color: '#2563eb', cols: 7  },
                  { name: 'Sync_Log',            color: '#6b7280', cols: 6  },
                ].map(s => (
                  <div key={s.name} style={{
                    display: 'flex', alignItems: 'center', gap: 10,
                    padding: '8px 12px', borderRadius: 6, background: 'var(--bg)',
                    border: '1px solid var(--border)',
                  }}>
                    <span style={{ width: 10, height: 10, borderRadius: 2, background: s.color, flexShrink: 0 }} />
                    <span style={{ fontSize: 12, fontWeight: 500, fontFamily: 'DM Mono, monospace' }}>{s.name}</span>
                    <span style={{ marginLeft: 'auto', fontSize: 11, color: 'var(--text-muted)' }}>{s.cols} cols</span>
                  </div>
                ))}
              </div>
            </div>
          </div>

        </div>

        <div className="card" style={{ marginTop: 20 }}>
          <div className="card-header">
            <span className="card-title">⬇ Import from Google Sheets</span>
          </div>
          <div className="card-body" style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            <p style={{ fontSize: 13, color: 'var(--text-muted)', margin: 0 }}>
              Pull all data from Google Sheets into the app. This replaces local data with whatever is in your Sheet.
            </p>
            <button
              className="btn btn-secondary"
              style={{ alignSelf: 'flex-start', padding: '10px 24px', fontSize: 14 }}
              onClick={importFromSheets}
              disabled={importStatus === 'loading'}
            >
              {importStatus === 'loading' ? '⏳ Importing…' : '⬇ Import from Sheets'}
            </button>
            {importMessage && (
              <div style={{
                fontSize: 13, padding: '10px 14px', borderRadius: 8,
                background: importStatus === 'ok' ? '#d1fae5' : importStatus === 'error' ? '#fee2e2' : '#f0f9ff',
                color: importStatus === 'ok' ? '#065f46' : importStatus === 'error' ? '#991b1b' : '#0369a1',
              }}>
                {importMessage}
              </div>
            )}
          </div>
        </div>
      </div>
      
    </div>
  )
}
// Auto-sync is handled by useAutoSync hook in layout
