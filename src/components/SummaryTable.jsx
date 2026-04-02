'use client'

import { useState } from 'react'

export default function SummaryTable({ summary, onSelectEmployee, selectedIds, onToggleSelect, onClearSelection }) {
  const [sortKey, setSortKey] = useState('name')
  const [sortDir, setSortDir] = useState('asc')
  const [search,  setSearch]  = useState('')

  function toggleSort(key) {
    if (sortKey === key) setSortDir(d => d === 'asc' ? 'desc' : 'asc')
    else { setSortKey(key); setSortDir('asc') }
  }

  const sorted = [...summary.employees]
    .filter(e => e.name.toLowerCase().includes(search.toLowerCase()))
    .sort((a, b) => {
      const av = a[sortKey], bv = b[sortKey]
      const cmp = typeof av === 'string' ? av.localeCompare(bv) : av - bv
      return sortDir === 'asc' ? cmp : -cmp
    })

  const arrow = key => sortKey === key ? (sortDir === 'asc' ? ' ↑' : ' ↓') : ''
  const allChecked = sorted.length > 0 && sorted.every(e => selectedIds.has(e.userId))
  const hasFilters = search.trim() !== '' || selectedIds.size > 0

  function clearAll() {
    setSearch('')
    onClearSelection()
  }

  function toggleAll() {
    if (allChecked) sorted.forEach(e => onToggleSelect(e, false))
    else sorted.forEach(e => onToggleSelect(e, true))
  }

  return (
    <div className="card">
      <div className="table-header-row">
        <h2 className="section-title" style={{ margin: 0 }}>Employee Summary</h2>
        <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
          <input
            className="text-input search-input"
            placeholder="Search employee…"
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
          {hasFilters && (
            <button className="clear-filter-btn" onClick={clearAll}>✕ Clear filters</button>
          )}
        </div>
      </div>

      {selectedIds.size > 0 && (
        <p className="selection-hint">
          {selectedIds.size} employee{selectedIds.size > 1 ? 's' : ''} selected — adjust schedule in the panel above
        </p>
      )}

      <div className="table-scroll">
        <table className="data-table">
          <thead>
            <tr>
              <th style={{ width: 36 }}>
                <input type="checkbox" checked={allChecked} onChange={toggleAll} />
              </th>
              <th onClick={() => toggleSort('name')}>Name{arrow('name')}</th>
              <th onClick={() => toggleSort('workingDays')}>Presence{arrow('workingDays')}</th>
              <th onClick={() => toggleSort('lateDays')}>Late{arrow('lateDays')}</th>
              <th onClick={() => toggleSort('totalOvertimeMinutes')}>Overtime{arrow('totalOvertimeMinutes')}</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {sorted.map(emp => (
              <tr key={emp.userId} className={`table-row ${selectedIds.has(emp.userId) ? 'row-selected' : ''}`}>
                <td>
                  <input
                    type="checkbox"
                    checked={selectedIds.has(emp.userId)}
                    onChange={e => onToggleSelect(emp, e.target.checked)}
                  />
                </td>
                <td className="name-cell">{emp.name}</td>
                <td>{emp.workingDays} day{emp.workingDays !== 1 ? 's' : ''}</td>
                <td>
                  {emp.lateDays > 0
                    ? <span className="badge badge-amber">{emp.lateDays} day{emp.lateDays !== 1 ? 's' : ''}</span>
                    : <span className="on-time">On time</span>}
                </td>
                <td>
                  {emp.totalOvertimeMinutes > 0
                    ? <span className="badge badge-blue">{Math.floor(emp.totalOvertimeMinutes / 60)}h {emp.totalOvertimeMinutes % 60}m</span>
                    : '—'}
                </td>
                <td>
                  <button className="btn-link" onClick={() => onSelectEmployee(emp)}>Details →</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
