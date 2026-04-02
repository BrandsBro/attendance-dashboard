'use client'

import { useState } from 'react'
import { DEFAULT_LOGIN_TIME, DEFAULT_LOGOUT_TIME } from '@/lib/constants'

export default function ScheduleConfig({ employees, schedules, onUpdate }) {
  const [expanded, setExpanded] = useState(false)
  const [bulkLogin,  setBulkLogin]  = useState(DEFAULT_LOGIN_TIME)
  const [bulkLogout, setBulkLogout] = useState(DEFAULT_LOGOUT_TIME)

  function getSchedule(emp) {
    return schedules[emp.userId] ?? schedules[emp.name] ?? {
      userId: emp.userId,
      name:   emp.name,
      scheduledLoginTime:  DEFAULT_LOGIN_TIME,
      scheduledLogoutTime: DEFAULT_LOGOUT_TIME,
    }
  }

  function handleChange(emp, field, value) {
    onUpdate(emp.userId, { ...getSchedule(emp), [field]: value })
  }

  function applyToAll() {
    for (const emp of employees) {
      onUpdate(emp.userId, {
        userId: emp.userId,
        name:   emp.name,
        scheduledLoginTime:  bulkLogin,
        scheduledLogoutTime: bulkLogout,
      })
    }
  }

  return (
    <div className="card">
      <div
        className="section-header"
        onClick={() => setExpanded(v => !v)}
        style={{ cursor: 'pointer', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}
      >
        <h2 className="section-title" style={{ margin: 0 }}>Employee Schedules</h2>
        <span className="chevron">{expanded ? '▲' : '▼'}</span>
      </div>

      {expanded && (
        <>
          <div className="bulk-row">
            <span className="bulk-label">Apply to all:</span>
            <input type="time" className="time-input" value={bulkLogin}  onChange={e => setBulkLogin(e.target.value)} />
            <input type="time" className="time-input" value={bulkLogout} onChange={e => setBulkLogout(e.target.value)} />
            <button className="btn-secondary" onClick={applyToAll}>Apply</button>
          </div>

          <div className="schedule-grid">
            <div className="schedule-header">
              <span>Employee</span>
              <span>Login by</span>
              <span>Logout by</span>
            </div>
            {employees.map(emp => {
              const sched = getSchedule(emp)
              return (
                <div className="schedule-row" key={emp.userId}>
                  <span className="emp-name">{emp.name}</span>
                  <input
                    type="time" className="time-input"
                    value={sched.scheduledLoginTime}
                    onChange={e => handleChange(emp, 'scheduledLoginTime', e.target.value)}
                  />
                  <input
                    type="time" className="time-input"
                    value={sched.scheduledLogoutTime}
                    onChange={e => handleChange(emp, 'scheduledLogoutTime', e.target.value)}
                  />
                </div>
              )
            })}
          </div>
          <p className="schedule-note">
            Stats recalculate instantly when you change a time. Overtime = any time beyond logout + 30 min.
          </p>
        </>
      )}
    </div>
  )
}
