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
    const { action, data } = await req.json()

    if (action === 'appendRows' && data) {
      const r = await getReq({
        action: 'appendRows',
        data: encodeURIComponent(JSON.stringify(data))
      })
      return NextResponse.json(r)
    }
    if (action === 'syncAll' && data) {
      const results = {}

      for (const [sheetName, payload] of Object.entries(data)) {
        const { headers, rows } = payload
        if (!headers || !rows) continue

        try {
          // Step 1: Clear and write headers only
          await getReq({
            action: 'writeSheet',
            data: encodeURIComponent(JSON.stringify({
              [sheetName]: { headers, rows: [] }
            }))
          })

          // Step 2: Append all rows in batches of 20
          const BATCH = 20
          for (let i = 0; i < rows.length; i += BATCH) {
            const batch = rows.slice(i, i + BATCH)
            await getReq({
              action: 'appendRows',
              data: encodeURIComponent(JSON.stringify({
                [sheetName]: { headers, rows: batch }
              }))
            })
          }

          results[sheetName] = { ok: true, rows: rows.length }
        } catch(e) {
          results[sheetName] = { ok: false, error: e.message }
        }
      }

      return NextResponse.json({ ok: true, results })
    }

    // Other actions
    const r = await getReq({
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
