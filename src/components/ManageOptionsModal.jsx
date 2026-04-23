'use client'

import { useState } from 'react'

const TABS = [
  { id: 'designations', label: 'Designations' },
  { id: 'departments',  label: 'Departments'  },
  { id: 'shifts',       label: 'Shifts'       },
]

export default function ManageOptionsModal({ options, onAdd, onRemove, onClose }) {
  const [tab,    setTab]    = useState('designations')
  const [newVal, setNewVal] = useState('')

  function handleAdd() {
    const v = newVal.trim()
    if (!v) return
    onAdd(tab, v)
    setNewVal('')
  }

  const list = options[tab] ?? []

  return (
    <div className="payroll-modal-backdrop" onClick={onClose}>
      <div className="payroll-modal" onClick={e => e.stopPropagation()}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
          <div style={{ fontSize: 16, fontWeight: 600 }}>Manage Dropdown Options</div>
          <button className="btn-icon" onClick={onClose}>✕</button>
        </div>

        <div className="tabs" style={{ marginBottom: 16 }}>
          {TABS.map(t => (
            <button key={t.id} className={`tab ${tab === t.id ? 'active' : ''}`} onClick={() => { setTab(t.id); setNewVal('') }}>
              {t.label}
            </button>
          ))}
        </div>

        <div style={{ display: 'flex', gap: 8, marginBottom: 14 }}>
          <input
            className="input"
            style={{ flex: 1 }}
            placeholder={`Add new ${tab.slice(0,-1)}…`}
            value={newVal}
            onChange={e => setNewVal(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && handleAdd()}
          />
          <button className="btn btn-primary" onClick={handleAdd}>Add</button>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 4, maxHeight: 300, overflowY: 'auto' }}>
          {list.length === 0 && (
            <div style={{ fontSize: 13, color: 'var(--text-muted)', textAlign: 'center', padding: '20px 0' }}>
              No options yet. Add one above.
            </div>
          )}
          {list.map(v => (
            <div key={v} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '8px 12px', background: 'var(--bg)', borderRadius: 6, border: '1px solid var(--border)' }}>
              <span style={{ fontSize: 13 }}>{v}</span>
              <button
                style={{ background: 'none', border: 'none', color: 'var(--red)', cursor: 'pointer', fontSize: 12, fontWeight: 500 }}
                onClick={() => onRemove(tab, v)}
              >
                Remove
              </button>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
