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
  const { summary } = useAttendanceData()
  const {
    profiles, photos, options,
    addEmployee, updateProfile, removeEmployee,
    uploadPhoto, deletePhoto,
    addLeave, removeLeave,
    addOption, removeOption,
  } = useEmployeeProfiles(summary?.employees ?? [])

  const [selected,       setSelected]       = useState(null)
  const [search,         setSearch]         = useState('')
  const [showAdd,        setShowAdd]        = useState(false)
  const [showOptions,    setShowOptions]    = useState(false)
  const [confirmDelete,  setConfirmDelete]  = useState(null)

  const summaryEmployees = summary?.employees ?? []

  // Merge attendance employees + manually added profiles
  const allIds = [...new Set([
    ...summaryEmployees.map(e => e.userId),
    ...Object.keys(profiles),
  ])]

  const allEmployees = allIds.map(id => ({
    userId: id,
    name:   profiles[id]?.name ?? summaryEmployees.find(e => e.userId === id)?.name ?? id,
    stats:  summaryEmployees.find(e => e.userId === id) ?? null,
  })).filter(e => e.name.toLowerCase().includes(search.toLowerCase()) || e.userId.includes(search))

  const selectedProfile = selected ? profiles[selected] : null
  const selectedStats   = selected ? summaryEmployees.find(e => e.userId === selected) ?? null : null

  function handleDelete(userId) {
    setConfirmDelete(userId)
  }

  function confirmDel() {
    removeEmployee(confirmDelete)
    if (selected === confirmDelete) setSelected(null)
    setConfirmDelete(null)
  }

  return (
    <div className="app-shell">
      <Sidebar active="employees" summary={summary} />
      <div className="main-content">
        <div className="topbar">
          <div className="topbar-left">
            <div className="topbar-title">Employees</div>
            <div className="topbar-sub">{allEmployees.length} employees</div>
          </div>
          <div className="topbar-right">
            <div className="search-wrap">
              <span className="search-icon">⌕</span>
              <input className="input search-input" placeholder="Search…" value={search} onChange={e => setSearch(e.target.value)} />
            </div>
            <button className="btn btn-secondary" onClick={() => setShowOptions(true)}>⚙ Manage Options</button>
            <button className="btn btn-primary"   onClick={() => setShowAdd(true)}>+ Add Employee</button>
          </div>
        </div>

        <div className="page-body">
          <div className="emp-card-grid">
            {allEmployees.map(emp => (
              <EmployeeCard
                key={emp.userId}
                profile={profiles[emp.userId] ?? { userId: emp.userId, name: emp.name }}
                stats={emp.stats}
                photo={photos[emp.userId]}
                onClick={() => setSelected(emp.userId)}
                onDelete={() => handleDelete(emp.userId)}
              />
            ))}
          </div>
        </div>
      </div>

      {/* Profile panel */}
      {selectedProfile && (
        <EmployeeProfilePanel
          profile={selectedProfile}
          stats={selectedStats}
          photo={photos[selected]}
          options={options}
          onUpdate={updateProfile}
          onUploadPhoto={uploadPhoto}
          onDeletePhoto={deletePhoto}
          onAddLeave={addLeave}
          onRemoveLeave={removeLeave}
          onClose={() => setSelected(null)}
        />
      )}

      {/* Add employee modal */}
      {showAdd && (
        <AddEmployeeModal
          options={options}
          onAdd={addEmployee}
          onClose={() => setShowAdd(false)}
        />
      )}

      {/* Manage options modal */}
      {showOptions && (
        <ManageOptionsModal
          options={options}
          onAdd={addOption}
          onRemove={removeOption}
          onClose={() => setShowOptions(false)}
        />
      )}

      {/* Confirm delete */}
      {confirmDelete && (
        <div className="payroll-modal-backdrop" onClick={() => setConfirmDelete(null)}>
          <div className="payroll-modal" style={{ maxWidth: 360 }} onClick={e => e.stopPropagation()}>
            <div style={{ fontSize: 16, fontWeight: 600, marginBottom: 10 }}>Delete Employee?</div>
            <div style={{ fontSize: 13, color: 'var(--text-muted)', marginBottom: 20 }}>
              This will permanently remove <strong>{profiles[confirmDelete]?.name ?? confirmDelete}</strong> and all their data.
            </div>
            <div style={{ display: 'flex', gap: 10 }}>
              <button className="btn btn-secondary" style={{ flex: 1 }} onClick={() => setConfirmDelete(null)}>Cancel</button>
              <button className="btn btn-danger"    style={{ flex: 1 }} onClick={confirmDel}>Delete</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
