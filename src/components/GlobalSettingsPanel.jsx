'use client'

import { useState } from 'react'
import { loadDashSettings, saveDashSettings } from '@/components/EmployeeDetail'

export default function GlobalSettingsPanel({ onClose }) {
  const [settings, setSettings] = useState(() => loadDashSettings())
  const global = settings._global ?? {}

  function set(field, val) {
    const next = { ...settings, _global: { ...global, [field]: val } }
    saveDashSettings(next)
    setSettings(next)
  }

  return (
    <div className="payroll-modal-backdrop" onClick={onClose}>
      <div className="payroll-modal" style={{ maxWidth: 480 }} onClick={e => e.stopPropagation()}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
          <div style={{ fontSize: 15, fontWeight: 600 }}>Global Schedule Settings</div>
          <button className="btn-icon" onClick={onClose}>✕</button>
        </div>

        <div style={{ fontSize: 12, color: 'var(--text-muted)', marginBottom: 16, background: 'var(--bg)', padding: '10px 14px', borderRadius: 8 }}>
          These defaults apply to all employees. You can override per employee inside their attendance slide.
        </div>

        <div className="profile-form">
          <label className="form-label">
            Default Login Time
            <input type="time" className="input"
              value={global.loginTime ?? '09:00'}
              onChange={e => set('loginTime', e.target.value)} />
          </label>
          <label className="form-label">
            Default Logout Time
            <input type="time" className="input"
              value={global.logoutTime ?? '18:00'}
              onChange={e => set('logoutTime', e.target.value)} />
          </label>
          <label className="form-label">
            Grace Period (minutes)
            <input type="number" className="input" min={0}
              value={global.gracePeriod ?? 0}
              onChange={e => set('gracePeriod', +e.target.value)} />
          </label>
          <label className="form-label">
            Overtime After (hours)
            <input type="number" className="input" min={0} step={0.5}
              value={global.otAfterHours ?? 8}
              onChange={e => set('otAfterHours', +e.target.value)} />
          </label>
        </div>

        <div style={{ marginTop: 20, background: 'var(--bg)', borderRadius: 8, padding: '12px 14px', border: '1px solid var(--border)' }}>
          <div style={{ fontSize: 11, fontWeight: 600, color: 'var(--text-muted)', marginBottom: 8 }}>Current defaults</div>
          <div style={{ display: 'flex', gap: 16, fontSize: 13, fontFamily: 'DM Mono, monospace' }}>
            <span>In: <strong>{global.loginTime ?? '09:00'}</strong></span>
            <span>Out: <strong>{global.logoutTime ?? '18:00'}</strong></span>
            <span>Grace: <strong>{global.gracePeriod ?? 0}m</strong></span>
            <span>OT: <strong>{global.otAfterHours ?? 8}h</strong></span>
          </div>
        </div>

        <button className="btn btn-primary" style={{ width: '100%', marginTop: 20 }} onClick={onClose}>
          Save & Close
        </button>
      </div>
    </div>
  )
}
