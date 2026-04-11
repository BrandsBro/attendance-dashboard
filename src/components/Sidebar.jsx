'use client'

import { fmtMinutes } from '@/lib/calculateStats'

const NAV = [
  { id: 'dashboard',     href: '/',             icon: '◈', label: 'Dashboard'     },
  { id: 'employees',     href: '/employees',     icon: '⊞', label: 'Employees'     },
  { id: 'schedule',      href: '/schedule',      icon: '◷', label: 'Schedules'     },
  { id: 'shift-manager', href: '/shift-manager', icon: '⇄', label: 'Shift Manager' },
  { id: 'leave',         href: '/leave',         icon: '◑', label: 'Leave Records' },
  { id: 'payroll',       href: '/payroll',       icon: '◎', label: 'Payroll'       },
  { id: 'holidays',      href: '/holidays',      icon: '◻', label: 'Holidays'      },
  { id: 'upload',        href: '/upload',        icon: '⊕', label: 'Upload Data'   },
]

export default function Sidebar({ active, summary }) {
  const totals = summary?.employees.reduce(
    (acc, e) => ({
      presence: acc.presence + e.totalPresenceMinutes,
      late:     acc.late     + e.totalLateMinutes,
      overtime: acc.overtime + e.totalOvertimeMinutes,
    }),
    { presence: 0, late: 0, overtime: 0 }
  ) ?? null

  return (
    <aside className="sidebar">
      <div className="sidebar-logo">
        <div className="sidebar-logo-text">Attendance HR</div>
        <div className="sidebar-logo-sub">Brands Bro LLC</div>
      </div>

      <div className="sidebar-section">
        <div className="sidebar-section-label">Navigation</div>
        {NAV.map(item => {
          const cls = 'sidebar-nav-item' + (active === item.id ? ' active' : '')
          return (
            <a key={item.id} href={item.href} className={cls} style={{ textDecoration: 'none' }}>
              <span className="sidebar-nav-icon">{item.icon}</span>
              {item.label}
            </a>
          )
        })}
      </div>

      {totals && (
        <div className="sidebar-stats">
          <div style={{ fontSize: 10, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '.08em', color: '#3d4657', marginBottom: 8 }}>
            Month Summary
          </div>
          <div className="sidebar-stat">
            <span className="sidebar-stat-label">Employees</span>
            <span className="sidebar-stat-value">{summary.employees.length}</span>
          </div>
          <div className="sidebar-stat">
            <span className="sidebar-stat-label">Presence</span>
            <span className="sidebar-stat-value" style={{ color: '#34d399' }}>{fmtMinutes(totals.presence)}</span>
          </div>
          <div className="sidebar-stat">
            <span className="sidebar-stat-label">Late</span>
            <span className="sidebar-stat-value" style={{ color: '#fbbf24' }}>{fmtMinutes(totals.late)}</span>
          </div>
          <div className="sidebar-stat">
            <span className="sidebar-stat-label">Overtime</span>
            <span className="sidebar-stat-value" style={{ color: '#a78bfa' }}>{fmtMinutes(totals.overtime)}</span>
          </div>
        </div>
      )}
    </aside>
  )
}
