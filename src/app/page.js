'use client'

import { useState, useRef } from 'react'
import { useAttendanceData } from '@/hooks/useAttendanceData'
import Sidebar               from '@/components/Sidebar'
import MetricsBar            from '@/components/MetricsBar'
import SummaryTable          from '@/components/SummaryTable'
import EmployeeDetail        from '@/components/EmployeeDetail'
import { useLeaveRecords }     from '@/hooks/useLeaveRecords'
import { usePayrollSettings }   from '@/hooks/usePayrollSettings'
import { loadRawRecords }       from '@/lib/storage'
import GlobalSettingsPanel   from '@/components/GlobalSettingsPanel'

export default function Dashboard() {
  const { summary, schedules, updateSchedule, updateLogoutOverride, processFile, status } = useAttendanceData()
  const { records: leaveRecords }   = useLeaveRecords()
  const { settings: payrollSettings } = usePayrollSettings()
  const [syncing,      setSyncing]      = useState(false)
  const [syncProgress, setSyncProgress] = useState('')
  const [selectedEmployee, setSelectedEmployee] = useState(null)
  const fileInputRef = useRef(null)
  const [selectedIds,      setSelectedIds]      = useState(new Set())
  const [recalcTick,       setRecalcTick]       = useState(0)

  const liveEmployee = selectedEmployee
    ? summary?.employees.find(e => e.userId === selectedEmployee.userId) ?? selectedEmployee
    : null

  function toggleSelect(emp, checked) {
    setSelectedIds(prev => {
      const next = new Set(prev)
      checked ? next.add(emp.userId) : next.delete(emp.userId)
      return next
    })
  }

  async function handleSyncToSheets() {
    if (!summary) return
    setSyncing(true)
    try {
      const rawRecords = loadRawRecords()
      const employees  = summary.employees ?? []
      const SCRIPT     = 'https://script.google.com/macros/s/AKfycbwR5oiVUx6Uv8iVd430mbqbMs9P1uwrfwyGky95pY4QmcA3vd1TiHIE2ylG7x2uyxZu/exec'
      const headers    = ['Serial No','User ID','Name','Department','Date/Time','Status']

      // 1. Clear Attendance_Records
      setSyncProgress('Clearing old records...')
      await fetch('/api/sheets', {
        method: 'POST', headers: {'Content-Type':'application/json'},
        body: JSON.stringify({ action:'syncAll', data:{ Attendance_Records:{ headers, rows:[] } } })
      })

      // 2. Send each employee's records
      for (let i = 0; i < employees.length; i++) {
        const emp = employees[i]
        setSyncProgress(`Sending ${emp.name} (${i+1}/${employees.length})...`)
        const empRecords = (rawRecords || []).filter(r => String(r.userId) === String(emp.userId))
        if (empRecords.length === 0) continue
        const rows = empRecords.map(r => ({
          'Serial No':  String(r.serialNo ?? ''),
          'User ID':    String(r.userId   || ''),
          'Name':       String(r.name     || ''),
          'Department': String(r.department || ''),
          'Date/Time':  r.dateTime instanceof Date ? r.dateTime.toISOString() : String(r.dateTime || ''),
          'Status':     String(r.status   || ''),
        }))
        const url = SCRIPT + '?action=appendRows&data=' + encodeURIComponent(JSON.stringify({ Attendance_Records: { headers, rows } }))
        await fetch(url)
      }

      // 3. Sync summary
      setSyncProgress('Syncing attendance summary...')
      const sumRows = employees.map(e => ({
        'User ID': String(e.userId||''), 'Name': String(e.name||''),
        'Department': String(e.department||''), 'Shift': String(e.shift||''),
        'Working Days': e.workingDays??0, 'Presence (min)': e.totalPresenceMinutes??0,
        'Late (min)': e.totalLateMinutes??0, 'Overtime (min)': e.totalOvertimeMinutes??0,
        'Late Days': e.lateDays??0, 'Last Updated': new Date().toISOString(),
      }))
      await fetch('/api/sheets', {
        method:'POST', headers:{'Content-Type':'application/json'},
        body: JSON.stringify({ action:'syncAll', data:{ Attendance_Summary:{ headers: Object.keys(sumRows[0]), rows: sumRows } } })
      })

      setSyncProgress('Done! ✓')
      setTimeout(() => { setSyncing(false); setSyncProgress('') }, 2000)
    } catch(e) {
      setSyncProgress('Error: ' + e.message)
      setTimeout(() => { setSyncing(false); setSyncProgress('') }, 3000)
    }
  }

  return (
    <div className="app-shell">
      <Sidebar active="dashboard" summary={summary} />
      <div className="main-content">
        <div className="topbar">
          <div className="topbar-left">
            <div className="topbar-title">Dashboard</div>
            {summary && <div className="topbar-sub">{summary.dateRange.from} → {summary.dateRange.to} · {summary.employees.length} employees</div>}
          </div>
          <div className="topbar-right">
            <button className="btn btn-danger" onClick={() => {
              if (!confirm('Clear all attendance data? This cannot be undone.')) return
              localStorage.clear()
              window.location.reload()
            }}>✕ Clear Data</button>
            <button className="btn btn-secondary" onClick={() => {
              const emps = summary?.employees ?? []
              const rows = [
                ['Employee','User ID','Department','Shift','Days Present','Presence (min)','Late Days','Late (min)','Overtime (min)'],
                ...emps.map(e => [
                  e.name, e.userId, e.department ?? '', e.shift ?? '',
                  e.workingDays, e.totalPresenceMinutes,
                  e.lateDays ?? 0, e.totalLateMinutes, e.totalOvertimeMinutes
                ])
              ]
              const csv = rows.map(r => r.join(',')).join('\n')
              const a = document.createElement('a')
              a.href = URL.createObjectURL(new Blob([csv], {type:'text/csv'}))
              a.download = 'attendance_summary.csv'
              a.click()
            }}>↓ Download All</button>
            {!summary && <a href="/upload" className="btn btn-primary" style={{ textDecoration: 'none' }}>Upload Data</a>}
            <input ref={fileInputRef} type="file" accept=".xls,.xlsx,.csv" style={{ display: 'none' }}
              onChange={async e => { const f = e.target.files?.[0]; if (f) { await processFile(f); e.target.value = '' } }} />
            <button className="btn btn-secondary" onClick={() => fileInputRef.current?.click()}>↑ Upload</button>
            {summary && (
              <button className="btn btn-primary" onClick={handleSyncToSheets} disabled={syncing}
                style={{ minWidth: 160 }}>
                {syncing ? syncProgress || 'Syncing...' : '⬆ Sync to Sheets'}
              </button>
            )}
          </div>
        </div>
        <div className="page-body">
          {!summary ? (
            <div className="card">
              <div className="card-body" style={{ textAlign: 'center', padding: '60px 20px', color: 'var(--text-muted)' }}>
                <div style={{ fontSize: 40, marginBottom: 16 }}>📂</div>
                <div style={{ fontWeight: 600, fontSize: 16, marginBottom: 8 }}>No data loaded</div>
                <div style={{ fontSize: 13, color: 'var(--text-muted)', marginBottom: 20 }}>Upload an attendance file to get started.</div>
                <a href="/upload" className="btn btn-primary" style={{ textDecoration: 'none', display: 'inline-flex' }}>Go to Upload</a>
              </div>
            </div>
          ) : (
            <>
              <MetricsBar summary={summary} />
              <GlobalSettingsPanel employees={summary.employees} onRecalculate={() => { window.dispatchEvent(new CustomEvent('dashSettingsChanged')); setRecalcTick(t => t + 1) }} />
              <SummaryTable
                summary={summary}
                selectedIds={selectedIds}
                onToggleSelect={toggleSelect}
                onSelectEmployee={setSelectedEmployee}
                onClearSelection={() => setSelectedIds(new Set())}
              />
            </>
          )}
        </div>
      </div>
      {liveEmployee && (
        <EmployeeDetail
          employee={liveEmployee}
          schedules={schedules}
          onLogoutOverride={updateLogoutOverride}
          onClose={() => setSelectedEmployee(null)}
          onRecalculate={() => { window.dispatchEvent(new CustomEvent('dashSettingsChanged')); setRecalcTick(t => t + 1) }}
        />
      )}
    </div>
  )
}
