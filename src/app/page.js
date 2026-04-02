'use client'

import { useState } from 'react'
import { useAttendanceData } from '@/hooks/useAttendanceData'
import UploadSection  from '@/components/UploadSection'
import ScheduleConfig from '@/components/ScheduleConfig'
import StatsOverview  from '@/components/StatsOverview'
import SummaryTable   from '@/components/SummaryTable'
import EmployeeDetail from '@/components/EmployeeDetail'

export default function Home() {
  const {
    summary, schedules, status, errorMsg,
    processFile, processSheetUrl, updateSchedule, clearData,
  } = useAttendanceData()

  const [selectedEmployee, setSelectedEmployee] = useState(null)
  const loading = status === 'loading'

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

      {loading && <div className="loading-banner">Processing attendance data…</div>}

      {summary && (
        <>
          <ScheduleConfig employees={summary.employees} schedules={schedules} onUpdate={updateSchedule} />
          <StatsOverview summary={summary} />
          <SummaryTable summary={summary} onSelectEmployee={setSelectedEmployee} />
        </>
      )}

      {selectedEmployee && (
        <EmployeeDetail employee={selectedEmployee} onClose={() => setSelectedEmployee(null)} />
      )}
    </main>
  )
}
