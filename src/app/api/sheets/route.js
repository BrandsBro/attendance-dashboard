import { NextResponse } from 'next/server'

const SCRIPT_URL = 'https://script.google.com/macros/s/AKfycbwR5oiVUx6Uv8iVd430mbqbMs9P1uwrfwyGky95pY4QmcA3vd1TiHIE2ylG7x2uyxZu/exec'

export async function POST(req) {
  try {
    const { action, data } = await req.json()

    // Step 1 - get the redirect URL without sending body
    const res1 = await fetch(SCRIPT_URL, {
      method:  'POST',
      redirect: 'manual',
      headers: { 'Content-Type': 'application/json' },
      body:    JSON.stringify({ action, data }),
    })

    let finalUrl = SCRIPT_URL

    // Step 2 - if redirected, use the redirect URL
    if ([301,302,303,307,308].includes(res1.status)) {
      const location = res1.headers.get('location')
      if (location) finalUrl = location
    }

    // Step 3 - POST with body to final URL
    const res2 = await fetch(finalUrl, {
      method:  'POST',
      redirect: 'follow',
      headers: { 'Content-Type': 'application/json' },
      body:    JSON.stringify({ action, data }),
    })

    const text = await res2.text()
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
