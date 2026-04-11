'use client'

import { useState } from 'react'
import { useAttendanceData }  from '@/hooks/useAttendanceData'
import Sidebar                from '@/components/Sidebar'
import SelectedSchedulePanel  from '@/components/SelectedSchedulePanel'
import SummaryTable           from '@/components/SummaryTable'

export default function SchedulePage() {
  const { summary, schedules, updateSchedule } = useAttendanceData()
  const [selectedIds, setSelectedIds] = useState(new Set())
  const selectedEmployees = summary?.employees.filter(e => selectedIds.has(e.userId)) ?? []

  function toggleSelect(emp, checked) {
    setSelectedIds(prev => {
      const next = new Set(prev)
      checked ? next.add(emp.userId) : next.delete(emp.userId)
      return next
    })
  }

  return (
    <div className="app-shell">
      <Sidebar active="schedule" summary={summary} />
      <div className="main-content">
        <div className="topbar">
          <div className="topbar-left">
            <div className="topbar-title">Schedules</div>
            <div className="topbar-sub">Select employees then configure their schedule</div>
          </div>
        </div>
        <div className="page-body">
          {!summary ? (
            <div className="card">
              <div className="card-body" style={{ textAlign: 'center', padding: '60px 20px', color: 'var(--text-muted)' }}>
                <div style={{ fontSize: 40, marginBottom: 16 }}>◷</div>
                <div style={{ fontWeight: 600, fontSize: 16, marginBottom: 8 }}>No data loaded</div>
                <a href="/upload" className="btn btn-primary" style={{ textDecoration: 'none', display: 'inline-flex' }}>Go to Upload</a>
              </div>
            </div>
          ) : (
            <>
              {selectedEmployees.length > 0 ? (
                <SelectedSchedulePanel
                  employees={selectedEmployees}
                  schedules={schedules}
                  onUpdate={updateSchedule}
                  onClear={() => setSelectedIds(new Set())}
                />
              ) : (
                <div className="card">
                  <div className="card-body" style={{ padding: 16, fontSize: 13, color: 'var(--text-muted)' }}>
                    ☑ Check employees below to configure their schedule.
                  </div>
                </div>
              )}
              <SummaryTable
                summary={summary}
                selectedIds={selectedIds}
                onToggleSelect={toggleSelect}
                onSelectEmployee={() => {}}
                onClearSelection={() => setSelectedIds(new Set())}
              />
            </>
          )}
        </div>
      </div>
    </div>
  )
}
