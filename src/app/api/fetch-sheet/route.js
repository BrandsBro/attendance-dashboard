import { NextResponse } from 'next/server'

export async function GET(req) {
  const url = req.nextUrl.searchParams.get('url')

  if (!url || !url.startsWith('https://docs.google.com/spreadsheets')) {
    return NextResponse.json({ error: 'Invalid URL' }, { status: 400 })
  }

  try {
    const res = await fetch(url, {
      headers: { Accept: 'text/csv' },
      next: { revalidate: 300 },
    })
    if (!res.ok) return NextResponse.json({ error: `Upstream error: ${res.status}` }, { status: res.status })
    const csv = await res.text()
    return new NextResponse(csv, { status: 200, headers: { 'Content-Type': 'text/csv' } })
  } catch (e) {
    return NextResponse.json({ error: String(e) }, { status: 500 })
  }
}
