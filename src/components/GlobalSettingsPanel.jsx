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

export default function GlobalSettingsPanel({ employees = [], onClose, onRecalculate }) {
  const [open,       setOpen]       = useState(false)
  const [settings,   setSettings]   = useState(() => loadDashSettings())
  const [selected,   setSelected]   = useState(new Set())
  const [loginTime,  setLoginTime]  = useState('09:00')
  const [logoutTime, setLogoutTime] = useState('18:00')
  const [grace,      setGrace]      = useState(0)
  const [otAfter,    setOtAfter]    = useState(30)
  const [applied,    setApplied]    = useState(false)
  const [applyLogin,  setApplyLogin]  = useState(true)
  const [applyLogout, setApplyLogout] = useState(true)
  const [applyGrace,  setApplyGrace]  = useState(true)
  const [applyOT,     setApplyOT]     = useState(true)

  const global = settings._global ?? {}

  function toggleAll() {
    setSelected(selected.size === employees.length ? new Set() : new Set(employees.map(e => e.userId)))
  }

  function toggle(userId) {
    const next = new Set(selected)
    next.has(userId) ? next.delete(userId) : next.add(userId)
    setSelected(next)
  }

  function apply(ids) {
    const next = { ...settings }
    for (const userId of ids) {
      const cur = next[userId] ?? {}
      next[userId] = {
        ...cur,
        ...(applyLogin  ? { loginTime }              : {}),
        ...(applyLogout ? { logoutTime }             : {}),
        ...(applyGrace  ? { gracePeriod: grace }     : {}),
        ...(applyOT     ? { otBufferMins: otAfter }  : {}),
      }
    }
    const g = next._global ?? {}
    next._global = {
      ...g,
      ...(applyLogin  ? { loginTime }              : {}),
      ...(applyLogout ? { logoutTime }             : {}),
      ...(applyGrace  ? { gracePeriod: grace }     : {}),
      ...(applyOT     ? { otBufferMins: otAfter }  : {}),
    }
    saveDashSettings(next)
    setSettings(next)
    setApplied(true)
    setTimeout(() => setApplied(false), 2000)
  }

  return (
    <div className="card">
      <div className="card-header" style={{ cursor: 'pointer' }} onClick={() => setOpen(p => !p)}>
        <span className="card-title">⚙ Schedule Settings</span>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <span style={{ fontSize: 12, color: 'var(--text-muted)', fontFamily: 'DM Mono, monospace' }}>
            <strong>{fmt12(global.loginTime ?? '09:00')}</strong> → <strong>{fmt12(global.logoutTime ?? '18:00')}</strong> · Grace: <strong>{global.gracePeriod ?? 0}m</strong> · OT: <strong>{global.otBufferMins ?? 30}m</strong>
          </span>
          <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>{open ? '▲' : '▼'}</span>
        </div>
      </div>
      {open && <div className="card-body" style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>

        {/* Settings form row */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 12 }}>
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
            OT Buffer (min)
            <input type="number" className="input" min={0} step={1} value={otAfter === 8 ? 30 : otAfter} onChange={e => setOtAfter(+e.target.value)} />
          </label>
        </div>

        {/* Field selection */}
        <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap', padding: '10px 14px', background: 'var(--bg)', borderRadius: 8, border: '1px solid var(--border)' }}>
          <span style={{ fontSize: 11, fontWeight: 600, color: 'var(--text-muted)', alignSelf: 'center' }}>Apply:</span>
          {[
            { label: 'Login Time',    state: applyLogin,  set: setApplyLogin  },
            { label: 'Logout Time',   state: applyLogout, set: setApplyLogout },
            { label: 'Grace Period',  state: applyGrace,  set: setApplyGrace  },
            { label: 'OT Buffer',     state: applyOT,     set: setApplyOT     },
          ].map(f => (
            <label key={f.label} style={{ display: 'flex', alignItems: 'center', gap: 6, cursor: 'pointer', fontSize: 12, fontWeight: 500 }}>
              <input type="checkbox" checked={f.state} onChange={e => f.set(e.target.checked)}
                style={{ width: 14, height: 14, accentColor: 'var(--accent)', cursor: 'pointer' }} />
              {f.label}
            </label>
          ))}
        </div>

        {/* Action buttons */}
        <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
          <button className="btn btn-primary" disabled={selected.size === 0} onClick={() => apply(selected)}>
            {applied ? '✓ Applied!' : `Apply to ${selected.size} selected`}
          </button>
          <button className="btn btn-secondary" onClick={() => apply(new Set(employees.map(e => e.userId)))}>
            Apply to ALL ({employees.length})
          </button>
          <button className="btn btn-secondary" style={{ marginLeft: 'auto' }}
            onClick={() => {
              window.dispatchEvent(new CustomEvent('dashSettingsChanged'))
              onRecalculate?.()
            }}>
            ↻ Recalculate Stats
          </button>
        </div>

        {/* Employee list */}
        <div>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
            <span style={{ fontSize: 12, color: 'var(--text-muted)', fontWeight: 500 }}>{selected.size} of {employees.length} selected</span>
            <button className="btn-link" style={{ fontSize: 12 }} onClick={toggleAll}>
              {selected.size === employees.length ? 'Deselect all' : 'Select all'}
            </button>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: 6 }}>
            {employees.map(emp => {
              const s          = settings[emp.userId] ?? {}
              const isSelected = selected.has(emp.userId)
              const hasOverride = s.loginTime || s.logoutTime
              return (
                <div key={emp.userId} onClick={() => toggle(emp.userId)} style={{
                  display: 'flex', alignItems: 'center', gap: 10,
                  padding: '8px 12px', borderRadius: 8, cursor: 'pointer',
                  border: '1.5px solid',
                  borderColor: isSelected ? 'var(--accent)' : 'var(--border)',
                  background: isSelected ? '#eef2ff' : 'var(--bg)',
                  transition: 'all .15s',
                }}>
                  <div style={{
                    width: 16, height: 16, borderRadius: 4, flexShrink: 0,
                    border: '2px solid', borderColor: isSelected ? 'var(--accent)' : 'var(--border)',
                    background: isSelected ? 'var(--accent)' : 'transparent',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                  }}>
                    {isSelected && <span style={{ color: '#fff', fontSize: 10 }}>✓</span>}
                  </div>
                  <div className="emp-avatar" style={{ background: getColor(emp.userId), width: 28, height: 28, fontSize: 10, borderRadius: 6, flexShrink: 0 }}>
                    {getInitials(emp.name)}
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: 12, fontWeight: 500, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{emp.name}</div>
                    <div style={{ fontSize: 10, color: hasOverride ? 'var(--accent)' : 'var(--text-subtle)', fontFamily: 'DM Mono, monospace' }}>
                      {hasOverride ? `${fmt12(s.loginTime)} → ${fmt12(s.logoutTime)}` : 'Global defaults'}
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        </div>

      </div>}
    </div>
  )
}
