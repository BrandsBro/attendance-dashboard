export function toExportUrl(rawUrl) {
  const idMatch = rawUrl.match(/\/spreadsheets\/d\/([a-zA-Z0-9_-]+)/)
  if (!idMatch) throw new Error('Could not extract spreadsheet ID from URL.')
  const id = idMatch[1]
  const gidMatch = rawUrl.match(/[?&]gid=(\d+)/)
  const gid = gidMatch ? gidMatch[1] : '0'
  return `https://docs.google.com/spreadsheets/d/${id}/export?format=csv&gid=${gid}`
}

export async function fetchSheetCsv(sheetsUrl) {
  const exportUrl = toExportUrl(sheetsUrl)
  const res = await fetch(`/api/fetch-sheet?url=${encodeURIComponent(exportUrl)}`)
  if (!res.ok) throw new Error(`Failed to fetch sheet: ${await res.text().catch(() => res.statusText)}`)
  return res.text()
}

export function isValidSheetsUrl(url) {
  return url.includes('docs.google.com/spreadsheets')
}
