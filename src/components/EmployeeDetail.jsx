'use client'

import { fmtMinutes, fmtTime } from '@/lib/calculateStats'

export default function EmployeeDetail({ employee: emp, onClose }) {
  return (
    <div className="detail-overlay" onClick={onClose}>
      <div className="detail-panel" onClick={e => e.stopPropagation()}>
        <div className="detail-top">
          <div>
            <h2 className="detail-name">{emp.name}</h2>
            <p className="detail-dept">{emp.department}</p>
          </div>
          <button className="btn-icon" onClick={onClose}>✕</button>
        </div>

        <div className="detail-stats">
          {[
            { label: 'Days',     value: emp.workingDays,             color: '' },
            { label: 'Presence', value: fmtMinutes(emp.totalPresenceMinutes),  color: '' },
            { label: 'Late',     value: fmtMinutes(emp.totalLateMinutes),      color: 'amber' },
            { label: 'Overtime', value: fmtMinutes(emp.totalOvertimeMinutes),  color: 'blue' },
          ].map(p => (
            <div key={p.label} className={`detail-pill ${p.color ? `detail-pill-${p.color}` : ''}`}>
              <div className="pill-value">{p.value}</div>
              <div className="pill-label">{p.label}</div>
            </div>
          ))}
        </div>

        <div className="table-scroll">
          <table className="data-table">
            <thead>
              <tr>
                <th>Date</th><th>In</th><th>Out</th>
                <th>Presence</th><th>Late</th><th>Overtime</th>
              </tr>
            </thead>
            <tbody>
              {emp.days.map(d => (
                <tr key={d.date} className="table-row">
                  <td>{d.date}</td>
                  <td>{fmtTime(d.inTime)}</td>
                  <td>{fmtTime(d.outTime)}</td>
                  <td>{fmtMinutes(d.presenceMinutes)}</td>
                  <td>
                    {d.lateMinutes > 0
                      ? <span className="badge badge-amber">{fmtMinutes(d.lateMinutes)}</span>
                      : <span className="on-time">On time</span>}
                  </td>
                  <td>
                    {d.overtimeMinutes > 0
                      ? <span className="badge badge-blue">{fmtMinutes(d.overtimeMinutes)}</span>
                      : '—'}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
