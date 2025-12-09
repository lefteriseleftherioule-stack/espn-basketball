import { NextResponse } from "next/server"

const url = "https://site.api.espn.com/apis/site/v2/sports/basketball/nba/news"

export const revalidate = 300

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url)
    const team = searchParams.get("team") || ""
    const fullUrl = team ? `https://site.api.espn.com/apis/site/v2/sports/basketball/nba/teams/${team}/news` : url
    const res = await fetch(fullUrl, { next: { revalidate } })
    if (!res.ok) return NextResponse.json({ error: "upstream" }, { status: 502 })
    const data = await res.json()
    return NextResponse.json(data)
  } catch (e) {
    return NextResponse.json({ error: "failed" }, { status: 502 })
  }
}
