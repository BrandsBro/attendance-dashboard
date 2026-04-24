'use client'

import { useState, useEffect } from 'react'
import { fmtMinutes, fmt12h } from '@/lib/calculateStats'

const SETTINGS_KEY = 'dashboard_settings_v1'

export function loadDashSettings() {
  if (typeof window === 'undefined') return {}
  try { return JSON.parse(localStorage.getItem(SETTINGS_KEY) ?? '{}') }
  catch { return {} }
}

export function saveDashSettings(s) {
  if (typeof window === 'undefined') return
  localStorage.setItem(SETTINGS_KEY, JSON.stringify(s))
}

function fmt12(t) {
  if (!t) return '—'
  const [h, m] = t.split(':').map(Number)
  return `${h % 12 || 12}:${String(m).padStart(2,'0')} ${h >= 12 ? 'PM' : 'AM'}`
}

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
      <input type="time" className="inline-time-input"
        defaultValue={toVal(value)} autoFocus
        onChange={handleChange} onBlur={() => setEditing(false)} />
    )
  }

  return (
    <span className={`editable-time ${!value ? 'editable-time-empty' : ''}`}
      onClick={() => setEditing(true)} title="Click to edit">
      {fmt12h(value)}
      <span className="edit-pencil">✎</span>
    </span>
  )
}

function EditableField({ label, value, type = 'text', step, min, onChange }) {
  const [editing, setEditing] = useState(false)
  const [val, setVal]         = useState(value)

  useEffect(() => setVal(value), [value])

  function commit() {
    onChange(type === 'number' ? +val : val)
    setEditing(false)
  }

  if (editing) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
        <input
          type={type} step={step} min={min}
          className="inline-time-input"
          style={{ width: type === 'time' ? 100 : 70 }}
          value={val}
          autoFocus
          onChange={e => setVal(e.target.value)}
          onBlur={commit}
          onKeyDown={e => e.key === 'Enter' && commit()}
        />
      </div>
    )
  }

  return (
    <span className="editable-time" onClick={() => setEditing(true)} title="Click to edit">
      {type === 'time' ? fmt12(value) : value}
      <span className="edit-pencil">✎</span>
    </span>
  )
}

