import { NextResponse } from 'next/server'

const SCRIPT_URL = 'https://script.google.com/macros/s/AKfycbwR5oiVUx6Uv8iVd430mbqbMs9P1uwrfwyGky95pY4QmcA3vd1TiHIE2ylG7x2uyxZu/exec'

export async function POST(req) {
  try {
    const body       = await req.json()
    const { action, data } = body

    // Use GET to avoid POST redirect body loss
    const payload    = encodeURIComponent(JSON.stringify({ data }))
    const url        = `${SCRIPT_URL}?action=${action}&data=${payload}`

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
