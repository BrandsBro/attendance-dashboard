const KEY = 'payroll_settings_v1'

function isBrowser() { return typeof window !== 'undefined' }

export function loadPayrollSettings() {
  if (!isBrowser()) return {}
  try {
    const raw = localStorage.getItem(KEY)
    return raw ? JSON.parse(raw) : {}
  } catch { return {} }
}

export function savePayrollSettings(data) {
  if (!isBrowser()) return
  try { localStorage.setItem(KEY, JSON.stringify(data)) }
  catch {}
}

export const DEFAULT_SETTINGS = {
  basicSalary:            0,
  workingDaysPerMonth:    26,
  // Late rule: every N late days = 1 day salary deduction
  lateDaysPerDeduction:   3,
  // Overtime rule: every N hours overtime = 1 day extra pay
  overtimeHoursPerDay:    8,
  currency:               'BDT',
}

export function calcPayroll(emp, settings, leaveRecords = []) {
  const s = { ...DEFAULT_SETTINGS, ...settings }

  const perDay      = s.basicSalary / s.workingDaysPerMonth
  const presentDays = emp.workingDays ?? 0
  const absentDays  = Math.max(0, s.workingDaysPerMonth - presentDays)
  const lateDays    = emp.lateDays ?? 0
  const otMinutes   = emp.totalOvertimeMinutes ?? 0
  const otHours     = otMinutes / 60

  // Unpaid leave
  const unpaidDays = leaveRecords
    .filter(r => r.type === 'unpaid')
    .reduce((acc, r) => acc + r.days, 0)

  // Late deduction: floor(lateDays / lateDaysPerDeduction) = days to cut
  const lateDaysDeducted  = s.lateDaysPerDeduction > 0
    ? Math.floor(lateDays / s.lateDaysPerDeduction)
    : 0

  // Overtime bonus: floor(otHours / overtimeHoursPerDay) = extra days pay
  const otDaysEarned = s.overtimeHoursPerDay > 0
    ? Math.floor(otHours / s.overtimeHoursPerDay)
    : 0

  const absentDeduct  = absentDays       * perDay
  const lateDeduct    = lateDaysDeducted * perDay
  const unpaidDeduct  = unpaidDays       * perDay
  const overtimePay   = otDaysEarned     * perDay

  const totalDeduct   = absentDeduct + lateDeduct + unpaidDeduct
  const netSalary     = Math.max(0, s.basicSalary - totalDeduct + overtimePay)

  return {
    grossSalary:      s.basicSalary,
    perDay:           Math.round(perDay),
    presentDays,
    absentDays,
    lateDays,
    lateDaysDeducted,
    otHours:          Math.round(otHours * 10) / 10,
    otDaysEarned,
    unpaidDays,
    absentDeduct,
    lateDeduct,
    unpaidDeduct,
    overtimePay,
    totalDeduct,
    netSalary,
    // rules used
    lateDaysPerDeduction:  s.lateDaysPerDeduction,
    overtimeHoursPerDay:   s.overtimeHoursPerDay,
  }
}
