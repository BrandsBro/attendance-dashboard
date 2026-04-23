const SCRIPT_URL = 'https://script.google.com/macros/s/AKfycbx_m7qzOLcOkDLAcFIHEQd6JAPWLmuunspNtNxMepqFCFW8-J6K5pRYqH1HhurAPEYqqQ/exec'

async function post(action, payload) {
  try {
    const res = await fetch(SCRIPT_URL, {
      method: 'POST',
      body: JSON.stringify({ action, ...payload }),
    })
    return await res.json()
  } catch (err) {
    console.error('Sheets sync error:', err)
    return { ok: false, error: err.message }
  }
}

async function get(params) {
  try {
    const url = new URL(SCRIPT_URL)
    Object.entries(params).forEach(([k, v]) => url.searchParams.set(k, v))
    const res = await fetch(url.toString())
    return await res.json()
  } catch (err) {
    console.error('Sheets read error:', err)
    return { error: err.message }
  }
}

export async function pingSheets() {
  return get({ action: 'ping' })
}

// ── Sync Employees ────────────────────────────────────────────
export async function syncEmployees(profiles) {
  const rows = Object.values(profiles).map(p => ({
    'User ID':          p.userId        || '',
    'Name':             p.name          || '',
    'Designation':      p.designation   || '',
    'Department':       p.department    || '',
    'Employment Status':p.employmentStatus || '',
    'Join Date':        p.joinDate      || '',
    'Gender':           p.gender        || '',
    'Blood Group':      p.bloodGroup    || '',
    'Phone':            p.phone         || '',
    'Email':            p.email         || '',
    'Address':          p.address       || '',
    'Emergency Name':   p.emergencyName  || '',
    'Emergency Phone':  p.emergencyPhone || '',
    'Shift':            p.shift         || '',
    'Casual Used':      p.casualUsed    ?? 0,
    'Sick Used':        p.sickUsed      ?? 0,
    'Notes':            p.notes         || '',
    'Last Updated':     new Date().toISOString(),
  }))

  return post('sync', {
    sheet: 'Employees',
    headers: Object.keys(rows[0] || {}),
    rows,
  })
}

// ── Sync Attendance Summary ───────────────────────────────────
export async function syncAttendanceSummary(summary) {
  if (!summary?.employees) return
  const rows = summary.employees.map(e => ({
    'User ID':             e.userId                || '',
    'Name':                e.name                  || '',
    'Department':          e.department            || '',
    'Shift':               e.shift                 || '',
    'Working Days':        e.workingDays           ?? 0,
    'Presence (min)':      e.totalPresenceMinutes  ?? 0,
    'Late (min)':          e.totalLateMinutes      ?? 0,
    'Overtime (min)':      e.totalOvertimeMinutes  ?? 0,
    'Late Days':           e.lateDays              ?? 0,
    'Date From':           summary.dateRange?.from || '',
    'Date To':             summary.dateRange?.to   || '',
    'Last Updated':        new Date().toISOString(),
  }))

  return post('sync', {
    sheet: 'Attendance_Summary',
    headers: Object.keys(rows[0] || {}),
    rows,
  })
}

// ── Sync Leave Records ────────────────────────────────────────
export async function syncLeaveRecords(records) {
  const rows = []
  for (const [userId, list] of Object.entries(records)) {
    for (const r of list) {
      rows.push({
        'ID':            r.id        || '',
        'User ID':       userId,
        'Employee Name': r.empName   || '',
        'Type':          r.type      || '',
        'From Date':     r.fromDate  || '',
        'To Date':       r.toDate    || '',
        'Days':          r.days      ?? 0,
        'Reason':        r.reason    || '',
        'Created At':    r.createdAt || '',
      })
    }
  }

  return post('sync', {
    sheet: 'Leave_Records',
    headers: Object.keys(rows[0] || {}),
    rows,
  })
}

// ── Sync Payroll Settings ─────────────────────────────────────
export async function syncPayrollSettings(settings) {
  const rows = []
  for (const [userId, s] of Object.entries(settings)) {
    rows.push({
      'User ID':                userId,
      'Basic Salary':           s.basicSalary            ?? 0,
      'Working Days/Month':     s.workingDaysPerMonth    ?? 26,
      'Late Days Per Deduction':s.lateDaysPerDeduction   ?? 3,
      'OT Hours Per Day':       s.overtimeHoursPerDay    ?? 8,
      'Currency':               s.currency               || 'BDT',
      'Last Updated':           new Date().toISOString(),
    })
  }

  return post('sync', {
    sheet: 'Payroll_Settings',
    headers: Object.keys(rows[0] || {}),
    rows,
  })
}

