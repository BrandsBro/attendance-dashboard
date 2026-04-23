'use client'

import { useState } from 'react'
import { useAttendanceData }   from '@/hooks/useAttendanceData'
import { useShiftOverrides }   from '@/hooks/useShiftOverrides'
import Sidebar                 from '@/components/Sidebar'
import { PRESET_SHIFTS }       from '@/lib/constants'

const COLORS = ['#4f46e5','#0891b2','#059669','#d97706','#dc2626','#7c3aed','#db2777','#0284c7']
function getColor(id) { const s = String(id ?? "0"); return COLORS[s.charCodeAt(s.length-1) % COLORS.length] }
function getInitials(name) { const n = String(name ?? "?"); return n.split(' ').map(w=>w[0]).join('').toUpperCase().slice(0,2) }

export default function ShiftManagerPage() {
  const { summary, schedules } = useAttendanceData()
  const { overrides, addOverride, removeOverride } = useShiftOverrides()

  const employees = summary?.employees ?? []

  const [selectedEmp, setSelectedEmp] = useState(null)
  const [fromDate,    setFromDate]    = useState('')
  const [toDate,      setToDate]      = useState('')
  const [shift,       setShift]       = useState('')
  const [reason,      setReason]      = useState('')
  const [search,      setSearch]      = useState('')
  const [filterEmp,   setFilterEmp]   = useState('')

  function getDefaultShift(userId) {
    return schedules?.[userId]?.shift ?? null
  }

  function handleAdd() {
    if (!selectedEmp || !fromDate || !toDate || !shift) return
    const preset = PRESET_SHIFTS.find(p => p.label === shift)
    addOverride(selectedEmp.userId, {
      fromDate,
      toDate,
      shift,
      login:  preset?.login  ?? '',
      logout: preset?.logout ?? '',
      reason,
      empName: selectedEmp.name,
    })
    setFromDate('')
    setToDate('')
    setShift('')
    setReason('')
    setSelectedEmp(null)
  }

  // All overrides flat list for display
  const allOverrides = Object.entries(overrides).flatMap(([userId, list]) =>
    list.map(o => ({ ...o, userId }))
  ).sort((a, b) => b.createdAt.localeCompare(a.createdAt))

  const filteredOverrides = allOverrides.filter(o =>
    !filterEmp || o.userId === filterEmp
  )

  const filtered = employees.filter(e =>
    e.name.toLowerCase().includes(search.toLowerCase())
  )

  const today = new Date().toISOString().slice(0, 10)

  function getStatus(o) {
    if (o.toDate < today) return 'expired'
    if (o.fromDate > today) return 'upcoming'
    return 'active'
  }

  return (
    <div className="app-shell">
      <Sidebar active="shift-manager" summary={summary} />
      <div className="main-content">
        <div className="topbar">
          <div className="topbar-left">
            <div className="topbar-title">Shift Manager</div>
            <div className="topbar-sub">Manage temporary shift changes per employee</div>
          </div>
        </div>

        <div className="page-body">
          {!summary ? (
            <div className="card">
              <div className="card-body" style={{ textAlign: 'center', padding: '60px 20px', color: 'var(--text-muted)' }}>
                <div style={{ fontSize: 40, marginBottom: 16 }}>⇄</div>
                <div style={{ fontWeight: 600, fontSize: 16, marginBottom: 8 }}>No data loaded</div>
                <a href="/upload" className="btn btn-primary" style={{ textDecoration: 'none', display: 'inline-flex' }}>Go to Upload</a>
              </div>
            </div>
          ) : (
            <div className="sm-layout">

              {/* Left — Add new override */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                <div className="card">
                  <div className="card-header">
                    <span className="card-title">Add Shift Change</span>
                  </div>
                  <div className="card-body" style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>

                    {/* Employee picker */}
                    <div>
                      <div className="form-section-title" style={{ marginBottom: 8 }}>Select Employee</div>
                      <div style={{ display: 'flex', gap: 6, marginBottom: 8 }}>
                        <input
                          className="input"
                          style={{ flex: 1 }}
                          placeholder="Search…"
                          value={search}
                          onChange={e => setSearch(e.target.value)}
                        />
                      </div>
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
                                Default: {getDefaultShift(emp.userId) ?? 'None'}
                              </div>
                            </div>
                            {selectedEmp?.userId === emp.userId && (
                              <span style={{ color: 'var(--accent)', fontSize: 14 }}>✓</span>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Date range */}
                    <div>
                      <div className="form-section-title" style={{ marginBottom: 8 }}>Date Range</div>
                      <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 4, flex: 1 }}>
                          <label className="form-label" style={{ marginBottom: 0 }}>From</label>
                          <input type="date" className="input" value={fromDate} onChange={e => setFromDate(e.target.value)} />
                        </div>
                        <div style={{ color: 'var(--text-muted)', paddingTop: 20 }}>→</div>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 4, flex: 1 }}>
                          <label className="form-label" style={{ marginBottom: 0 }}>To</label>
                          <input type="date" className="input" value={toDate} min={fromDate} onChange={e => setToDate(e.target.value)} />
                        </div>
                      </div>
                    </div>

                    {/* Shift picker */}
                    <div>
                      <div className="form-section-title" style={{ marginBottom: 8 }}>Temporary Shift</div>
                      <div className="shift-pills">
                        {PRESET_SHIFTS.map(p => (
                          <button
                            key={p.label}
                            className={'shift-pill' + (shift === p.label ? ' active' : '')}
                            onClick={() => setShift(p.label)}
                          >
                            {p.label}
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* Reason */}
                    <div>
                      <div className="form-section-title" style={{ marginBottom: 8 }}>Reason (optional)</div>
                      <input
                        className="input"
                        style={{ width: '100%' }}
                        placeholder="e.g. Cover for sick leave, project deadline…"
                        value={reason}
                        onChange={e => setReason(e.target.value)}
                      />
                    </div>

                    {/* Summary preview */}
                    {selectedEmp && fromDate && toDate && shift && (
                      <div className="sm-preview">
                        <div style={{ fontSize: 12, fontWeight: 600, marginBottom: 6, color: 'var(--accent)' }}>Preview</div>
                        <div style={{ fontSize: 13 }}>
                          <strong>{selectedEmp.name}</strong> will be on <strong>{shift}</strong>
                          {' '}from <strong>{fromDate}</strong> to <strong>{toDate}</strong>
                          {reason && <span> — {reason}</span>}
                        </div>
                      </div>
                    )}

                    <button
                      className="btn btn-primary"
                      style={{ width: '100%' }}
                      disabled={!selectedEmp || !fromDate || !toDate || !shift}
                      onClick={handleAdd}
                    >
                      Save shift change
                    </button>
                  </div>
                </div>
              </div>

              {/* Right — All overrides */}
              <div className="card">
                <div className="card-header">
                  <span className="card-title">Shift Changes</span>
                  <select
                    className="input input-sm"
                    style={{ width: 'auto' }}
                    value={filterEmp}
                    onChange={e => setFilterEmp(e.target.value)}
                  >
                    <option value="">All employees</option>
                    {employees.map(e => (
                      <option key={e.userId} value={e.userId}>{e.name}</option>
                    ))}
                  </select>
                </div>

                {filteredOverrides.length === 0 ? (
                  <div className="card-body" style={{ color: 'var(--text-muted)', fontSize: 13, textAlign: 'center', padding: '40px 20px' }}>
                    No shift changes recorded yet.
                  </div>
                ) : (
                  <div className="table-wrap">
                    <table className="data-table">
                      <thead>
                        <tr>
                          <th>Employee</th>
                          <th>From</th>
                          <th>To</th>
                          <th>Shift</th>
                          <th>Reason</th>
                          <th>Status</th>
                          <th></th>
                        </tr>
                      </thead>
                      <tbody>
                        {filteredOverrides.map(o => {
                          const status = getStatus(o)
                          return (
                            <tr key={o.id}>
                              <td>
                                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                                  <div className="emp-avatar" style={{ background: getColor(o.userId), width: 28, height: 28, fontSize: 10, borderRadius: 6, flexShrink: 0 }}>
                                    {getInitials(o.empName ?? o.userId)}
                                  </div>
                                  <span style={{ fontSize: 13, fontWeight: 500 }}>{o.empName ?? o.userId}</span>
                                </div>
                              </td>
                              <td style={{ fontFamily: 'DM Mono, monospace', fontSize: 12 }}>{o.fromDate}</td>
                              <td style={{ fontFamily: 'DM Mono, monospace', fontSize: 12 }}>{o.toDate}</td>
                              <td><span className="badge badge-violet">{o.shift}</span></td>
                              <td style={{ fontSize: 12, color: 'var(--text-muted)', maxWidth: 160, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                                {o.reason || '—'}
                              </td>
                              <td>
                                <span className={
                                  status === 'active'   ? 'badge badge-green' :
                                  status === 'upcoming' ? 'badge badge-blue'  :
                                  'badge badge-gray'
                                }>
                                  {status}
                                </span>
                              </td>
                              <td>
                                <button
                                  className="btn-link"
                                  style={{ color: 'var(--red)' }}
                                  onClick={() => removeOverride(o.userId, o.id)}
                                >
                                  Remove
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
          )}
        </div>
      </div>
    </div>
  )
}
