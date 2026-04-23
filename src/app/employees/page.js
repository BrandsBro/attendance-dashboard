'use client'

import { useState } from 'react'
import { useAttendanceData }   from '@/hooks/useAttendanceData'
import { useEmployeeProfiles } from '@/hooks/useEmployeeProfiles'
import Sidebar                 from '@/components/Sidebar'
import EmployeeCard            from '@/components/EmployeeCard'
import EmployeeProfilePanel    from '@/components/EmployeeProfilePanel'
import AddEmployeeModal        from '@/components/AddEmployeeModal'
import ManageOptionsModal      from '@/components/ManageOptionsModal'

export default function EmployeesPage() {
  const { summary, schedules, updateSchedule } = useAttendanceData()
  const {
    profiles, photos, options,
    addEmployee, updateProfile, removeEmployee,
    uploadPhoto, deletePhoto,
    addLeave, removeLeave,
    addOption, removeOption,
  } = useEmployeeProfiles(summary?.employees ?? [])

  const [selected,      setSelected]      = useState(null)
  const [search,        setSearch]        = useState('')
  const [showAdd,       setShowAdd]       = useState(false)
  const [showOptions,   setShowOptions]   = useState(false)
  const [confirmDelete, setConfirmDelete] = useState(null)

  // Filters
  const [filterDesig,  setFilterDesig]  = useState('')
  const [filterDept,   setFilterDept]   = useState('')
  const [filterShift,  setFilterShift]  = useState('')
  const [filterStatus, setFilterStatus] = useState('')

  const summaryEmployees = summary?.employees ?? []

  const allIds = [...new Set([
    ...summaryEmployees.map(e => e.userId),
    ...Object.keys(profiles),
  ])]

  const allEmployees = allIds.map(id => ({
    userId:  id,
    name:    profiles[id]?.name ?? summaryEmployees.find(e => e.userId === id)?.name ?? id,
    stats:   summaryEmployees.find(e => e.userId === id) ?? null,
    profile: profiles[id] ?? null,
  }))

  const filtered = allEmployees.filter(e => {
    const p = e.profile
    if (!p) return true
    if (search        && !e.name.toLowerCase().includes(search.toLowerCase()) && !e.userId.includes(search)) return false
    if (filterDesig   && p.designation      !== filterDesig)   return false
    if (filterDept    && p.department       !== filterDept)    return false
    if (filterShift   && p.shift            !== filterShift)   return false
    if (filterStatus  && p.employmentStatus !== filterStatus)  return false
    return true
  })

  const hasFilters = search || filterDesig || filterDept || filterShift || filterStatus

  function clearFilters() {
    setSearch(''); setFilterDesig(''); setFilterDept(''); setFilterShift(''); setFilterStatus('')
  }

  // When profile is updated, also sync shift to schedule
  function handleUpdateProfile(userId, data) {
    updateProfile(userId, data)
    if (data.shift !== undefined) {
      const cur = schedules?.[userId] ?? {}
      const preset = (options.shifts ?? []).find(s => s === data.shift)
      // find matching preset times from constants
      const SHIFT_TIMES = {
        '9 AM – 6 PM':   { login: '09:00', logout: '18:00' },
        '10 AM – 7 PM':  { login: '10:00', logout: '19:00' },
        '12 PM – 8 PM':  { login: '12:00', logout: '20:00' },
        '2 PM – 10 PM':  { login: '14:00', logout: '22:00' },
        '5 PM – 10 PM':  { login: '17:00', logout: '22:00' },
      }
      const times = SHIFT_TIMES[data.shift]
      if (times) {
        updateSchedule(userId, {
          ...cur,
          userId,
          name: profiles[userId]?.name ?? userId,
          scheduledLoginTime:  times.login,
          scheduledLogoutTime: times.logout,
          shift: data.shift,
        })
      }
    }
  }

  const selectedProfile = selected ? profiles[selected] : null
  const selectedStats   = selected ? summaryEmployees.find(e => e.userId === selected) ?? null : null

  // Count per filter option for badges
  function countBy(field, value) {
    return allEmployees.filter(e => e.profile?.[field] === value).length
  }

  return (
    <div className="app-shell">
      <Sidebar active="employees" summary={summary} />
      <div className="main-content">
        <div className="topbar">
          <div className="topbar-left">
            <div className="topbar-title">Employees</div>
            <div className="topbar-sub">{filtered.length} of {allEmployees.length} employees</div>
          </div>
          <div className="topbar-right">
            <div className="search-wrap">
              <span className="search-icon">⌕</span>
              <input className="input search-input" placeholder="Search name or ID…" value={search} onChange={e => setSearch(e.target.value)} />
            </div>
            <button className="btn btn-secondary" onClick={() => setShowOptions(true)}>⚙ Manage Options</button>
            <button className="btn btn-primary"   onClick={() => setShowAdd(true)}>+ Add Employee</button>
          </div>
        </div>

        <div className="page-body">

          {/* Filter bar */}
          <div className="emp-filter-bar">
            <div className="emp-filter-group">
              <span className="emp-filter-label">Status</span>
              <div className="emp-filter-pills">
                {['Permanent','Probation'].map(s => (
                  <button
                    key={s}
                    className={'emp-filter-pill' + (filterStatus === s ? ' active' : '')}
                    onClick={() => setFilterStatus(v => v === s ? '' : s)}
                  >
                    {s}
                    <span className="emp-filter-count">{countBy('employmentStatus', s)}</span>
                  </button>
                ))}
              </div>
            </div>

            {(options.departments ?? []).length > 0 && (
              <div className="emp-filter-group">
                <span className="emp-filter-label">Department</span>
                <div className="emp-filter-pills">
                  {(options.departments ?? []).map(d => (
                    <button
                      key={d}
                      className={'emp-filter-pill' + (filterDept === d ? ' active' : '')}
                      onClick={() => setFilterDept(v => v === d ? '' : d)}
                    >
                      {d}
                      <span className="emp-filter-count">{countBy('department', d)}</span>
                    </button>
                  ))}
                </div>
              </div>
            )}

            {(options.shifts ?? []).length > 0 && (
              <div className="emp-filter-group">
                <span className="emp-filter-label">Shift</span>
                <div className="emp-filter-pills">
                  {(options.shifts ?? []).map(s => (
                    <button
                      key={s}
                      className={'emp-filter-pill' + (filterShift === s ? ' active' : '')}
                      onClick={() => setFilterShift(v => v === s ? '' : s)}
                    >
                      {s}
                      <span className="emp-filter-count">{countBy('shift', s)}</span>
                    </button>
                  ))}
                </div>
              </div>
            )}

            {(options.designations ?? []).length > 0 && (
              <div className="emp-filter-group">
                <span className="emp-filter-label">Designation</span>
                <div className="emp-filter-pills">
                  {(options.designations ?? []).map(d => (
                    <button
                      key={d}
                      className={'emp-filter-pill' + (filterDesig === d ? ' active' : '')}
                      onClick={() => setFilterDesig(v => v === d ? '' : d)}
                    >
                      {d}
                      <span className="emp-filter-count">{countBy('designation', d)}</span>
                    </button>
                  ))}
                </div>
              </div>
            )}

            {hasFilters && (
              <button className="btn btn-danger" style={{ alignSelf: 'flex-start' }} onClick={clearFilters}>
                ✕ Clear filters
              </button>
            )}
          </div>

          {/* Employee cards */}
          <div className="emp-card-grid">
            {filtered.map(emp => (
              <EmployeeCard
                key={emp.userId}
                profile={profiles[emp.userId] ?? { userId: emp.userId, name: emp.name }}
                stats={emp.stats}
                photo={photos[emp.userId]}
                onClick={() => setSelected(emp.userId)}
                onDelete={() => setConfirmDelete(emp.userId)}
              />
            ))}
            {filtered.length === 0 && (
              <div style={{ gridColumn: '1/-1', textAlign: 'center', padding: '60px 20px', color: 'var(--text-muted)' }}>
                No employees match the current filters.
              </div>
            )}
          </div>
        </div>
      </div>

      {selectedProfile && (
        <EmployeeProfilePanel
          profile={selectedProfile}
          stats={selectedStats}
          photo={photos[selected]}
          options={options}
          onUpdate={handleUpdateProfile}
          onUploadPhoto={uploadPhoto}
          onDeletePhoto={deletePhoto}
          onAddLeave={addLeave}
          onRemoveLeave={removeLeave}
          onClose={() => setSelected(null)}
        />
      )}

      {showAdd && (
        <AddEmployeeModal
          options={options}
          onAdd={addEmployee}
          onClose={() => setShowAdd(false)}
        />
      )}

      {showOptions && (
        <ManageOptionsModal
          options={options}
          onAdd={addOption}
          onRemove={removeOption}
          onClose={() => setShowOptions(false)}
        />
      )}

      {confirmDelete && (
        <div className="payroll-modal-backdrop" onClick={() => setConfirmDelete(null)}>
          <div className="payroll-modal" style={{ maxWidth: 360 }} onClick={e => e.stopPropagation()}>
            <div style={{ fontSize: 16, fontWeight: 600, marginBottom: 10 }}>Delete Employee?</div>
            <div style={{ fontSize: 13, color: 'var(--text-muted)', marginBottom: 20 }}>
              This will permanently remove <strong>{profiles[confirmDelete]?.name ?? confirmDelete}</strong> and all their data.
            </div>
            <div style={{ display: 'flex', gap: 10 }}>
              <button className="btn btn-secondary" style={{ flex: 1 }} onClick={() => setConfirmDelete(null)}>Cancel</button>
              <button className="btn btn-danger"    style={{ flex: 1 }} onClick={() => { removeEmployee(confirmDelete); if (selected === confirmDelete) setSelected(null); setConfirmDelete(null) }}>Delete</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
