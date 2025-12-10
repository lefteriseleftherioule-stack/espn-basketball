import { NextResponse } from "next/server"

export const revalidate = 1800

export async function GET() {
  try {
    const season = new Date().getFullYear()
    const base = `https://sports.core.api.espn.com/v2/sports/basketball/leagues/nba/standings?season=${season}`
    const r1 = await fetch(base, { next: { revalidate } })
    if (!r1.ok) return NextResponse.json({ error: "upstream" }, { status: 502, headers: { "Access-Control-Allow-Origin": "*" } })
    const j1 = await r1.json()
    const ref = String((j1 as any)?.$ref || "")
    if (!ref) return NextResponse.json({ entries: [] }, { headers: { "Access-Control-Allow-Origin": "*" } })
    const r2 = await fetch(ref.includes("?") ? `${ref}&limit=200` : `${ref}?limit=200`, { next: { revalidate } })
    if (!r2.ok) return NextResponse.json({ error: "upstream" }, { status: 502, headers: { "Access-Control-Allow-Origin": "*" } })
    const j2 = await r2.json()
    const items = Array.isArray((j2 as any)?.items) ? (j2 as any).items : []
    const standings = Array.isArray((j2 as any)?.standings) ? (j2 as any).standings : []
    const refs = [
      ...items.map((it: any) => String(it?.$ref || "")).filter(Boolean),
      ...standings.map((st: any) => String(st?.$ref || "")).filter(Boolean)
    ]
    const pickRef = refs.find(r => /standings\/0\b/.test(r)) || refs[0] || ""
    if (!pickRef) return NextResponse.json({ entries: [] }, { headers: { "Access-Control-Allow-Origin": "*" } })
    const r3 = await fetch(pickRef.includes("?") ? `${pickRef}&limit=200` : `${pickRef}?limit=200`, { next: { revalidate } })
    if (!r3.ok) return NextResponse.json({ error: "upstream" }, { status: 502, headers: { "Access-Control-Allow-Origin": "*" } })
    const j3 = await r3.json()
    const entries = Array.isArray((j3 as any)?.standings)
      ? (j3 as any).standings
      : (Array.isArray((j3 as any)?.entries) ? (j3 as any).entries : (Array.isArray((j3 as any)?.entries?.items) ? (j3 as any).entries.items : []))
    const teamsRes = await fetch("https://site.api.espn.com/apis/site/v2/sports/basketball/nba/teams", { next: { revalidate } })
    const teamsJson = await teamsRes.json().catch(() => ({} as any))
    const rawTeams = Array.isArray((teamsJson as any)?.sports?.[0]?.leagues?.[0]?.teams)
      ? (teamsJson as any).sports[0].leagues[0].teams
      : (Array.isArray((teamsJson as any)?.teams) ? (teamsJson as any).teams : [])
    const teamMap = new Map<string, { name: string; abbreviation: string }>()
    rawTeams.forEach((entry: any) => {
      const t = entry?.team || entry
      const id = String(t?.id || "")
      const name = t?.displayName || t?.name || t?.abbreviation || ""
      const abbr = t?.abbreviation || ""
      if (id) teamMap.set(id, { name, abbreviation: abbr })
    })
    const norm = entries.map((e: any) => {
      const tref = String(e?.team?.$ref || "")
      const tid = String(e?.team?.id || e?.teamId || (tref.match(/teams\/(\d+)/)?.[1] || ""))
      const tm = tid ? teamMap.get(tid) : undefined
      const stats = Array.isArray(e?.stats) ? e.stats : []
      const recItem = (Array.isArray(e?.records) ? e.records : []).find((r: any) => {
        const n = String(r?.type || r?.name || "").toLowerCase()
        return /league|overall|total/.test(n)
      })
      const wins = stats.find((s: any) => String(s?.type || s?.name || "").toLowerCase() === "wins")?.displayValue
      const losses = stats.find((s: any) => String(s?.type || s?.name || "").toLowerCase() === "losses")?.displayValue
      const summary = recItem?.summary || (wins && losses ? `${wins}-${losses}` : "")
      return {
        team: { id: tid, name: tm?.name || "", abbreviation: tm?.abbreviation || "" },
        records: summary ? [{ summary }] : [],
        stats
      }
    }).filter((x: any) => x.team?.id)
    return NextResponse.json({ entries: norm }, { headers: { "Access-Control-Allow-Origin": "*" } })
  } catch (e) {
    return NextResponse.json({ error: "failed" }, { status: 502, headers: { "Access-Control-Allow-Origin": "*" } })
  }
}

export async function OPTIONS() {
  return NextResponse.json({}, { headers: { "Access-Control-Allow-Origin": "*", "Access-Control-Allow-Methods": "GET,OPTIONS", "Access-Control-Allow-Headers": "Content-Type" } })
}
