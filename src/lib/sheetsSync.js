const SCRIPT_URL = 'https://script.google.com/macros/s/AKfycbx_m7qzOLcOkDLAcFIHEQd6JAPWLmuunspNtNxMepqFCFW8-J6K5pRYqH1HhurAPEYqqQ/exec'

async function post(payload) {
  try {
    const res  = await fetch(SCRIPT_URL, {
      method:  'POST',
      body:    JSON.stringify(payload),
    })
    const text = await res.text()
    try { return JSON.parse(text) }
    catch { return { ok: false, error: text } }
  } catch(err) {
    return { ok: false, error: err.message }
  }
}

export async function pingSheets() {
  try {
    const res  = await fetch(SCRIPT_URL + '?action=ping')
    return await res.json()
  } catch(e) {
    return { ok: false, error: e.message }
  }
}

// Convert object array to sheet payload — always returns {headers:[], rows:[]}
function toPayload(rows) {
  if (!rows || !Array.isArray(rows) || rows.length === 0) return null
  const headers = Object.keys(rows[0])
  if (!headers || headers.length === 0) return null
  return { headers, rows }
}

export async function syncAll({
  profiles, summary, leaveRecords, payrollSettings,
  shiftOverrides, holidays, schedules, options,
}) {
  const data = {}

  try {
    // ── Employees ──────────────────────────────────────────
    if (profiles) {
      const vals = Object.values(profiles)
      if (vals.length > 0) {
        const rows = vals.map(p => ({
          'User ID':           String(p.userId          || ''),
          'Name':              String(p.name            || ''),
          'Designation':       String(p.designation     || ''),
          'Department':        String(p.department      || ''),
          'Employment Status': String(p.employmentStatus|| ''),
          'Join Date':         String(p.joinDate        || ''),
          'Gender':            String(p.gender          || ''),
          'Blood Group':       String(p.bloodGroup      || ''),
          'Phone':             String(p.phone           || ''),
          'Email':             String(p.email           || ''),
          'Address':           String(p.address         || ''),
          'Emergency Name':    String(p.emergencyName   || ''),
          'Emergency Phone':   String(p.emergencyPhone  || ''),
          'Shift':             String(p.shift           || ''),
          'Casual Used':       Number(p.casualUsed      ?? 0),
          'Sick Used':         Number(p.sickUsed        ?? 0),
          'Notes':             String(p.notes           || ''),
          'Last Updated':      new Date().toISOString(),
        }))
        const p = toPayload(rows)
        if (p) data['Employees'] = p
      }
    }

    // ── Attendance Summary ─────────────────────────────────
    if (summary?.employees?.length > 0) {
      const rows = summary.employees.map(e => ({
        'User ID':        String(e.userId               || ''),
        'Name':           String(e.name                 || ''),
        'Department':     String(e.department           || ''),
        'Shift':          String(e.shift                || ''),
        'Working Days':   Number(e.workingDays          ?? 0),
        'Presence (min)': Number(e.totalPresenceMinutes ?? 0),
        'Late (min)':     Number(e.totalLateMinutes     ?? 0),
        'Overtime (min)': Number(e.totalOvertimeMinutes ?? 0),
        'Late Days':      Number(e.lateDays             ?? 0),
        'Date From':      String(summary.dateRange?.from|| ''),
        'Date To':        String(summary.dateRange?.to  || ''),
        'Last Updated':   new Date().toISOString(),
      }))
      const p = toPayload(rows)
      if (p) data['Attendance_Summary'] = p
    }

    // ── Leave Records ──────────────────────────────────────
    if (leaveRecords) {
      const rows = []
      for (const [userId, list] of Object.entries(leaveRecords)) {
        for (const r of (Array.isArray(list) ? list : [])) {
          rows.push({
            'ID':            String(r.id        || ''),
            'User ID':       String(userId),
            'Employee Name': String(r.empName   || ''),
            'Type':          String(r.type      || ''),
            'From Date':     String(r.fromDate  || ''),
            'To Date':       String(r.toDate    || ''),
            'Days':          Number(r.days      ?? 0),
            'Reason':        String(r.reason    || ''),
            'Created At':    String(r.createdAt || ''),
          })
        }
      }
      const p = toPayload(rows)
      if (p) data['Leave_Records'] = p
    }

    // ── Payroll Settings ───────────────────────────────────
    if (payrollSettings) {
      const rows = []
      for (const [userId, s] of Object.entries(payrollSettings)) {
        rows.push({
          'User ID':                  String(userId),
          'Basic Salary':             Number(s.basicSalary           ?? 0),
          'Working Days/Month':       Number(s.workingDaysPerMonth   ?? 26),
          'Late Days Per Deduction':  Number(s.lateDaysPerDeduction  ?? 3),
          'OT Hours Per Day':         Number(s.overtimeHoursPerDay   ?? 8),
          'Currency':                 String(s.currency              || 'BDT'),
          'Last Updated':             new Date().toISOString(),
        })
      }
      const p = toPayload(rows)
      if (p) data['Payroll_Settings'] = p
    }

    // ── Shift Overrides ────────────────────────────────────
    if (shiftOverrides) {
      const rows = []
      for (const [userId, list] of Object.entries(shiftOverrides)) {
        for (const o of (Array.isArray(list) ? list : [])) {
          rows.push({
            'ID':            String(o.id        || ''),
            'User ID':       String(userId),
            'Employee Name': String(o.empName   || ''),
            'From Date':     String(o.fromDate  || ''),
            'To Date':       String(o.toDate    || ''),
            'Shift':         String(o.shift     || ''),
            'Login':         String(o.login     || ''),
            'Logout':        String(o.logout    || ''),
            'Reason':        String(o.reason    || ''),
            'Created At':    String(o.createdAt || ''),
          })
        }
      }
      const p = toPayload(rows)
      if (p) data['Shift_Overrides'] = p
    }

    // ── Holidays ───────────────────────────────────────────
    if (Array.isArray(holidays) && holidays.length > 0) {
      const rows = holidays.map(h => ({
        'Date':     String(typeof h === 'string' ? h : (h?.date  || '')),
        'Label':    String(typeof h === 'string' ? '' : (h?.label || '')),
        'Added At': new Date().toISOString(),
      }))
      const p = toPayload(rows)
      if (p) data['Holidays'] = p
    }

    // ── Schedules ──────────────────────────────────────────
    if (schedules) {
      const vals = Object.values(schedules)
      if (vals.length > 0) {
        const rows = vals.map(s => ({
          'User ID':     String(s.userId             || ''),
          'Name':        String(s.name               || ''),
          'Login Time':  String(s.scheduledLoginTime || '09:00'),
          'Logout Time': String(s.scheduledLogoutTime|| '18:00'),
          'Grace (min)': Number(s.gracePeriodMinutes ?? 0),
          'Shift':       String(s.shift              || ''),
          'Last Updated':new Date().toISOString(),
        }))
        const p = toPayload(rows)
        if (p) data['Schedules'] = p
      }
    }

    // ── Dropdown Options ───────────────────────────────────
    if (options) {
      const rows = []
      for (const [field, values] of Object.entries(options)) {
        for (const value of (Array.isArray(values) ? values : [])) {
          rows.push({
            'Field':    String(field),
            'Value':    String(value),
            'Added At': new Date().toISOString(),
          })
        }
      }
      const p = toPayload(rows)
      if (p) data['Dropdown_Options'] = p
    }

    if (Object.keys(data).length === 0) {
      return { ok: false, error: 'No data to sync — upload attendance data first' }
    }

    console.log('Syncing', Object.keys(data).length, 'sheets:', Object.keys(data))
    return await post({ action: 'syncAll', data })

  } catch(err) {
    console.error('syncAll error:', err)
    return { ok: false, error: err.message }
  }
}

// Debug helper — call this from console: window.testSync()
if (typeof window !== 'undefined') {
  window.testPing = async () => {
    console.log('Pinging sheets...')
    const r = await pingSheets()
    console.log('Ping result:', r)
    return r
  }
}
