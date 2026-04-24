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
    return <input type="time" className="inline-time-input" defaultValue={toVal(value)} autoFocus onChange={handleChange} onBlur={() => setEditing(false)} />
  }
  return (
    <span className={`editable-time ${!value ? 'editable-time-empty' : ''}`} onClick={() => setEditing(true)} title="Click to edit">
      {fmt12h(value)}<span className="edit-pencil">✎</span>
    </span>
  )
}

function EditableTimeStr({ value, fallback, onSave }) {
  const [editing, setEditing] = useState(false)
  const [val, setVal] = useState(value ?? fallback)
  useEffect(() => setVal(value ?? fallback), [value, fallback])
  function commit() { onSave(val); setEditing(false) }
  if (editing) {
    return <input type="time" className="inline-time-input" style={{ width: 95 }} value={val} autoFocus onChange={e => setVal(e.target.value)} onBlur={commit} onKeyDown={e => e.key === 'Enter' && commit()} />
  }
  return (
    <span className="editable-time" onClick={() => setEditing(true)} title="Click to edit">
      {fmt12(value ?? fallback)}<span className="edit-pencil">✎</span>
    </span>
  )
}

function EditableNum({ value, min = 0, step = 1, suffix = '', onSave }) {
  const [editing, setEditing] = useState(false)
  const [val, setVal] = useState(value)
  useEffect(() => setVal(value), [value])
  function commit() { onSave(+val); setEditing(false) }
  if (editing) {
    return <input type="number" className="inline-time-input" style={{ width: 60 }} min={min} step={step} value={val} autoFocus onChange={e => setVal(e.target.value)} onBlur={commit} onKeyDown={e => e.key === 'Enter' && commit()} />
  }
  return (
    <span className="editable-time" onClick={() => setEditing(true)} title="Click to edit">
      {value}{suffix}<span className="edit-pencil">✎</span>
    </span>
  )
}

