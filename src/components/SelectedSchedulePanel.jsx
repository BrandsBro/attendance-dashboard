'use client'

import { useState } from 'react'
import { DEFAULT_LOGIN_TIME, DEFAULT_LOGOUT_TIME } from '@/lib/constants'

export default function SelectedSchedulePanel({ employees, onUpdate, onClear }) {
  const [loginTime,  setLoginTime]  = useState(DEFAULT_LOGIN_TIME)
  const [logoutTime, setLogoutTime] = useState(DEFAULT_LOGOUT_TIME)

  if (!employees || employees.length === 0) return null

  function applyToSelected() {
    for (const emp of employees) {
      onUpdate(emp.userId, {
        userId: emp.userId,
        name:   emp.name,
        scheduledLoginTime:  loginTime,
        scheduledLogoutTime: logoutTime,
      })
    }
  }

  return (
    <div className="card selected-panel">

      <div className="selected-names">
        {employees.map(e => (
          <span key={e.userId} className="emp-chip">{e.name}</span>
        ))}
      </div>

      <div className="time-apply-row">
        <div className="time-block">
          <span className="time-block-label">Login by</span>
          <input
            type="time"
            className="time-box"
            value={loginTime}
            onChange={e => setLoginTime(e.target.value)}
          />
        </div>

        <div className="time-divider">→</div>

        <div className="time-block">
          <span className="time-block-label">Logout by</span>
          <input
            type="time"
            className="time-box"
            value={logoutTime}
            onChange={e => setLogoutTime(e.target.value)}
          />
        </div>

        <button className="btn-primary apply-btn" onClick={applyToSelected}>
          Apply to {employees.length} employee{employees.length > 1 ? 's' : ''}
        </button>

        <button className="btn-secondary" onClick={onClear}>Clear</button>
      </div>
    </div>
  )
}
