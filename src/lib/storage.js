import { STORAGE_KEY, RECORDS_KEY } from './constants'

function isBrowser() { return typeof window !== 'undefined' }

export function saveCache(data) {
  if (!isBrowser()) return
  try { localStorage.setItem(STORAGE_KEY, JSON.stringify(data)) }
  catch { console.warn('Could not save cache') }
}

export function loadCache() {
  if (!isBrowser()) return null
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return null
    const parsed = JSON.parse(raw)
    parsed.summary = hydrateSummaryDates(parsed.summary)
    return parsed
  } catch { return null }
}

export function clearCache() {
  if (!isBrowser()) return
  localStorage.removeItem(STORAGE_KEY)
  localStorage.removeItem(RECORDS_KEY)
}

export function saveRawRecords(records) {
  if (!isBrowser()) return
  try {
    const serialised = records.map(r => ({ ...r, dateTime: r.dateTime.toISOString() }))
    localStorage.setItem(RECORDS_KEY, JSON.stringify(serialised))
  } catch { console.warn('Could not save raw records') }
}

export function loadRawRecords() {
  if (!isBrowser()) return null
  try {
    const raw = localStorage.getItem(RECORDS_KEY)
    if (!raw) return null
    return JSON.parse(raw).map(r => ({ ...r, dateTime: new Date(r.dateTime) }))
  } catch { return null }
}

function hydrateSummaryDates(summary) {
  return {
    ...summary,
    employees: summary.employees.map(emp => ({
      ...emp,
      days: emp.days.map(d => ({
        ...d,
        inTime:  d.inTime  ? new Date(d.inTime)  : null,
        outTime: d.outTime ? new Date(d.outTime) : null,
      })),
    })),
  }
}
