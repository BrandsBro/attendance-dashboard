'use client'

import { useState } from 'react'
import { useAttendanceData }   from '@/hooks/useAttendanceData'
import { useLeaveRecords }     from '@/hooks/useLeaveRecords'
import { useEmployeeProfiles } from '@/hooks/useEmployeeProfiles'
import Sidebar                 from '@/components/Sidebar'
import { calcDays, getUsedDays } from '@/lib/leaveRecords'
import { calcAccruedLeave, calcRemainingCasual } from '@/lib/employeeProfiles'

const COLORS = ['#4f46e5','#0891b2','#059669','#d97706','#dc2626','#7c3aed','#db2777','#0284c7']
function getColor(id) { const s = String(id ?? "0"); return COLORS[s.charCodeAt(s.length-1) % COLORS.length] }
function getInitials(name) { return name.split(' ').map(w=>w[0]).join('').toUpperCase().slice(0,2) }

const LEAVE_TYPES = [
  { id: 'casual',  label: 'Casual Leave',  color: '#d97706', bg: '#fef3c7' },
  { id: 'sick',    label: 'Sick Leave',    color: '#dc2626', bg: '#fee2e2' },
  { id: 'unpaid',  label: 'Unpaid Leave',  color: '#6b7280', bg: '#f3f4f6' },
  { id: 'annual',  label: 'Annual Leave',  color: '#4f46e5', bg: '#eef2ff' },
  { id: 'other',   label: 'Other',         color: '#0891b2', bg: '#e0f2fe' },
]

function getTypeInfo(id) {
  return LEAVE_TYPES.find(t => t.id === id) ?? LEAVE_TYPES[0]
}

function fmt(date) {
  return new Date(date + 'T00:00:00').toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
}

