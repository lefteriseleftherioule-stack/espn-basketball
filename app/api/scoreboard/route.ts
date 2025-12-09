import { NextResponse } from "next/server"

const base = "https://site.api.espn.com/apis/site/v2/sports/basketball/nba/scoreboard"

export const revalidate = 60

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url)
    const date = searchParams.get("date") || ""
    const team = searchParams.get("team") || ""
    const fullUrl = date ? `${base}?dates=${date}` : base
    const res = await fetch(fullUrl, { next: { revalidate } })
    if (!res.ok) return NextResponse.json({ error: "upstream" }, { status: 502, headers: { "Access-Control-Allow-Origin": "*" } })
    const data = await res.json()
    if (!team) return NextResponse.json(data, { headers: { "Access-Control-Allow-Origin": "*" } })
    const id = String(team)
    const events = Array.isArray(data?.events) ? data.events : []
    const filtered = events.filter((ev: any) => {
      const comps = ev?.competitions?.[0]?.competitors || []
      return comps.some((c: any) => String(c?.team?.id) === id)
    })
    const out = { ...data, events: filtered }
    return NextResponse.json(out, { headers: { "Access-Control-Allow-Origin": "*" } })
  } catch (e) {
    return NextResponse.json({ error: "failed" }, { status: 502, headers: { "Access-Control-Allow-Origin": "*" } })
  }
}

export async function OPTIONS() {
  return NextResponse.json({}, { headers: { "Access-Control-Allow-Origin": "*", "Access-Control-Allow-Methods": "GET,OPTIONS", "Access-Control-Allow-Headers": "Content-Type" } })
}
