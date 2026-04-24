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
  const [settings,    setSettings]    = useState(() => loadDashSettings())
  const [selectedEmp, setSelectedEmp] = useState(null)
  const [search,      setSearch]      = useState('')

  const global = settings._global ?? {}

  function setGlobal(field, val) {
    const next = { ...settings, _global: { ...global, [field]: val } }
    saveDashSettings(next)
    setSettings(next)
  }

  function setEmp(userId, field, val) {
    const cur  = settings[userId] ?? {}
    const next = { ...settings, [userId]: { ...cur, [field]: val } }
    saveDashSettings(next)
    setSettings(next)
  }

  function resetEmp(userId, field) {
    const cur     = { ...(settings[userId] ?? {}) }
    delete cur[field]
    const next = { ...settings, [userId]: cur }
    saveDashSettings(next)
    setSettings(next)
  }

  function applyGlobalToAll() {
    const next = { ...settings }
    for (const emp of employees) {
      next[emp.userId] = {
        ...(next[emp.userId] ?? {}),
        loginTime:   global.loginTime   ?? '09:00',
        logoutTime:  global.logoutTime  ?? '18:00',
        gracePeriod: global.gracePeriod ?? 0,
      }
    }
    saveDashSettings(next)
    setSettings(next)
  }

  const filtered = employees.filter(e =>
    e.name.toLowerCase().includes(search.toLowerCase()) ||
    String(e.userId).includes(search)
  )

  return (
    <div className="card">
      <div className="card-header">
        <span className="card-title">⚙ Schedule Settings</span>
      </div>
      <div className="card-body" style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>

        {/* Global defaults */}
        <div style={{ background: 'var(--bg)', borderRadius: 10, padding: 16, border: '1px solid var(--border)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
            <div>
              <div style={{ fontWeight: 600, fontSize: 13 }}>Global Defaults</div>
              <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 2 }}>Applies to all employees unless overridden</div>
            </div>
            <button className="btn btn-secondary" style={{ fontSize: 12 }} onClick={applyGlobalToAll}>
              Apply to all employees
            </button>
          </div>
          <div className="profile-form">
            <label className="form-label">
              Login Time
              <input type="time" className="input" value={global.loginTime ?? '09:00'}
                onChange={e => setGlobal('loginTime', e.target.value)} />
            </label>
            <label className="form-label">
              Logout Time
              <input type="time" className="input" value={global.logoutTime ?? '18:00'}
                onChange={e => setGlobal('logoutTime', e.target.value)} />
            </label>
            <label className="form-label">
              Grace Period (min)
              <input type="number" className="input" min={0} value={global.gracePeriod ?? 0}
                onChange={e => setGlobal('gracePeriod', +e.target.value)} />
            </label>
            <label className="form-label">
              OT After (hours)
              <input type="number" className="input" min={0} step={0.5} value={global.otAfterHours ?? 8}
                onChange={e => setGlobal('otAfterHours', +e.target.value)} />
            </label>
          </div>
          <div style={{ marginTop: 12, padding: '8px 12px', background: 'var(--surface)', borderRadius: 8, fontSize: 12, fontFamily: 'DM Mono, monospace', color: 'var(--text-muted)' }}>
            Current: <strong>{fmt12(global.loginTime ?? '09:00')}</strong> → <strong>{fmt12(global.logoutTime ?? '18:00')}</strong> · Grace: <strong>{global.gracePeriod ?? 0}m</strong> · OT after: <strong>{global.otAfterHours ?? 8}h</strong>
          </div>
        </div>

        {/* Individual overrides */}
        <div>
          <div style={{ fontWeight: 600, fontSize: 13, marginBottom: 10 }}>Individual Overrides</div>
          <div className="search-wrap" style={{ marginBottom: 12 }}>
            <span className="search-icon">⌕</span>
            <input className="input search-input" placeholder="Search employee…" value={search} onChange={e => setSearch(e.target.value)} />
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            {filtered.map(emp => {
              const s         = settings[emp.userId] ?? {}
              const isActive  = selectedEmp === emp.userId
              const hasOverride = s.loginTime || s.logoutTime || s.gracePeriod !== undefined

              return (
                <div key={emp.userId}
                  style={{
                    border: '1px solid',
                    borderColor: isActive ? 'var(--accent)' : 'var(--border)',
                    borderRadius: 10,
                    background: isActive ? 'var(--accent-light, #eef2ff)' : 'var(--bg)',
                    overflow: 'hidden',
                  }}
                >
                  {/* Employee row header */}
                  <div
                    style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '10px 14px', cursor: 'pointer' }}
                    onClick={() => setSelectedEmp(isActive ? null : emp.userId)}
                  >
                    <div className="emp-avatar" style={{ background: getColor(emp.userId), width: 32, height: 32, fontSize: 11, borderRadius: 8, flexShrink: 0 }}>
                      {getInitials(emp.name)}
                    </div>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontSize: 13, fontWeight: 500 }}>{emp.name}</div>
                      <div style={{ fontSize: 11, color: 'var(--text-muted)', fontFamily: 'DM Mono, monospace' }}>
                        {hasOverride
                          ? <span style={{ color: 'var(--accent)' }}>
                              {fmt12(s.loginTime ?? global.loginTime ?? '09:00')} → {fmt12(s.logoutTime ?? global.logoutTime ?? '18:00')} · {s.gracePeriod ?? global.gracePeriod ?? 0}m grace
                            </span>
                          : <span style={{ color: 'var(--text-subtle)' }}>Using global defaults</span>}
                      </div>
                    </div>
                    <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
                      {hasOverride && (
                        <button className="btn btn-danger" style={{ fontSize: 11, padding: '3px 8px' }}
                          onClick={e => { e.stopPropagation(); resetEmp(emp.userId, 'loginTime'); resetEmp(emp.userId, 'logoutTime'); resetEmp(emp.userId, 'gracePeriod') }}>
                          Reset
                        </button>
                      )}
                      <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>{isActive ? '▲' : '▼'}</span>
                    </div>
                  </div>

                  {/* Expanded settings */}
                  {isActive && (
                    <div style={{ padding: '0 14px 14px', borderTop: '1px solid var(--border)' }}>
                      <div className="profile-form" style={{ marginTop: 12 }}>
                        <label className="form-label">
                          Login Time
                          <input type="time" className="input"
                            value={s.loginTime ?? global.loginTime ?? '09:00'}
                            onChange={e => setEmp(emp.userId, 'loginTime', e.target.value)} />
                        </label>
                        <label className="form-label">
                          Logout Time
                          <input type="time" className="input"
                            value={s.logoutTime ?? global.logoutTime ?? '18:00'}
                            onChange={e => setEmp(emp.userId, 'logoutTime', e.target.value)} />
                        </label>
                        <label className="form-label">
                          Grace Period (min)
                          <input type="number" className="input" min={0}
                            value={s.gracePeriod ?? global.gracePeriod ?? 0}
                            onChange={e => setEmp(emp.userId, 'gracePeriod', +e.target.value)} />
                        </label>
                        <label className="form-label">
                          OT After (hours)
                          <input type="number" className="input" min={0} step={0.5}
                            value={s.otAfterHours ?? global.otAfterHours ?? 8}
                            onChange={e => setEmp(emp.userId, 'otAfterHours', +e.target.value)} />
                        </label>
                      </div>
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        </div>
      </div>
    </div>
  )
}
