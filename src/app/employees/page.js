'use client'

import { useState } from 'react'
import { useAttendanceData }   from '@/hooks/useAttendanceData'
import { useEmployeeProfiles } from '@/hooks/useEmployeeProfiles'
import Sidebar                 from '@/components/Sidebar'
import EmployeeCard            from '@/components/EmployeeCard'
import EmployeeProfilePanel    from '@/components/EmployeeProfilePanel'

export default function EmployeesPage() {
  const { summary } = useAttendanceData()
  const { profiles, photos, updateProfile, uploadPhoto, deletePhoto, addLeave, removeLeave } = useEmployeeProfiles(summary?.employees ?? [])
  const [selected, setSelected] = useState(null)
  const [search,   setSearch]   = useState('')

  const employees = summary?.employees ?? []
  const filtered  = employees.filter(e =>
    e.name.toLowerCase().includes(search.toLowerCase()) ||
    e.userId.includes(search)
  )

  const selectedProfile = selected ? profiles[selected] : null
  const selectedStats   = selected ? employees.find(e => e.userId === selected) : null

  return (
    <div className="app-shell">
      <Sidebar active="employees" summary={summary} />
      <div className="main-content">
        <div className="topbar">
          <div className="topbar-left">
            <div className="topbar-title">Employees</div>
            {summary && <div className="topbar-sub">{employees.length} employees</div>}
          </div>
          <div className="topbar-right">
            <div className="search-wrap">
              <span className="search-icon">⌕</span>
              <input className="input search-input" placeholder="Search name or ID…" value={search} onChange={e => setSearch(e.target.value)} />
            </div>
          </div>
        </div>
        <div className="page-body">
          {!summary ? (
            <div className="card">
              <div className="card-body" style={{ textAlign: 'center', padding: '60px 20px', color: 'var(--text-muted)' }}>
                <div style={{ fontSize: 40, marginBottom: 16 }}>⊞</div>
                <div style={{ fontWeight: 600, fontSize: 16, marginBottom: 8 }}>No data loaded</div>
                <a href="/upload" className="btn btn-primary" style={{ textDecoration: 'none', display: 'inline-flex' }}>Go to Upload</a>
              </div>
            </div>
          ) : (
            <div className="emp-card-grid">
              {filtered.map(emp => (
                <EmployeeCard
                  key={emp.userId}
                  profile={profiles[emp.userId] ?? { userId: emp.userId, name: emp.name }}
                  stats={emp}
                  photo={photos[emp.userId]}
                  onClick={() => setSelected(emp.userId)}
                />
              ))}
            </div>
          )}
        </div>
      </div>
      {selectedProfile && (
        <EmployeeProfilePanel
          profile={selectedProfile}
          stats={selectedStats}
          photo={photos[selected]}
          onUpdate={updateProfile}
          onUploadPhoto={uploadPhoto}
          onDeletePhoto={deletePhoto}
          onAddLeave={addLeave}
          onRemoveLeave={removeLeave}
          onClose={() => setSelected(null)}
        />
      )}
    </div>
  )
}