// ── Sync Payroll Summary ──────────────────────────────────────
export async function syncPayrollSummary(payrollRows) {
  const rows = payrollRows.map(p => ({
    'User ID':          p.userId           || '',
    'Name':             p.name             || '',
    'Gross Salary':     p.grossSalary      ?? 0,
    'Per Day':          p.perDay           ?? 0,
    'Present Days':     p.presentDays      ?? 0,
    'Absent Days':      p.absentDays       ?? 0,
    'Late Days':        p.lateDays         ?? 0,
    'Days Cut':         p.lateDaysDeducted ?? 0,
    'OT Hours':         p.otHours          ?? 0,
    'OT Days Earned':   p.otDaysEarned     ?? 0,
    'Unpaid Days':      p.unpaidDays       ?? 0,
    'Total Deduction':  p.totalDeduct      ?? 0,
    'OT Bonus':         p.overtimePay      ?? 0,
    'Net Salary':       p.netSalary        ?? 0,
    'Currency':         p.currency         || 'BDT',
    'Last Updated':     new Date().toISOString(),
  }))

  return post('sync', {
    sheet: 'Payroll_Summary',
    headers: Object.keys(rows[0] || {}),
    rows,
  })
}

// ── Sync Shift Overrides ──────────────────────────────────────
export async function syncShiftOverrides(overrides) {
  const rows = []
  for (const [userId, list] of Object.entries(overrides)) {
    for (const o of list) {
      rows.push({
        'ID':            o.id        || '',
        'User ID':       userId,
        'Employee Name': o.empName   || '',
        'From Date':     o.fromDate  || '',
        'To Date':       o.toDate    || '',
        'Shift':         o.shift     || '',
        'Login':         o.login     || '',
        'Logout':        o.logout    || '',
        'Reason':        o.reason    || '',
        'Created At':    o.createdAt || '',
      })
    }
  }

  return post('sync', {
    sheet: 'Shift_Overrides',
    headers: Object.keys(rows[0] || {}),
    rows,
  })
}

// ── Sync Holidays ─────────────────────────────────────────────
export async function syncHolidays(holidays) {
  const rows = holidays.map(h => ({
    'Date':     typeof h === 'string' ? h : h.date  || '',
    'Label':    typeof h === 'string' ? '' : h.label || '',
    'Added At': new Date().toISOString(),
  }))

  return post('sync', {
    sheet: 'Holidays',
    headers: ['Date', 'Label', 'Added At'],
    rows,
  })
}

// ── Sync Schedules ────────────────────────────────────────────
export async function syncSchedules(schedules) {
  const rows = Object.values(schedules).map(s => ({
    'User ID':       s.userId               || '',
    'Name':          s.name                 || '',
    'Login Time':    s.scheduledLoginTime   || '09:00',
    'Logout Time':   s.scheduledLogoutTime  || '18:00',
    'Grace (min)':   s.gracePeriodMinutes   ?? 0,
    'Shift':         s.shift                || '',
    'Last Updated':  new Date().toISOString(),
  }))

  return post('sync', {
    sheet: 'Schedules',
    headers: Object.keys(rows[0] || {}),
    rows,
  })
}

// ── Sync Dropdown Options ─────────────────────────────────────
export async function syncDropdownOptions(options) {
  const rows = []
  for (const [field, values] of Object.entries(options)) {
    for (const value of values) {
      rows.push({
        'Field':    field,
        'Value':    value,
        'Added At': new Date().toISOString(),
      })
    }
  }

  return post('sync', {
    sheet: 'Dropdown_Options',
    headers: ['Field', 'Value', 'Added At'],
    rows,
  })
}

