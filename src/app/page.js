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
    const dashSetts = JSON.parse(localStorage.getItem('dashboard_settings_v1') || '{}')
    const global    = dashSetts._global ?? {}

    const fmtMin = mins => {
      if (!mins) return '0m'
      const h = Math.floor(mins / 60)
      const m = mins % 60
      return h > 0 ? (m > 0 ? h + 'h ' + m + 'm' : h + 'h') : m + 'm'
    }

    const fmtTime = t => {
      if (!t) return ''
      const dt = new Date(t)
      const h  = dt.getHours()
      const m  = dt.getMinutes()
      const ap = h >= 12 ? 'PM' : 'AM'
      const hh = h % 12 || 12
      return hh + ':' + String(m).padStart(2,'0') + ' ' + ap
    }

    try {
      const employees = summary.employees ?? []

      // STEP 1 — Collect all rows exactly as shown on screen
      setSyncProgress('Collecting data from dashboard...')

      const headers = [
        'User ID','Name','Department',
        'Date','Shift','In','Out','Grace',
        'Presence','Late','OT','Status'
      ]

      const allRows = []

      for (const emp of employees) {
        const empSetts  = dashSetts[String(emp.userId)] ?? {}
        const defLogin  = empSetts.loginTime    ?? global.loginTime    ?? '09:00'
        const defLogout = empSetts.logoutTime   ?? global.logoutTime   ?? '18:00'
        const defGrace  = empSetts.gracePeriod  ?? global.gracePeriod  ?? 0
        const defOTBuf  = empSetts.otBufferMins ?? global.otBufferMins ?? 30

        for (const d of emp.days) {
          const rowOvr = dashSetts[String(emp.userId) + '_rows']?.[d.date] ?? {}
          const login  = rowOvr.loginTime   ?? d.effectiveLogin  ?? defLogin
          const logout = rowOvr.logoutTime  ?? d.effectiveLogout ?? defLogout
          const grace  = rowOvr.gracePeriod ?? defGrace
          const isOff  = d.isWeekend || d.isHoliday

          // Format shift same as shown: "9:00 AM → 6:00 PM"
          const fmtShift = t => {
            if (!t) return ''
            const [h, m] = t.split(':').map(Number)
            const ap = h >= 12 ? 'PM' : 'AM'
            return (h % 12 || 12) + ':' + String(m).padStart(2,'0') + ' ' + ap
          }
          const shift = isOff ? '' : fmtShift(login) + ' → ' + fmtShift(logout)

          // Calculate OT exactly as shown
          let otMins = rowOvr.otMinutes ?? 0
          if (!otMins && !isOff && d.outTime) {
            const out      = new Date(d.outTime)
            const outMins  = out.getHours() * 60 + out.getMinutes()
            const [lh, lm] = logout.split(':').map(Number)
            const diff     = outMins - (lh * 60 + lm)
            if (diff >= 60)             otMins = diff
            else if (diff >= defOTBuf)  otMins = diff - defOTBuf
          }

          let status = 'Present'
          if (isOff)          status = d.isHoliday ? 'Holiday' : 'Weekend'
          else if (!d.inTime) status = 'Absent'
          else if (d.lateMinutes > 0) status = 'Late'

          allRows.push({
            'User ID':    String(emp.userId),
            'Name':       emp.name,
            'Department': emp.department ?? '',
            'Date':       d.date,
            'Shift':      shift,
            'In':         fmtTime(d.inTime),
            'Out':        fmtTime(d.outTime),
            'Grace':      isOff ? '' : grace + 'm',
            'Presence':   isOff ? '' : fmtMin(d.presenceMinutes),
            'Late':       isOff ? '' : fmtMin(d.lateMinutes),
            'OT':         isOff ? '' : fmtMin(otMins),
            'Status':     status,
          })
        }
      }

      setSyncProgress(`✓ Collected ${allRows.length} rows — sending to Sheets...`)
      await new Promise(r => setTimeout(r, 400))

      // STEP 2 — Clear sheet then send per employee via proxy
      await fetch('/api/sheets', {
        method: 'POST', headers: {'Content-Type':'application/json'},
        body: JSON.stringify({ action: 'writeSheet', data: { Attendance_Records: { headers, rows: [] } } })
      })

      let sent = 0
      for (const emp of employees) {
        const empRows = allRows.filter(r => r['User ID'] === String(emp.userId))
        if (empRows.length === 0) continue
        setSyncProgress(`Sending ${emp.name} (${++sent}/${employees.length})...`)
        await fetch('/api/sheets', {
          method: 'POST', headers: {'Content-Type':'application/json'},
          body: JSON.stringify({ action: 'appendRows', data: { Attendance_Records: { headers, rows: empRows } } })
        })
      }

      setSyncProgress('✓ Done! All data synced to Google Sheets')
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
