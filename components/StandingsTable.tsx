"use client"
import { useEffect, useState } from "react"

type Team = { name?: string, abbreviation?: string, id?: string }
type RecordItem = { summary?: string, wins?: number, losses?: number }

type Row = {
  team?: Team
  records?: RecordItem[]
  stats?: { name?: string, value?: number | string }[]
}

export default function StandingsTable() {
  const [rows, setRows] = useState<Row[]>([])
  const [loading, setLoading] = useState(true)
  useEffect(() => {
    const run = async () => {
      try {
        const res = await fetch("/api/standings")
        const json = await res.json()
        const directNorm = Array.isArray(json?.entries) ? json.entries : []
        if (directNorm.length) {
          const rows: Row[] = directNorm
            .map((e: any): Row => ({
              team: e?.team,
              records: e?.records,
              stats: e?.stats
            }))
            .filter((r: Row) => !!r.team?.name)
          setRows(rows.slice(0, 30))
          return
        }
        const season = new Date().getFullYear()
        const r1 = await fetch(`https://sports.core.api.espn.com/v2/sports/basketball/leagues/nba/standings?season=${season}`)
        const j1 = await r1.json().catch(() => ({} as any))
        const ref = String(j1?.$ref || "")
        if (!ref) {
          setRows([])
          return
        }
        const r2 = await fetch(ref.includes("?") ? `${ref}&limit=200` : `${ref}?limit=200`)
        const j2 = await r2.json().catch(() => ({} as any))
        const items = Array.isArray(j2?.items) ? j2.items : []
        const standingsList = Array.isArray(j2?.standings) ? j2.standings : []
        const refs = [
          ...items.map((it: any) => String(it?.$ref || "")).filter(Boolean),
          ...standingsList.map((st: any) => String(st?.$ref || "")).filter(Boolean)
        ]
        const pickRef = refs.find((r: string) => /standings\/0\b/.test(r)) || refs[0] || ""
        if (!pickRef) {
          setRows([])
          return
        }
        const r3 = await fetch(pickRef.includes("?") ? `${pickRef}&limit=200` : `${pickRef}?limit=200`)
        const j3 = await r3.json().catch(() => ({} as any))
        const tableEntries = Array.isArray(j3?.standings)
          ? j3.standings
          : (Array.isArray(j3?.entries) ? j3.entries : (Array.isArray(j3?.entries?.items) ? j3.entries.items : []))
        const teamsRes = await fetch("https://site.api.espn.com/apis/site/v2/sports/basketball/nba/teams")
        const teamsJson = await teamsRes.json().catch(() => ({} as any))
        const rawTeams = Array.isArray(teamsJson?.sports?.[0]?.leagues?.[0]?.teams)
          ? teamsJson.sports[0].leagues[0].teams
          : (Array.isArray(teamsJson?.teams) ? teamsJson.teams : [])
        const teamMap = new Map<string, { name?: string; abbreviation?: string }>()
        rawTeams.forEach((entry: any) => {
          const t = entry?.team || entry
          const id = String(t?.id || "")
          const name = t?.displayName || t?.name || t?.abbreviation || ""
          const abbr = t?.abbreviation || ""
          if (id) teamMap.set(id, { name, abbreviation: abbr })
        })
        const rowsFallback: Row[] = tableEntries.map((e: any) => {
          const tref = String(e?.team?.$ref || "")
          const tid = String(e?.team?.id || e?.teamId || (tref.match(/teams\/(\d+)/)?.[1] || ""))
          const tm = tid ? teamMap.get(tid) : undefined
          const stats = Array.isArray(e?.stats) ? e.stats : []
          const recItem = (Array.isArray(e?.records) ? e.records : []).find((r: any) => {
            const n = String(r?.type || r?.name || "").toLowerCase()
            return /leaguestandings|league|overall|total/.test(n)
          })
          const wins = stats.find((s: any) => String(s?.type || s?.name || "").toLowerCase() === "wins")?.displayValue
          const losses = stats.find((s: any) => String(s?.type || s?.name || "").toLowerCase() === "losses")?.displayValue
          const summary = recItem?.summary || (wins && losses ? `${wins}-${losses}` : "")
          return {
            team: { name: tm?.name, abbreviation: tm?.abbreviation, id: tid },
            records: summary ? [{ summary }] : [],
            stats
          }
        }).filter((r: Row) => !!r.team?.name)
        setRows(rowsFallback.slice(0, 30))
        return
        const collectEntries = (node: any): any[] => {
          if (!node || typeof node !== "object") return []
          const direct = Array.isArray(node?.entries) ? node.entries : Array.isArray(node?.standings?.entries) ? node.standings.entries : []
          const fromArray = Array.isArray(node?.standings) ? node.standings : []
          const kids = Array.isArray(node?.children) ? node.children : Array.isArray(node?.standings?.children) ? node.standings.children : []
          const sub = Array.isArray(kids) ? kids.flatMap(collectEntries) : []
          return [...direct, ...fromArray, ...sub]
        }
        const legacyEntries = collectEntries(json)
        const teams: Row[] = legacyEntries.map((e: any) => {
          const t = e?.team || {}
          const stats = Array.isArray(e?.stats) ? e.stats : []
          const rec = stats.find((s: any) => (s?.name || "").toLowerCase() === "record")
          const records = Array.isArray(e?.records) ? e.records : (rec ? [{ summary: rec.displayValue || String(rec.value || "") }] : [])
          return {
            team: { name: t?.displayName || t?.name || t?.abbreviation, abbreviation: t?.abbreviation, id: String(t?.id || "") },
            records,
            stats
          }
        }).filter((r: Row) => !!r.team?.name)
        setRows(teams.slice(0, 30))
      } finally {
        setLoading(false)
      }
    }
    run()
  }, [])
  return (
    <div className="card">
      <div className="title">Standings</div>
      {loading && <div className="badge">Loading</div>}
      {!loading && rows.length === 0 && <div className="badge">No data</div>}
      {!loading && rows.length > 0 && (
        <table style={{ width: "100%", borderCollapse: "collapse" }}>
          <thead>
            <tr>
              <th style={{ textAlign: "left", fontWeight: 600 }}>Team</th>
              <th style={{ textAlign: "right", fontWeight: 600 }}>Record</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((r, i) => {
              const getStat = (key: string) => {
                const s = (r.stats || []).find((x: any) => String(x?.name || x?.type || "").toLowerCase() === key)
                return (s?.displayValue ?? s?.value ?? "") as any
              }
              const record = r.records?.[0]?.summary || (() => {
                const w = String(getStat("wins") || "")
                const l = String(getStat("losses") || "")
                return (w && l) ? `${w}-${l}` : ""
              })()
              return (
                <tr key={i}>
                  <td>{r.team?.name || r.team?.abbreviation}</td>
                  <td style={{ textAlign: "right" }}>{record}</td>
                </tr>
              )
            })}
          </tbody>
        </table>
      )}
    </div>
  )
}
