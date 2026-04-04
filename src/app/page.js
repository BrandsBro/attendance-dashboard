'use client'

import { useState } from 'react'
import * as XLSX from 'xlsx'
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

  // -------- Export to Excel --------
function handleDownloadExcel() {
  if (!summary) {
    alert('No data to export')
    return
  }

  try {
    const rows = summary.employees.map(emp => {
      const mins = emp.totalOvertimeMinutes || 0
      const overtimeStr = mins > 0 ? `${Math.floor(mins / 60)}h ${mins % 60}m` : '—'

      return {
        'Name': emp.name,
        'Presence (days)': emp.workingDays,
        'Late (days)': emp.lateDays,
        'Overtime': overtimeStr,
      }
    })

    const ws = XLSX.utils.json_to_sheet(rows)
    const wb = XLSX.utils.book_new()
    XLSX.utils.book_append_sheet(wb, ws, 'Employee Summary')
    XLSX.writeFile(wb, `employee_summary_${new Date().toISOString().slice(0, 10)}.xlsx`)
  } catch (err) {
    console.error('Export error:', err)
    alert('Export failed: ' + err.message)
  }
}
  return (
    <main className="page">
      <header className="page-header">
        <div>
          <h1 className="page-title">Attendance Dashboard</h1>
          <p className="page-sub">Brands Bro LLC</p>
        </div>
        <div style={{ display: 'flex', gap: '10px' }}>
          {summary && (
            <>
              <button className="btn-primary" onClick={handleDownloadExcel}>
                📥 Download Excel Report
              </button>
              <button className="btn-danger-outline" onClick={clearData}>
                Clear Data
              </button>
            </>
          )}
        </div>
      </header>

      {status === 'error' && (
        <div className="error-banner">{errorMsg || 'Something went wrong.'}</div>
      )}

      <UploadSection onFile={processFile} onSheetUrl={processSheetUrl} loading={loading} />

      <HolidayCalendar holidays={holidays} onUpdate={updateHolidays} />

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