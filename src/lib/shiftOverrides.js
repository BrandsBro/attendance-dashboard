const KEY = 'shift_overrides_v1'

function isBrowser() { return typeof window !== 'undefined' }

export function loadShiftOverrides() {
  if (!isBrowser()) return {}
  try {
    const raw = localStorage.getItem(KEY)
    return raw ? JSON.parse(raw) : {}
  } catch { return {} }
}

export function saveShiftOverrides(data) {
  if (!isBrowser()) return
  try { localStorage.setItem(KEY, JSON.stringify(data)) }
  catch { console.warn('Could not save shift overrides') }
}

// Structure:
// {
//   userId: [
//     { id, fromDate, toDate, shift, login, logout, reason, createdAt }
//   ]
// }

export function addShiftOverride(overrides, userId, entry) {
  const list = overrides[userId] ?? []
  const next = {
    ...overrides,
    [userId]: [...list, { ...entry, id: Date.now().toString(), createdAt: new Date().toISOString() }]
  }
  saveShiftOverrides(next)
  return next
}

export function removeShiftOverride(overrides, userId, id) {
  const next = {
    ...overrides,
    [userId]: (overrides[userId] ?? []).filter(e => e.id !== id)
  }
  saveShiftOverrides(next)
  return next
}

// Get active override for a specific date
export function getOverrideForDate(overrides, userId, date) {
  const list = overrides[userId] ?? []
  return list.find(e => e.fromDate <= date && e.toDate >= date) ?? null
}
