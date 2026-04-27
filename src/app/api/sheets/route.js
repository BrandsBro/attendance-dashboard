import { NextResponse } from 'next/server'

const SCRIPT_URL = 'https://script.google.com/macros/s/AKfycbwR5oiVUx6Uv8iVd430mbqbMs9P1uwrfwyGky95pY4QmcA3vd1TiHIE2ylG7x2uyxZu/exec'
const CHUNK_SIZE = 50

async function getRequest(params) {
  const url = SCRIPT_URL + '?' + new URLSearchParams(params).toString()
  const res  = await fetch(url, { redirect: 'follow' })
  const text = await res.text()
  try { return JSON.parse(text) }
  catch { return { error: text } }
}

export async function POST(req) {
  try {
    const { action, data } = await req.json()

    if (action === 'syncAll' && data) {
      const results = {}

      for (const [sheetName, payload] of Object.entries(data)) {
        const { headers, rows } = payload

        if (!headers || !rows) continue

        try {
          if (rows.length === 0) {
            // Just write headers
            const r = await getRequest({
              action: 'syncAll',
              data: encodeURIComponent(JSON.stringify({ [sheetName]: { headers, rows: [] } }))
            })
            results[sheetName] = r
            continue
          }

          // First chunk — full write (clears sheet + writes headers + first rows)
          const firstChunk = rows.slice(0, CHUNK_SIZE)
          await getRequest({
            action: 'syncAll',
            data: encodeURIComponent(JSON.stringify({ [sheetName]: { headers, rows: firstChunk } }))
          })

          // Remaining chunks — append
          for (let i = CHUNK_SIZE; i < rows.length; i += CHUNK_SIZE) {
            const chunk = rows.slice(i, i + CHUNK_SIZE)
            await getRequest({
              action: 'appendRows',
              data: encodeURIComponent(JSON.stringify({ [sheetName]: { headers, rows: chunk } }))
            })
          }

          results[sheetName] = { ok: true, rows: rows.length }
        } catch(e) {
          results[sheetName] = { ok: false, error: e.message }
        }
      }

      return NextResponse.json({ ok: true, results })
    }

    // Single sheet sync
    const r = await getRequest({
      action,
      data: encodeURIComponent(JSON.stringify(data))
    })
    return NextResponse.json(r)

  } catch(e) {
    return NextResponse.json({ error: e.message }, { status: 500 })
  }
}

export async function GET(req) {
  try {
    const { searchParams } = new URL(req.url)
    const action = searchParams.get('action') || 'ping'
    const sheet  = searchParams.get('sheet')  || ''
    const scriptUrl = sheet
      ? `${SCRIPT_URL}?action=${action}&sheet=${encodeURIComponent(sheet)}`
      : `${SCRIPT_URL}?action=${action}`
    const res  = await fetch(scriptUrl, { redirect: 'follow' })
    const text = await res.text()
    try { return NextResponse.json(JSON.parse(text)) }
    catch { return NextResponse.json({ error: text }) }
  } catch(e) {
    return NextResponse.json({ error: e.message }, { status: 500 })
  }
}