// ── Sync Everything at once ───────────────────────────────────
export async function syncAll({
  profiles, summary, leaveRecords, payrollSettings,
  payrollSummary, shiftOverrides, holidays, schedules, options,
}) {
  const data = {}

  if (profiles && Object.keys(profiles).length > 0) {
    const rows = Object.values(profiles).map(p => ({
      'User ID': p.userId || '', 'Name': p.name || '',
      'Designation': p.designation || '', 'Department': p.department || '',
      'Employment Status': p.employmentStatus || '', 'Join Date': p.joinDate || '',
      'Gender': p.gender || '', 'Blood Group': p.bloodGroup || '',
      'Phone': p.phone || '', 'Email': p.email || '',
      'Address': p.address || '', 'Emergency Name': p.emergencyName || '',
      'Emergency Phone': p.emergencyPhone || '', 'Shift': p.shift || '',
      'Casual Used': p.casualUsed ?? 0, 'Sick Used': p.sickUsed ?? 0,
      'Notes': p.notes || '', 'Last Updated': new Date().toISOString(),
    }))
    data['Employees'] = { headers: Object.keys(rows[0]), rows }
  }

  if (summary?.employees) {
    const rows = summary.employees.map(e => ({
      'User ID': e.userId || '', 'Name': e.name || '',
      'Department': e.department || '', 'Shift': e.shift || '',
      'Working Days': e.workingDays ?? 0,
      'Presence (min)': e.totalPresenceMinutes ?? 0,
      'Late (min)': e.totalLateMinutes ?? 0,
      'Overtime (min)': e.totalOvertimeMinutes ?? 0,
      'Late Days': e.lateDays ?? 0,
      'Date From': summary.dateRange?.from || '',
      'Date To': summary.dateRange?.to || '',
      'Last Updated': new Date().toISOString(),
    }))
    data['Attendance_Summary'] = { headers: Object.keys(rows[0]), rows }
  }

  if (leaveRecords) {
    const rows = []
    for (const [userId, list] of Object.entries(leaveRecords)) {
      for (const r of list) {
        rows.push({
          'ID': r.id || '', 'User ID': userId, 'Employee Name': r.empName || '',
          'Type': r.type || '', 'From Date': r.fromDate || '', 'To Date': r.toDate || '',
          'Days': r.days ?? 0, 'Reason': r.reason || '', 'Created At': r.createdAt || '',
        })
      }
    }
    if (rows.length > 0) data['Leave_Records'] = { headers: Object.keys(rows[0]), rows }
  }

  if (payrollSettings) {
    const rows = Object.entries(payrollSettings).map(([userId, s]) => ({
      'User ID': userId, 'Basic Salary': s.basicSalary ?? 0,
      'Working Days/Month': s.workingDaysPerMonth ?? 26,
      'Late Days Per Deduction': s.lateDaysPerDeduction ?? 3,
      'OT Hours Per Day': s.overtimeHoursPerDay ?? 8,
      'Currency': s.currency || 'BDT',
      'Last Updated': new Date().toISOString(),
    }))
    data['Payroll_Settings'] = { headers: Object.keys(rows[0]), rows }
  }

  if (shiftOverrides) {
    const rows = []
    for (const [userId, list] of Object.entries(shiftOverrides)) {
      for (const o of list) {
        rows.push({
          'ID': o.id || '', 'User ID': userId, 'Employee Name': o.empName || '',
          'From Date': o.fromDate || '', 'To Date': o.toDate || '',
          'Shift': o.shift || '', 'Login': o.login || '', 'Logout': o.logout || '',
          'Reason': o.reason || '', 'Created At': o.createdAt || '',
        })
      }
    }
    if (rows.length > 0) data['Shift_Overrides'] = { headers: Object.keys(rows[0]), rows }
  }

  if (holidays?.length > 0) {
    const rows = holidays.map(h => ({
      'Date': typeof h === 'string' ? h : h.date || '',
      'Label': typeof h === 'string' ? '' : h.label || '',
      'Added At': new Date().toISOString(),
    }))
    data['Holidays'] = { headers: Object.keys(rows[0]), rows }
  }

  if (schedules) {
    const rows = Object.values(schedules).map(s => ({
      'User ID': s.userId || '', 'Name': s.name || '',
      'Login Time': s.scheduledLoginTime || '09:00',
      'Logout Time': s.scheduledLogoutTime || '18:00',
      'Grace (min)': s.gracePeriodMinutes ?? 0,
      'Shift': s.shift || '', 'Last Updated': new Date().toISOString(),
    }))
    data['Schedules'] = { headers: Object.keys(rows[0]), rows }
  }

  if (options) {
    const rows = []
    for (const [field, values] of Object.entries(options)) {
      for (const value of values) {
        rows.push({ 'Field': field, 'Value': value, 'Added At': new Date().toISOString() })
      }
    }
    if (rows.length > 0) data['Dropdown_Options'] = { headers: Object.keys(rows[0]), rows }
  }

  return post('syncAll', { data })
}
