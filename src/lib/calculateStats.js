import { OVERTIME_BUFFER_MINUTES } from './constants'

function toMinutes(date) {
  return date.getHours() * 60 + date.getMinutes()
}
function scheduleMinutes(timeStr) {
  const [h, m] = timeStr.split(':').map(Number)
  return h * 60 + m
}
function toDateKey(date) {
  return date.toISOString().slice(0, 10)
}

export function calculateStats(records, schedules, source, sourceLabel, holidays = [], timeEdits = {}) {
  const holidaySet = new Set(holidays)
  const byEmployee = new Map()

  for (const r of records) {
    const key = r.userId || r.name
    if (!byEmployee.has(key)) byEmployee.set(key, [])
    byEmployee.get(key).push(r)
    // track global date range
  }

  const employees = []
  let globalMin = new Date(8640000000000000)
  let globalMax = new Date(-8640000000000000)

  for (const [userId, empRecords] of byEmployee) {
    const sample = empRecords[0]
    const schedule = schedules[userId] ?? schedules[sample.name] ?? null
    const defaultLoginMin = schedule ? scheduleMinutes(schedule.scheduledLoginTime) : null
    const defaultLogoutMin = schedule ? scheduleMinutes(schedule.scheduledLogoutTime) : null
    const grace = schedule?.gracePeriodMinutes ?? 0
    const empEdits = timeEdits[userId] ?? {}
    const dayOverrides = schedule?.dayOverrides ?? {}   // { "2025-01-15": { login: "14:00", logout: "22:00" } }

    const byDay = new Map()
    for (const r of empRecords) {
      const day = toDateKey(r.dateTime)
      if (!byDay.has(day)) byDay.set(day, [])
      byDay.get(day).push(r)
      if (r.dateTime < globalMin) globalMin = r.dateTime
      if (r.dateTime > globalMax) globalMax = r.dateTime
    }

    const days = []
    let totalPresence = 0, totalLate = 0, totalOvertime = 0
    let lateDays = 0, overtimeDays = 0

    for (const [date, dayRecs] of [...byDay.entries()].sort()) {
      const dayOfWeek = new Date(date + 'T12:00:00').getDay()
      const isWeekend = dayOfWeek === 0   // Sunday only
      const isHoliday = holidaySet.has(date)
      const edit = empEdits[date] ?? {}

      // Determine effective login/logout minutes for this day (override if exists)
      const override = dayOverrides[date]
      let loginMin = defaultLoginMin
      let logoutMin = defaultLogoutMin
      if (override) {
        if (override.login) loginMin = scheduleMinutes(override.login)
        if (override.logout) logoutMin = scheduleMinutes(override.logout)
      }

      const sorted = [...dayRecs].sort((a, b) => +a.dateTime - +b.dateTime)
      const firstIn = sorted.find(r => r.status === 'In') ?? null
      const outs = sorted.filter(r => r.status === 'Out')
      const lastOut = outs.length > 0 ? outs[outs.length - 1] : null

      const inTime = edit.in ? new Date(edit.in) : (firstIn ? firstIn.dateTime : null)
      const outTime = edit.out ? new Date(edit.out) : (lastOut ? lastOut.dateTime : null)

      let presenceMinutes = 0
      if (inTime && outTime && outTime > inTime)
        presenceMinutes = Math.round((+outTime - +inTime) / 60000)

      let lateMinutes = 0
      if (!isWeekend && !isHoliday && inTime && loginMin !== null) {
        const diff = toMinutes(inTime) - loginMin - grace
        if (diff > 0) { lateMinutes = diff; lateDays++ }
      }

      let overtimeMinutes = 0
      if (!isWeekend && !isHoliday && outTime && logoutMin !== null) {
        const minsAfter = toMinutes(outTime) - logoutMin
        // OT rule: <30min=0, 30-59min=OT-30, >=60min=full OT
        if (minsAfter >= 60) {
          overtimeMinutes = minsAfter
          overtimeDays++
        } else if (minsAfter >= OVERTIME_BUFFER_MINUTES) {
          overtimeMinutes = minsAfter - OVERTIME_BUFFER_MINUTES
          overtimeDays++
        }
      }

      days.push({
        date, inTime, outTime,
        isWeekend, isHoliday,
        presenceMinutes, lateMinutes, overtimeMinutes,
        manualOut: !!edit.out,
        manualIn: !!edit.in,
        shiftOverride: !!override,
        effectiveLogin: override?.login || schedule?.scheduledLoginTime,
        effectiveLogout: override?.logout || schedule?.scheduledLogoutTime,
      })

      totalPresence += presenceMinutes
      totalLate += lateMinutes
      totalOvertime += overtimeMinutes
    }

    employees.push({
      userId,
      name: sample.name,
      department: sample.department,
      shift: schedule?.shift ?? null,
      totalPresenceMinutes: totalPresence,
      totalLateMinutes: totalLate,
      totalOvertimeMinutes: totalOvertime,
      lateDays, overtimeDays,
      workingDays: days.filter(d => d.inTime && !d.isWeekend && !d.isHoliday).length,
      days,
    })
  }

  return {
    employees: employees.sort((a, b) => a.name.localeCompare(b.name)),
    processedAt: new Date().toISOString(),
    dateRange: {
      from: globalMin.toISOString().slice(0, 10),
      to: globalMax.toISOString().slice(0, 10),
    },
    source, sourceLabel,
  }
}

export function fmtMinutes(minutes) {
  if (!minutes || minutes <= 0) return '—'
  const h = Math.floor(minutes / 60)
  const m = minutes % 60
  return h > 0 ? `${h}h ${m}m` : `${m}m`
}

export function fmt12h(date) {
  if (!date) return '—'
  return new Date(date).toLocaleTimeString('en-US', {
    hour: 'numeric', minute: '2-digit', hour12: true,
  })
}