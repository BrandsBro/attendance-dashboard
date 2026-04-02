'use client'

import { useState } from 'react'

export default function HolidayCalendar({ holidays = [], onUpdate }) {
  const [newDate, setNewDate] = useState('')

  function addHoliday() {
    if (!newDate || holidays.includes(newDate)) return
    onUpdate([...holidays, newDate].sort())
    setNewDate('')
  }

  function removeHoliday(date) {
    onUpdate(holidays.filter(d => d !== date))
  }

  return (
    <div className="card">
      <h2 className="section-title" style={{ marginBottom: 4 }}>Weekends & Holidays</h2>
      <p className="schedule-note" style={{ marginBottom: 14 }}>
        Weekends are excluded automatically. Add public holidays — these days won't count towards late or overtime.
      </p>

      <div style={{ display: 'flex', gap: 8, marginBottom: 14 }}>
        <input
          type="date"
          className="text-input"
          style={{ width: 'auto' }}
          value={newDate}
          onChange={e => setNewDate(e.target.value)}
        />
        <button className="btn-primary" onClick={addHoliday}>Add holiday</button>
      </div>

      {holidays.length === 0 ? (
        <p style={{ fontSize: 13, color: 'var(--text-subtle)' }}>No holidays added yet.</p>
      ) : (
        <div className="holiday-list">
          {holidays.map(d => (
            <div key={d} className="holiday-chip">
              <span>
                {new Date(d + 'T00:00:00').toLocaleDateString('en-US', {
                  weekday: 'short', month: 'short', day: 'numeric',
                })}
              </span>
              <button className="holiday-remove" onClick={() => removeHoliday(d)}>✕</button>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
