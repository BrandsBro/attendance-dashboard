import { NextResponse } from 'next/server'

export async function POST(req) {
  const { url, action, data } = await req.json()

  const res = await fetch(url, {
    method:  'POST',
    headers: { 'Content-Type': 'application/json' },
    body:    JSON.stringify({ action, data }),
  })

  const text = await res.text()
  let json
  try { json = JSON.parse(text) } catch { json = { error: text } }

  return NextResponse.json(json)
}

export async function GET(req) {
  const { searchParams } = new URL(req.url)
  const url    = searchParams.get('url')
  const action = searchParams.get('action') || 'ping'

  const res  = await fetch(`${url}?action=${action}`)
  const text = await res.text()
  let json
  try { json = JSON.parse(text) } catch { json = { error: text } }

  return NextResponse.json(json)
}
