'use client'

import { useState } from 'react'
import { fmtMinutes } from '@/lib/calculateStats'

export default function SummaryTable({ summary, onSelectEmployee }) {
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

  return (
    <div className="card">
      <div className="table-header-row">
        <h2 className="section-title" style={{ margin: 0 }}>Employee Summary</h2>
        <input
          className="text-input search-input"
          placeholder="Search employee…"
          value={search}
          onChange={e => setSearch(e.target.value)}
        />
      </div>
      <div className="table-scroll">
        <table className="data-table">
          <thead>
            <tr>
              <th onClick={() => toggleSort('name')}>Name{arrow('name')}</th>
              <th onClick={() => toggleSort('workingDays')}>Days{arrow('workingDays')}</th>
              <th onClick={() => toggleSort('totalPresenceMinutes')}>Presence{arrow('totalPresenceMinutes')}</th>
              <th onClick={() => toggleSort('totalLateMinutes')}>Late{arrow('totalLateMinutes')}</th>
              <th onClick={() => toggleSort('totalOvertimeMinutes')}>Overtime{arrow('totalOvertimeMinutes')}</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {sorted.map(emp => (
              <tr key={emp.userId} className="table-row">
                <td className="name-cell">{emp.name}</td>
                <td>{emp.workingDays}</td>
                <td>{fmtMinutes(emp.totalPresenceMinutes)}</td>
                <td><span className={emp.totalLateMinutes > 0 ? 'badge badge-amber' : 'badge badge-gray'}>{fmtMinutes(emp.totalLateMinutes)}</span></td>
                <td><span className={emp.totalOvertimeMinutes > 0 ? 'badge badge-blue' : 'badge badge-gray'}>{fmtMinutes(emp.totalOvertimeMinutes)}</span></td>
                <td><button className="btn-link" onClick={() => onSelectEmployee(emp)}>Details →</button></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
