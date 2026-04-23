const SCRIPT_URL = 'https://script.google.com/macros/s/AKfycbx_m7qzOLcOkDLAcFIHEQd6JAPWLmuunspNtNxMepqFCFW8-J6K5pRYqH1HhurAPEYqqQ/exec'

async function post(action, payload) {
  try {
    const res = await fetch(SCRIPT_URL, {
      method: 'POST',
      body: JSON.stringify({ action, ...payload }),
    })
    const text = await res.text()
    try { return JSON.parse(text) }
    catch { return { ok: false, error: text } }
  } catch (err) {
    console.error('Sheets sync error:', err)
    return { ok: false, error: err.message }
  }
}

export async function pingSheets() {
  try {
    const res = await fetch(SCRIPT_URL + '?action=ping')
    const data = await res.json()
    return data
  } catch(e) {
    return { ok: false, error: e.message }
  }
}

function makeSheetPayload(rows) {
  if (!rows || rows.length === 0) return null
  return { headers: Object.keys(rows[0]), rows }
}

export async function syncAll({
  profiles, summary, leaveRecords, payrollSettings,
  shiftOverrides, holidays, schedules, options,
}) {
  const data = {}

  // Employees
  if (profiles && Object.keys(profiles).length > 0) {
    const rows = Object.values(profiles).map(p => ({
      'User ID':            p.userId             || '',
      'Name':               p.name               || '',
      'Designation':        p.designation        || '',
      'Department':         p.department         || '',
      'Employment Status':  p.employmentStatus   || '',
      'Join Date':          p.joinDate           || '',
      'Gender':             p.gender             || '',
      'Blood Group':        p.bloodGroup         || '',
      'Phone':              p.phone              || '',
      'Email':              p.email              || '',
      'Address':            p.address            || '',
      'Emergency Name':     p.emergencyName      || '',
      'Emergency Phone':    p.emergencyPhone     || '',
      'Shift':              p.shift              || '',
      'Casual Used':        p.casualUsed         ?? 0,
      'Sick Used':          p.sickUsed           ?? 0,
      'Notes':              p.notes              || '',
      'Last Updated':       new Date().toISOString(),
    }))
    const p = makeSheetPayload(rows)
    if (p) data['Employees'] = p
  }

  // Attendance Summary
  if (summary?.employees?.length > 0) {
    const rows = summary.employees.map(e => ({
      'User ID':        e.userId                || '',
      'Name':           e.name                  || '',
      'Department':     e.department            || '',
      'Shift':          e.shift                 || '',
      'Working Days':   e.workingDays           ?? 0,
      'Presence (min)': e.totalPresenceMinutes  ?? 0,
      'Late (min)':     e.totalLateMinutes      ?? 0,
      'Overtime (min)': e.totalOvertimeMinutes  ?? 0,
      'Late Days':      e.lateDays              ?? 0,
      'Date From':      summary.dateRange?.from || '',
      'Date To':        summary.dateRange?.to   || '',
      'Last Updated':   new Date().toISOString(),
    }))
    const p = makeSheetPayload(rows)
    if (p) data['Attendance_Summary'] = p
  }

  // Leave Records
  if (leaveRecords && Object.keys(leaveRecords).length > 0) {
    const rows = []
    for (const [userId, list] of Object.entries(leaveRecords)) {
      for (const r of (list || [])) {
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
    const p = makeSheetPayload(rows)
    if (p) data['Leave_Records'] = p
  }

  // Payroll Settings
  if (payrollSettings && Object.keys(payrollSettings).length > 0) {
    const rows = Object.entries(payrollSettings).map(([userId, s]) => ({
      'User ID':                  userId,
      'Basic Salary':             s.basicSalary           ?? 0,
      'Working Days/Month':       s.workingDaysPerMonth   ?? 26,
      'Late Days Per Deduction':  s.lateDaysPerDeduction  ?? 3,
      'OT Hours Per Day':         s.overtimeHoursPerDay   ?? 8,
      'Currency':                 s.currency              || 'BDT',
      'Last Updated':             new Date().toISOString(),
    }))
    const p = makeSheetPayload(rows)
    if (p) data['Payroll_Settings'] = p
  }

  // Shift Overrides
  if (shiftOverrides && Object.keys(shiftOverrides).length > 0) {
    const rows = []
    for (const [userId, list] of Object.entries(shiftOverrides)) {
      for (const o of (list || [])) {
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
    const p = makeSheetPayload(rows)
    if (p) data['Shift_Overrides'] = p
  }

  // Holidays
  if (holidays?.length > 0) {
    const rows = holidays.map(h => ({
      'Date':     typeof h === 'string' ? h : (h.date  || ''),
      'Label':    typeof h === 'string' ? '' : (h.label || ''),
      'Added At': new Date().toISOString(),
    }))
    const p = makeSheetPayload(rows)
    if (p) data['Holidays'] = p
  }

  // Schedules
  if (schedules && Object.keys(schedules).length > 0) {
    const rows = Object.values(schedules).map(s => ({
      'User ID':     s.userId              || '',
      'Name':        s.name                || '',
      'Login Time':  s.scheduledLoginTime  || '09:00',
      'Logout Time': s.scheduledLogoutTime || '18:00',
      'Grace (min)': s.gracePeriodMinutes  ?? 0,
      'Shift':       s.shift               || '',
      'Last Updated':new Date().toISOString(),
    }))
    const p = makeSheetPayload(rows)
    if (p) data['Schedules'] = p
  }

  // Dropdown Options
  if (options && Object.keys(options).length > 0) {
    const rows = []
    for (const [field, values] of Object.entries(options)) {
      for (const value of (values || [])) {
        rows.push({
          'Field':    field,
          'Value':    value,
          'Added At': new Date().toISOString(),
        })
      }
    }
    const p = makeSheetPayload(rows)
    if (p) data['Dropdown_Options'] = p
  }

  if (Object.keys(data).length === 0) {
    return { ok: false, error: 'No data to sync' }
  }

  console.log('Syncing sheets:', Object.keys(data))
  return post('syncAll', { data })
}