export default function EmployeeDetail({ employee: emp, schedules, onLogoutOverride, onClose }) {
  const schedule = schedules?.[emp.userId]
  const [settings, setSettings] = useState(() => loadDashSettings())

  const global   = settings._global  ?? {}
  const empSetts = settings[emp.userId] ?? {}

  const loginTime   = empSetts.loginTime    ?? global.loginTime    ?? schedule?.scheduledLoginTime  ?? '09:00'
  const logoutTime  = empSetts.logoutTime   ?? global.logoutTime   ?? schedule?.scheduledLogoutTime ?? '18:00'
  const gracePeriod = empSetts.gracePeriod  ?? global.gracePeriod  ?? schedule?.gracePeriodMinutes  ?? 0
  const otAfter     = empSetts.otAfterHours ?? global.otAfterHours ?? 8

  function setEmp(field, val) {
    const next = { ...settings, [emp.userId]: { ...empSetts, [field]: val } }
    saveDashSettings(next)
    setSettings(next)
  }

  function saveIn(date, iso)  { onLogoutOverride(emp.userId, date, iso, false, false, 'in')  }
  function saveOut(date, iso) { onLogoutOverride(emp.userId, date, iso, false, false, 'out') }

  function calcDayOT(d) {
    if (!d.outTime) return 0
    const outMs    = new Date(d.outTime).getTime()
    const [lh, lm] = logoutTime.split(':').map(Number)
    const logoutMs = new Date(d.date + 'T00:00:00').setHours(lh, lm, 0, 0)
    const otMs     = outMs - logoutMs
    return otMs > 0 ? Math.round(otMs / 60000) : 0
  }

  return (
    <>
      <div className="detail-backdrop" onClick={onClose} />
      <div className="detail-panel">

        {/* Header */}
        <div className="detail-header">
          <div style={{ flex: 1 }}>
            <div className="detail-name">{emp.name}</div>
            <div className="detail-dept">
              {emp.department}
              {emp.shift && <span className="shift-badge">{emp.shift}</span>}
            </div>
          </div>
          <button className="btn-icon" onClick={onClose}>✕</button>
        </div>

        {/* Editable schedule settings inline */}
        <div style={{ padding: '12px 20px', background: 'var(--bg)', borderBottom: '1px solid var(--border)', display: 'flex', gap: 20, flexWrap: 'wrap', alignItems: 'center' }}>
          <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '.06em', minWidth: 60 }}>Schedule</div>
          <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap', fontSize: 12 }}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
              <span style={{ fontSize: 10, color: 'var(--text-subtle)', textTransform: 'uppercase' }}>Login</span>
              <EditableField label="Login" value={loginTime} type="time"
                onChange={v => setEmp('loginTime', v)} />
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
              <span style={{ fontSize: 10, color: 'var(--text-subtle)', textTransform: 'uppercase' }}>Logout</span>
              <EditableField label="Logout" value={logoutTime} type="time"
                onChange={v => setEmp('logoutTime', v)} />
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
              <span style={{ fontSize: 10, color: 'var(--text-subtle)', textTransform: 'uppercase' }}>Grace (min)</span>
              <EditableField label="Grace" value={gracePeriod} type="number" min={0}
                onChange={v => setEmp('gracePeriod', v)} />
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
              <span style={{ fontSize: 10, color: 'var(--text-subtle)', textTransform: 'uppercase' }}>OT after (hrs)</span>
              <EditableField label="OT" value={otAfter} type="number" min={0} step={0.5}
                onChange={v => setEmp('otAfterHours', v)} />
            </div>
          </div>
        </div>

        {/* Stats pills */}
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

        {/* Table */}
        <div className="detail-body">
          <table className="data-table">
            <thead>
              <tr>
                <th>Date</th>
                <th>Shift</th>
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
                const dayOT = calcDayOT(d)
                return (
                  <tr key={d.date} className={isOff ? 'row-off' : ''}>
                    <td>
                      <div style={{ fontFamily: 'DM Mono, monospace', fontSize: 12 }}>{d.date}</div>
                      {d.isHoliday && <span className="day-badge day-holiday">Holiday</span>}
                      {d.isWeekend && <span className="day-badge day-weekend">Weekend</span>}
                      {(d.manualIn || d.manualOut) && <span className="day-badge day-edited">Edited</span>}
                    </td>
                    <td style={{ fontFamily: 'DM Mono, monospace', fontSize: 11, whiteSpace: 'nowrap' }}>
                      {isOff ? '—' : (
                        <span>
                          <span style={{ color: '#059669' }}>{fmt12(loginTime)}</span>
                          <span style={{ color: 'var(--text-subtle)' }}> → </span>
                          <span style={{ color: '#dc2626' }}>{fmt12(logoutTime)}</span>
                        </span>
                      )}
                    </td>
                    <td>
                      {isOff ? <span style={{ color: 'var(--text-subtle)' }}>—</span>
                             : <EditableTime value={d.inTime}  date={d.date} onSave={iso => saveIn(d.date, iso)} />}
                    </td>
                    <td>
                      {isOff ? <span style={{ color: 'var(--text-subtle)' }}>—</span>
                             : <EditableTime value={d.outTime} date={d.date} onSave={iso => saveOut(d.date, iso)} />}
                    </td>
                    <td style={{ fontFamily: 'DM Mono, monospace', fontSize: 12 }}>{fmtMinutes(d.presenceMinutes)}</td>
                    <td>
                      {isOff ? '—' : d.lateMinutes > 0
                        ? <span className="badge badge-amber">{fmtMinutes(d.lateMinutes)}</span>
                        : <span className="on-time">✓</span>}
                    </td>
                    <td>
                      {isOff ? '—' : dayOT > 0
                        ? <span className="badge badge-violet">{fmtMinutes(dayOT)}</span>
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
