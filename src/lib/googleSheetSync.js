// ── Hardcoded sheet URL — never changes ───────────────────────
const SCRIPT_URL = 'https://script.google.com/macros/s/AKfycbwR5oiVUx6Uv8iVd430mbqbMs9P1uwrfwyGky95pY4QmcA3vd1TiHIE2ylG7x2uyxZu/exec'

export function getSheetsUrl()        { return SCRIPT_URL }
export function setSheetsUrl(url)     { /* no-op — URL is hardcoded */ }
export function hasSheetsUrl()        { return true }

async function post(action, data) {
  const res = await fetch('/api/sheets', {
    method:  'POST',
    headers: { 'Content-Type': 'application/json' },
    body:    JSON.stringify({ url: SCRIPT_URL, action, data }),
  })
  const json = await res.json()
  if (json.error) throw new Error(json.error)
  return json
}

export async function pingSheets() {
  const res  = await fetch(`/api/sheets?url=${encodeURIComponent(SCRIPT_URL)}&action=ping`)
  const json = await res.json()
  if (!json.ok) throw new Error(json.message || 'Ping failed')
  return json
}

function toRows(arr) {
  if (!arr || !Array.isArray(arr) || arr.length === 0) return null
  const headers = Object.keys(arr[0])
  if (!headers.length) return null
  return { headers, rows: arr }
}

export async function syncAll(payload) {
  const {
    employees, attendanceRecords, attendanceSummary,
    leaveRecords, payrollSettings, payrollSummary,
    shiftOverrides, holidays, schedules,
  } = payload

  const data = {}

  if (employees && Object.keys(employees).length > 0) {
    const rows = Object.values(employees).map(p => ({
      'User ID':            String(p.userId            || ''),
      'Name':               String(p.name              || ''),
      'Designation':        String(p.designation       || ''),
      'Department':         String(p.department        || ''),
      'Employment Status':  String(p.employmentStatus  || ''),
      'Join Date':          String(p.joinDate          || ''),
      'Gender':             String(p.gender            || ''),
      'Blood Group':        String(p.bloodGroup        || ''),
      'Phone':              String(p.phone             || ''),
      'Email':              String(p.email             || ''),
      'Address':            String(p.address           || ''),
      'Emergency Name':     String(p.emergencyName     || ''),
      'Emergency Phone':    String(p.emergencyPhone    || ''),
      'Shift':              String(p.shift             || ''),
      'Casual Used':        Number(p.casualUsed        ?? 0),
      'Sick Used':          Number(p.sickUsed          ?? 0),
      'Notes':              String(p.notes             || ''),
      'Last Updated':       new Date().toISOString(),
    }))
    const p = toRows(rows)
    if (p) data['Employees'] = p
  }

  if (Array.isArray(attendanceRecords) && attendanceRecords.length > 0) {
    const rows = attendanceRecords.map(r => ({
      'Serial No':  String(r.serialNo   ?? ''),
      'User ID':    String(r.userId     || ''),
      'Name':       String(r.name       || ''),
      'Department': String(r.department || ''),
      'Date/Time':  String(r.dateTime   || ''),
      'Status':     String(r.status     || ''),
    }))
    const p = toRows(rows)
    if (p) data['Attendance_Records'] = p
  }

  if (attendanceSummary?.employees?.length > 0) {
    const rows = attendanceSummary.employees.map(e => ({
      'User ID':        String(e.userId               || ''),
      'Name':           String(e.name                 || ''),
      'Department':     String(e.department           || ''),
      'Shift':          String(e.shift                || ''),
      'Working Days':   Number(e.workingDays          ?? 0),
      'Presence (min)': Number(e.totalPresenceMinutes ?? 0),
      'Late (min)':     Number(e.totalLateMinutes     ?? 0),
      'Overtime (min)': Number(e.totalOvertimeMinutes ?? 0),
      'Late Days':      Number(e.lateDays             ?? 0),
      'Date From':      String(attendanceSummary.dateRange?.from || ''),
      'Date To':        String(attendanceSummary.dateRange?.to   || ''),
      'Last Updated':   new Date().toISOString(),
    }))
    const p = toRows(rows)
    if (p) data['Attendance_Summary'] = p
  }

  if (leaveRecords && Object.keys(leaveRecords).length > 0) {
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
    const p = toRows(rows)
    if (p) data['Leave_Records'] = p
  }

  if (payrollSettings && Object.keys(payrollSettings).length > 0) {
    const rows = Object.entries(payrollSettings).map(([userId, s]) => ({
      'User ID':                 String(userId),
      'Basic Salary':            Number(s.basicSalary           ?? 0),
      'Working Days/Month':      Number(s.workingDaysPerMonth   ?? 26),
      'Late Days Per Deduction': Number(s.lateDaysPerDeduction  ?? 3),
      'OT Hours Per Day':        Number(s.overtimeHoursPerDay   ?? 8),
      'Currency':                String(s.currency              || 'BDT'),
      'Last Updated':            new Date().toISOString(),
    }))
    const p = toRows(rows)
    if (p) data['Payroll_Settings'] = p
  }

  if (Array.isArray(payrollSummary) && payrollSummary.length > 0) {
    const rows = payrollSummary.map(p => ({
      'User ID':         String(p.userId           || ''),
      'Name':            String(p.name             || ''),
      'Gross Salary':    Number(p.grossSalary      ?? 0),
      'Per Day':         Number(p.perDay           ?? 0),
      'Present Days':    Number(p.presentDays      ?? 0),
      'Absent Days':     Number(p.absentDays       ?? 0),
      'Late Days':       Number(p.lateDays         ?? 0),
      'Days Cut':        Number(p.lateDaysDeducted ?? 0),
      'OT Hours':        Number(p.otHours          ?? 0),
      'OT Days Earned':  Number(p.otDaysEarned     ?? 0),
      'Unpaid Days':     Number(p.unpaidDays       ?? 0),
      'Total Deduction': Number(p.totalDeduct      ?? 0),
      'OT Bonus':        Number(p.overtimePay      ?? 0),
      'Net Salary':      Number(p.netSalary        ?? 0),
      'Currency':        String(p.currency         || 'BDT'),
      'Last Updated':    new Date().toISOString(),
    }))
    const p = toRows(rows)
    if (p) data['Payroll_Summary'] = p
  }

  if (shiftOverrides && Object.keys(shiftOverrides).length > 0) {
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
    const p = toRows(rows)
    if (p) data['Shift_Overrides'] = p
  }

  if (Array.isArray(holidays) && holidays.length > 0) {
    const rows = holidays.map(h => ({
      'Date':     String(typeof h === 'string' ? h : (h?.date  || '')),
      'Label':    String(typeof h === 'string' ? '' : (h?.label || '')),
      'Added At': new Date().toISOString(),
    }))
    const p = toRows(rows)
    if (p) data['Holidays'] = p
  }

  if (schedules && Object.keys(schedules).length > 0) {
    const rows = Object.values(schedules).map(s => ({
      'User ID':     String(s.userId              || ''),
      'Name':        String(s.name                || ''),
      'Login Time':  String(s.scheduledLoginTime  || '09:00'),
      'Logout Time': String(s.scheduledLogoutTime || '18:00'),
      'Grace (min)': Number(s.gracePeriodMinutes  ?? 0),
      'Shift':       String(s.shift               || ''),
      'Last Updated':new Date().toISOString(),
    }))
    const p = toRows(rows)
    if (p) data['Schedules'] = p
  }

  if (Object.keys(data).length === 0) {
    throw new Error('No data to sync — load attendance data first')
  }

  return post('syncAll', data)
}

