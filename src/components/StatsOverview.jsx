'use client'

import { fmtMinutes } from '@/lib/calculateStats'

export default function StatsOverview({ summary }) {
  const totals = summary.employees.reduce(
    (acc, emp) => ({
      presence: acc.presence + emp.totalPresenceMinutes,
      late:     acc.late     + emp.totalLateMinutes,
      overtime: acc.overtime + emp.totalOvertimeMinutes,
      days:     acc.days     + emp.workingDays,
    }),
    { presence: 0, late: 0, overtime: 0, days: 0 }
  )

  const lateCount = summary.employees.filter(e => e.totalLateMinutes > 0).length

  const cards = [
    { label: 'Total Presence', value: fmtMinutes(totals.presence), sub: `${totals.days} employee-days`,          color: 'stat-green' },
    { label: 'Total Late',     value: fmtMinutes(totals.late),     sub: `${lateCount} employees late`,           color: 'stat-amber' },
    { label: 'Total Overtime', value: fmtMinutes(totals.overtime), sub: 'beyond schedule + 30 min buffer',       color: 'stat-blue'  },
    { label: 'Employees',      value: summary.employees.length,    sub: `${summary.dateRange.from} → ${summary.dateRange.to}`, color: 'stat-gray' },
  ]

  return (
    <div>
      <div className="overview-meta">
        <span>Source: <strong>{summary.sourceLabel}</strong></span>
        <span>Processed: {new Date(summary.processedAt).toLocaleString()}</span>
      </div>
      <div className="stat-grid">
        {cards.map(c => (
          <div key={c.label} className={`stat-card ${c.color}`}>
            <div className="stat-value">{c.value}</div>
            <div className="stat-label">{c.label}</div>
            <div className="stat-sub">{c.sub}</div>
          </div>
        ))}
      </div>
    </div>
  )
}
