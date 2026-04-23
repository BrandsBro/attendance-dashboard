'use client'

import { useState } from 'react'
import { useAttendanceData }   from '@/hooks/useAttendanceData'
import { useEmployeeProfiles } from '@/hooks/useEmployeeProfiles'
import Sidebar                 from '@/components/Sidebar'
import EmployeeCard            from '@/components/EmployeeCard'
import EmployeeProfilePanel    from '@/components/EmployeeProfilePanel'
import AddEmployeeModal        from '@/components/AddEmployeeModal'
import ManageOptionsModal      from '@/components/ManageOptionsModal'
import EmployeeFilterBar       from '@/components/EmployeeFilterBar'
import LoadingScreen            from '@/components/LoadingScreen'

export default function EmployeesPage() {
  const { summary, schedules, updateSchedule } = useAttendanceData()
  const {
    profiles, photos, options,
    addEmployee, updateProfile, removeEmployee,
    uploadPhoto, deletePhoto,
    addLeave, removeLeave,
    addOption, removeOption,
  loading,
  } = useEmployeeProfiles()
  
  if (loading) return <LoadingScreen message="Loading employees from Google Sheets…" />

  const [selected,      setSelected]      = useState(null)
  const [showAdd,       setShowAdd]       = useState(false)
  const [showOptions,   setShowOptions]   = useState(false)
  const [confirmDelete, setConfirmDelete] = useState(null)

  const [search,        setSearch]        = useState('')
  const [filterDesig,   setFilterDesig]   = useState('')
  const [filterDept,    setFilterDept]    = useState('')
  const [filterShift,   setFilterShift]   = useState('')
  const [filterStatus,  setFilterStatus]  = useState('')

  const summaryEmployees = summary?.employees ?? []
  const allEmployees = Object.values(profiles).map(p => ({
    userId:  p.userId,
    name:    p.name,
    stats:   summaryEmployees.find(e => String(e.userId) === p.userId) ?? null,
    profile: p,
  }))

  const filtered = allEmployees.filter(e => {
    const p = e.profile
    if (search       && !e.name.toLowerCase().includes(search.toLowerCase()) && !e.userId.includes(search)) return false
    if (filterDesig  && p?.designation      !== filterDesig)  return false
    if (filterDept   && p?.department       !== filterDept)   return false
    if (filterShift  && p?.shift            !== filterShift)  return false
    if (filterStatus && p?.employmentStatus !== filterStatus) return false
    return true
  })

  const hasFilters = !!(search || filterDesig || filterDept || filterShift || filterStatus)

  function clearFilters() {
    setSearch(''); setFilterDesig(''); setFilterDept('')
    setFilterShift(''); setFilterStatus('')
  }

  const SHIFT_TIMES = {
    '9 AM – 6 PM':  { login: '09:00', logout: '18:00' },
    '10 AM – 7 PM': { login: '10:00', logout: '19:00' },
    '12 PM – 8 PM': { login: '12:00', logout: '20:00' },
    '2 PM – 10 PM': { login: '14:00', logout: '22:00' },
    '5 PM – 10 PM': { login: '17:00', logout: '22:00' },
  }

  function handleUpdateProfile(userId, data) {
    updateProfile(userId, data)
    if (data.shift !== undefined) {
      const times = SHIFT_TIMES[data.shift]
      if (times) {
        updateSchedule(userId, {
          ...(schedules?.[userId] ?? {}),
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

  return (
    <div className="app-shell">
      <Sidebar active="employees" summary={summary} />
      <div className="main-content">
        <div className="topbar">
          <div className="topbar-left">
            <div className="topbar-title">Employees</div>
            <div className="topbar-sub">{allEmployees.length} total employees</div>
          </div>
          <div className="topbar-right">
            <button className="btn btn-secondary" onClick={() => setShowOptions(true)}>⚙ Manage Options</button>
            <button className="btn btn-primary"   onClick={() => setShowAdd(true)}>+ Add Employee</button>
          </div>
        </div>

        <div className="page-body">
          <EmployeeFilterBar
            options={options}
            profiles={profiles}
            search={search}           setSearch={setSearch}
            filterStatus={filterStatus} setFilterStatus={setFilterStatus}
            filterDept={filterDept}   setFilterDept={setFilterDept}
            filterShift={filterShift} setFilterShift={setFilterShift}
            filterDesig={filterDesig} setFilterDesig={setFilterDesig}
            onClear={clearFilters}
            hasFilters={hasFilters}
            total={allEmployees.length}
            filtered={filtered.length}
          />

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
        <AddEmployeeModal options={options} onAdd={addEmployee} onClose={() => setShowAdd(false)} />
      )}

      {showOptions && (
        <ManageOptionsModal options={options} onAdd={addOption} onRemove={removeOption} onClose={() => setShowOptions(false)} />
      )}

      {confirmDelete && (
        <div className="payroll-modal-backdrop" onClick={() => setConfirmDelete(null)}>
          <div className="payroll-modal" style={{ maxWidth: 360 }} onClick={e => e.stopPropagation()}>
            <div style={{ fontSize: 16, fontWeight: 600, marginBottom: 10 }}>Delete Employee?</div>
            <div style={{ fontSize: 13, color: 'var(--text-muted)', marginBottom: 20 }}>
              Permanently remove <strong>{profiles[confirmDelete]?.name ?? confirmDelete}</strong> and all their data.
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
