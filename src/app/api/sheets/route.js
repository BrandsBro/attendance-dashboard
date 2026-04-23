import { NextResponse } from 'next/server'

export async function POST(req) {
  const { url, action, data } = await req.json()
  const body = JSON.stringify({ action, data })

  // First request — get redirect URL
  const res1 = await fetch(url, {
    method:   'POST',
    redirect: 'manual',
    headers:  { 'Content-Type': 'application/json' },
    body,
  })

  // If redirected, follow with POST and body
  if (res1.status === 301 || res1.status === 302 || res1.status === 307 || res1.status === 308) {
    const redirectUrl = res1.headers.get('location')
    if (redirectUrl) {
      const res2 = await fetch(redirectUrl, {
        method:   'POST',
        redirect: 'follow',
        headers:  { 'Content-Type': 'application/json' },
        body,
      })
      const text = await res2.text()
      try { return NextResponse.json(JSON.parse(text)) }
      catch { return NextResponse.json({ error: text }) }
    }
  }

  const text = await res1.text()
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
