'use client'

import { useState } from 'react'
import { fmtMinutes } from '@/lib/calculateStats'
import { PRESET_SHIFTS } from '@/lib/constants'

export default function SummaryTable({ summary, onSelectEmployee, selectedIds, onToggleSelect, onClearSelection }) {
  const [sortKey,     setSortKey]     = useState('name')
  const [sortDir,     setSortDir]     = useState('asc')
  const [search,      setSearch]      = useState('')
  const [shiftFilter, setShiftFilter] = useState('')

  function toggleSort(key) {
    if (sortKey === key) setSortDir(d => d === 'asc' ? 'desc' : 'asc')
    else { setSortKey(key); setSortDir('asc') }
  }

  const sorted = [...summary.employees]
    .filter(e => e.name.toLowerCase().includes(search.toLowerCase()))
    .filter(e => !shiftFilter || e.shift === shiftFilter)
    .sort((a, b) => {
      const av = a[sortKey], bv = b[sortKey]
      const cmp = typeof av === 'string' ? av.localeCompare(bv) : av - bv
      return sortDir === 'asc' ? cmp : -cmp
    })

  const arrow = key => sortKey === key ? (sortDir === 'asc' ? ' ↑' : ' ↓') : ''
  const allChecked = sorted.length > 0 && sorted.every(e => selectedIds.has(e.userId))
  const hasFilters = search.trim() || selectedIds.size > 0 || shiftFilter

  function clearAll() { setSearch(''); setShiftFilter(''); onClearSelection() }
  function toggleAll() {
    if (allChecked) sorted.forEach(e => onToggleSelect(e, false))
    else sorted.forEach(e => onToggleSelect(e, true))
  }

  return (
    <div className="card">
      <div className="card-header">
        <span className="card-title">Employee Summary</span>
        <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
          <div className="search-wrap">
            <span className="search-icon">⌕</span>
            <input className="input search-input" placeholder="Search employee…" value={search} onChange={e => setSearch(e.target.value)} />
          </div>
          <select className="input" style={{ width: 'auto' }} value={shiftFilter} onChange={e => setShiftFilter(e.target.value)}>
            <option value="">All shifts</option>
            {PRESET_SHIFTS.map(p => <option key={p.label} value={p.label}>{p.label}</option>)}
          </select>
          {hasFilters && (
            <button className="btn btn-danger" onClick={clearAll}>✕ Clear</button>
          )}
        </div>
      </div>

      {selectedIds.size > 0 && (
        <div className="selection-hint">
          {selectedIds.size} employee{selectedIds.size > 1 ? 's' : ''} selected — adjust their schedule in the panel above
        </div>
      )}

      <div className="table-wrap">
        <table className="data-table">
          <thead>
            <tr>
              <th style={{ width: 36 }}>
                <input type="checkbox" checked={allChecked} onChange={toggleAll} />
              </th>
              <th onClick={() => toggleSort('name')}>Employee{arrow('name')}</th>
              <th>Shift</th>
              <th onClick={() => toggleSort('workingDays')}>Presence{arrow('workingDays')}</th>
              <th onClick={() => toggleSort('lateDays')}>Late{arrow('lateDays')}</th>
              <th onClick={() => toggleSort('totalOvertimeMinutes')}>Overtime{arrow('totalOvertimeMinutes')}</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {sorted.map(emp => (
              <tr key={emp.userId} className={`${selectedIds.has(emp.userId) ? 'tr-selected' : ''}`}>
                <td>
                  <input type="checkbox" checked={selectedIds.has(emp.userId)} onChange={e => onToggleSelect(emp, e.target.checked)} />
                </td>
                <td>
                  <div className="emp-name-cell">{emp.name}</div>
                  <div className="emp-id-cell">{emp.userId}</div>
                </td>
                <td>
                  {emp.shift
                    ? <span className="badge badge-violet">{emp.shift}</span>
                    : <span style={{ color: 'var(--text-subtle)' }}>—</span>}
                </td>
                <td>{emp.workingDays} day{emp.workingDays !== 1 ? 's' : ''}</td>
                <td>
                  {emp.lateDays > 0
                    ? <span className="badge badge-amber">{emp.lateDays} day{emp.lateDays !== 1 ? 's' : ''}</span>
                    : <span className="on-time">✓ On time</span>}
                </td>
                <td>
                  {emp.totalOvertimeMinutes > 0
                    ? <span className="badge badge-blue">{fmtMinutes(emp.totalOvertimeMinutes)}</span>
                    : '—'}
                </td>
                <td>
                  <button className="btn-link" onClick={() => onSelectEmployee(emp)}>View →</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
