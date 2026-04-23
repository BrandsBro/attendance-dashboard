import { NextResponse } from 'next/server'

export async function POST(req) {
  const { url, action, data } = await req.json()
  const res = await fetch(url, {
    method:  'POST',
    redirect: 'follow',
    headers: { 'Content-Type': 'application/json' },
    body:    JSON.stringify({ action, data }),
  })
  const text = await res.text()
  try { return NextResponse.json(JSON.parse(text)) }
  catch { return NextResponse.json({ error: text }) }
}

export async function GET(req) {
  const { searchParams } = new URL(req.url)
  const url    = searchParams.get('url')
  const action = searchParams.get('action') || 'ping'
  const sheet  = searchParams.get('sheet')  || ''
  const scriptUrl = sheet
    ? `${url}?action=${action}&sheet=${encodeURIComponent(sheet)}`
    : `${url}?action=${action}`
  const res  = await fetch(scriptUrl, { redirect: 'follow' })
  const text = await res.text()
  try { return NextResponse.json(JSON.parse(text)) }
  catch { return NextResponse.json({ error: text }) }
}
