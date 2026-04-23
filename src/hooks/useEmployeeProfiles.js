'use client'

import { useState, useEffect, useCallback } from 'react'
import {
  loadProfiles, saveProfiles, deleteProfile,
  loadPhotos, savePhoto, removePhoto,
  loadDropdownOptions, saveDropdownOptions,
} from '@/lib/employeeProfiles'

export const DEFAULT_DESIGNATIONS = [
  'Manager','Senior Manager','Senior Executive','Executive',
  'Assistant','Team Lead','Developer','Designer',
  'Accountant','HR Executive','Operations','Intern',
]
export const DEFAULT_DEPARTMENTS = [
  'Management','Operations','Finance','HR',
  'Technology','Design','Marketing','Sales','Support',
]
export const EMPLOYMENT_TYPES = ['Full Time','Part Time','Contract','Intern']
export const GENDERS           = ['Male','Female','Other','Prefer not to say']
export const BLOOD_GROUPS      = ['A+','A-','B+','B-','AB+','AB-','O+','O-']

export function useEmployeeProfiles(summaryEmployees = []) {
  const [profiles, setProfiles] = useState({})
  const [photos,   setPhotos]   = useState({})
  const [options,  setOptions]  = useState({
    designations: DEFAULT_DESIGNATIONS,
    departments:  DEFAULT_DEPARTMENTS,
  })

  useEffect(() => {
    const saved = loadProfiles()
    const pics  = loadPhotos()
    const opts  = loadDropdownOptions()
    const merged = { ...saved }
    for (const emp of summaryEmployees) {
      if (!merged[emp.userId]) merged[emp.userId] = makeDefault(emp)
    }
    setProfiles(merged)
    setPhotos(pics)
    setOptions({
      designations: opts.designations ?? DEFAULT_DESIGNATIONS,
      departments:  opts.departments  ?? DEFAULT_DEPARTMENTS,
    })
    saveProfiles(merged)
  }, [summaryEmployees.length])

  function makeDefault(emp) {
    return {
      userId: emp.userId, name: emp.name,
      department: emp.department ?? '', designation: '',
      employmentType: 'Full Time', joinDate: '',
      gender: '', bloodGroup: '', phone: '', email: '',
      address: '', emergencyName: '', emergencyPhone: '',
      shift: emp.shift ?? '', casualUsed: 0, sickUsed: 0, notes: '',
    }
  }

  const addEmployee = useCallback((data) => {
    setProfiles(prev => {
      const next = { ...prev, [data.userId]: { ...makeDefault({ userId: data.userId, name: data.name }), ...data } }
      saveProfiles(next)
      return next
    })
  }, [])

  const updateProfile = useCallback((userId, data) => {
    setProfiles(prev => {
      const next = { ...prev, [userId]: { ...prev[userId], ...data } }
      saveProfiles(next)
      return next
    })
  }, [])

  const removeEmployee = useCallback((userId) => {
    setProfiles(prev => {
      const next = { ...prev }
      delete next[userId]
      saveProfiles(next)
      return next
    })
    deleteProfile(userId)
    removePhoto(userId)
  }, [])

  const uploadPhoto = useCallback((userId, file) => {
    const reader = new FileReader()
    reader.onload = e => {
      savePhoto(userId, e.target.result)
      setPhotos(prev => ({ ...prev, [userId]: e.target.result }))
    }
    reader.readAsDataURL(file)
  }, [])

  const deletePhoto = useCallback((userId) => {
    removePhoto(userId)
    setPhotos(prev => { const n = { ...prev }; delete n[userId]; return n })
  }, [])

  const addLeave = useCallback((userId, type, days) => {
    setProfiles(prev => {
      const key  = type === 'casual' ? 'casualUsed' : 'sickUsed'
      const next = { ...prev, [userId]: { ...prev[userId], [key]: ((prev[userId]?.[key]) ?? 0) + days } }
      saveProfiles(next)
      return next
    })
  }, [])

  const removeLeave = useCallback((userId, type, days) => {
    setProfiles(prev => {
      const key  = type === 'casual' ? 'casualUsed' : 'sickUsed'
      const cur  = prev[userId]?.[key] ?? 0
      const next = { ...prev, [userId]: { ...prev[userId], [key]: Math.max(0, cur - days) } }
      saveProfiles(next)
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
    profiles, photos, options,
    addEmployee, updateProfile, removeEmployee,
    uploadPhoto, deletePhoto,
    addLeave, removeLeave,
    addOption, removeOption,
  }
}
