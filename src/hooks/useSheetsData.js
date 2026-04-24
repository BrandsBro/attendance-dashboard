'use client'

const SCRIPT_URL = 'https://script.google.com/macros/s/AKfycbwR5oiVUx6Uv8iVd430mbqbMs9P1uwrfwyGky95pY4QmcA3vd1TiHIE2ylG7x2uyxZu/exec'
const CACHE_KEY  = 'sheets_cache_v1'
const CACHE_TS   = 'sheets_cache_ts_v1'
const CACHE_TTL  = 5 * 60 * 1000 // 5 minutes

function isBrowser() { return typeof window !== 'undefined' }

function loadCache() {
  if (!isBrowser()) return null
  try {
    const ts = localStorage.getItem(CACHE_TS)
    if (!ts || Date.now() - parseInt(ts) > CACHE_TTL) return null
    const raw = localStorage.getItem(CACHE_KEY)
    return raw ? JSON.parse(raw) : null
  } catch { return null }
}

function saveCache(data) {
  if (!isBrowser()) return
  try {
    localStorage.setItem(CACHE_KEY, JSON.stringify(data))
    localStorage.setItem(CACHE_TS, Date.now().toString())
  } catch {}
}

// Always go through our Next.js proxy to avoid CORS
export async function fetchAllFromSheets() {
  const res  = await fetch(`/api/sheets?url=${encodeURIComponent(SCRIPT_URL)}&action=readAll`)
  const json = await res.json()
  if (json.error) throw new Error(json.error)
  saveCache(json)
  return json
}

export async function fetchSheetTab(sheetName) {
  const res  = await fetch(`/api/sheets?url=${encodeURIComponent(SCRIPT_URL)}&action=read&sheet=${encodeURIComponent(sheetName)}`)
  const json = await res.json()
  if (json.error) throw new Error(json.error)
  return json
}

export function parseEmployeesFromSheets(sheetsData) {
  const empSheet = sheetsData?.Employees
  if (!empSheet?.rows?.length) return {}

  const profiles = {}
  for (const row of empSheet.rows) {
    const userId = String(row['User ID'] || '').trim()
    if (!userId) continue
    profiles[userId] = {
      userId,
      firstName:        String(row['First Name']        || ''),
      lastName:         String(row['Last Name']         || ''),
      name:             String(row['Name'] || ((row['First Name']||'') + ' ' + (row['Last Name']||'')).trim() || ''),
      designation:      String(row['Designation']       || ''),
      department:       String(row['Department']        || ''),
      employmentStatus: String(row['Employment Status'] || 'Permanent'),
      joinDate:         String(row['Join Date']         || ''),
      gender:           String(row['Gender']            || ''),
      bloodGroup:       String(row['Blood Group']       || ''),
      phone:            String(row['Phone']             || ''),
      email:            String(row['Email']             || ''),
      address:          String(row['Address']           || ''),
      emergencyName:    String(row['Emergency Name']    || ''),
      emergencyPhone:   String(row['Emergency Phone']   || ''),
      shift:            String(row['Shift']             || ''),
      casualUsed:       Number(row['Casual Used']       || 0),
      sickUsed:         Number(row['Sick Used']         || 0),
      notes:            String(row['Notes']             || ''),
    }
  }
  return profiles
}
