'use client'

import { useState } from 'react'
import { useAttendanceData }    from '@/hooks/useAttendanceData'
import { usePayrollSettings }   from '@/hooks/usePayrollSettings'
import { useLeaveRecords }      from '@/hooks/useLeaveRecords'
import Sidebar                  from '@/components/Sidebar'
import { calcPayroll, DEFAULT_SETTINGS } from '@/lib/payroll'

const COLORS = ['#4f46e5','#0891b2','#059669','#d97706','#dc2626','#7c3aed','#db2777','#0284c7']
function getColor(id) { const s = String(id ?? "0"); return COLORS[s.charCodeAt(s.length-1) % COLORS.length] }
function getInitials(name) { const n = String(name ?? "?"); return n.split(' ').map(w=>w[0]).join('').toUpperCase().slice(0,2) }
function fmt(n, cur) { return cur + ' ' + Math.round(n).toLocaleString() }

const CURRENCIES = ['BDT','USD','EUR','GBP','AED','SGD','INR']

function RuleBox({ label, value, sub }) {
  return (
    <div style={{ background: 'var(--bg)', border: '1px solid var(--border)', borderRadius: 8, padding: '10px 14px', flex: 1 }}>
      <div style={{ fontSize: 11, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '.05em', color: 'var(--text-muted)', marginBottom: 4 }}>{label}</div>
      <div style={{ fontSize: 18, fontWeight: 700, fontFamily: 'DM Mono, monospace', color: 'var(--text)' }}>{value}</div>
      <div style={{ fontSize: 11, color: 'var(--text-subtle)', marginTop: 3 }}>{sub}</div>
    </div>
  )
}

