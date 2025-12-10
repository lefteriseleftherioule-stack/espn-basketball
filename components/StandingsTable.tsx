"use client"
import { useEffect, useState } from "react"

type Team = { name?: string, abbreviation?: string, id?: string, logo?: string }
type RecordItem = { summary?: string, wins?: number, losses?: number, stats?: Stat[] }

type Stat = { name?: string, type?: string, value?: number | string, displayValue?: string | number }
type Row = {
  team?: Team
  records?: RecordItem[]
  stats?: Stat[]
}

export default function StandingsTable() {
  const [rows, setRows] = useState<Row[]>([])
  const [loading, setLoading] = useState(true)
  const [mode, setMode] = useState<"league" | "conference" | "division">("league")
  const [seasonType, setSeasonType] = useState<"regular" | "preseason">("regular")
  const [seasonYear, setSeasonYear] = useState<number>(new Date().getFullYear())
  useEffect(() => {
    const run = async () => {
      try {
        const season = seasonYear
        const typesId = seasonType === "regular" ? 2 : 1
        const r1 = await fetch(`https://sports.core.api.espn.com/v2/sports/basketball/leagues/nba/standings?season=${season}`)
        const j1 = await r1.json().catch(() => ({} as any))
        const ref = String(j1?.$ref || "")
        if (!ref) {
          setRows([])
          return
        }
        const refTypes = ref.replace(/types\/\d+/, `types/${typesId}`)
        const r2 = await fetch(refTypes.includes("?") ? `${refTypes}&limit=200` : `${refTypes}?limit=200`)
        const j2 = await r2.json().catch(() => ({} as any))
        const items = Array.isArray(j2?.items) ? j2.items : []
        const standingsList = Array.isArray(j2?.standings) ? j2.standings : []
        const refs = [
          ...items.map((it: any) => String(it?.$ref || "")).filter(Boolean),
          ...standingsList.map((st: any) => String(st?.$ref || "")).filter(Boolean)
        ]
        const tableIndex = mode === "division" ? 2 : (mode === "conference" ? 1 : 0)
        const pickRef = refs.find((r: string) => new RegExp(`standings\/${tableIndex}\\b`).test(r)) || refs[0] || ""
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
        const teamMap = new Map<string, { name?: string; abbreviation?: string; logo?: string }>()
        rawTeams.forEach((entry: any) => {
          const t = entry?.team || entry
          const id = String(t?.id || "")
          const name = t?.displayName || t?.name || t?.abbreviation || ""
          const abbr = t?.abbreviation || ""
          const logo = Array.isArray(t?.logos) && t.logos[0]?.href ? t.logos[0].href : ""
          if (id) teamMap.set(id, { name, abbreviation: abbr, logo })
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
            team: { name: tm?.name, abbreviation: tm?.abbreviation, id: tid, logo: tm?.logo },
            records: summary ? [{ summary }] : [],
            stats: [...stats, ...((Array.isArray(recItem?.stats) ? recItem!.stats! : []) as any[])]
          }
        }).filter((r: Row) => !!r.team?.name)
        setRows(rowsFallback.slice(0, 30))
      } finally {
        setLoading(false)
      }
    }
    run()
  }, [])
  useEffect(() => {
    setLoading(true)
    const rerun = async () => {
      await new Promise(res => setTimeout(res, 0))
      const btn = document.createElement('span')
    }
    ;(async () => {
      const season = seasonYear
      const typesId = seasonType === "regular" ? 2 : 1
      try {
        const r1 = await fetch(`https://sports.core.api.espn.com/v2/sports/basketball/leagues/nba/standings?season=${season}`)
        const j1 = await r1.json().catch(() => ({} as any))
        const ref = String(j1?.$ref || "")
        if (!ref) { setRows([]); setLoading(false); return }
        const refTypes = ref.replace(/types\/\d+/, `types/${typesId}`)
        const r2 = await fetch(refTypes.includes("?") ? `${refTypes}&limit=200` : `${refTypes}?limit=200`)
        const j2 = await r2.json().catch(() => ({} as any))
        const items = Array.isArray(j2?.items) ? j2.items : []
        const standingsList = Array.isArray(j2?.standings) ? j2.standings : []
        const refs = [
          ...items.map((it: any) => String(it?.$ref || "")).filter(Boolean),
          ...standingsList.map((st: any) => String(st?.$ref || "")).filter(Boolean)
        ]
        const tableIndex = mode === "division" ? 2 : (mode === "conference" ? 1 : 0)
        const pickRef = refs.find((r: string) => new RegExp(`standings\/${tableIndex}\\b`).test(r)) || refs[0] || ""
        if (!pickRef) { setRows([]); setLoading(false); return }
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
        const teamMap = new Map<string, { name?: string; abbreviation?: string; logo?: string }>()
        rawTeams.forEach((entry: any) => {
          const t = entry?.team || entry
          const id = String(t?.id || "")
          const name = t?.displayName || t?.name || t?.abbreviation || ""
          const abbr = t?.abbreviation || ""
          const logo = Array.isArray(t?.logos) && t.logos[0]?.href ? t.logos[0].href : ""
          if (id) teamMap.set(id, { name, abbreviation: abbr, logo })
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
            team: { name: tm?.name, abbreviation: tm?.abbreviation, id: tid, logo: tm?.logo },
            records: summary ? [{ summary }] : [],
            stats: [...stats, ...((Array.isArray(recItem?.stats) ? recItem!.stats! : []) as any[])]
          }
        }).filter((r: Row) => !!r.team?.name)
        setRows(rowsFallback.slice(0, 30))
      } finally {
        setLoading(false)
      }
    })()
  }, [mode, seasonType, seasonYear])
  return (
    <div className="card">
      <div className="title">Standings</div>
      <div className="btnstack" style={{ display: "flex", gap: 8, marginBottom: 12, flexWrap: "wrap" as any }}>
        <button type="button" className="btnpill" onClick={() => setMode("league")}>League</button>
        <button type="button" className="btnpill" onClick={() => setMode("conference")}>Conference</button>
        <button type="button" className="btnpill" onClick={() => setMode("division")}>Division</button>
        <button type="button" className="btnpill" onClick={() => setSeasonType("regular")}>Regular Season</button>
        <button type="button" className="btnpill" onClick={() => setSeasonType("preseason")}>Preseason</button>
        <span className="badge">{seasonYear}-{String(seasonYear + 1).slice(2)}</span>
      </div>
      {loading && <div className="badge">Loading</div>}
      {!loading && rows.length === 0 && <div className="badge">No data</div>}
      {!loading && rows.length > 0 && (
        <table style={{ width: "100%", borderCollapse: "collapse" }}>
          <thead>
            <tr>
              <th style={{ textAlign: "left", fontWeight: 600 }}>Team</th>
              <th style={{ textAlign: "right", fontWeight: 600 }}>W</th>
              <th style={{ textAlign: "right", fontWeight: 600 }}>L</th>
              <th style={{ textAlign: "right", fontWeight: 600 }}>PCT</th>
              <th style={{ textAlign: "right", fontWeight: 600 }}>PPG</th>
              <th style={{ textAlign: "right", fontWeight: 600 }}>OPP PPG</th>
              <th style={{ textAlign: "right", fontWeight: 600 }}>DIFF</th>
              <th style={{ textAlign: "right", fontWeight: 600 }}>STRK</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((r, i) => {
              const getStat = (key: string) => {
                const fromStats = (r.stats || []).find((x) => String(x?.name || x?.type || "").toLowerCase() === key)
                const v = (fromStats as any)?.displayValue ?? (fromStats as any)?.value
                return v == null ? "" : String(v)
              }
              const getFirst = (keys: string[]) => {
                for (const k of keys) {
                  const v = getStat(k)
                  if (v !== "") return v
                }
                return ""
              }
              const w = getFirst(["wins"]) || ""
              const l = getFirst(["losses"]) || ""
              const pct = getFirst(["winpercent", "winpct", "winpercentage"]) || ""
              const ppg = getFirst(["avgpointsfor", "pointsforpergame", "pointsforpg"]) || ""
              const opp = getFirst(["avgpointsagainst", "pointsagainstpergame", "oppointspergame", "oppptsg"]) || ""
              let diff = getFirst(["differential", "pointdifferential"]) || ""
              const strk = getFirst(["streak"]) || ""
              if (!diff) {
                const pn = parseFloat(ppg)
                const on = parseFloat(opp)
                if (!Number.isNaN(pn) && !Number.isNaN(on)) {
                  const d = pn - on
                  diff = `${d > 0 ? "+" : ""}${d.toFixed(1)}`
                }
              }
              return (
                <tr key={i}>
                  <td>
                    <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                      {r.team?.logo && <img src={r.team.logo} alt={r.team?.abbreviation || r.team?.name || ""} style={{ width: 20, height: 20, borderRadius: 4, objectFit: "contain", background: "#fff" }} />}
                      <span>{r.team?.name || r.team?.abbreviation}</span>
                    </div>
                  </td>
                  <td style={{ textAlign: "right" }}>{w}</td>
                  <td style={{ textAlign: "right" }}>{l}</td>
                  <td style={{ textAlign: "right" }}>{pct}</td>
                  <td style={{ textAlign: "right" }}>{ppg}</td>
                  <td style={{ textAlign: "right" }}>{opp}</td>
                  <td style={{ textAlign: "right" }}>{diff}</td>
                  <td style={{ textAlign: "right" }}>{strk}</td>
                </tr>
              )
            })}
          </tbody>
        </table>
      )}
    </div>
  )
}
