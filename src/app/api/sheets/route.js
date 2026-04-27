import { NextResponse } from 'next/server'

const SCRIPT_URL = 'https://script.google.com/macros/s/AKfycbwR5oiVUx6Uv8iVd430mbqbMs9P1uwrfwyGky95pY4QmcA3vd1TiHIE2ylG7x2uyxZu/exec'

async function getRequest(params) {
  const url  = SCRIPT_URL + '?' + new URLSearchParams(params).toString()
  const res  = await fetch(url, { redirect: 'follow' })
  const text = await res.text()
  try { return JSON.parse(text) } catch { return { error: text } }
}

async function postRequest(body) {
  // Step 1 - get redirect URL
  const res1 = await fetch(SCRIPT_URL, {
    method: 'POST',
    redirect: 'manual',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  })
  
  let targetUrl = SCRIPT_URL
  if ([301,302,303,307,308].includes(res1.status)) {
    const loc = res1.headers.get('location')
    if (loc) targetUrl = loc
  }

  // Step 2 - POST to final URL
  const res2 = await fetch(targetUrl, {
    method: 'POST',
    redirect: 'follow',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  })
  const text = await res2.text()
  try { return JSON.parse(text) } catch { return { error: text } }
}

export async function POST(req) {
  try {
    const { action, data } = await req.json()

    if (action === 'syncAll' && data) {
      const results = {}
      const CHUNK   = 100

      for (const [sheetName, payload] of Object.entries(data)) {
        const { headers, rows } = payload
        if (!headers || !rows) continue

        try {
          // First chunk via GET (creates sheet with headers)
          const firstChunk = rows.slice(0, CHUNK)
          await getRequest({
            action: 'syncAll',
            data: encodeURIComponent(JSON.stringify({
              [sheetName]: { headers, rows: firstChunk }
            }))
          })

          // Remaining chunks via GET append
          for (let i = CHUNK; i < rows.length; i += CHUNK) {
            const chunk = rows.slice(i, i + CHUNK)
            await getRequest({
              action: 'appendRows',
              data: encodeURIComponent(JSON.stringify({
                [sheetName]: { headers, rows: chunk }
              }))
            })
          }

          results[sheetName] = { ok: true, rows: rows.length, chunks: Math.ceil(rows.length / CHUNK) }
        } catch(e) {
          results[sheetName] = { ok: false, error: e.message }
        }
      }

      return NextResponse.json({ ok: true, results })
    }

    // Single sheet — use GET
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
