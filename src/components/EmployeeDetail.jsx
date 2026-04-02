'use client'

import { useState } from 'react'
import { fmtMinutes, fmt12h } from '@/lib/calculateStats'

function EditableTime({ value, onSave }) {
  const [editing, setEditing] = useState(false)

  function toTimeVal(date) {
    if (!date) return ''
    const d = new Date(date)
    return `${String(d.getHours()).padStart(2,'0')}:${String(d.getMinutes()).padStart(2,'0')}`
  }

  function handleChange(e) {
    const [h, m] = e.target.value.split(':').map(Number)
    const base   = new Date(value ?? Date.now())
    base.setHours(h, m, 0, 0)
    onSave(base.toISOString())
    setEditing(false)
  }

  if (editing) {
    return (
      <input
        type="time"
        className="inline-time-input"
        defaultValue={toTimeVal(value)}
        autoFocus
        onChange={handleChange}
        onBlur={() => setEditing(false)}
      />
    )
  }

  return (
    <span
      className={`editable-time ${value ? '' : 'editable-time-empty'}`}
      onClick={() => setEditing(true)}
      title="Click to edit"
    >
      {fmt12h(value)}
      <span className="edit-pencil">✎</span>
    </span>
  )
}

export default function EmployeeDetail({ employee: emp, schedules, onLogoutOverride, onClose }) {
  const schedule = schedules?.[emp.userId]

  function handleInSave(date, isoStr) {
    onLogoutOverride(emp.userId, date, isoStr, false, false, 'in')
  }

  function handleOutSave(date, isoStr) {
    onLogoutOverride(emp.userId, date, isoStr, false, false, 'out')
  }

  return (
    <div className="detail-overlay" onClick={onClose}>
      <div className="detail-panel" onClick={e => e.stopPropagation()}>

        <div className="detail-top">
          <div>
            <h2 className="detail-name">{emp.name}</h2>
            <p className="detail-dept">
              {emp.department}
              {emp.shift && <span className="shift-badge">{emp.shift}</span>}
              {schedule?.gracePeriodMinutes > 0 && (
                <span className="grace-badge">{schedule.gracePeriodMinutes} min grace</span>
              )}
            </p>
          </div>
          <button className="btn-icon" onClick={onClose}>✕</button>
        </div>

        {/* Summary pills */}
        <div className="detail-stats">
          <div className="detail-pill">
            <div className="pill-value">{emp.workingDays}</div>
            <div className="pill-label">Days present</div>
          </div>
          <div className="detail-pill">
            <div className="pill-value">{fmtMinutes(emp.totalPresenceMinutes)}</div>
            <div className="pill-label">Total presence</div>
          </div>
          <div className="detail-pill detail-pill-amber">
            <div className="pill-value">{emp.lateDays ?? 0} days</div>
            <div className="pill-label">Late days</div>
          </div>
          <div className="detail-pill detail-pill-amber">
            <div className="pill-value">{fmtMinutes(emp.totalLateMinutes)}</div>
            <div className="pill-label">Total late</div>
          </div>
          <div className="detail-pill detail-pill-blue">
            <div className="pill-value">{fmtMinutes(emp.totalOvertimeMinutes)}</div>
            <div className="pill-label">Total overtime</div>
          </div>
        </div>

        <div className="table-scroll">
          <table className="data-table">
            <thead>
              <tr>
                <th>Date</th>
                <th>In <span className="th-hint">click to edit</span></th>
                <th>Out <span className="th-hint">click to edit</span></th>
                <th>Presence</th>
                <th>Late</th>
                <th>Overtime</th>
              </tr>
            </thead>
            <tbody>
              {emp.days.map(d => {
                const isOff = d.isWeekend || d.isHoliday
                return (
                  <tr key={d.date} className={`table-row ${isOff ? 'row-off' : ''}`}>
                    <td>
                      <div>{d.date}</div>
                      {d.isHoliday && <span className="day-badge day-holiday">Holiday</span>}
                      {d.isWeekend && <span className="day-badge day-weekend">Weekend</span>}
                      {d.manualOut && <span className="day-badge day-edited">Edited</span>}
                    </td>

                    {/* In — click to edit */}
                    <td>
                      {isOff
                        ? fmt12h(d.inTime)
                        : <EditableTime
                            value={d.inTime}
                            onSave={iso => handleInSave(d.date, iso)}
                          />
                      }
                    </td>

                    {/* Out — click to edit */}
                    <td>
                      {isOff
                        ? fmt12h(d.outTime)
                        : <EditableTime
                            value={d.outTime}
                            onSave={iso => handleOutSave(d.date, iso)}
                          />
                      }
                    </td>

                    <td>{fmtMinutes(d.presenceMinutes)}</td>
                    <td>
                      {isOff ? '—' : d.lateMinutes > 0
                        ? <span className="badge badge-amber">{fmtMinutes(d.lateMinutes)}</span>
                        : <span className="on-time">On time</span>}
                    </td>
                    <td>
                      {isOff ? '—' : d.overtimeMinutes > 0
                        ? <span className="badge badge-blue">{fmtMinutes(d.overtimeMinutes)}</span>
                        : '—'}
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>

      </div>
    </div>
  )
}
