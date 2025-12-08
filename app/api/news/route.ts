import { NextResponse } from "next/server"

const url = "https://site.api.espn.com/apis/site/v2/sports/basketball/nba/news"

export const revalidate = 300

export async function GET() {
  try {
    const res = await fetch(url, { next: { revalidate } })
    if (!res.ok) return NextResponse.json({ error: "upstream" }, { status: 502 })
    const data = await res.json()
    return NextResponse.json(data)
  } catch (e) {
    return NextResponse.json({ error: "failed" }, { status: 502 })
  }
}
