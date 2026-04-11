'use client'

import { useState } from 'react'

export default function HolidayCalendar({ holidays, onUpdate }) {
  const [newDate, setNewDate] = useState('')

  function add() {
    if (!newDate || holidays.includes(newDate)) return
    onUpdate([...holidays, newDate].sort())
    setNewDate('')
  }

  return (
    <div className="card">
      <div className="card-header">
        <span className="card-title">Weekends & Holidays</span>
        <span className="badge badge-gray">{holidays.length} holidays</span>
      </div>
      <div className="card-body">
        <p style={{ fontSize: 12, color: 'var(--text-muted)', marginBottom: 12 }}>
          Weekends excluded automatically. Add holidays — excluded from late & overtime calculations.
        </p>
        <div style={{ display: 'flex', gap: 8, marginBottom: 12 }}>
          <input type="date" className="input" value={newDate} onChange={e => setNewDate(e.target.value)} />
          <button className="btn btn-primary" onClick={add}>Add Holiday</button>
        </div>
        {holidays.length === 0
          ? <p style={{ fontSize: 12, color: 'var(--text-subtle)' }}>No holidays added yet.</p>
          : (
            <div className="holiday-list">
              {holidays.map(d => (
                <div key={d} className="holiday-chip">
                  <span>{new Date(d + 'T12:00:00').toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })}</span>
                  <button className="holiday-remove" onClick={() => onUpdate(holidays.filter(x => x !== d))}>✕</button>
                </div>
              ))}
            </div>
          )}
      </div>
    </div>
  )
}
