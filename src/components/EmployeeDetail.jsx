'use client'

import { useState, useEffect } from 'react'
import { fmtMinutes, fmt12h } from '@/lib/calculateStats'

// localStorage helpers
const SETTINGS_KEY = 'dashboard_settings_v1'

function loadSettings() {
  if (typeof window === 'undefined') return {}
  try { return JSON.parse(localStorage.getItem(SETTINGS_KEY) ?? '{}') }
  catch { return {} }
}

function saveSettings(s) {
  if (typeof window === 'undefined') return
  localStorage.setItem(SETTINGS_KEY, JSON.stringify(s))
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

function SettingsPanel({ empId, empName, onClose }) {
  const [settings, setSettings] = useState(() => loadSettings())

  const global = settings._global ?? {}
  const emp    = settings[empId]   ?? {}

  function setGlobal(field, val) {
    const next = { ...settings, _global: { ...global, [field]: val } }
    saveSettings(next)
    setSettings(next)
  }

  function setEmp(field, val) {
    const next = { ...settings, [empId]: { ...emp, [field]: val } }
    saveSettings(next)
    setSettings(next)
  }

  function clearEmp(field) {
    const updated = { ...emp }
    delete updated[field]
    const next = { ...settings, [empId]: updated }
    saveSettings(next)
    setSettings(next)
  }

  return (
    <div className="payroll-modal-backdrop" onClick={onClose}>
      <div className="payroll-modal" style={{ maxWidth: 520 }} onClick={e => e.stopPropagation()}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
          <div style={{ fontSize: 15, fontWeight: 600 }}>Schedule Settings</div>
          <button className="btn-icon" onClick={onClose}>✕</button>
        </div>

        {/* Global settings */}
        <div style={{ background: 'var(--bg)', borderRadius: 8, padding: 14, border: '1px solid var(--border)', marginBottom: 14 }}>
          <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '.06em', marginBottom: 12 }}>
            Global Defaults — applies to all employees
          </div>
          <div className="profile-form">
            <label className="form-label">
              Login Time
              <input type="time" className="input"
                value={global.loginTime ?? '09:00'}
                onChange={e => setGlobal('loginTime', e.target.value)} />
            </label>
            <label className="form-label">
              Logout Time
              <input type="time" className="input"
                value={global.logoutTime ?? '18:00'}
                onChange={e => setGlobal('logoutTime', e.target.value)} />
            </label>
            <label className="form-label">
              Grace Period (min)
              <input type="number" className="input" min={0}
                value={global.gracePeriod ?? 0}
                onChange={e => setGlobal('gracePeriod', +e.target.value)} />
            </label>
            <label className="form-label">
              OT After (hours)
              <input type="number" className="input" min={0} step={0.5}
                value={global.otAfterHours ?? 8}
                onChange={e => setGlobal('otAfterHours', +e.target.value)} />
            </label>
          </div>
        </div>

        {/* Per-employee override */}
        <div style={{ background: '#eef2ff', borderRadius: 8, padding: 14, border: '1px solid #c7d2fe' }}>
          <div style={{ fontSize: 12, fontWeight: 700, color: '#3730a3', textTransform: 'uppercase', letterSpacing: '.06em', marginBottom: 12 }}>
            {empName} — Individual Override
          </div>
          <div className="profile-form">
            <label className="form-label">
              Login Time
              <div style={{ display: 'flex', gap: 6 }}>
                <input type="time" className="input"
                  value={emp.loginTime ?? global.loginTime ?? '09:00'}
                  onChange={e => setEmp('loginTime', e.target.value)} />
                {emp.loginTime && <button className="btn-link" style={{ fontSize: 11 }} onClick={() => clearEmp('loginTime')}>Reset</button>}
              </div>
            </label>
            <label className="form-label">
              Logout Time
              <div style={{ display: 'flex', gap: 6 }}>
                <input type="time" className="input"
                  value={emp.logoutTime ?? global.logoutTime ?? '18:00'}
                  onChange={e => setEmp('logoutTime', e.target.value)} />
                {emp.logoutTime && <button className="btn-link" style={{ fontSize: 11 }} onClick={() => clearEmp('logoutTime')}>Reset</button>}
              </div>
            </label>
            <label className="form-label">
              Grace Period (min)
              <div style={{ display: 'flex', gap: 6 }}>
                <input type="number" className="input" min={0}
                  value={emp.gracePeriod ?? global.gracePeriod ?? 0}
                  onChange={e => setEmp('gracePeriod', +e.target.value)} />
                {emp.gracePeriod !== undefined && <button className="btn-link" style={{ fontSize: 11 }} onClick={() => clearEmp('gracePeriod')}>Reset</button>}
              </div>
            </label>
            <label className="form-label">
              OT After (hours)
              <div style={{ display: 'flex', gap: 6 }}>
                <input type="number" className="input" min={0} step={0.5}
                  value={emp.otAfterHours ?? global.otAfterHours ?? 8}
                  onChange={e => setEmp('otAfterHours', +e.target.value)} />
                {emp.otAfterHours !== undefined && <button className="btn-link" style={{ fontSize: 11 }} onClick={() => clearEmp('otAfterHours')}>Reset</button>}
              </div>
            </label>
          </div>
        </div>

        <button className="btn btn-primary" style={{ width: '100%', marginTop: 16 }} onClick={onClose}>
          Done
        </button>
      </div>
    </div>
  )
}

