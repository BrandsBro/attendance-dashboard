'use client'

import { useState } from 'react'
import { fmtMinutes, fmt12h } from '@/lib/calculateStats'

function EditableTime({ value, date, onSave }) {
  const [editing, setEditing] = useState(false)

  function toVal(d) {
    if (!d) return ''
    const dt = new Date(d)
    return `${String(dt.getHours()).padStart(2,'0')}:${String(dt.getMinutes()).padStart(2,'0')}`
  }

  function handleChange(e) {
    const [h, m] = e.target.value.split(':').map(Number)
    const base = new Date(value ?? (date + 'T12:00:00'))
    base.setHours(h, m, 0, 0)
    onSave(base.toISOString())
    setEditing(false)
  }

  if (editing) {
    return (
      <input
        type="time"
        className="inline-time-input"
        defaultValue={toVal(value)}
        autoFocus
        onChange={handleChange}
        onBlur={() => setEditing(false)}
      />
    )
  }

  return (
    <span className={`editable-time ${!value ? 'editable-time-empty' : ''}`} onClick={() => setEditing(true)} title="Click to edit">
      {fmt12h(value)}
      <span className="edit-pencil">✎</span>
    </span>
  )
}

export default function EmployeeDetail({ employee: emp, schedules, onLogoutOverride, onClose }) {
  const schedule = schedules?.[emp.userId]

  function saveIn(date, iso)  { onLogoutOverride(emp.userId, date, iso, false, false, 'in')  }
  function saveOut(date, iso) { onLogoutOverride(emp.userId, date, iso, false, false, 'out') }

  return (
    <>
      <div className="detail-backdrop" onClick={onClose} />
      <div className="detail-panel">
        <div className="detail-header">
          <div>
            <div className="detail-name">{emp.name}</div>
            <div className="detail-dept">
              {emp.department}
              {emp.shift && <span className="shift-badge">{emp.shift}</span>}
              {schedule?.gracePeriodMinutes > 0 && <span className="grace-badge">{schedule.gracePeriodMinutes}m grace</span>}
            </div>
          </div>
          <button className="btn-icon" onClick={onClose}>✕</button>
        </div>

        <div className="detail-pills">
          <div className="detail-pill">
            <div className="pill-val">{emp.workingDays}</div>
            <div className="pill-lbl">Days present</div>
          </div>
          <div className="detail-pill">
            <div className="pill-val">{fmtMinutes(emp.totalPresenceMinutes)}</div>
            <div className="pill-lbl">Total presence</div>
          </div>
          <div className="detail-pill detail-pill-amber">
            <div className="pill-val">{emp.lateDays ?? 0}d</div>
            <div className="pill-lbl">Late days</div>
          </div>
          <div className="detail-pill detail-pill-amber">
            <div className="pill-val">{fmtMinutes(emp.totalLateMinutes)}</div>
            <div className="pill-lbl">Late time</div>
          </div>
          <div className="detail-pill detail-pill-violet">
            <div className="pill-val">{fmtMinutes(emp.totalOvertimeMinutes)}</div>
            <div className="pill-lbl">Overtime</div>
          </div>
        </div>

        <div className="detail-body">
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
                  <tr key={d.date} className={isOff ? 'row-off' : ''}>
                    <td>
                      <div style={{ fontFamily: 'DM Mono, monospace', fontSize: 12 }}>{d.date}</div>
                      {d.isHoliday && <span className="day-badge day-holiday">Holiday</span>}
                      {d.isWeekend && <span className="day-badge day-weekend">Weekend</span>}
                      {(d.manualIn || d.manualOut) && <span className="day-badge day-edited">Edited</span>}
                    </td>
                    <td>
                      {isOff ? <span style={{ color: 'var(--text-subtle)' }}>—</span>
                             : <EditableTime value={d.inTime}  date={d.date} onSave={iso => saveIn(d.date, iso)}  />}
                    </td>
                    <td>
                      {isOff ? <span style={{ color: 'var(--text-subtle)' }}>—</span>
                             : <EditableTime value={d.outTime} date={d.date} onSave={iso => saveOut(d.date, iso)} />}
                    </td>
                    <td style={{ fontFamily: 'DM Mono, monospace', fontSize: 12 }}>{fmtMinutes(d.presenceMinutes)}</td>
                    <td>
                      {isOff ? '—' : d.lateMinutes > 0
                        ? <span className="badge badge-amber">{fmtMinutes(d.lateMinutes)}</span>
                        : <span className="on-time">✓ On time</span>}
                    </td>
                    <td>
                      {isOff ? '—' : d.overtimeMinutes > 0
                        ? <span className="badge badge-blue">{fmtMinutes(d.overtimeMinutes)}</span>
                        : <span style={{ color: 'var(--text-subtle)' }}>—</span>}
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      </div>
    </>
  )
}