export default function EmployeeDetail({ employee: emp, schedules, onLogoutOverride, onClose }) {
  const schedule = schedules?.[emp.userId]
  const [settings, setSettings] = useState(() => loadDashSettings())
  const [rowOverrides, setRowOverrides] = useState(() => {
    const s = loadDashSettings()
    return s[emp.userId + '_rows'] ?? {}
  })

  const global   = settings._global    ?? {}
  const empSetts = settings[emp.userId] ?? {}

  const defLogin  = empSetts.loginTime   ?? global.loginTime   ?? schedule?.scheduledLoginTime  ?? '09:00'
  const defLogout = empSetts.logoutTime  ?? global.logoutTime  ?? schedule?.scheduledLogoutTime ?? '18:00'
  const defGrace  = empSetts.gracePeriod ?? global.gracePeriod ?? schedule?.gracePeriodMinutes  ?? 0

  function saveRowOverride(date, field, val) {
    const next = { ...rowOverrides, [date]: { ...(rowOverrides[date] ?? {}), [field]: val } }
    setRowOverrides(next)
    const s = loadDashSettings()
    saveDashSettings({ ...s, [emp.userId + '_rows']: next })
  }

  function saveIn(date, iso)  { onLogoutOverride(emp.userId, date, iso, false, false, 'in')  }
  function saveOut(date, iso) { onLogoutOverride(emp.userId, date, iso, false, false, 'out') }

  function calcDayOT(d, rowLogout) {
    if (rowOverrides[d.date]?.otMinutes !== undefined) return rowOverrides[d.date].otMinutes
    if (!d.outTime) return 0
    const outMs    = new Date(d.outTime).getTime()
    const [lh, lm] = rowLogout.split(':').map(Number)
    const logoutMs = new Date(d.date + 'T00:00:00').setHours(lh, lm, 0, 0)
    return Math.max(0, Math.round((outMs - logoutMs) / 60000))
  }

  function calcDayLate(d, rowLogin, rowGrace) {
    if (!d.inTime) return 0
    const inMs     = new Date(d.inTime).getTime()
    const [lh, lm] = rowLogin.split(':').map(Number)
    const loginMs  = new Date(d.date + 'T00:00:00').setHours(lh, lm, 0, 0)
    return Math.max(0, Math.round((inMs - loginMs - rowGrace * 60000) / 60000))
  }

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
            </div>
            <div style={{ display: 'flex', gap: 16, marginTop: 8, flexWrap: 'wrap', alignItems: 'center' }}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                <span style={{ fontSize: 9, color: 'var(--text-subtle)', textTransform: 'uppercase', letterSpacing: '.06em' }}>Default Login</span>
                <EditableTimeStr value={empSetts.loginTime} fallback={defLogin}
                  onSave={v => { const next = { ...settings, [emp.userId]: { ...empSetts, loginTime: v } }; saveDashSettings(next); setSettings(next) }} />
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                <span style={{ fontSize: 9, color: 'var(--text-subtle)', textTransform: 'uppercase', letterSpacing: '.06em' }}>Default Logout</span>
                <EditableTimeStr value={empSetts.logoutTime} fallback={defLogout}
                  onSave={v => { const next = { ...settings, [emp.userId]: { ...empSetts, logoutTime: v } }; saveDashSettings(next); setSettings(next) }} />
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                <span style={{ fontSize: 9, color: 'var(--text-subtle)', textTransform: 'uppercase', letterSpacing: '.06em' }}>Default Grace (min)</span>
                <EditableNum value={defGrace} suffix="m"
                  onSave={v => { const next = { ...settings, [emp.userId]: { ...empSetts, gracePeriod: v } }; saveDashSettings(next); setSettings(next) }} />
              </div>
            </div>
          </div>
          <button className="btn-icon" onClick={onClose}>✕</button>
        </div>

        <div className="detail-pills">
          <div className="detail-pill"><div className="pill-val">{emp.workingDays}</div><div className="pill-lbl">Days present</div></div>
          <div className="detail-pill"><div className="pill-val">{fmtMinutes(emp.totalPresenceMinutes)}</div><div className="pill-lbl">Total presence</div></div>
          <div className="detail-pill detail-pill-amber"><div className="pill-val">{emp.lateDays ?? 0}d</div><div className="pill-lbl">Late days</div></div>
          <div className="detail-pill detail-pill-amber"><div className="pill-val">{fmtMinutes(emp.totalLateMinutes)}</div><div className="pill-lbl">Late time</div></div>
          <div className="detail-pill detail-pill-violet"><div className="pill-val">{fmtMinutes(emp.totalOvertimeMinutes)}</div><div className="pill-lbl">Overtime</div></div>
        </div>

        <div className="detail-body">
          <table className="data-table">
            <thead>
              <tr>
                <th>Date</th>
                <th>Shift <span className="th-hint">click to edit</span></th>
                <th>In <span className="th-hint">click to edit</span></th>
                <th>Out <span className="th-hint">click to edit</span></th>
                <th>Grace <span className="th-hint">✎</span></th>
                <th>Presence</th>
                <th>Late</th>
                <th>OT <span className="th-hint">click to edit</span></th>
              </tr>
            </thead>
            <tbody>
              {emp.days.map(d => {
                const isOff     = d.isWeekend || d.isHoliday
                const rowLogin  = rowOverrides[d.date]?.loginTime   ?? defLogin
                const rowLogout = rowOverrides[d.date]?.logoutTime  ?? defLogout
                const rowGrace  = rowOverrides[d.date]?.gracePeriod ?? defGrace
                const dayOT     = calcDayOT(d, rowLogout)
                const dayLate   = calcDayLate(d, rowLogin, rowGrace)
                return (
                  <tr key={d.date} className={isOff ? 'row-off' : ''}>
                    <td>
                      <div style={{ fontFamily: 'DM Mono, monospace', fontSize: 12 }}>{d.date}</div>
                      {d.isHoliday && <span className="day-badge day-holiday">Holiday</span>}
                      {d.isWeekend && <span className="day-badge day-weekend">Weekend</span>}
                      {(d.manualIn || d.manualOut) && <span className="day-badge day-edited">Edited</span>}
                    </td>
                    <td style={{ fontSize: 11, fontFamily: 'DM Mono, monospace', whiteSpace: 'nowrap' }}>
                      {isOff ? '—' : (
                        <span style={{ display: 'flex', gap: 4, alignItems: 'center' }}>
                          <EditableTimeStr value={rowOverrides[d.date]?.loginTime} fallback={defLogin} onSave={v => saveRowOverride(d.date, 'loginTime', v)} />
                          <span style={{ color: 'var(--text-subtle)' }}>→</span>
                          <EditableTimeStr value={rowOverrides[d.date]?.logoutTime} fallback={defLogout} onSave={v => saveRowOverride(d.date, 'logoutTime', v)} />
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
                    <td>
                      {isOff ? '—' : <EditableNum value={rowGrace} suffix="m" onSave={v => saveRowOverride(d.date, 'gracePeriod', v)} />}
                    </td>
                    <td style={{ fontFamily: 'DM Mono, monospace', fontSize: 12 }}>{fmtMinutes(d.presenceMinutes)}</td>
                    <td>
                      {isOff ? '—' : dayLate > 0
                        ? <span className="badge badge-amber">{fmtMinutes(dayLate)}</span>
                        : <span className="on-time">✓</span>}
                    </td>
                    <td>
                      {isOff ? '—' : <EditableNum value={dayOT} suffix="m" min={0} onSave={v => saveRowOverride(d.date, 'otMinutes', v)} />}
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
