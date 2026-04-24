'use client'

import { useState } from 'react'
import { EMPLOYMENT_STATUSES, GENDERS } from '@/hooks/useEmployeeProfiles'

export default function AddEmployeeModal({ options, onAdd, onClose }) {
  const [form, setForm] = useState({
    userId: '', firstName: '', lastName: '', designation: '',
    department: '', employmentStatus: 'Permanent',
    shift: '', joinDate: '', phone: '', email: '',
  })
  const [error, setError] = useState('')

  function set(field, val) { setForm(p => ({ ...p, [field]: val })) }

  function handleAdd() {
    if (!form.firstName.trim()) { setError('First name is required'); return }
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
            First Name *
            <input className="input" value={form.firstName} onChange={e => set('firstName', e.target.value)} placeholder="e.g. John" />
          </label>
          <label className="form-label">
            Last Name
            <input className="input" value={form.lastName} onChange={e => set('lastName', e.target.value)} placeholder="e.g. Doe" />
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
            Employment Status
            <select className="input" value={form.employmentStatus} onChange={e => set('employmentStatus', e.target.value)}>
              {EMPLOYMENT_STATUSES.map(s => <option key={s}>{s}</option>)}
            </select>
          </label>
          <label className="form-label">
            Shift
            <select className="input" value={form.shift} onChange={e => set('shift', e.target.value)}>
              <option value="">Select…</option>
              {(options.shifts ?? []).map(s => <option key={s}>{s}</option>)}
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
        </div>

        <button className="btn btn-primary" style={{ width: '100%', marginTop: 20 }} onClick={handleAdd}>
          Add Employee
        </button>
      </div>
    </div>
  )
}
