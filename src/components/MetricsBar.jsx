'use client'

import { fmtMinutes } from '@/lib/calculateStats'

export default function MetricsBar({ summary }) {
  if (!summary) return null

  const totals = summary.employees.reduce(
    (acc, e) => ({
      presence: acc.presence + e.totalPresenceMinutes,
      late:     acc.late     + e.totalLateMinutes,
      overtime: acc.overtime + e.totalOvertimeMinutes,
      lateDays: acc.lateDays + e.lateDays,
    }),
    { presence: 0, late: 0, overtime: 0, lateDays: 0 }
  )

  const cards = [
    {
      label: 'Total Presence',
      value: fmtMinutes(totals.presence),
      sub:   `${summary.employees.reduce((a,e) => a + e.workingDays, 0)} employee-days`,
      icon:  '✓',
      cls:   'metric-green',
    },
    {
      label: 'Total Late Time',
      value: fmtMinutes(totals.late),
      sub:   `${summary.employees.filter(e => e.lateDays > 0).length} employees late`,
      icon:  '!',
      cls:   'metric-amber',
    },
    {
      label: 'Total Overtime',
      value: fmtMinutes(totals.overtime),
      sub:   `After 30 min buffer`,
      icon:  '↑',
      cls:   'metric-violet',
    },
    {
      label: 'Employees',
      value: summary.employees.length,
      sub:   `${summary.dateRange.from} → ${summary.dateRange.to}`,
      icon:  '⊞',
      cls:   'metric-blue',
    },
  ]

  return (
    <div className="metrics-grid">
      {cards.map(c => (
        <div key={c.label} className={`metric-card ${c.cls}`}>
          <div className="metric-card-top">
            <span className="metric-label">{c.label}</span>
            <div className="metric-icon">{c.icon}</div>
          </div>
          <div className="metric-value">{c.value}</div>
          <div className="metric-sub">{c.sub}</div>
        </div>
      ))}
    </div>
  )
}
