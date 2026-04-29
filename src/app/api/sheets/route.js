import { NextResponse } from 'next/server'

const SCRIPT_URL = 'https://script.google.com/macros/s/AKfycbwR5oiVUx6Uv8iVd430mbqbMs9P1uwrfwyGky95pY4QmcA3vd1TiHIE2ylG7x2uyxZu/exec'

async function getReq(params) {
  const url  = SCRIPT_URL + '?' + new URLSearchParams(params).toString()
  const res  = await fetch(url, { redirect: 'follow' })
  const text = await res.text()
  try { return JSON.parse(text) } catch { return { error: text } }
}

export async function POST(req) {
  try {
    const body   = await req.json()
    const action = body.action
    const data   = body.data

    if (action === 'syncAll' && data) {
      const results = {}
      const CHUNK   = 100
      for (const [sheetName, payload] of Object.entries(data)) {
        const { headers, rows } = payload
        if (!headers || !rows) continue
        try {
          const firstChunk = rows.slice(0, CHUNK)
          await getReq({ action: 'writeSheet', data: encodeURIComponent(JSON.stringify({ [sheetName]: { headers, rows: firstChunk } })) })
          for (let i = CHUNK; i < rows.length; i += CHUNK) {
            await getReq({ action: 'appendRows', data: encodeURIComponent(JSON.stringify({ [sheetName]: { headers, rows: rows.slice(i, i+CHUNK) } })) })
          }
          results[sheetName] = { ok: true, rows: rows.length }
        } catch(e) { results[sheetName] = { ok: false, error: e.message } }
      }
      return NextResponse.json({ ok: true, results })
    }

    if (action === 'appendRows' && data) {
      const r = await getReq({ action: 'appendRows', data: encodeURIComponent(JSON.stringify(data)) })
      return NextResponse.json(r)
    }

    if (action === 'writeSheet' && data) {
      const r = await getReq({ action: 'writeSheet', data: encodeURIComponent(JSON.stringify(data)) })
      return NextResponse.json(r)
    }

    if (action === 'updateRow') {
      const r = await getReq({
        action:      'updateRow',
        sheet:       body.sheet,
        keyColumn:   body.keyColumn,
        keyValue:    body.keyValue,
        dateColumn:  body.dateColumn,
        dateValue:   body.dateValue,
        data:        encodeURIComponent(JSON.stringify(body.row))
      })
      return NextResponse.json(r)
    }

    const r = await getReq({ action, data: encodeURIComponent(JSON.stringify(data)) })
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
    const url    = sheet
      ? `${SCRIPT_URL}?action=${action}&sheet=${encodeURIComponent(sheet)}`
      : `${SCRIPT_URL}?action=${action}`
    const res  = await fetch(url, { redirect: 'follow' })
    const text = await res.text()
    try { return NextResponse.json(JSON.parse(text)) }
    catch { return NextResponse.json({ error: text }) }
  } catch(e) {
    return NextResponse.json({ error: e.message }, { status: 500 })
  }
}
