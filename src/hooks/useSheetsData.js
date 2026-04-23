'use client'

import { useState, useEffect, useCallback } from 'react'
import { fetchAllFromSheets, syncAll } from '@/lib/googleSheetSync'

const CACHE_KEY = 'sheets_cache_v1'
const CACHE_TS  = 'sheets_cache_ts_v1'
const CACHE_TTL = 5 * 60 * 1000 // 5 minutes

function isBrowser() { return typeof window !== 'undefined' }

function loadCache() {
  if (!isBrowser()) return null
  try {
    const ts  = localStorage.getItem(CACHE_TS)
    const now = Date.now()
    if (!ts || now - parseInt(ts) > CACHE_TTL) return null
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

export function useSheetsData() {
  const [loading, setLoading] = useState(true)
  const [error,   setError]   = useState(null)
  const [data,    setData]    = useState(null)

  const fetchFromSheets = useCallback(async (force = false) => {
    setLoading(true)
    setError(null)
    try {
      // Use cache if fresh enough
      if (!force) {
        const cached = loadCache()
        if (cached) {
          setData(cached)
          setLoading(false)
          return cached
        }
      }

      // Fetch fresh from Sheets
      const result = await fetchAllFromSheets()
      saveCache(result)
      setData(result)
      return result
    } catch(e) {
      setError(e.message)
      // Fall back to cache
      const cached = loadCache()
      if (cached) setData(cached)
      return null
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchFromSheets()
  }, [])

  return { data, loading, error, refresh: () => fetchFromSheets(true) }
}

// Parse Sheets rows back into profiles object
export function parseEmployeesFromSheets(sheetsData) {
  const empSheet = sheetsData?.Employees
  if (!empSheet?.rows?.length) return {}

  const profiles = {}
  for (const row of empSheet.rows) {
    const userId = String(row['User ID'] || '').trim()
    if (!userId) continue
    profiles[userId] = {
      userId,
      name:             String(row['Name']             || ''),
      designation:      String(row['Designation']      || ''),
      department:       String(row['Department']       || ''),
      employmentStatus: String(row['Employment Status']|| 'Permanent'),
      joinDate:         String(row['Join Date']        || ''),
      gender:           String(row['Gender']           || ''),
      bloodGroup:       String(row['Blood Group']      || ''),
      phone:            String(row['Phone']            || ''),
      email:            String(row['Email']            || ''),
      address:          String(row['Address']          || ''),
      emergencyName:    String(row['Emergency Name']   || ''),
      emergencyPhone:   String(row['Emergency Phone']  || ''),
      shift:            String(row['Shift']            || ''),
      casualUsed:       Number(row['Casual Used']      || 0),
      sickUsed:         Number(row['Sick Used']        || 0),
      notes:            String(row['Notes']            || ''),
    }
  }
  return profiles
}

export { parseEmployeesFromSheets }
