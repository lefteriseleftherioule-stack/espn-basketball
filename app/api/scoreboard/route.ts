import { NextResponse } from "next/server"

const url = "https://site.api.espn.com/apis/site/v2/sports/basketball/nba/scoreboard"

export const revalidate = 60

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url)
    const date = searchParams.get("date") || ""
    const fullUrl = date ? `${url}?dates=${date}` : url
    const res = await fetch(fullUrl, { next: { revalidate } })
    if (!res.ok) return NextResponse.json({ error: "upstream" }, { status: 502 })
    const data = await res.json()
    return NextResponse.json(data)
  } catch (e) {
    return NextResponse.json({ error: "failed" }, { status: 502 })
  }
}