export default function EmployeeDetail({ employee: emp, schedules, onLogoutOverride, onClose }) {
  const schedule = schedules?.[emp.userId]
  const [showSettings, setShowSettings] = useState(false)
  const [settings, setSettings]         = useState(() => loadSettings())

  // Refresh settings when panel opens
  useEffect(() => { setSettings(loadSettings()) }, [showSettings])

  const global   = settings._global ?? {}
  const empSetts = settings[emp.userId] ?? {}

  const loginTime   = empSetts.loginTime   ?? global.loginTime   ?? schedule?.scheduledLoginTime  ?? '09:00'
  const logoutTime  = empSetts.logoutTime  ?? global.logoutTime  ?? schedule?.scheduledLogoutTime ?? '18:00'
  const gracePeriod = empSetts.gracePeriod ?? global.gracePeriod ?? schedule?.gracePeriodMinutes  ?? 0
  const otAfter     = empSetts.otAfterHours ?? global.otAfterHours ?? 8

  function saveIn(date, iso)  { onLogoutOverride(emp.userId, date, iso, false, false, 'in')  }
  function saveOut(date, iso) { onLogoutOverride(emp.userId, date, iso, false, false, 'out') }

  function fmt(t) {
    if (!t) return '—'
    const [h, m] = t.split(':').map(Number)
    const ampm = h >= 12 ? 'PM' : 'AM'
    const hh   = h % 12 || 12
    return `${hh}:${String(m).padStart(2,'0')} ${ampm}`
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
              {gracePeriod > 0 && <span className="grace-badge">{gracePeriod}m grace</span>}
            </div>
            {/* Schedule info row */}
            <div style={{ display: 'flex', gap: 12, marginTop: 6, fontSize: 11, color: 'var(--text-muted)', fontFamily: 'DM Mono, monospace' }}>
              <span>🕐 In: <strong style={{ color: 'var(--text)' }}>{fmt(loginTime)}</strong></span>
              <span>🕕 Out: <strong style={{ color: 'var(--text)' }}>{fmt(logoutTime)}</strong></span>
              <span>⏱ OT after: <strong style={{ color: 'var(--text)' }}>{otAfter}h</strong></span>
            </div>
          </div>
          <div style={{ display: 'flex', gap: 8 }}>
            <button className="btn btn-secondary" style={{ padding: '5px 10px', fontSize: 12 }}
              onClick={() => setShowSettings(true)}>
              ⚙ Settings
            </button>
            <button className="btn-icon" onClick={onClose}>✕</button>
          </div>
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

      {showSettings && (
        <SettingsPanel
          empId={emp.userId}
          empName={emp.name}
          onClose={() => { setShowSettings(false); setSettings(loadSettings()) }}
        />
      )}
    </>
  )
}
