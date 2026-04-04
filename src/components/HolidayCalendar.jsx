'use client'

import { useState } from 'react'

export default function HolidayCalendar({ holidays = [], onUpdate }) {
  const [currentMonth, setCurrentMonth] = useState(new Date())
  const [newDate, setNewDate] = useState('')

  // Helper: check if a date is a holiday
  const isHoliday = (dateStr) => holidays.includes(dateStr)

  // Toggle holiday: if already holiday, remove; else add
  const toggleHoliday = (dateStr) => {
    if (isHoliday(dateStr)) {
      onUpdate(holidays.filter(d => d !== dateStr))
    } else {
      onUpdate([...holidays, dateStr].sort())
    }
  }

  // Generate calendar grid for current month
  const getCalendarDays = () => {
    const year = currentMonth.getFullYear()
    const month = currentMonth.getMonth()
    const firstDay = new Date(year, month, 1)
    const lastDay = new Date(year, month + 1, 0)
    const startDayOfWeek = firstDay.getDay() // 0 = Sunday
    const daysInMonth = lastDay.getDate()

    const days = []
    // Previous month padding
    const prevMonthLastDay = new Date(year, month, 0).getDate()
    for (let i = startDayOfWeek - 1; i >= 0; i--) {
      const date = new Date(year, month - 1, prevMonthLastDay - i)
      days.push({ date, isCurrentMonth: false })
    }
    // Current month days
    for (let d = 1; d <= daysInMonth; d++) {
      const date = new Date(year, month, d)
      days.push({ date, isCurrentMonth: true })
    }
    // Next month padding to fill 6 rows (42 cells)
    const remaining = 42 - days.length
    for (let i = 1; i <= remaining; i++) {
      const date = new Date(year, month + 1, i)
      days.push({ date, isCurrentMonth: false })
    }
    return days
  }

  const formatDateKey = (date) => date.toISOString().slice(0, 10)

  const goPrevMonth = () => {
    setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1, 1))
  }

  const goNextMonth = () => {
    setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 1))
  }

  const monthNames = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December']
  const weekdays = ['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa']

  // Add from date picker
  const addFromPicker = () => {
    if (!newDate || holidays.includes(newDate)) return
    onUpdate([...holidays, newDate].sort())
    setNewDate('')
  }

  return (
    <div className="card">
      <h2 className="section-title" style={{ marginBottom: 4 }}>Holiday Calendar</h2>
      <p className="schedule-note" style={{ marginBottom: 14 }}>
        Click on any date in the calendar to mark/unmark as holiday. Only Sundays are weekends.
      </p>

      {/* Calendar navigation */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
        <button className="btn-secondary" onClick={goPrevMonth}>← {monthNames[currentMonth.getMonth() - 1] || 'Dec'}</button>
        <h3 style={{ fontSize: 18, fontWeight: 500 }}>{monthNames[currentMonth.getMonth()]} {currentMonth.getFullYear()}</h3>
        <button className="btn-secondary" onClick={goNextMonth}>{monthNames[currentMonth.getMonth() + 1] || 'Jan'} →</button>
      </div>

      {/* Calendar grid */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(7, 1fr)',
        gap: '6px',
        textAlign: 'center',
        marginBottom: 20,
      }}>
        {weekdays.map(day => (
          <div key={day} style={{ fontWeight: 600, fontSize: 12, color: 'var(--text-muted)', padding: '8px 0' }}>{day}</div>
        ))}
        {getCalendarDays().map(({ date, isCurrentMonth }) => {
          const dateKey = formatDateKey(date)
          const dayOfWeek = date.getDay()
          const isWeekend = dayOfWeek === 0  // Sunday only
          const isHolidayFlag = isHoliday(dateKey)
          const isToday = dateKey === new Date().toISOString().slice(0, 10)

          let bgColor = 'var(--surface)'
          if (isHolidayFlag) bgColor = 'var(--amber-light)'
          else if (isWeekend && isCurrentMonth) bgColor = 'var(--bg)'

          return (
            <div
              key={dateKey}
              onClick={() => {
                if (isCurrentMonth && !isWeekend) toggleHoliday(dateKey)
              }}
              style={{
                padding: '10px 6px',
                borderRadius: 8,
                backgroundColor: bgColor,
                border: isToday ? '2px solid var(--blue)' : '1px solid var(--border)',
                cursor: (isCurrentMonth && !isWeekend) ? 'pointer' : 'default',
                opacity: isCurrentMonth ? 1 : 0.4,
                fontWeight: isToday ? 600 : 400,
                transition: 'all 0.1s',
              }}
              title={isWeekend ? 'Sunday is weekend – cannot be set as holiday' : (isHolidayFlag ? 'Click to remove holiday' : 'Click to add holiday')}
            >
              {date.getDate()}
              {isHolidayFlag && <div style={{ fontSize: 10, marginTop: 2 }}>🎉</div>}
            </div>
          )
        })}
      </div>

      {/* Alternative: add by date picker */}
      <div style={{ display: 'flex', gap: 8, alignItems: 'flex-end', marginTop: 8, paddingTop: 16, borderTop: '1px solid var(--border)' }}>
        <div>
          <div style={{ fontSize: 12, marginBottom: 4, color: 'var(--text-muted)' }}>Or add by date picker:</div>
          <input
            type="date"
            className="text-input"
            style={{ width: 'auto' }}
            value={newDate}
            onChange={e => setNewDate(e.target.value)}
          />
        </div>
        <button className="btn-primary" onClick={addFromPicker}>Add holiday</button>
      </div>

      {/* List of current holidays */}
      {holidays.length > 0 && (
        <div style={{ marginTop: 16 }}>
          <div style={{ fontSize: 13, fontWeight: 500, marginBottom: 8 }}>Holidays added:</div>
          <div className="holiday-list">
            {holidays.map(d => (
              <div key={d} className="holiday-chip">
                <span>
                  {new Date(d + 'T00:00:00').toLocaleDateString('en-US', {
                    weekday: 'short', month: 'short', day: 'numeric',
                  })}
                </span>
                <button className="holiday-remove" onClick={() => onUpdate(holidays.filter(h => h !== d))}>✕</button>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}