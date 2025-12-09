import { NextResponse } from "next/server"

export const revalidate = 300

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url)
    const league = (searchParams.get("league") || "nba").toLowerCase()
    const team = searchParams.get("team") || ""
    const limit = searchParams.get("limit") || ""
    const allowed = new Set(["nba", "wnba", "mens-college-basketball", "womens-college-basketball"]) as Set<string>
    const useLeague = allowed.has(league) ? league : "nba"
    const base = `https://site.api.espn.com/apis/site/v2/sports/basketball/${useLeague}`
    const fullUrl = team
      ? `${base}/teams/${team}/news${limit ? `?limit=${limit}` : ""}`
      : `${base}/news${limit ? `?limit=${limit}` : ""}`
    const res = await fetch(fullUrl, { next: { revalidate } })
    if (!res.ok) return NextResponse.json({ error: "upstream" }, { status: 502 })
    const data = await res.json()
    return NextResponse.json(data)
  } catch (e) {
    return NextResponse.json({ error: "failed" }, { status: 502 })
  }
}