export default function LeavePage() {
  const { summary } = useAttendanceData()
  const { records, addRecord, removeRecord, updateRecord } = useLeaveRecords()
  const { profiles } = useEmployeeProfiles(summary?.employees ?? [])

  const employees = summary?.employees ?? []

  const [selectedEmp, setSelectedEmp]   = useState(null)
  const [fromDate,    setFromDate]       = useState('')
  const [toDate,      setToDate]         = useState('')
  const [leaveType,   setLeaveType]      = useState('casual')
  const [reason,      setReason]         = useState('')
  const [search,      setSearch]         = useState('')
  const [filterEmp,   setFilterEmp]      = useState('')
  const [filterType,  setFilterType]     = useState('')
  const [editingId,   setEditingId]      = useState(null)
  const [editReason,  setEditReason]     = useState('')

  const days = fromDate && toDate ? calcDays(fromDate, toDate) : 0

  const filtered = employees.filter(e =>
    e.name.toLowerCase().includes(search.toLowerCase())
  )

  const profile = selectedEmp ? profiles[selectedEmp.userId] : null
  const accrued   = profile ? calcAccruedLeave(profile.joinDate) : 0
  const remaining = profile ? calcRemainingCasual(profile) : 0
  const used      = selectedEmp ? getUsedDays(records, selectedEmp.userId) : {}

  function handleAdd() {
    if (!selectedEmp || !fromDate || !toDate || !leaveType || days < 1) return
    addRecord(selectedEmp.userId, {
      empName:  selectedEmp.name,
      type:     leaveType,
      fromDate,
      toDate,
      days,
      reason,
    })
    setFromDate('')
    setToDate('')
    setReason('')
  }

  // All records flat
  const allRecords = Object.entries(records).flatMap(([userId, list]) =>
    list.map(r => ({ ...r, userId }))
  ).sort((a, b) => b.createdAt.localeCompare(a.createdAt))

  const filteredRecords = allRecords
    .filter(r => !filterEmp  || r.userId   === filterEmp)
    .filter(r => !filterType || r.type     === filterType)

  return (
    <div className="app-shell">
      <Sidebar active="leave" summary={summary} />
      <div className="main-content">
        <div className="topbar">
          <div className="topbar-left">
            <div className="topbar-title">Leave Records</div>
            <div className="topbar-sub">Track and manage employee leave</div>
          </div>
        </div>

        <div className="page-body">
          <div className="sm-layout">

            {/* Left — Add leave */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              <div className="card">
                <div className="card-header">
                  <span className="card-title">Record Leave</span>
                </div>
                <div className="card-body" style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>

                  {/* Employee picker */}
                  <div>
                    <div className="form-section-title" style={{ marginBottom: 8 }}>Employee</div>
                    <input
                      className="input"
                      style={{ width: '100%', marginBottom: 8 }}
                      placeholder="Search employee…"
                      value={search}
                      onChange={e => setSearch(e.target.value)}
                    />
                    <div className="sm-emp-list">
                      {filtered.map(emp => (
                        <div
                          key={emp.userId}
                          className={'sm-emp-row' + (selectedEmp?.userId === emp.userId ? ' selected' : '')}
                          onClick={() => setSelectedEmp(emp)}
                        >
                          <div className="emp-avatar" style={{ background: getColor(emp.userId), width: 30, height: 30, fontSize: 11, borderRadius: 7, flexShrink: 0 }}>
                            {getInitials(emp.name)}
                          </div>
                          <div style={{ flex: 1, minWidth: 0 }}>
                            <div style={{ fontSize: 13, fontWeight: 500, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{emp.name}</div>
                            <div style={{ fontSize: 11, color: 'var(--text-muted)', fontFamily: 'DM Mono, monospace' }}>
                              {(getUsedDays(records, emp.userId)['casual'] ?? 0) + (getUsedDays(records, emp.userId)['sick'] ?? 0)} days taken
                            </div>
                          </div>
                          {selectedEmp?.userId === emp.userId && (
                            <span style={{ color: 'var(--accent)', fontSize: 14 }}>✓</span>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Balance preview */}
                  {selectedEmp && (
                    <div className="leave-balance-row">
                      <div className="leave-balance-item">
                        <div className="leave-balance-val" style={{ color: '#059669' }}>{remaining}</div>
                        <div className="leave-balance-lbl">Casual left</div>
                      </div>
                      <div className="leave-balance-item">
                        <div className="leave-balance-val" style={{ color: '#d97706' }}>{used.casual ?? 0}</div>
                        <div className="leave-balance-lbl">Casual used</div>
                      </div>
                      <div className="leave-balance-item">
                        <div className="leave-balance-val" style={{ color: '#dc2626' }}>{used.sick ?? 0}</div>
                        <div className="leave-balance-lbl">Sick used</div>
                      </div>
                      <div className="leave-balance-item">
                        <div className="leave-balance-val" style={{ color: '#6b7280' }}>{used.unpaid ?? 0}</div>
                        <div className="leave-balance-lbl">Unpaid</div>
                      </div>
                    </div>
                  )}

                  {/* Leave type */}
                  <div>
                    <div className="form-section-title" style={{ marginBottom: 8 }}>Leave Type</div>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                      {LEAVE_TYPES.map(t => (
                        <button
                          key={t.id}
                          onClick={() => setLeaveType(t.id)}
                          style={{
                            padding: '5px 12px',
                            borderRadius: 100,
                            border: '1.5px solid',
                            borderColor: leaveType === t.id ? t.color : 'var(--border)',
                            background:  leaveType === t.id ? t.bg    : 'transparent',
                            color:       leaveType === t.id ? t.color : 'var(--text-muted)',
                            fontSize: 12,
                            fontWeight: 500,
                            cursor: 'pointer',
                            transition: 'all .15s',
                          }}
                        >
                          {t.label}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Date range */}
                  <div>
                    <div className="form-section-title" style={{ marginBottom: 8 }}>Date Range</div>
                    <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: 4, flex: 1 }}>
                        <label className="form-label">From</label>
                        <input type="date" className="input" value={fromDate} onChange={e => setFromDate(e.target.value)} />
                      </div>
                      <div style={{ color: 'var(--text-muted)', paddingTop: 20 }}>→</div>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: 4, flex: 1 }}>
                        <label className="form-label">To</label>
                        <input type="date" className="input" value={toDate} min={fromDate} onChange={e => setToDate(e.target.value)} />
                      </div>
                    </div>
                    {days > 0 && (
                      <div style={{ marginTop: 6, fontSize: 12, color: 'var(--accent)', fontWeight: 500 }}>
                        {days} day{days !== 1 ? 's' : ''}
                      </div>
                    )}
                  </div>

                  {/* Reason */}
                  <div>
                    <div className="form-section-title" style={{ marginBottom: 8 }}>Reason</div>
                    <textarea
                      className="input"
                      rows={2}
                      style={{ width: '100%', resize: 'none' }}
                      placeholder="Optional reason or notes…"
                      value={reason}
                      onChange={e => setReason(e.target.value)}
                    />
                  </div>

                  {/* Preview */}
                  {selectedEmp && fromDate && toDate && days > 0 && (
                    <div className="sm-preview">
                      <div style={{ fontSize: 12, fontWeight: 600, marginBottom: 4, color: 'var(--accent)' }}>Preview</div>
                      <div style={{ fontSize: 13 }}>
                        <strong>{selectedEmp.name}</strong> — {getTypeInfo(leaveType).label}
                        {' '}· <strong>{days} day{days !== 1 ? 's' : ''}</strong>
                        {' '}from <strong>{fmt(fromDate)}</strong> to <strong>{fmt(toDate)}</strong>
                      </div>
                    </div>
                  )}

                  <button
                    className="btn btn-primary"
                    style={{ width: '100%' }}
                    disabled={!selectedEmp || !fromDate || !toDate || days < 1}
                    onClick={handleAdd}
                  >
                    Record Leave
                  </button>

                </div>
              </div>
            </div>

            {/* Right — Leave history */}
            <div className="card">
              <div className="card-header">
                <span className="card-title">Leave History</span>
                <div style={{ display: 'flex', gap: 8 }}>
                  <select className="input input-sm" style={{ width: 'auto' }} value={filterEmp} onChange={e => setFilterEmp(e.target.value)}>
                    <option value="">All employees</option>
                    {employees.map(e => <option key={e.userId} value={e.userId}>{e.name}</option>)}
                  </select>
                  <select className="input input-sm" style={{ width: 'auto' }} value={filterType} onChange={e => setFilterType(e.target.value)}>
                    <option value="">All types</option>
                    {LEAVE_TYPES.map(t => <option key={t.id} value={t.id}>{t.label}</option>)}
                  </select>
                </div>
              </div>

              {filteredRecords.length === 0 ? (
                <div className="card-body" style={{ textAlign: 'center', padding: '40px 20px', color: 'var(--text-muted)', fontSize: 13 }}>
                  No leave records yet.
                </div>
              ) : (
                <div className="table-wrap">
                  <table className="data-table">
                    <thead>
                      <tr>
                        <th>Employee</th>
                        <th>Type</th>
                        <th>From</th>
                        <th>To</th>
                        <th>Days</th>
                        <th>Reason</th>
                        <th></th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredRecords.map(r => {
                        const type = getTypeInfo(r.type)
                        return (
                          <tr key={r.id}>
                            <td>
                              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                                <div className="emp-avatar" style={{ background: getColor(r.userId), width: 28, height: 28, fontSize: 10, borderRadius: 6, flexShrink: 0 }}>
                                  {getInitials(r.empName ?? r.userId)}
                                </div>
                                <span style={{ fontSize: 13, fontWeight: 500 }}>{r.empName ?? r.userId}</span>
                              </div>
                            </td>
                            <td>
                              <span style={{ padding: '2px 8px', borderRadius: 100, fontSize: 11, fontWeight: 600, background: type.bg, color: type.color }}>
                                {type.label}
                              </span>
                            </td>
                            <td style={{ fontFamily: 'DM Mono, monospace', fontSize: 12 }}>{fmt(r.fromDate)}</td>
                            <td style={{ fontFamily: 'DM Mono, monospace', fontSize: 12 }}>{fmt(r.toDate)}</td>
                            <td style={{ fontWeight: 600, fontFamily: 'DM Mono, monospace' }}>{r.days}</td>
                            <td>
                              {editingId === r.id ? (
                                <div style={{ display: 'flex', gap: 6 }}>
                                  <input
                                    className="input input-sm"
                                    value={editReason}
                                    onChange={e => setEditReason(e.target.value)}
                                    style={{ width: 140 }}
                                  />
                                  <button className="btn-link" onClick={() => {
                                    updateRecord(r.userId, r.id, { reason: editReason })
                                    setEditingId(null)
                                  }}>Save</button>
                                </div>
                              ) : (
                                <span
                                  style={{ fontSize: 12, color: 'var(--text-muted)', cursor: 'pointer' }}
                                  onClick={() => { setEditingId(r.id); setEditReason(r.reason ?? '') }}
                                  title="Click to edit"
                                >
                                  {r.reason || <span style={{ color: 'var(--text-subtle)' }}>Add reason…</span>}
                                </span>
                              )}
                            </td>
                            <td>
                              <button
                                className="btn-link"
                                style={{ color: 'var(--red)' }}
                                onClick={() => removeRecord(r.userId, r.id)}
                              >
                                Delete
                              </button>
                            </td>
                          </tr>
                        )
                      })}
                    </tbody>
                  </table>
                </div>
              )}
            </div>

          </div>
        </div>
      </div>
    </div>
  )
}
