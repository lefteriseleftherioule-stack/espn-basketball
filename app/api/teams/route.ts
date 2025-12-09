import { NextResponse } from "next/server"

export const revalidate = 3600

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url)
    const league = (searchParams.get("league") || "nba").toLowerCase()
    const allowed = new Set(["nba", "wnba", "mens-college-basketball", "womens-college-basketball"]) as Set<string>
    const useLeague = allowed.has(league) ? league : "nba"
    const url = `https://site.api.espn.com/apis/site/v2/sports/basketball/${useLeague}/teams`
    const res = await fetch(url, { next: { revalidate } })
    if (!res.ok) return NextResponse.json({ error: "upstream" }, { status: 502, headers: { "Access-Control-Allow-Origin": "*" } })
    const data = await res.json()
    const list = Array.isArray((data as any)?.sports?.[0]?.leagues?.[0]?.teams)
      ? (data as any).sports[0].leagues[0].teams
      : (Array.isArray((data as any)?.teams) ? (data as any).teams : [])
    const out = list.map((entry: any) => {
      const t = entry?.team || entry
      return { id: String(t?.id || ""), name: t?.displayName || t?.name || t?.abbreviation || "" }
    }).filter((t: any) => t.id && t.name)
    return NextResponse.json({ teams: out }, { headers: { "Access-Control-Allow-Origin": "*" } })
  } catch (e) {
    return NextResponse.json({ error: "failed" }, { status: 502, headers: { "Access-Control-Allow-Origin": "*" } })
  }
}

export async function OPTIONS() {
  return NextResponse.json({}, { headers: { "Access-Control-Allow-Origin": "*", "Access-Control-Allow-Methods": "GET,OPTIONS", "Access-Control-Allow-Headers": "Content-Type" } })
}
