const SYNC_URL_KEY = 'gsheets_sync_url'

export function getSheetsUrl() {
  if (typeof window === 'undefined') return ''
  return localStorage.getItem(SYNC_URL_KEY) || ''
}

export function setSheetsUrl(url) {
  if (typeof window === 'undefined') return
  localStorage.setItem(SYNC_URL_KEY, url)
}

export function hasSheetsUrl() {
  return Boolean(getSheetsUrl())
}

async function post(action, data) {
  const url = getSheetsUrl()
  if (!url) throw new Error('Google Sheets URL not configured. Go to Settings.')
  const res = await fetch('/api/sheets', {
    method:  'POST',
    headers: { 'Content-Type': 'application/json' },
    body:    JSON.stringify({ url, action, data }),
  })
  const json = await res.json()
  if (json.error) throw new Error(json.error)
  return json
}

export async function pingSheets() {
  const url = getSheetsUrl()
  if (!url) throw new Error('URL not set')
  const res  = await fetch(`/api/sheets?url=${encodeURIComponent(url)}&action=ping`)
  const json = await res.json()
  if (!json.ok) throw new Error(json.message || 'Ping failed')
  return json
}

export async function syncEmployees(profiles)        { return post('syncEmployees', profiles) }
export async function syncAttendanceRecords(records) { return post('syncAttendanceRecords', records) }
export async function syncAttendanceSummary(summary) { return post('syncAttendanceSummary', summary) }
export async function syncLeaveRecords(records)      { return post('syncLeaveRecords', records) }
export async function syncPayrollSettings(settings)  { return post('syncPayrollSettings', settings) }
export async function syncPayrollSummary(rows)       { return post('syncPayrollSummary', rows) }
export async function syncShiftOverrides(overrides)  { return post('syncShiftOverrides', overrides) }
export async function syncHolidays(holidays)         { return post('syncHolidays', holidays) }
export async function syncSchedules(schedules)       { return post('syncSchedules', schedules) }
export async function syncAll(payload)               { return post('syncAll', payload) }

export function buildPayrollSummaryRows(employees, getSettingsFn, recordsByUserId, currency) {
  return employees.map(emp => {
    const settings = getSettingsFn(emp.userId)
    return {
      userId:      emp.userId,
      name:        emp.name,
      currency:    settings.currency || currency || 'BDT',
      ...emp,
      basicSalary: settings.basicSalary,
    }
  })
}

// ─────────────────────────────────────────────────────────────
//  Pull all data FROM Google Sheets
// ─────────────────────────────────────────────────────────────
export async function fetchAllFromSheets() {
  const url = getSheetsUrl()
  if (!url) throw new Error('URL not set')
  const res  = await fetch(`/api/sheets?url=${encodeURIComponent(url)}&action=readAll`)
  const json = await res.json()
  if (json.error) throw new Error(json.error)
  return json
}