export async function fetchAllFromSheets() {
  const res  = await fetch('/api/sheets?url=' + encodeURIComponent(SCRIPT_URL) + '&action=readAll')
  const json = await res.json()
  if (json.error) throw new Error(json.error)
  return json
}

export function buildPayrollSummaryRows(employees, getSettingsFn, recordsByUserId, currency) {
  return employees.map(emp => {
    const settings = getSettingsFn(emp.userId)
    return { ...emp, basicSalary: settings.basicSalary, currency: settings.currency || currency || 'BDT' }
  })
}

export async function syncEmployees(profiles)        { return syncAll({ employees: profiles }) }
export async function syncAttendanceRecords(records) { return syncAll({ attendanceRecords: records }) }
export async function syncAttendanceSummary(summary) { return syncAll({ attendanceSummary: summary }) }
export async function syncLeaveRecords(records)      { return syncAll({ leaveRecords: records }) }
export async function syncPayrollSettings(settings)  { return syncAll({ payrollSettings: settings }) }
export async function syncPayrollSummary(rows)       { return syncAll({ payrollSummary: rows }) }
export async function syncShiftOverrides(overrides)  { return syncAll({ shiftOverrides: overrides }) }
export async function syncHolidays(holidays)         { return syncAll({ holidays }) }
export async function syncSchedules(schedules)       { return syncAll({ schedules }) }
