const KEY = 'leave_records_v1'

function isBrowser() { return typeof window !== 'undefined' }

export function loadLeaveRecords() {
  if (!isBrowser()) return {}
  try {
    const raw = localStorage.getItem(KEY)
    return raw ? JSON.parse(raw) : {}
  } catch { return {} }
}

export function saveLeaveRecords(data) {
  if (!isBrowser()) return
  try { localStorage.setItem(KEY, JSON.stringify(data)) }
  catch { console.warn('Could not save leave records') }
}

export function addLeaveRecord(records, userId, entry) {
  const list = records[userId] ?? []
  const next = {
    ...records,
    [userId]: [
      ...list,
      { ...entry, id: Date.now().toString(), createdAt: new Date().toISOString() }
    ]
  }
  saveLeaveRecords(next)
  return next
}

export function removeLeaveRecord(records, userId, id) {
  const next = {
    ...records,
    [userId]: (records[userId] ?? []).filter(e => e.id !== id)
  }
  saveLeaveRecords(next)
  return next
}

export function updateLeaveRecord(records, userId, id, data) {
  const next = {
    ...records,
    [userId]: (records[userId] ?? []).map(e => e.id === id ? { ...e, ...data } : e)
  }
  saveLeaveRecords(next)
  return next
}

// Calculate total days between two dates inclusive
export function calcDays(fromDate, toDate) {
  const from = new Date(fromDate)
  const to   = new Date(toDate)
  return Math.round((to - from) / 86400000) + 1
}

// Get used days per type for an employee
export function getUsedDays(records, userId) {
  const list = records[userId] ?? []
  return list.reduce((acc, r) => {
    acc[r.type] = (acc[r.type] ?? 0) + r.days
    return acc
  }, {})
}
