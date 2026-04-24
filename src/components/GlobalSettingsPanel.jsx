'use client'

import { useState } from 'react'
import { loadDashSettings, saveDashSettings } from '@/components/EmployeeDetail'

const COLORS = ['#4f46e5','#0891b2','#059669','#d97706','#dc2626','#7c3aed','#db2777','#0284c7']
function getColor(id) { const s = String(id ?? '0'); return COLORS[s.charCodeAt(s.length-1) % COLORS.length] }
function getInitials(name) { const n = String(name ?? '?'); return n.split(' ').map(w => w[0]||'').join('').toUpperCase().slice(0,2) }
function fmt12(t) {
  if (!t) return '—'
  const [h, m] = t.split(':').map(Number)
  return `${h % 12 || 12}:${String(m).padStart(2,'0')} ${h >= 12 ? 'PM' : 'AM'}`
}

export default function GlobalSettingsPanel({ employees = [] }) {
  const [settings,  setSettings]  = useState(() => loadDashSettings())
  const [selected,  setSelected]  = useState(new Set())
  const [loginTime, setLoginTime] = useState('09:00')
  const [logoutTime,setLogoutTime]= useState('18:00')
  const [grace,     setGrace]     = useState(0)
  const [otAfter,   setOtAfter]   = useState(8)
  const [applied,   setApplied]   = useState(false)

  const global = settings._global ?? {}

  function toggleAll() {
    if (selected.size === employees.length) {
      setSelected(new Set())
    } else {
      setSelected(new Set(employees.map(e => e.userId)))
    }
  }

  function toggle(userId) {
    const next = new Set(selected)
    next.has(userId) ? next.delete(userId) : next.add(userId)
    setSelected(next)
  }

  function applyToSelected() {
    const next = { ...settings }
    for (const userId of selected) {
      next[userId] = {
        ...(next[userId] ?? {}),
        loginTime,
        logoutTime,
        gracePeriod:  grace,
        otAfterHours: otAfter,
      }
    }
    saveDashSettings(next)
    setSettings(next)
    setApplied(true)
    setTimeout(() => setApplied(false), 2000)
  }

  function applyGlobalToAll() {
    const next = { ...settings, _global: { loginTime, logoutTime, gracePeriod: grace, otAfterHours: otAfter } }
    // Also apply to all employees
    for (const emp of employees) {
      next[emp.userId] = { ...(next[emp.userId] ?? {}), loginTime, logoutTime, gracePeriod: grace, otAfterHours: otAfter }
    }
    saveDashSettings(next)
    setSettings(next)
    setApplied(true)
    setTimeout(() => setApplied(false), 2000)
  }

  return (
    <div className="card">
      <div className="card-header">
        <span className="card-title">⚙ Schedule Settings</span>
        <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>
          Current global: <strong>{fmt12(global.loginTime ?? '09:00')}</strong> → <strong>{fmt12(global.logoutTime ?? '18:00')}</strong> · Grace: <strong>{global.gracePeriod ?? 0}m</strong>
        </span>
      </div>
      <div className="card-body">
        <div style={{ display: 'flex', gap: 20, flexWrap: 'wrap' }}>

          {/* Left — settings form */}
          <div style={{ minWidth: 280, flex: '0 0 280px', display: 'flex', flexDirection: 'column', gap: 14 }}>
            <div className="profile-form">
              <label className="form-label">
                Login Time
                <input type="time" className="input" value={loginTime} onChange={e => setLoginTime(e.target.value)} />
              </label>
              <label className="form-label">
                Logout Time
                <input type="time" className="input" value={logoutTime} onChange={e => setLogoutTime(e.target.value)} />
              </label>
              <label className="form-label">
                Grace Period (min)
                <input type="number" className="input" min={0} value={grace} onChange={e => setGrace(+e.target.value)} />
              </label>
              <label className="form-label">
                OT After (hours)
                <input type="number" className="input" min={0} step={0.5} value={otAfter} onChange={e => setOtAfter(+e.target.value)} />
              </label>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              <button
                className="btn btn-primary"
                disabled={selected.size === 0}
                onClick={applyToSelected}
              >
                {applied ? '✓ Applied!' : `Apply to ${selected.size} selected employee${selected.size !== 1 ? 's' : ''}`}
              </button>
              <button className="btn btn-secondary" onClick={applyGlobalToAll}>
                Apply to ALL employees
              </button>
            </div>
          </div>

          {/* Right — employee list */}
          <div style={{ flex: 1, minWidth: 200 }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
              <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-muted)' }}>
                {selected.size} of {employees.length} selected
              </div>
              <button className="btn-link" style={{ fontSize: 12 }} onClick={toggleAll}>
                {selected.size === employees.length ? 'Deselect all' : 'Select all'}
              </button>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 4, maxHeight: 320, overflowY: 'auto' }}>
              {employees.map(emp => {
                const s          = settings[emp.userId] ?? {}
                const isSelected = selected.has(emp.userId)
                const hasOverride = s.loginTime || s.logoutTime

                return (
                  <div
                    key={emp.userId}
                    onClick={() => toggle(emp.userId)}
                    style={{
                      display: 'flex', alignItems: 'center', gap: 10,
                      padding: '8px 12px', borderRadius: 8, cursor: 'pointer',
                      border: '1.5px solid',
                      borderColor: isSelected ? 'var(--accent)' : 'var(--border)',
                      background: isSelected ? 'var(--accent-light, #eef2ff)' : 'var(--bg)',
                      transition: 'all .15s',
                    }}
                  >
                    <div style={{
                      width: 16, height: 16, borderRadius: 4, flexShrink: 0,
                      border: '2px solid',
                      borderColor: isSelected ? 'var(--accent)' : 'var(--border)',
                      background: isSelected ? 'var(--accent)' : 'transparent',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                    }}>
                      {isSelected && <span style={{ color: '#fff', fontSize: 10, lineHeight: 1 }}>✓</span>}
                    </div>
                    <div className="emp-avatar" style={{ background: getColor(emp.userId), width: 28, height: 28, fontSize: 10, borderRadius: 6, flexShrink: 0 }}>
                      {getInitials(emp.name)}
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontSize: 13, fontWeight: 500, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{emp.name}</div>
                      <div style={{ fontSize: 10, color: hasOverride ? 'var(--accent)' : 'var(--text-subtle)', fontFamily: 'DM Mono, monospace' }}>
                        {hasOverride
                          ? `${fmt12(s.loginTime)} → ${fmt12(s.logoutTime)} · ${s.gracePeriod ?? 0}m`
                          : 'Using global defaults'}
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
