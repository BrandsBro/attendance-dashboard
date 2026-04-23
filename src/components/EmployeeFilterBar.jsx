'use client'

export default function EmployeeFilterBar({
  options, profiles,
  search, setSearch,
  filterStatus, setFilterStatus,
  filterDept, setFilterDept,
  filterShift, setFilterShift,
  filterDesig, setFilterDesig,
  onClear, hasFilters, total, filtered,
}) {
  function countBy(field, value) {
    return Object.values(profiles).filter(p => p?.[field] === value).length
  }

  return (
    <div className="filter-bar">
      <div className="filter-bar-inner">

        {/* Search */}
        <div className="filter-search-wrap">
          <span className="filter-search-icon">⌕</span>
          <input
            className="filter-search-input"
            placeholder="Search employee…"
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
        </div>

        <div className="filter-divider" />

        {/* Status */}
        <div className="filter-select-wrap">
          <span className="filter-select-label">Status</span>
          <select
            className="filter-select"
            value={filterStatus}
            onChange={e => setFilterStatus(e.target.value)}
          >
            <option value="">All</option>
            {['Permanent','Probation'].map(s => (
              <option key={s} value={s}>{s} ({countBy('employmentStatus', s)})</option>
            ))}
          </select>
          {filterStatus && <span className="filter-active-dot" />}
        </div>

        {/* Department */}
        <div className="filter-select-wrap">
          <span className="filter-select-label">Department</span>
          <select
            className="filter-select"
            value={filterDept}
            onChange={e => setFilterDept(e.target.value)}
          >
            <option value="">All</option>
            {(options.departments ?? []).map(d => (
              <option key={d} value={d}>{d} ({countBy('department', d)})</option>
            ))}
          </select>
          {filterDept && <span className="filter-active-dot" />}
        </div>

        {/* Shift */}
        <div className="filter-select-wrap">
          <span className="filter-select-label">Shift</span>
          <select
            className="filter-select"
            value={filterShift}
            onChange={e => setFilterShift(e.target.value)}
          >
            <option value="">All</option>
            {(options.shifts ?? []).map(s => (
              <option key={s} value={s}>{s} ({countBy('shift', s)})</option>
            ))}
          </select>
          {filterShift && <span className="filter-active-dot" />}
        </div>

        {/* Designation */}
        <div className="filter-select-wrap">
          <span className="filter-select-label">Designation</span>
          <select
            className="filter-select"
            value={filterDesig}
            onChange={e => setFilterDesig(e.target.value)}
          >
            <option value="">All</option>
            {(options.designations ?? []).map(d => (
              <option key={d} value={d}>{d} ({countBy('designation', d)})</option>
            ))}
          </select>
          {filterDesig && <span className="filter-active-dot" />}
        </div>

        {hasFilters && (
          <>
            <div className="filter-divider" />
            <button className="filter-clear-btn" onClick={onClear}>✕ Clear</button>
          </>
        )}
      </div>

      {/* Results count */}
      <div className="filter-results">
        Showing <strong>{filtered}</strong> of <strong>{total}</strong> employees
        {hasFilters && <span className="filter-results-hint"> — filters active</span>}
      </div>
    </div>
  )
}
