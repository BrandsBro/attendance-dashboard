import { NextResponse } from 'next/server'

const SCRIPT_URL = 'https://script.google.com/macros/s/AKfycbwR5oiVUx6Uv8iVd430mbqbMs9P1uwrfwyGky95pY4QmcA3vd1TiHIE2ylG7x2uyxZu/exec'

export async function POST(req) {
  try {
    const { action, data } = await req.json()

    if (action === 'syncAll' && data) {
      const results = {}
      for (const [sheetName, payload] of Object.entries(data)) {
        const chunkPayload = { [sheetName]: payload }
        const url = `${SCRIPT_URL}?action=syncAll&data=${encodeURIComponent(JSON.stringify(chunkPayload))}`
        try {
          const res  = await fetch(url, { redirect: 'follow' })
          const text = await res.text()
          const json = JSON.parse(text)
          results[sheetName] = json.results?.[sheetName] ?? json
        } catch(e) {
          results[sheetName] = { ok: false, error: e.message }
        }
      }
      return NextResponse.json({ ok: true, results })
    }

    const url = `${SCRIPT_URL}?action=${action}&data=${encodeURIComponent(JSON.stringify(data))}`
    const res  = await fetch(url, { redirect: 'follow' })
    const text = await res.text()
    try { return NextResponse.json(JSON.parse(text)) }
    catch { return NextResponse.json({ error: text }) }

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
