'use client'

import { useAttendanceData } from '@/hooks/useAttendanceData'
import Sidebar               from '@/components/Sidebar'
import HolidayCalendar       from '@/components/HolidayCalendar'

export default function HolidaysPage() {
  const { summary, holidays, updateHolidays } = useAttendanceData()

  return (
    <div className="app-shell">
      <Sidebar active="holidays" summary={summary} />
      <div className="main-content">
        <div className="topbar">
          <div className="topbar-left">
            <div className="topbar-title">Holidays and Weekends</div>
            <div className="topbar-sub">Excluded from late and overtime calculations</div>
          </div>
        </div>
        <div className="page-body">
          <div style={{ maxWidth: 700 }}>
            <HolidayCalendar holidays={holidays} onUpdate={updateHolidays} />
          </div>
        </div>
      </div>
    </div>
  )
}
