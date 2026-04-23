'use client'

import { calcRemainingCasual } from '@/lib/employeeProfiles'

const COLORS = ['#4f46e5','#0891b2','#059669','#d97706','#dc2626','#7c3aed','#db2777','#0284c7']
function getColor(id) { const s = String(id ?? "0"); return COLORS[s.charCodeAt(s.length-1) % COLORS.length] }
function getInitials(name) { const n = String(name ?? "?"); return n.split(' ').map(w => w[0]).join('').toUpperCase().slice(0,2) }

export default function EmployeeCard({ profile, stats, photo, onClick, onDelete }) {
  const remaining = calcRemainingCasual(profile)

  return (
    <div className="emp-card">
      <div className="emp-card-actions">
        <button className="emp-card-action-btn" onClick={onClick}>✎ Edit</button>
        <button className="emp-card-action-btn danger" onClick={e => { e.stopPropagation(); onDelete() }}>✕</button>
      </div>

      <div className="emp-card-top" onClick={onClick} style={{ cursor: 'pointer' }}>
        <div className="emp-avatar-wrap">
          {photo
            ? <img src={photo} alt={profile.name} className="emp-avatar emp-avatar-img" />
            : <div className="emp-avatar" style={{ background: getColor(profile.userId) }}>{getInitials(profile.name)}</div>}
        </div>
        <div className="emp-card-info">
          <div className="emp-card-name">{profile.name}</div>
          <div className="emp-card-id">{profile.userId}</div>
          {profile.designation && <div className="emp-card-desig">{profile.designation}</div>}
          {profile.employmentStatus && <div className="emp-card-type">{profile.employmentStatus}</div>}
        </div>
      </div>

      {(profile.department || profile.shift) && (
        <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }} onClick={onClick}>
          {profile.department && <span className="emp-tag">{profile.department}</span>}
          {profile.shift      && <span className="emp-tag emp-tag-accent">{profile.shift}</span>}
        </div>
      )}

      <div className="emp-card-leaves" onClick={onClick}>
        <div className="leave-item">
          <div className="leave-val" style={{ color: '#059669' }}>{remaining}</div>
          <div className="leave-lbl">Casual left</div>
        </div>
        <div className="leave-divider" />
        <div className="leave-item">
          <div className="leave-val" style={{ color: '#d97706' }}>{profile.casualUsed ?? 0}</div>
          <div className="leave-lbl">Casual used</div>
        </div>
        <div className="leave-divider" />
        <div className="leave-item">
          <div className="leave-val" style={{ color: '#dc2626' }}>{profile.sickUsed ?? 0}</div>
          <div className="leave-lbl">Sick used</div>
        </div>
      </div>

      {stats && (
        <div className="emp-card-stats" onClick={onClick}>
          <span>{stats.workingDays}d present</span>
          {stats.lateDays > 0 && <span style={{ color: '#d97706' }}>{stats.lateDays}d late</span>}
          {stats.totalOvertimeMinutes > 0 && <span style={{ color: '#4f46e5' }}>OT</span>}
        </div>
      )}

      {profile.joinDate && (
        <div style={{ fontSize: 11, color: 'var(--text-subtle)' }} onClick={onClick}>
          Joined {new Date(profile.joinDate + 'T00:00:00').toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
        </div>
      )}

      <div className="emp-card-footer" onClick={onClick}>View profile →</div>
    </div>
  )
}
