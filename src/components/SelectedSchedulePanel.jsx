'use client'

import { useState } from 'react'
import { DEFAULT_LOGIN_TIME, DEFAULT_LOGOUT_TIME, PRESET_SHIFTS } from '@/lib/constants'

export default function SelectedSchedulePanel({ employees, schedules, onUpdate, onClear }) {
  const [tab,        setTab]        = useState('schedule')
  const [loginTime,  setLoginTime]  = useState(DEFAULT_LOGIN_TIME)
  const [logoutTime, setLogoutTime] = useState(DEFAULT_LOGOUT_TIME)
  const [grace,      setGrace]      = useState(0)
  const [activeShift,setActiveShift]= useState(null)

  if (!employees?.length) return null

  function getSchedule(emp) {
    return schedules[emp.userId] ?? {
      userId: emp.userId, name: emp.name,
      scheduledLoginTime: DEFAULT_LOGIN_TIME,
      scheduledLogoutTime: DEFAULT_LOGOUT_TIME,
      gracePeriodMinutes: 0, shift: null,
    }
  }

  function applyAll() {
    for (const emp of employees) {
      onUpdate(emp.userId, { ...getSchedule(emp), scheduledLoginTime: loginTime, scheduledLogoutTime: logoutTime, gracePeriodMinutes: grace })
    }
  }

  function applyShift(p) {
    setActiveShift(p.label); setLoginTime(p.login); setLogoutTime(p.logout)
    for (const emp of employees) {
      onUpdate(emp.userId, { ...getSchedule(emp), scheduledLoginTime: p.login, scheduledLogoutTime: p.logout, shift: p.label })
    }
  }

  return (
    <div className="schedule-panel">
      <div className="schedule-panel-header">
        <div>
          <div style={{ fontSize: 13, fontWeight: 600, marginBottom: 6 }}>
            {employees.length} employee{employees.length > 1 ? 's' : ''} selected
          </div>
          <div className="emp-chips">
            {employees.map(e => <span key={e.userId} className="emp-chip">{e.name}</span>)}
          </div>
        </div>
        <button className="btn btn-ghost" onClick={onClear}>✕ Clear</button>
      </div>

      <div className="filter-tabs">
        {['schedule', 'grace', 'shift'].map(t => (
          <button key={t} className={`filter-tab ${tab === t ? 'active' : ''}`} onClick={() => setTab(t)}>
            {t === 'schedule' ? 'Login & Logout' : t === 'grace' ? 'Grace Period' : 'Shifts'}
          </button>
        ))}
      </div>

      <div className="filter-tab-body">
        {tab === 'schedule' && (
          <>
            <div className="time-block">
              <span className="time-label">Login by</span>
              <input type="time" className="time-box" value={loginTime} onChange={e => setLoginTime(e.target.value)} />
            </div>
            <div className="time-arrow">→</div>
            <div className="time-block">
              <span className="time-label">Logout by</span>
              <input type="time" className="time-box" value={logoutTime} onChange={e => setLogoutTime(e.target.value)} />
            </div>
            <button className="btn btn-primary" onClick={applyAll}>Apply to {employees.length}</button>
          </>
        )}

        {tab === 'grace' && (
          <>
            <div className="time-block">
              <span className="time-label">Late arrivals within this window won't count</span>
              <div className="grace-options">
                {[0,5,10,15,20,30].map(g => (
                  <button key={g} className={`grace-btn ${grace === g ? 'active' : ''}`} onClick={() => setGrace(g)}>
                    {g === 0 ? 'None' : `${g}m`}
                  </button>
                ))}
              </div>
            </div>
            <button className="btn btn-primary" onClick={applyAll}>Apply to {employees.length}</button>
          </>
        )}

        {tab === 'shift' && (
          <div className="time-block">
            <span className="time-label">Select preset shift — applies login & logout instantly</span>
            <div className="shift-pills">
              {PRESET_SHIFTS.map(p => (
                <button key={p.label} className={`shift-pill ${activeShift === p.label ? 'active' : ''}`} onClick={() => applyShift(p)}>
                  {p.label}
                </button>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
