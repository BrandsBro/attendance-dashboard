'use client'

import { useState } from 'react'
import { DEFAULT_LOGIN_TIME, DEFAULT_LOGOUT_TIME, PRESET_SHIFTS } from '@/lib/constants'

export default function SelectedSchedulePanel({ employees, schedules, onUpdate, onClear }) {
  const [tab,        setTab]        = useState('schedule')
  const [loginTime,  setLoginTime]  = useState(DEFAULT_LOGIN_TIME)
  const [logoutTime, setLogoutTime] = useState(DEFAULT_LOGOUT_TIME)
  const [grace,      setGrace]      = useState(0)
  const [shiftTab,   setShiftTab]   = useState(null)

  if (!employees || employees.length === 0) return null

  function getSchedule(emp) {
    return schedules[emp.userId] ?? {
      userId: emp.userId,
      name: emp.name,
      scheduledLoginTime:  DEFAULT_LOGIN_TIME,
      scheduledLogoutTime: DEFAULT_LOGOUT_TIME,
      gracePeriodMinutes:  0,
      shift:               null,
      logoutOverrides:     {},
    }
  }

  function applyAll() {
    for (const emp of employees) {
      onUpdate(emp.userId, {
        ...getSchedule(emp),
        scheduledLoginTime:  loginTime,
        scheduledLogoutTime: logoutTime,
        gracePeriodMinutes:  grace,
      })
    }
  }

  function applyShift(preset) {
    setShiftTab(preset.label)
    setLoginTime(preset.login)
    setLogoutTime(preset.logout)
    for (const emp of employees) {
      onUpdate(emp.userId, {
        ...getSchedule(emp),
        scheduledLoginTime:  preset.login,
        scheduledLogoutTime: preset.logout,
        shift: preset.label,
      })
    }
  }

  return (
    <div className="card selected-panel">

      {/* Employee chips + clear */}
      <div className="sp-top">
        <div className="selected-names">
          {employees.map(e => (
            <span key={e.userId} className="emp-chip">{e.name}</span>
          ))}
        </div>
        <button className="btn-secondary" onClick={onClear}>✕ Clear</button>
      </div>

      {/* Filter tabs */}
      <div className="filter-tabs">
        <button
          className={`filter-tab ${tab === 'schedule' ? 'active' : ''}`}
          onClick={() => setTab('schedule')}
        >
          Login & Logout
        </button>
        <button
          className={`filter-tab ${tab === 'grace' ? 'active' : ''}`}
          onClick={() => setTab('grace')}
        >
          Grace Period
        </button>
        <button
          className={`filter-tab ${tab === 'shift' ? 'active' : ''}`}
          onClick={() => setTab('shift')}
        >
          Shifts
        </button>
      </div>

      {/* Tab: Login & Logout together */}
      {tab === 'schedule' && (
        <div className="sp-body">
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
          <button className="btn-primary apply-btn" onClick={applyAll}>
            Apply to {employees.length} employee{employees.length > 1 ? 's' : ''}
          </button>
        </div>
      )}

      {/* Tab: Grace period */}
      {tab === 'grace' && (
        <div className="sp-body">
          <div className="time-block">
            <span className="time-block-label">Late arrivals within this window won't count as late</span>
            <div className="grace-options">
              {[0, 5, 10, 15, 20, 30].map(g => (
                <button
                  key={g}
                  className={`grace-btn ${grace === g ? 'grace-btn-active' : ''}`}
                  onClick={() => setGrace(g)}
                >
                  {g === 0 ? 'No grace' : `${g} min`}
                </button>
              ))}
            </div>
          </div>
          <button className="btn-primary apply-btn" onClick={applyAll}>
            Apply to {employees.length} employee{employees.length > 1 ? 's' : ''}
          </button>
        </div>
      )}

      {/* Tab: Shifts */}
      {tab === 'shift' && (
        <div className="sp-body">
          <div className="time-block">
            <span className="time-block-label">Select a preset shift — sets login & logout automatically</span>
            <div className="grace-options">
              {PRESET_SHIFTS.map(p => (
                <button
                  key={p.label}
                  className={`grace-btn ${shiftTab === p.label ? 'grace-btn-active' : ''}`}
                  onClick={() => applyShift(p)}
                >
                  {p.label}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

    </div>
  )
}
