import * as XLSX from 'xlsx'

function parseStatus(raw) {
  if (typeof raw !== 'string') return 'In'
  const map = { in: 'In', out: 'Out', break: 'Break' }
  return map[raw.toLowerCase().trim()] ?? 'In'
}

function parseDateTime(raw) {
  if (raw instanceof Date) return raw
  if (typeof raw === 'number') return new Date(Math.round((raw - 25569) * 86400 * 1000))
  return new Date(String(raw))
}

function normaliseRows(rows) {
  return rows.map((row, i) => {
    const userId   = String(row['User ID'] ?? row['UserID'] ?? row['User No.'] ?? '').trim()
    const name     = String(row['Name'] ?? row['Employee'] ?? '').trim()
    const rawDt    = row['Date/Time'] ?? row['DateTime'] ?? row['Time']
    const dateTime = parseDateTime(rawDt)
    if (!name || isNaN(dateTime.getTime())) return null
    return {
      serialNo:   i,
      department: String(row['Department'] ?? '').trim(),
      userId,
      name,
      dateTime,
      status: parseStatus(row['Status'] ?? row['status']),
    }
  }).filter(Boolean)
}

export async function parseFile(file) {
  const buffer = await file.arrayBuffer()
  const wb = XLSX.read(buffer, { type: 'array', cellDates: true })
  const sheet = wb.Sheets[wb.SheetNames[0]]
  const rows = XLSX.utils.sheet_to_json(sheet, { raw: false, dateNF: 'yyyy-mm-dd hh:mm:ss' })
  return normaliseRows(rows)
}

export function parseCsv(csvText) {
  const wb = XLSX.read(csvText, { type: 'string', cellDates: true })
  const sheet = wb.Sheets[wb.SheetNames[0]]
  const rows = XLSX.utils.sheet_to_json(sheet, { raw: false, dateNF: 'yyyy-mm-dd hh:mm:ss' })
  return normaliseRows(rows)
}
