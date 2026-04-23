'use client'

import { useState, useRef } from 'react'
import { calcAccruedLeave, calcRemainingCasual } from '@/lib/employeeProfiles'
import { fmtMinutes } from '@/lib/calculateStats'
import { EMPLOYMENT_STATUSES, GENDERS, BLOOD_GROUPS } from '@/hooks/useEmployeeProfiles'

const COLORS = ['#4f46e5','#0891b2','#059669','#d97706','#dc2626','#7c3aed','#db2777','#0284c7']
function getColor(id) { const s = String(id ?? "0"); return COLORS[s.charCodeAt(s.length-1) % COLORS.length] }
function getInitials(n) { const safe = String(n ?? "?"); return safe.split(' ').map(w => w[0] || '').join('').toUpperCase().slice(0,2) }

const TABS = ['Profile','Leave','Attendance']

export default function EmployeeProfilePanel({
  profile, stats, photo, options,
  onUpdate, onUploadPhoto, onDeletePhoto,
  onAddLeave, onRemoveLeave, onClose,
}) {
  const [tab,       setTab]       = useState('Profile')
  const [form,      setForm]      = useState({ ...profile })
  const [dirty,     setDirty]     = useState(false)
  const [leaveType, setLeaveType] = useState('casual')
  const [leaveDays, setLeaveDays] = useState(1)
  const [leaveMode, setLeaveMode] = useState('add')
  const photoRef = useRef(null)

  const designations = options?.designations ?? []
  const departments  = options?.departments  ?? []

  const accrued   = calcAccruedLeave(profile.joinDate)
  const remaining = calcRemainingCasual(profile)

  function set(field, value) { setForm(p => ({ ...p, [field]: value })); setDirty(true) }
  function save() { onUpdate(profile.userId, form); setDirty(false) }
  function handlePhoto(e) { const f = e.target.files?.[0]; if (f) onUploadPhoto(profile.userId, f) }

  function handleLeave() {
    if (leaveMode === 'add') onAddLeave(profile.userId, leaveType, leaveDays)
    else onRemoveLeave(profile.userId, leaveType, leaveDays)
  }

  return (
    <>
      <div className="detail-backdrop" onClick={onClose} />
      <div className="detail-panel">

        <div className="detail-header">
          <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
            <div className="profile-photo-wrap" onClick={() => photoRef.current?.click()} title="Click to change photo">
              {photo
                ? <img src={photo} alt={profile.name} className="profile-photo" />
                : <div className="emp-avatar emp-avatar-lg" style={{ background: getColor(profile.userId) }}>{getInitials(profile.name)}</div>}
              <div className="photo-overlay">📷</div>
              {photo && (
                <button className="photo-remove" onClick={e => { e.stopPropagation(); onDeletePhoto(profile.userId) }}>✕</button>
              )}
            </div>
            <input ref={photoRef} type="file" accept="image/*" style={{ display: 'none' }} onChange={handlePhoto} />
            <div>
              <div className="detail-name">{profile.name}</div>
              <div className="detail-dept">
                {profile.designation || 'No designation'}
                {profile.employmentType && <span className="emp-type-badge">{profile.employmentType}</span>}
                {profile.shift && <span className="shift-badge">{profile.shift}</span>}
              </div>
              <div style={{ fontSize: 11, color: 'var(--text-subtle)', marginTop: 4, fontFamily: 'DM Mono, monospace' }}>
                {profile.userId}
                {profile.department && ` · ${profile.department}`}
                {profile.joinDate && ` · Joined ${new Date(profile.joinDate + 'T00:00:00').toLocaleDateString('en-US', { month: 'short', year: 'numeric' })}`}
              </div>
            </div>
          </div>
          <button className="btn-icon" onClick={onClose}>✕</button>
        </div>

        {/* Tabs */}
        <div style={{ display: 'flex', borderBottom: '1px solid var(--border)', padding: '0 24px' }}>
          {TABS.map(t => (
            <button key={t} onClick={() => setTab(t)} style={{
              padding: '10px 16px', border: 'none', background: 'none', cursor: 'pointer',
              fontSize: 13, fontWeight: tab === t ? 600 : 400,
              color: tab === t ? 'var(--accent)' : 'var(--text-muted)',
              borderBottom: tab === t ? '2px solid var(--accent)' : '2px solid transparent',
              marginBottom: -1,
            }}>{t}</button>
          ))}
          {dirty && (
            <button className="btn btn-primary" style={{ marginLeft: 'auto', alignSelf: 'center', padding: '5px 14px' }} onClick={save}>
              Save changes
            </button>
          )}
        </div>

        <div className="detail-body">

          {/* ── PROFILE TAB ── */}
          {tab === 'Profile' && (
            <div style={{ padding: 24, display: 'flex', flexDirection: 'column', gap: 20 }}>

              <section>
                <div className="form-section-title">Basic Information</div>
                <div className="profile-form">
                  <label className="form-label">
                    Full Name
                    <input className="input" value={form.name} onChange={e => set('name', e.target.value)} />
                  </label>
                  <label className="form-label">
                    Employee ID
                    <input className="input" value={form.userId} onChange={e => set('userId', e.target.value)} />
                  </label>
                  <label className="form-label">
                    Designation
                    <select className="input" value={form.designation} onChange={e => set('designation', e.target.value)}>
                      <option value="">Select…</option>
                      {designations.map(d => <option key={d}>{d}</option>)}
                    </select>
                  </label>
                  <label className="form-label">
                    Department
                    <select className="input" value={form.department} onChange={e => set('department', e.target.value)}>
                      <option value="">Select…</option>
                      {departments.map(d => <option key={d}>{d}</option>)}
                    </select>
                  </label>
                  <label className="form-label">
                    Employment Type
                    <select className="input" value={form.employmentType} onChange={e => set('employmentType', e.target.value)}>
                      {EMPLOYMENT_STATUSES.map(t => <option key={t}>{t}</option>)}
                    </select>
                  </label>
                  <label className="form-label">
                    Join Date
                    <input type="date" className="input" value={form.joinDate} onChange={e => set('joinDate', e.target.value)} />
                  </label>
                  <label className="form-label">
                    Gender
                    <select className="input" value={form.gender} onChange={e => set('gender', e.target.value)}>
                      <option value="">Select…</option>
                      {GENDERS.map(g => <option key={g}>{g}</option>)}
                    </select>
                  </label>
                  <label className="form-label">
                    Blood Group
                    <select className="input" value={form.bloodGroup} onChange={e => set('bloodGroup', e.target.value)}>
                      <option value="">Select…</option>
                      {BLOOD_GROUPS.map(b => <option key={b}>{b}</option>)}
                    </select>
                  </label>
                  <label className="form-label">
                    Shift
                    <select className="input" value={form.shift ?? ''} onChange={e => set('shift', e.target.value)}>
                      <option value="">Select...</option>
                      {(options?.shifts ?? []).map(s => <option key={s}>{s}</option>)}
                    </select>
                  </label>
                </div>
              </section>

              <section>
                <div className="form-section-title">Contact</div>
                <div className="profile-form">
                  <label className="form-label">
                    Phone
                    <input className="input" type="tel" value={form.phone} onChange={e => set('phone', e.target.value)} placeholder="+880 …" />
                  </label>
                  <label className="form-label">
                    Email
                    <input className="input" type="email" value={form.email} onChange={e => set('email', e.target.value)} />
                  </label>
                  <label className="form-label" style={{ gridColumn: '1/-1' }}>
                    Address
                    <input className="input" value={form.address} onChange={e => set('address', e.target.value)} />
                  </label>
                </div>
              </section>

              <section>
                <div className="form-section-title">Emergency Contact</div>
                <div className="profile-form">
                  <label className="form-label">
                    Name
                    <input className="input" value={form.emergencyName} onChange={e => set('emergencyName', e.target.value)} />
                  </label>
                  <label className="form-label">
                    Phone
                    <input className="input" type="tel" value={form.emergencyPhone} onChange={e => set('emergencyPhone', e.target.value)} />
                  </label>
                </div>
              </section>

              <section>
                <div className="form-section-title">Notes</div>
                <textarea className="input" rows={3} style={{ width: '100%', resize: 'vertical' }}
                  value={form.notes} onChange={e => set('notes', e.target.value)} placeholder="Any additional notes…" />
              </section>

            </div>
          )}

          {/* ── LEAVE TAB ── */}
          {tab === 'Leave' && (
            <div style={{ padding: 24, display: 'flex', flexDirection: 'column', gap: 20 }}>
              <div className="detail-pills">
                <div className="detail-pill detail-pill-amber">
                  <div className="pill-val">{remaining}</div>
                  <div className="pill-lbl">Casual remaining</div>
                </div>
                <div className="detail-pill">
                  <div className="pill-val">{accrued}</div>
                  <div className="pill-lbl">Casual accrued</div>
                </div>
                <div className="detail-pill">
                  <div className="pill-val">{profile.casualUsed ?? 0}</div>
                  <div className="pill-lbl">Casual used</div>
                </div>
                <div className="detail-pill detail-pill-violet">
                  <div className="pill-val">{profile.sickUsed ?? 0}</div>
                  <div className="pill-lbl">Sick used</div>
                </div>
              </div>
              <div style={{ fontSize: 11, color: 'var(--text-subtle)', background: 'var(--bg)', padding: '10px 14px', borderRadius: 8 }}>
                1.5 casual days accrued per month from join date
                {!profile.joinDate && <span style={{ color: 'var(--amber)' }}> — set join date in Profile tab</span>}
              </div>
              <div>
                <div className="form-section-title">Record Leave</div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap', marginTop: 10 }}>
                  <div className="tabs" style={{ marginBottom: 0 }}>
                    <button className={`tab ${leaveType === 'casual' ? 'active' : ''}`} onClick={() => setLeaveType('casual')}>Casual</button>
                    <button className={`tab ${leaveType === 'sick'   ? 'active' : ''}`} onClick={() => setLeaveType('sick')}>Sick</button>
                  </div>
                  <div className="tabs" style={{ marginBottom: 0 }}>
                    <button className={`tab ${leaveMode === 'add'    ? 'active' : ''}`} onClick={() => setLeaveMode('add')}>Add</button>
                    <button className={`tab ${leaveMode === 'remove' ? 'active' : ''}`} onClick={() => setLeaveMode('remove')}>Remove</button>
                  </div>
                  <input type="number" className="input" min={0.5} step={0.5} value={leaveDays}
                    onChange={e => setLeaveDays(parseFloat(e.target.value) || 1)} style={{ width: 80 }} />
                  <span style={{ fontSize: 13, color: 'var(--text-muted)' }}>days</span>
                  <button className="btn btn-primary" onClick={handleLeave}>
                    {leaveMode === 'add' ? '+ Add' : '− Remove'} {leaveType} leave
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* ── ATTENDANCE TAB ── */}
          {tab === 'Attendance' && (
            <div style={{ padding: 24 }}>
              {!stats ? (
                <p style={{ color: 'var(--text-muted)', fontSize: 13 }}>No attendance data available for this employee.</p>
              ) : (
                <>
                  <div className="detail-pills" style={{ marginBottom: 20 }}>
                    <div className="detail-pill">
                      <div className="pill-val">{stats.workingDays}</div>
                      <div className="pill-lbl">Days present</div>
                    </div>
                    <div className="detail-pill">
                      <div className="pill-val">{fmtMinutes(stats.totalPresenceMinutes)}</div>
                      <div className="pill-lbl">Total presence</div>
                    </div>
                    <div className="detail-pill detail-pill-amber">
                      <div className="pill-val">{stats.lateDays ?? 0}</div>
                      <div className="pill-lbl">Late days</div>
                    </div>
                    <div className="detail-pill detail-pill-violet">
                      <div className="pill-val">{fmtMinutes(stats.totalOvertimeMinutes)}</div>
                      <div className="pill-lbl">Overtime</div>
                    </div>
                  </div>
                  <table className="data-table">
                    <thead>
                      <tr>
                        <th>Date</th><th>In</th><th>Out</th>
                        <th>Presence</th><th>Late</th><th>Overtime</th>
                      </tr>
                    </thead>
                    <tbody>
                      {stats.days.map(d => (
                        <tr key={d.date} className={d.isWeekend || d.isHoliday ? 'row-off' : ''}>
                          <td style={{ fontFamily: 'DM Mono, monospace', fontSize: 12 }}>
                            {d.date}
                            {d.isHoliday && <span className="day-badge day-holiday">Holiday</span>}
                            {d.isWeekend && <span className="day-badge day-weekend">Weekend</span>}
                          </td>
                          <td style={{ fontFamily: 'DM Mono, monospace', fontSize: 12 }}>
                            {d.inTime ? new Date(d.inTime).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true }) : '—'}
                          </td>
                          <td style={{ fontFamily: 'DM Mono, monospace', fontSize: 12 }}>
                            {d.outTime ? new Date(d.outTime).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true }) : '—'}
                          </td>
                          <td>{fmtMinutes(d.presenceMinutes)}</td>
                          <td>
                            {d.lateMinutes > 0
                              ? <span className="badge badge-amber">{fmtMinutes(d.lateMinutes)}</span>
                              : <span className="on-time">✓</span>}
                          </td>
                          <td>
                            {d.overtimeMinutes > 0
                              ? <span className="badge badge-violet">{fmtMinutes(d.overtimeMinutes)}</span>
                              : '—'}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </>
              )}
            </div>
          )}

        </div>
      </div>
    </>
  )
}
