'use client'

import { useState } from 'react'
import { useAttendanceData } from '@/hooks/useAttendanceData'
import Sidebar               from '@/components/Sidebar'
import MetricsBar            from '@/components/MetricsBar'
import SummaryTable          from '@/components/SummaryTable'
import EmployeeDetail        from '@/components/EmployeeDetail'

export default function Dashboard() {
  const { summary, schedules, updateSchedule, updateLogoutOverride } = useAttendanceData()
  const [selectedEmployee, setSelectedEmployee] = useState(null)
  const [selectedIds,      setSelectedIds]      = useState(new Set())

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

  return (
    <div className="app-shell">
      <Sidebar active="dashboard" summary={summary} />
      <div className="main-content">
        <div className="topbar">
          <div className="topbar-left">
            <div className="topbar-title">Dashboard</div>
            {summary && <div className="topbar-sub">{summary.dateRange.from} → {summary.dateRange.to} · {summary.employees.length} employees</div>}
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
        />
      )}
    </div>
  )
}