export default function PayrollPage() {
  const { summary }                                           = useAttendanceData()
  const { settings, updateSettings, updateGlobal, getSettings } = usePayrollSettings()
  const { records }                                           = useLeaveRecords()

  const employees = summary?.employees ?? []

  const [editingGlobal, setEditingGlobal] = useState(false)
  const [globalForm,    setGlobalForm]    = useState({ ...DEFAULT_SETTINGS })
  const [empForm,       setEmpForm]       = useState({})
  const [editingEmp,    setEditingEmp]    = useState(null)
  const [search,        setSearch]        = useState('')

  const globalSettings = { ...DEFAULT_SETTINGS, ...(settings._global ?? {}) }
  const currency       = globalSettings.currency

  const filtered = employees.filter(e =>
    e.name.toLowerCase().includes(search.toLowerCase())
  )

  function openEmpEdit(emp) {
    setEditingEmp(emp.userId)
    setEmpForm(getSettings(emp.userId))
  }

  const totals = employees.reduce((acc, emp) => {
    const s  = getSettings(emp.userId)
    const lr = records[emp.userId] ?? []
    const p  = calcPayroll(emp, s, lr)
    acc.gross    += p.grossSalary
    acc.deduct   += p.totalDeduct
    acc.overtime += p.overtimePay
    acc.net      += p.netSalary
    return acc
  }, { gross: 0, deduct: 0, overtime: 0, net: 0 })

  return (
    <div className="app-shell">
      <Sidebar active="payroll" summary={summary} />
      <div className="main-content">
        <div className="topbar">
          <div className="topbar-left">
            <div className="topbar-title">Payroll Summary</div>
            <div className="topbar-sub">
              Late rule: every {globalSettings.lateDaysPerDeduction} late days = 1 day cut &nbsp;·&nbsp;
              OT rule: every {globalSettings.overtimeHoursPerDay}h overtime = 1 extra day pay
            </div>
          </div>
          <div className="topbar-right">
            <button className="btn btn-secondary" onClick={() => { setGlobalForm({ ...globalSettings }); setEditingGlobal(true) }}>
              ⚙ Edit Rules
            </button>
          </div>
        </div>

        <div className="page-body">
          {!summary ? (
            <div className="card">
              <div className="card-body" style={{ textAlign: 'center', padding: '60px 20px', color: 'var(--text-muted)' }}>
                <div style={{ fontSize: 40, marginBottom: 16 }}>💰</div>
                <div style={{ fontWeight: 600, fontSize: 16, marginBottom: 8 }}>No data loaded</div>
                <a href="/upload" className="btn btn-primary" style={{ textDecoration: 'none', display: 'inline-flex' }}>Go to Upload</a>
              </div>
            </div>
          ) : (
            <>
              {/* Global settings modal */}
              {editingGlobal && (
                <div className="payroll-modal-backdrop" onClick={() => setEditingGlobal(false)}>
                  <div className="payroll-modal" onClick={e => e.stopPropagation()}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
                      <div style={{ fontSize: 16, fontWeight: 600 }}>Global Payroll Rules</div>
                      <button className="btn-icon" onClick={() => setEditingGlobal(false)}>✕</button>
                    </div>

                    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>

                      <div style={{ background: 'var(--bg)', borderRadius: 8, padding: '14px', border: '1px solid var(--border)' }}>
                        <div style={{ fontWeight: 600, fontSize: 13, marginBottom: 12 }}>General</div>
                        <div className="profile-form">
                          <label className="form-label">
                            Currency
                            <select className="input" value={globalForm.currency} onChange={e => setGlobalForm(p => ({ ...p, currency: e.target.value }))}>
                              {CURRENCIES.map(c => <option key={c}>{c}</option>)}
                            </select>
                          </label>
                          <label className="form-label">
                            Working days / month
                            <input type="number" className="input" value={globalForm.workingDaysPerMonth} onChange={e => setGlobalForm(p => ({ ...p, workingDaysPerMonth: +e.target.value }))} />
                          </label>
                        </div>
                      </div>

                      <div style={{ background: '#fef3c7', borderRadius: 8, padding: '14px', border: '1px solid #fde68a' }}>
                        <div style={{ fontWeight: 600, fontSize: 13, marginBottom: 4, color: '#92400e' }}>Late Deduction Rule</div>
                        <div style={{ fontSize: 12, color: '#92400e', marginBottom: 12 }}>
                          Every N late days = 1 day salary cut
                        </div>
                        <label className="form-label">
                          Late days per 1-day deduction
                          <input
                            type="number"
                            className="input"
                            min={1}
                            value={globalForm.lateDaysPerDeduction}
                            onChange={e => setGlobalForm(p => ({ ...p, lateDaysPerDeduction: +e.target.value }))}
                          />
                        </label>
                        <div style={{ fontSize: 11, color: '#92400e', marginTop: 8 }}>
                          Example: if set to 3 → an employee with 9 late days loses 3 days salary
                        </div>
                      </div>

                      <div style={{ background: '#eef2ff', borderRadius: 8, padding: '14px', border: '1px solid #c7d2fe' }}>
                        <div style={{ fontWeight: 600, fontSize: 13, marginBottom: 4, color: '#3730a3' }}>Overtime Bonus Rule</div>
                        <div style={{ fontSize: 12, color: '#3730a3', marginBottom: 12 }}>
                          Every N overtime hours = 1 extra day pay
                        </div>
                        <label className="form-label">
                          Overtime hours per 1-day bonus
                          <input
                            type="number"
                            className="input"
                            min={1}
                            value={globalForm.overtimeHoursPerDay}
                            onChange={e => setGlobalForm(p => ({ ...p, overtimeHoursPerDay: +e.target.value }))}
                          />
                        </label>
                        <div style={{ fontSize: 11, color: '#3730a3', marginTop: 8 }}>
                          Example: if set to 8 → an employee with 24h overtime earns 3 extra days pay
                        </div>
                      </div>

                    </div>

                    <button className="btn btn-primary" style={{ width: '100%', marginTop: 20 }} onClick={() => { updateGlobal(globalForm); setEditingGlobal(false) }}>
                      Save rules
                    </button>
                  </div>
                </div>
              )}

              {/* Per-employee salary modal */}
              {editingEmp && (
                <div className="payroll-modal-backdrop" onClick={() => setEditingEmp(null)}>
                  <div className="payroll-modal" onClick={e => e.stopPropagation()}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
                      <div style={{ fontSize: 16, fontWeight: 600 }}>
                        {employees.find(e => e.userId === editingEmp)?.name} — Salary
                      </div>
                      <button className="btn-icon" onClick={() => setEditingEmp(null)}>✕</button>
                    </div>

                    <div style={{ fontSize: 12, color: 'var(--text-muted)', marginBottom: 16, background: 'var(--bg)', padding: '10px 14px', borderRadius: 8 }}>
                      Set this employee's salary. Leave rule overrides are optional — leave blank to use global rules.
                    </div>

                    <div className="profile-form">
                      <label className="form-label" style={{ gridColumn: '1/-1' }}>
                        Basic Salary ({currency})
                        <input type="number" className="input" value={empForm.basicSalary ?? 0}
                          onChange={e => setEmpForm(p => ({ ...p, basicSalary: +e.target.value }))} />
                      </label>
                      <label className="form-label">
                        Working days / month
                        <input type="number" className="input" value={empForm.workingDaysPerMonth ?? globalSettings.workingDaysPerMonth}
                          onChange={e => setEmpForm(p => ({ ...p, workingDaysPerMonth: +e.target.value }))} />
                      </label>
                      <label className="form-label">
                        Late days per deduction
                        <input type="number" className="input" value={empForm.lateDaysPerDeduction ?? globalSettings.lateDaysPerDeduction}
                          onChange={e => setEmpForm(p => ({ ...p, lateDaysPerDeduction: +e.target.value }))} />
                      </label>
                      <label className="form-label">
                        OT hours per day bonus
                        <input type="number" className="input" value={empForm.overtimeHoursPerDay ?? globalSettings.overtimeHoursPerDay}
                          onChange={e => setEmpForm(p => ({ ...p, overtimeHoursPerDay: +e.target.value }))} />
                      </label>
                    </div>

                    {empForm.basicSalary > 0 && (
                      <div style={{ marginTop: 16, background: 'var(--bg)', borderRadius: 8, padding: '12px 14px' }}>
                        <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-muted)', marginBottom: 8 }}>Per day rate</div>
                        <div style={{ fontSize: 20, fontWeight: 700, fontFamily: 'DM Mono, monospace', color: 'var(--accent)' }}>
                          {currency} {Math.round(empForm.basicSalary / (empForm.workingDaysPerMonth ?? globalSettings.workingDaysPerMonth)).toLocaleString()}
                        </div>
                      </div>
                    )}

                    <button className="btn btn-primary" style={{ width: '100%', marginTop: 20 }}
                      onClick={() => { updateSettings(editingEmp, empForm); setEditingEmp(null) }}>
                      Save
                    </button>
                  </div>
                </div>
              )}

              {/* Total metrics */}
              <div className="metrics-grid">
                {[
                  { label: 'Total Gross',    value: fmt(totals.gross,    currency), icon: '₿', cls: 'metric-blue'   },
                  { label: 'Total Deduct',   value: fmt(totals.deduct,   currency), icon: '↓', cls: 'metric-amber'  },
                  { label: 'Total OT Pay',   value: fmt(totals.overtime, currency), icon: '↑', cls: 'metric-violet' },
                  { label: 'Total Net Pay',  value: fmt(totals.net,      currency), icon: '✓', cls: 'metric-green'  },
                ].map(c => (
                  <div key={c.label} className={`metric-card ${c.cls}`}>
                    <div className="metric-card-top">
                      <span className="metric-label">{c.label}</span>
                      <div className="metric-icon">{c.icon}</div>
                    </div>
                    <div className="metric-value" style={{ fontSize: 22 }}>{c.value}</div>
                  </div>
                ))}
              </div>

              {/* Table */}
              <div className="card">
                <div className="card-header">
                  <span className="card-title">Employee Payroll Breakdown</span>
                  <div className="search-wrap">
                    <span className="search-icon">⌕</span>
                    <input className="input search-input" placeholder="Search…" value={search} onChange={e => setSearch(e.target.value)} />
                  </div>
                </div>
                <div className="table-wrap">
                  <table className="data-table">
                    <thead>
                      <tr>
                        <th>Employee</th>
                        <th>Basic Salary</th>
                        <th>Absent</th>
                        <th>Late days</th>
                        <th>Days cut</th>
                        <th>OT hours</th>
                        <th>OT days</th>
                        <th>Total deduct</th>
                        <th>OT bonus</th>
                        <th>Net Pay</th>
                        <th></th>
                      </tr>
                    </thead>
                    <tbody>
                      {filtered.map(emp => {
                        const s  = getSettings(emp.userId)
                        const lr = records[emp.userId] ?? []
                        const p  = calcPayroll(emp, s, lr)
                        const noSalary = !s.basicSalary
                        return (
                          <tr key={emp.userId}>
                            <td>
                              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                                <div className="emp-avatar" style={{ background: getColor(emp.userId), width: 28, height: 28, fontSize: 10, borderRadius: 6, flexShrink: 0 }}>
                                  {getInitials(emp.name)}
                                </div>
                                <div>
                                  <div style={{ fontSize: 13, fontWeight: 500 }}>{emp.name}</div>
                                  <div style={{ fontSize: 11, color: 'var(--text-subtle)', fontFamily: 'DM Mono, monospace' }}>
                                    {currency} {p.perDay.toLocaleString()}/day
                                  </div>
                                </div>
                              </div>
                            </td>
                            <td style={{ fontFamily: 'DM Mono, monospace', fontSize: 12 }}>
                              {noSalary ? <span style={{ color: 'var(--text-subtle)' }}>—</span> : fmt(p.grossSalary, currency)}
                            </td>
                            <td>
                              {p.absentDays > 0
                                ? <span className="badge badge-amber">{p.absentDays}d</span>
                                : <span style={{ color: 'var(--text-subtle)' }}>—</span>}
                            </td>
                            <td>
                              {p.lateDays > 0
                                ? <span className="badge badge-amber">{p.lateDays}d</span>
                                : <span style={{ color: 'var(--text-subtle)' }}>—</span>}
                            </td>
                            <td>
                              {p.lateDaysDeducted > 0
                                ? <span className="badge badge-red">{p.lateDaysDeducted}d cut</span>
                                : <span style={{ color: 'var(--text-subtle)' }}>—</span>}
                            </td>
                            <td style={{ fontFamily: 'DM Mono, monospace', fontSize: 12 }}>
                              {p.otHours > 0 ? p.otHours + 'h' : '—'}
                            </td>
                            <td>
                              {p.otDaysEarned > 0
                                ? <span className="badge badge-green">{p.otDaysEarned}d earned</span>
                                : <span style={{ color: 'var(--text-subtle)' }}>—</span>}
                            </td>
                            <td style={{ fontFamily: 'DM Mono, monospace', fontSize: 12, color: p.totalDeduct > 0 ? 'var(--red)' : 'var(--text-subtle)' }}>
                              {p.totalDeduct > 0 ? '−' + fmt(p.totalDeduct, currency) : '—'}
                            </td>
                            <td style={{ fontFamily: 'DM Mono, monospace', fontSize: 12, color: p.overtimePay > 0 ? '#059669' : 'var(--text-subtle)' }}>
                              {p.overtimePay > 0 ? '+' + fmt(p.overtimePay, currency) : '—'}
                            </td>
                            <td>
                              {noSalary
                                ? <span style={{ color: 'var(--text-subtle)', fontSize: 12 }}>Set salary →</span>
                                : <span style={{ fontFamily: 'DM Mono, monospace', fontSize: 14, fontWeight: 700, color: 'var(--accent)' }}>{fmt(p.netSalary, currency)}</span>}
                            </td>
                            <td>
                              <button className="btn-link" onClick={() => openEmpEdit(emp)}>⚙ Edit</button>
                            </td>
                          </tr>
                        )
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  )
}
