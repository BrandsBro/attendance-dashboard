const KEY         = 'employee_profiles_v1'
const PHOTOS_KEY  = 'employee_photos_v1'
const OPTIONS_KEY = 'hr_dropdown_options_v1'

function isBrowser() { return typeof window !== 'undefined' }

export function loadProfiles() {
  if (!isBrowser()) return {}
  try { return JSON.parse(localStorage.getItem(KEY) ?? '{}') }
  catch { return {} }
}

export function saveProfiles(p) {
  if (!isBrowser()) return
  localStorage.setItem(KEY, JSON.stringify(p))
}

export function deleteProfile(userId) {
  if (!isBrowser()) return
  const p = loadProfiles()
  delete p[userId]
  saveProfiles(p)
}

export function loadPhotos() {
  if (!isBrowser()) return {}
  try { return JSON.parse(localStorage.getItem(PHOTOS_KEY) ?? '{}') }
  catch { return {} }
}

export function savePhoto(userId, base64) {
  if (!isBrowser()) return
  const all = loadPhotos()
  all[userId] = base64
  localStorage.setItem(PHOTOS_KEY, JSON.stringify(all))
}

export function removePhoto(userId) {
  if (!isBrowser()) return
  const all = loadPhotos()
  delete all[userId]
  localStorage.setItem(PHOTOS_KEY, JSON.stringify(all))
}

export function loadDropdownOptions() {
  if (!isBrowser()) return {}
  try { return JSON.parse(localStorage.getItem(OPTIONS_KEY) ?? '{}') }
  catch { return {} }
}

export function saveDropdownOptions(opts) {
  if (!isBrowser()) return
  localStorage.setItem(OPTIONS_KEY, JSON.stringify(opts))
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
