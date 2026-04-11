'use client'

import { useState, useEffect, useCallback } from 'react'
import { loadProfiles, saveProfiles, loadPhotos, savePhoto, removePhoto } from '@/lib/employeeProfiles'

export const DESIGNATIONS = [
  'Manager','Senior Manager','Senior Executive','Executive',
  'Assistant','Team Lead','Developer','Designer',
  'Accountant','HR Executive','Operations','Intern',
]

export const DEPARTMENTS = [
  'Management','Operations','Finance','HR',
  'Technology','Design','Marketing','Sales','Support',
]

export const EMPLOYMENT_TYPES = ['Full Time','Part Time','Contract','Intern']
export const GENDERS           = ['Male','Female','Other','Prefer not to say']
export const BLOOD_GROUPS      = ['A+','A-','B+','B-','AB+','AB-','O+','O-']

export function useEmployeeProfiles(summaryEmployees = []) {
  const [profiles, setProfiles] = useState({})
  const [photos,   setPhotos]   = useState({})

  useEffect(() => {
    const saved  = loadProfiles()
    const pics   = loadPhotos()
    const merged = { ...saved }
    for (const emp of summaryEmployees) {
      if (!merged[emp.userId]) {
        merged[emp.userId] = createDefault(emp)
      }
    }
    setProfiles(merged)
    setPhotos(pics)
    saveProfiles(merged)
  }, [summaryEmployees.length])

  function createDefault(emp) {
    return {
      userId:         emp.userId,
      name:           emp.name,
      department:     emp.department ?? '',
      designation:    '',
      employmentType: 'Full Time',
      joinDate:       '',
      gender:         '',
      bloodGroup:     '',
      phone:          '',
      email:          '',
      address:        '',
      emergencyName:  '',
      emergencyPhone: '',
      shift:          emp.shift ?? '',
      casualUsed:     0,
      sickUsed:       0,
      notes:          '',
    }
  }

  const updateProfile = useCallback((userId, data) => {
    setProfiles(prev => {
      const next = { ...prev, [userId]: { ...prev[userId], ...data } }
      saveProfiles(next)
      return next
    })
  }, [])

  const uploadPhoto = useCallback((userId, file) => {
    const reader = new FileReader()
    reader.onload = e => {
      const b64 = e.target.result
      savePhoto(userId, b64)
      setPhotos(prev => ({ ...prev, [userId]: b64 }))
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

  return {
    profiles, photos,
    updateProfile, uploadPhoto, deletePhoto,
    addLeave, removeLeave,
  }
}
