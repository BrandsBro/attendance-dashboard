'use client'

import { useState } from 'react'
import * as XLSX from 'xlsx'
import { fmtMinutes, fmt12h } from '@/lib/calculateStats'

export default function EmployeeDetail({ employee: emp, schedules, onUpdateSchedule, onClose }) {
  const schedule = schedules?.[emp.userId] || {}
  const dayOverrides = schedule.dayOverrides || {}
  const currentGrace = schedule.gracePeriodMinutes ?? 0

  const [selectedDates, setSelectedDates] = useState(new Set())
  const [batchLogin, setBatchLogin] = useState('09:00')
  const [batchLogout, setBatchLogout] = useState('18:00')
  const [graceValue, setGraceValue] = useState(currentGrace)

  // Download employee detail as Excel
  function handleDownloadEmployeeDetail() {
    const rows = emp.days.map(d => {
      const isOff = d.isWeekend || d.isHoliday
      let notes = []
      if (d.isHoliday) notes.push('Holiday')
      if (d.isWeekend) notes.push('Weekend')
      if (dayOverrides[d.date]) notes.push('Shift Override')
      if (d.manualIn || d.manualOut) notes.push('Time Edited')
      return {
        'Date': d.date,
        'Shift In': getEffectiveLogin(d.date),
        'Shift Out': getEffectiveLogout(d.date),
        'Actual In': fmt12h(d.inTime),
        'Actual Out': fmt12h(d.outTime),
        'Presence (min)': d.presenceMinutes,
        'Late (min)': isOff ? 0 : d.lateMinutes,
        'Overtime (min)': isOff ? 0 : d.overtimeMinutes,
        'Notes': notes.join(', ') || '—',
      }
    })

    const ws = XLSX.utils.json_to_sheet(rows)
    const wb = XLSX.utils.book_new()
    XLSX.utils.book_append_sheet(wb, ws, `${emp.name}_daily`)
    XLSX.writeFile(wb, `${emp.name}_attendance_${new Date().toISOString().slice(0, 10)}.xlsx`)
  }

  function toggleDate(date) {
    setSelectedDates(prev => {
      const next = new Set(prev)
      if (next.has(date)) next.delete(date)
      else next.add(date)
      return next
    })
  }

  function toggleAllDates() {
    if (selectedDates.size === emp.days.length) {
      setSelectedDates(new Set())
    } else {
      setSelectedDates(new Set(emp.days.map(d => d.date)))
    }
  }

  function applyShiftOverride() {
    const newOverrides = { ...dayOverrides }
    for (const date of selectedDates) {
      newOverrides[date] = { login: batchLogin, logout: batchLogout }
    }
    onUpdateSchedule(emp.userId, {
      ...schedule,
      dayOverrides: newOverrides,
    })
    setSelectedDates(new Set())
  }

  function clearOverrideForDate(date) {
    const newOverrides = { ...dayOverrides }
    delete newOverrides[date]
    onUpdateSchedule(emp.userId, {
      ...schedule,
      dayOverrides: newOverrides,
    })
  }

  function updateGracePeriod(minutes) {
    setGraceValue(minutes)
    onUpdateSchedule(emp.userId, {
      ...schedule,
      gracePeriodMinutes: minutes,
    })
  }

  const getEffectiveLogin = (date) => {
    const ov = dayOverrides[date]
    return ov?.login || schedule.scheduledLoginTime || '09:00'
  }
  const getEffectiveLogout = (date) => {
    const ov = dayOverrides[date]
    return ov?.logout || schedule.scheduledLogoutTime || '18:00'
  }

  const allSelected = emp.days.length > 0 && selectedDates.size === emp.days.length

  return (
    <div className="detail-overlay" onClick={onClose}>
      <div 
        className="detail-panel" 
        onClick={e => e.stopPropagation()}
        style={{ maxWidth: 1200, width: '95%', padding: 24 }}
      >
        <div className="detail-top">
          <div>
            <h2 className="detail-name">{emp.name}</h2>
            <p className="detail-dept">
              {emp.department}
              {emp.shift && <span className="shift-badge">{emp.shift}</span>}
              {schedule.gracePeriodMinutes > 0 && (
                <span className="grace-badge">{schedule.gracePeriodMinutes} min grace</span>
              )}
            </p>
          </div>
          <div style={{ display: 'flex', gap: 8 }}>
            <button className="btn-primary" onClick={handleDownloadEmployeeDetail} style={{ fontSize: 13, padding: '6px 12px' }}>
              📥 Download Detail
            </button>
            <button className="btn-icon" onClick={onClose}>✕</button>
          </div>
        </div>

        {/* Summary pills */}
        <div className="detail-stats" style={{ flexWrap: 'wrap', gap: 8 }}>
          <div className="detail-pill"><div className="pill-value">{emp.workingDays}</div><div className="pill-label">Days present</div></div>
          <div className="detail-pill"><div className="pill-value">{fmtMinutes(emp.totalPresenceMinutes)}</div><div className="pill-label">Total presence</div></div>
          <div className="detail-pill detail-pill-amber"><div className="pill-value">{emp.lateDays ?? 0} days</div><div className="pill-label">Late days</div></div>
          <div className="detail-pill detail-pill-amber"><div className="pill-value">{fmtMinutes(emp.totalLateMinutes)}</div><div className="pill-label">Total late</div></div>
          <div className="detail-pill detail-pill-blue"><div className="pill-value">{fmtMinutes(emp.totalOvertimeMinutes)}</div><div className="pill-label">Total overtime</div></div>
        </div>

        {/* Grace period selector */}
        <div className="bulk-row" style={{ marginBottom: 16, justifyContent: 'space-between', flexWrap: 'wrap' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>
            <span className="bulk-label">Grace period for this employee:</span>
            <div className="grace-options">
              {[0, 5, 10, 15, 20, 30].map(g => (
                <button
                  key={g}
                  className={`grace-btn ${graceValue === g ? 'grace-btn-active' : ''}`}
                  onClick={() => updateGracePeriod(g)}
                >
                  {g === 0 ? 'No grace' : `${g} min`}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Batch shift override */}
        <div className="bulk-row" style={{ marginBottom: 16, justifyContent: 'space-between', flexWrap: 'wrap' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>
            <span className="bulk-label">Set shift for selected days:</span>
            <input type="time" className="time-input" value={batchLogin} onChange={e => setBatchLogin(e.target.value)} />
            <span>→</span>
            <input type="time" className="time-input" value={batchLogout} onChange={e => setBatchLogout(e.target.value)} />
            <button className="btn-primary" onClick={applyShiftOverride} disabled={selectedDates.size === 0}>
              Apply to {selectedDates.size} day{selectedDates.size !== 1 ? 's' : ''}
            </button>
            {selectedDates.size > 0 && (
              <button className="btn-secondary" onClick={() => setSelectedDates(new Set())}>Clear selection</button>
            )}
          </div>
        </div>

        <div style={{ overflowX: 'auto', maxWidth: '100%' }}>
          <table className="data-table" style={{ minWidth: 800 }}>
            <thead>
              <tr>
                <th style={{ width: 36 }}><input type="checkbox" checked={allSelected} onChange={toggleAllDates} /></th>
                <th>Date</th>
                <th>Shift In</th>
                <th>Shift Out</th>
                <th>Actual In</th>
                <th>Actual Out</th>
                <th>Presence</th>
                <th>Late</th>
                <th>Overtime</th>
              </tr>
            </thead>
            <tbody>
              {emp.days.map(d => {
                const isOff = d.isWeekend || d.isHoliday
                const hasOverride = !!dayOverrides[d.date]
                return (
                  <tr key={d.date} className={`table-row ${isOff ? 'row-off' : ''}`}>
                    <td style={{ textAlign: 'center' }}>
                      <input type="checkbox" checked={selectedDates.has(d.date)} onChange={() => toggleDate(d.date)} disabled={isOff} />
                    </td>
                    <td style={{ whiteSpace: 'nowrap' }}>
                      {d.date}
                      {d.isHoliday && <span className="day-badge day-holiday">Holiday</span>}
                      {d.isWeekend && <span className="day-badge day-weekend">Weekend</span>}
                    </td>
                    <td className={hasOverride ? 'day-edited' : ''} style={{ whiteSpace: 'nowrap' }}>
                      {getEffectiveLogin(d.date)}
                      {hasOverride && <button className="btn-link" style={{ marginLeft: 6 }} onClick={() => clearOverrideForDate(d.date)}>✕</button>}
                    </td>
                    <td className={hasOverride ? 'day-edited' : ''} style={{ whiteSpace: 'nowrap' }}>{getEffectiveLogout(d.date)}</td>
                    <td style={{ whiteSpace: 'nowrap' }}>{fmt12h(d.inTime)}</td>
                    <td style={{ whiteSpace: 'nowrap' }}>{fmt12h(d.outTime)}</td>
                    <td style={{ whiteSpace: 'nowrap' }}>{fmtMinutes(d.presenceMinutes)}</td>
                    <td style={{ whiteSpace: 'nowrap' }}>
                      {isOff ? '—' : (d.lateMinutes > 0 ? <span className="badge badge-amber">{fmtMinutes(d.lateMinutes)}</span> : 'On time')}
                    </td>
                    <td style={{ whiteSpace: 'nowrap' }}>
                      {isOff ? '—' : (d.overtimeMinutes > 0 ? <span className="badge badge-blue">{fmtMinutes(d.overtimeMinutes)}</span> : '—')}
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}