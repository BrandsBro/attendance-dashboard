'use client'

import { useCallback, useState } from 'react'
import { fetchAllFromSheets }    from '@/lib/googleSheetSync'
import { saveProfiles }          from '@/lib/employeeProfiles'
import { saveLeaveRecords }      from '@/lib/leaveRecords'
import { savePayrollSettings }   from '@/lib/payroll'
import { saveShiftOverrides }    from '@/lib/shiftOverrides'
import { saveCache, saveRawRecords } from '@/lib/storage'
import { calculateStats }        from '@/lib/calculateStats'
import { DEFAULT_LOGIN_TIME, DEFAULT_LOGOUT_TIME } from '@/lib/constants'

function rowsToObj(rows) {
  const out = {}
  for (const r of rows ?? []) out[r['User ID']] = r
  return out
}

export function useSheetsImport(onImportDone) {
  const [status,  setStatus]  = useState('idle')
  const [message, setMessage] = useState('')

  const importFromSheets = useCallback(async () => {
    setStatus('loading')
    setMessage('Fetching from Google Sheets…')
    try {
      const all = await fetchAllFromSheets()

      // ── Employees → profiles ──────────────────────────────
      const empRows = all['Employees']?.rows ?? []
      const profiles = {}
      for (const r of empRows) {
        const id = r['User ID']
        if (!id) continue
        profiles[id] = {
          userId:         id,
          name:           r['Name']           || '',
          designation:    r['Designation']    || '',
          department:     r['Department']     || '',
          employmentType: r['Employment Type']|| 'Full Time',
          joinDate:       r['Join Date']      || '',
          gender:         r['Gender']         || '',
          bloodGroup:     r['Blood Group']    || '',
          phone:          r['Phone']          || '',
          email:          r['Email']          || '',
          address:        r['Address']        || '',
          emergencyName:  r['Emergency Name'] || '',
          emergencyPhone: r['Emergency Phone']|| '',
          shift:          r['Shift']          || '',
          casualUsed:     parseFloat(r['Casual Used']) || 0,
          sickUsed:       parseFloat(r['Sick Used'])   || 0,
          notes:          r['Notes']          || '',
        }
      }
      saveProfiles(profiles)

      // ── Attendance Records → raw records ──────────────────
      const attRows = all['Attendance_Records']?.rows ?? []
      const rawRecords = attRows.map((r, i) => ({
        serialNo:   i,
        userId:     r['User ID']     || '',
        name:       r['Name']        || '',
        department: r['Department']  || '',
        dateTime:   new Date(r['Date/Time']),
        status:     r['Status']      || 'In',
      })).filter(r => r.name && !isNaN(r.dateTime))
      saveRawRecords(rawRecords)

      // ── Schedules ─────────────────────────────────────────
      const schedRows = all['Schedules']?.rows ?? []
      const schedules = {}
      for (const r of schedRows) {
        const id = r['User ID']
        if (!id) continue
        schedules[id] = {
          userId:              id,
          name:                r['Name']                || '',
          scheduledLoginTime:  r['Scheduled Login']     || DEFAULT_LOGIN_TIME,
          scheduledLogoutTime: r['Scheduled Logout']    || DEFAULT_LOGOUT_TIME,
          gracePeriodMinutes:  parseFloat(r['Grace Period (min)']) || 0,
          shift:               r['Shift']               || null,
        }
      }

      // ── Holidays ──────────────────────────────────────────
      const holRows = all['Holidays']?.rows ?? []
      const holidays = holRows.map(r => r['Date']).filter(Boolean)

      // ── Leave Records ─────────────────────────────────────
      const leaveRows = all['Leave_Records']?.rows ?? []
      const leaveRecords = {}
      for (const r of leaveRows) {
        const id = r['User ID']
        if (!id) continue
        if (!leaveRecords[id]) leaveRecords[id] = []
        leaveRecords[id].push({
          id:        r['ID']            || Date.now().toString(),
          type:      r['Type']          || 'casual',
          fromDate:  r['From Date']     || '',
          toDate:    r['To Date']       || '',
          days:      parseFloat(r['Days']) || 0,
          reason:    r['Reason']        || '',
          createdAt: r['Created At']    || '',
        })
      }
      saveLeaveRecords(leaveRecords)

      // ── Payroll Settings ──────────────────────────────────
      const payRows = all['Payroll_Settings']?.rows ?? []
      const payrollSettings = {}
      for (const r of payRows) {
        const id = r['User ID']
        if (!id) continue
        payrollSettings[id] = {
          basicSalary:           parseFloat(r['Basic Salary'])           || 0,
          workingDaysPerMonth:   parseFloat(r['Working Days/Month'])     || 26,
          lateDaysPerDeduction:  parseFloat(r['Late Days Per Deduction'])|| 3,
          overtimeHoursPerDay:   parseFloat(r['OT Hours Per Day'])       || 8,
          currency:              r['Currency'] || 'BDT',
        }
      }
      savePayrollSettings(payrollSettings)

      // ── Shift Overrides ───────────────────────────────────
      const shiftRows = all['Shift_Overrides']?.rows ?? []
      const shiftOverrides = {}
      for (const r of shiftRows) {
        const id = r['User ID']
        if (!id) continue
        if (!shiftOverrides[id]) shiftOverrides[id] = []
        shiftOverrides[id].push({
          id:        r['ID']        || Date.now().toString(),
          fromDate:  r['From Date'] || '',
          toDate:    r['To Date']   || '',
          shift:     r['Shift']     || '',
          login:     r['Login Time']|| '',
          logout:    r['Logout Time']|| '',
          reason:    r['Reason']    || '',
          createdAt: r['Created At']|| '',
        })
      }
      saveShiftOverrides(shiftOverrides)

      // ── Recalculate stats & save cache ────────────────────
      if (rawRecords.length > 0) {
        const summary = calculateStats(rawRecords, schedules, 'sheets', 'Google Sheets', holidays, {})
        saveCache({ summary, schedules, holidays, timeEdits: {} })
      }

      setStatus('ok')
      setMessage(`Imported ${empRows.length} employees, ${attRows.length} attendance records`)
      if (onImportDone) onImportDone()

    } catch(e) {
      setStatus('error')
      setMessage(e.message)
    }
  }, [onImportDone])

  return { importFromSheets, status, message }
}
