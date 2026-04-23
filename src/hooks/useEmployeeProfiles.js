'use client'

import { useState, useEffect, useCallback } from 'react'
import {
  loadProfiles, saveProfiles, deleteProfile,
  loadPhotos, savePhoto, removePhoto,
  loadDropdownOptions, saveDropdownOptions,
} from '@/lib/employeeProfiles'
import { syncEmployees } from '@/lib/googleSheetSync'
import { fetchAllFromSheets } from '@/lib/googleSheetSync'
import { parseEmployeesFromSheets } from '@/hooks/useSheetsData'

export const DEFAULT_DESIGNATIONS = [
  'Manager','Senior Manager','Senior Executive','Executive',
  'Assistant','Team Lead','Developer','Designer',
  'Accountant','HR Executive','Operations','Intern',
]
export const DEFAULT_DEPARTMENTS = [
  'Management','Operations','Finance','HR',
  'Technology','Design','Marketing','Sales','Support',
]
export const DEFAULT_SHIFTS = [
  '9 AM - 6 PM','10 AM - 7 PM','12 PM - 8 PM','2 PM - 10 PM','5 PM - 10 PM',
]
export const EMPLOYMENT_STATUSES = ['Permanent','Probation']
export const GENDERS              = ['Male','Female','Other','Prefer not to say']
export const BLOOD_GROUPS         = ['A+','A-','B+','B-','AB+','AB-','O+','O-']

export function useEmployeeProfiles() {
  const [profiles, setProfiles] = useState({})
  const [photos,   setPhotos]   = useState({})
  const [options,  setOptions]  = useState({
    designations: DEFAULT_DESIGNATIONS,
    departments:  DEFAULT_DEPARTMENTS,
    shifts:       DEFAULT_SHIFTS,
  })
  const [syncing, setSyncing] = useState(false)

  useEffect(() => {
    setPhotos(loadPhotos())
    const opts = loadDropdownOptions()
    setOptions({
      designations: opts.designations ?? DEFAULT_DESIGNATIONS,
      departments:  opts.departments  ?? DEFAULT_DEPARTMENTS,
      shifts:       opts.shifts       ?? DEFAULT_SHIFTS,
    })

    // Always fetch from Sheets — Sheets is the master
    fetchAllFromSheets()
      .then(sheetsData => {
        const fromSheets = parseEmployeesFromSheets(sheetsData)
        // Replace localStorage with Sheets data
        saveProfiles(fromSheets)
        setProfiles(fromSheets)
        console.log('Loaded', Object.keys(fromSheets).length, 'employees from Sheets')
      })
      .catch(e => {
        console.warn('Could not fetch from Sheets — falling back to localStorage:', e.message)
        const local = loadProfiles()
        const normalised = {}
        for (const [k, v] of Object.entries(local)) {
          const id = String(k)
          normalised[id] = { ...v, userId: id }
        }
        setProfiles(normalised)
      })
  }, [])

  // Push to Sheets immediately on every change
  async function pushToSheets(updatedProfiles) {
    try {
      console.log('🔄 Pushing to Sheets:', Object.keys(updatedProfiles).length, 'employees')
      const result = await syncEmployees(updatedProfiles)
      console.log('✅ Push result:', result)
    } catch(e) {
      console.error('❌ Sheets push failed:', e.message)
    }
  }

  const addEmployee = useCallback((data) => {
    setProfiles(prev => {
      const id   = String(data.userId)
      const profile = {
        userId:           id,
        name:             data.name             || '',
        department:       data.department       || '',
        designation:      data.designation      || '',
        employmentStatus: data.employmentStatus || 'Permanent',
        joinDate:         data.joinDate         || '',
        gender:           data.gender           || '',
        bloodGroup:       data.bloodGroup       || '',
        phone:            data.phone            || '',
        email:            data.email            || '',
        address:          data.address          || '',
        emergencyName:    data.emergencyName    || '',
        emergencyPhone:   data.emergencyPhone   || '',
        shift:            data.shift            || '',
        casualUsed:       0,
        sickUsed:         0,
        notes:            data.notes            || '',
      }
      const next = { ...prev, [id]: profile }
      saveProfiles(next)
      pushToSheets(next)
      return next
    })
  }, [])

  const updateProfile = useCallback((userId, data) => {
    const id = String(userId)
    setProfiles(prev => {
      const next = { ...prev, [id]: { ...prev[id], ...data, userId: id } }
      saveProfiles(next)
      pushToSheets(next)
      return next
    })
  }, [])

  const removeEmployee = useCallback((userId) => {
    const id = String(userId)
    setProfiles(prev => {
      const next = { ...prev }
      delete next[id]
      saveProfiles(next)
      pushToSheets(next)
      return next
    })
    deleteProfile(id)
    removePhoto(id)
  }, [])

  const uploadPhoto = useCallback((userId, file) => {
    const reader = new FileReader()
    reader.onload = e => {
      savePhoto(String(userId), e.target.result)
      setPhotos(prev => ({ ...prev, [String(userId)]: e.target.result }))
    }
    reader.readAsDataURL(file)
  }, [])

  const deletePhoto = useCallback((userId) => {
    removePhoto(String(userId))
    setPhotos(prev => { const n = { ...prev }; delete n[String(userId)]; return n })
  }, [])

  const addLeave = useCallback((userId, type, days) => {
    const id = String(userId)
    setProfiles(prev => {
      const key  = type === 'casual' ? 'casualUsed' : 'sickUsed'
      const next = { ...prev, [id]: { ...prev[id], [key]: ((prev[id]?.[key]) ?? 0) + days } }
      saveProfiles(next)
      pushToSheets(next)
      return next
    })
  }, [])

  const removeLeave = useCallback((userId, type, days) => {
    const id = String(userId)
    setProfiles(prev => {
      const key  = type === 'casual' ? 'casualUsed' : 'sickUsed'
      const cur  = prev[id]?.[key] ?? 0
      const next = { ...prev, [id]: { ...prev[id], [key]: Math.max(0, cur - days) } }
      saveProfiles(next)
      pushToSheets(next)
      return next
    })
  }, [])

  const addOption = useCallback((field, value) => {
    setOptions(prev => {
      const next = { ...prev, [field]: [...(prev[field] ?? []), value] }
      saveDropdownOptions(next)
      return next
    })
  }, [])

  const removeOption = useCallback((field, value) => {
    setOptions(prev => {
      const next = { ...prev, [field]: (prev[field] ?? []).filter(v => v !== value) }
      saveDropdownOptions(next)
      return next
    })
  }, [])

  return {
    profiles, photos, options, syncing,
    addEmployee, updateProfile, removeEmployee,
    uploadPhoto, deletePhoto,
    addLeave, removeLeave,
    addOption, removeOption,
  }
}
