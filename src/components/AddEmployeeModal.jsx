'use client'

import { useState } from 'react'

export default function AddEmployeeModal({ options, onAdd, onClose }) {
  const [form, setForm] = useState({
    userId: '', name: '', designation: '',
    department: '', employmentType: 'Full Time',
    joinDate: '', phone: '', email: '',
  })
  const [error, setError] = useState('')

  function set(field, val) { setForm(p => ({ ...p, [field]: val })) }

  function handleAdd() {
    if (!form.name.trim())   { setError('Name is required');        return }
    if (!form.userId.trim()) { setError('Employee ID is required'); return }
    onAdd(form)
    onClose()
  }

  return (
    <div className="payroll-modal-backdrop" onClick={onClose}>
      <div className="payroll-modal" onClick={e => e.stopPropagation()}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
          <div style={{ fontSize: 16, fontWeight: 600 }}>Add New Employee</div>
          <button className="btn-icon" onClick={onClose}>✕</button>
        </div>

        {error && <div className="error-banner" style={{ marginBottom: 12 }}>{error}</div>}

        <div className="profile-form">
          <label className="form-label">
            Full Name *
            <input className="input" value={form.name} onChange={e => set('name', e.target.value)} placeholder="e.g. John Doe" />
          </label>
          <label className="form-label">
            Employee ID *
            <input className="input" value={form.userId} onChange={e => set('userId', e.target.value)} placeholder="e.g. EMP001" />
          </label>
          <label className="form-label">
            Designation
            <select className="input" value={form.designation} onChange={e => set('designation', e.target.value)}>
              <option value="">Select…</option>
              {(options.designations ?? []).map(d => <option key={d}>{d}</option>)}
            </select>
          </label>
          <label className="form-label">
            Department
            <select className="input" value={form.department} onChange={e => set('department', e.target.value)}>
              <option value="">Select…</option>
              {(options.departments ?? []).map(d => <option key={d}>{d}</option>)}
            </select>
          </label>
          <label className="form-label">
            Employment Type
            <select className="input" value={form.employmentType} onChange={e => set('employmentType', e.target.value)}>
              {['Full Time','Part Time','Contract','Intern'].map(t => <option key={t}>{t}</option>)}
            </select>
          </label>
          <label className="form-label">
            Join Date
            <input type="date" className="input" value={form.joinDate} onChange={e => set('joinDate', e.target.value)} />
          </label>
          <label className="form-label">
            Phone
            <input className="input" type="tel" value={form.phone} onChange={e => set('phone', e.target.value)} />
          </label>
          <label className="form-label">
            Email
            <input className="input" type="email" value={form.email} onChange={e => set('email', e.target.value)} />
          </label>
        </div>

        <button className="btn btn-primary" style={{ width: '100%', marginTop: 20 }} onClick={handleAdd}>
          Add Employee
        </button>
      </div>
    </div>
  )
}
