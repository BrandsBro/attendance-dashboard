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

export function calculateStats(records, schedules, source, sourceLabel) {
  const byEmployee = new Map()
  for (const r of records) {
    const key = r.userId || r.name
    if (!byEmployee.has(key)) byEmployee.set(key, [])
    byEmployee.get(key).push(r)
  }

  const employees = []
  let globalMin = new Date(8640000000000000)
  let globalMax = new Date(-8640000000000000)

  for (const [userId, empRecords] of byEmployee) {
    const sample   = empRecords[0]
    const schedule = schedules[userId] ?? schedules[sample.name] ?? null
    const loginMin  = schedule ? scheduleMinutes(schedule.scheduledLoginTime)  : null
    const logoutMin = schedule ? scheduleMinutes(schedule.scheduledLogoutTime) : null

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

    for (const [date, dayRecs] of [...byDay.entries()].sort()) {
      const ins  = dayRecs.filter(r => r.status === 'In').sort((a, b) => +a.dateTime - +b.dateTime)
      const outs = dayRecs.filter(r => r.status === 'Out').sort((a, b) => +a.dateTime - +b.dateTime)
      const inTime  = ins[0]?.dateTime  ?? null
      const outTime = outs[outs.length - 1]?.dateTime ?? null

      let presenceMinutes = 0
      if (inTime && outTime && outTime > inTime)
        presenceMinutes = Math.round((+outTime - +inTime) / 60000)

      let lateMinutes = 0
      if (inTime && loginMin !== null) {
        const diff = toMinutes(inTime) - loginMin
        if (diff > 0) lateMinutes = diff
      }

      let overtimeMinutes = 0
      if (outTime && logoutMin !== null) {
        const diff = toMinutes(outTime) - (logoutMin + OVERTIME_BUFFER_MINUTES)
        if (diff > 0) overtimeMinutes = diff
      }

      days.push({ date, inTime, outTime, presenceMinutes, lateMinutes, overtimeMinutes })
      totalPresence += presenceMinutes
      totalLate     += lateMinutes
      totalOvertime += overtimeMinutes
    }

    employees.push({
      userId,
      name:       sample.name,
      department: sample.department,
      totalPresenceMinutes:  totalPresence,
      totalLateMinutes:      totalLate,
      totalOvertimeMinutes:  totalOvertime,
      workingDays: days.filter(d => d.inTime !== null).length,
      days,
    })
  }

  return {
    employees: employees.sort((a, b) => a.name.localeCompare(b.name)),
    processedAt: new Date().toISOString(),
    dateRange: {
      from: globalMin.toISOString().slice(0, 10),
      to:   globalMax.toISOString().slice(0, 10),
    },
    source,
    sourceLabel,
  }
}

export function fmtMinutes(minutes) {
  if (!minutes || minutes <= 0) return '0h 0m'
  const h = Math.floor(minutes / 60)
  const m = minutes % 60
  return h > 0 ? `${h}h ${m}m` : `${m}m`
}

export function fmtTime(date) {
  if (!date) return '—'
  return new Date(date).toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' })
}
