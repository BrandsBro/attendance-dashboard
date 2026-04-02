'use client'

import { useState } from 'react'
import { useAttendanceData }     from '@/hooks/useAttendanceData'
import UploadSection             from '@/components/UploadSection'
import SelectedSchedulePanel     from '@/components/SelectedSchedulePanel'
import StatsOverview             from '@/components/StatsOverview'
import SummaryTable              from '@/components/SummaryTable'
import EmployeeDetail            from '@/components/EmployeeDetail'
import HolidayCalendar           from '@/components/HolidayCalendar'

export default function Home() {
  const {
    summary, schedules, holidays, status, errorMsg,
    processFile, processSheetUrl, updateSchedule,
    updateLogoutOverride, updateHolidays, clearData,
  } = useAttendanceData()

  const [selectedEmployee, setSelectedEmployee] = useState(null)
  const [selectedIds,      setSelectedIds]      = useState(new Set())
  const loading = status === 'loading'

  function toggleSelect(emp, checked) {
    setSelectedIds(prev => {
      const next = new Set(prev)
      if (checked) next.add(emp.userId)
      else next.delete(emp.userId)
      return next
    })
  }

  function clearSelection() { setSelectedIds(new Set()) }

  const selectedEmployees = summary?.employees.filter(e => selectedIds.has(e.userId)) ?? []
  const liveEmployee = selectedEmployee
    ? summary?.employees.find(e => e.userId === selectedEmployee.userId) ?? selectedEmployee
    : null

  return (
    <main className="page">
      <header className="page-header">
        <div>
          <h1 className="page-title">Attendance Dashboard</h1>
          <p className="page-sub">Brands Bro LLC</p>
        </div>
        {summary && (
          <button className="btn-danger-outline" onClick={clearData}>Clear Data</button>
        )}
      </header>

      {status === 'error' && (
        <div className="error-banner">{errorMsg || 'Something went wrong.'}</div>
      )}

      <UploadSection onFile={processFile} onSheetUrl={processSheetUrl} loading={loading} />

      {/* Holiday calendar — always visible */}
      <HolidayCalendar holidays={holidays} onUpdate={updateHolidays} />

      {/* Schedule panel — only when employees selected */}
      {selectedEmployees.length > 0 && (
        <SelectedSchedulePanel
          employees={selectedEmployees}
          schedules={schedules}
          onUpdate={updateSchedule}
          onClear={clearSelection}
        />
      )}

      {loading && <div className="loading-banner">Processing attendance data…</div>}

      {summary && (
        <>
          <StatsOverview summary={summary} />
          <SummaryTable
            summary={summary}
            selectedIds={selectedIds}
            onToggleSelect={toggleSelect}
            onSelectEmployee={setSelectedEmployee}
            onClearSelection={clearSelection}
          />
        </>
      )}

      {liveEmployee && (
        <EmployeeDetail
          employee={liveEmployee}
          schedules={schedules}
          onLogoutOverride={updateLogoutOverride}
          onClose={() => setSelectedEmployee(null)}
        />
      )}
    </main>
  )
}
