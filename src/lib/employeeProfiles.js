const PROFILES_KEY = 'employee_profiles_v1'
const PHOTOS_KEY   = 'employee_photos_v1'

function isBrowser() { return typeof window !== 'undefined' }

export function loadProfiles() {
  if (!isBrowser()) return {}
  try {
    const raw = localStorage.getItem(PROFILES_KEY)
    return raw ? JSON.parse(raw) : {}
  } catch { return {} }
}

export function saveProfiles(profiles) {
  if (!isBrowser()) return
  try { localStorage.setItem(PROFILES_KEY, JSON.stringify(profiles)) }
  catch { console.warn('Could not save profiles') }
}

export function loadPhotos() {
  if (!isBrowser()) return {}
  try {
    const raw = localStorage.getItem(PHOTOS_KEY)
    return raw ? JSON.parse(raw) : {}
  } catch { return {} }
}

export function savePhoto(userId, base64) {
  if (!isBrowser()) return
  try {
    const all = loadPhotos()
    all[userId] = base64
    localStorage.setItem(PHOTOS_KEY, JSON.stringify(all))
  } catch { console.warn('Could not save photo') }
}

export function removePhoto(userId) {
  if (!isBrowser()) return
  try {
    const all = loadPhotos()
    delete all[userId]
    localStorage.setItem(PHOTOS_KEY, JSON.stringify(all))
  } catch {}
}

export function calcAccruedLeave(joinDate) {
  if (!joinDate) return 0
  const join   = new Date(joinDate)
  const now    = new Date()
  const months = (now.getFullYear() - join.getFullYear()) * 12 + (now.getMonth() - join.getMonth())
  return Math.max(0, Math.round(months * 1.5 * 10) / 10)
}

export function calcRemainingCasual(profile) {
  const accrued = calcAccruedLeave(profile.joinDate)
  return Math.max(0, Math.round((accrued - (profile.casualUsed ?? 0)) * 10) / 10)
}
