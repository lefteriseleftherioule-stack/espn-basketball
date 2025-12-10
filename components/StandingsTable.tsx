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
          const rows: Row[] = directNorm.map((e: any) => ({
            team: e?.team,
            records: e?.records,
            stats: e?.stats
          })).filter(r => r.team?.name)
          setRows(rows.slice(0, 30))
          return
        }
        const collectEntries = (node: any): any[] => {
          if (!node || typeof node !== "object") return []
          const direct = Array.isArray(node?.entries) ? node.entries : Array.isArray(node?.standings?.entries) ? node.standings.entries : []
          const fromArray = Array.isArray(node?.standings) ? node.standings : []
          const kids = Array.isArray(node?.children) ? node.children : Array.isArray(node?.standings?.children) ? node.standings.children : []
          const sub = Array.isArray(kids) ? kids.flatMap(collectEntries) : []
          return [...direct, ...fromArray, ...sub]
        }
        const entries = collectEntries(json)
        const teams: Row[] = entries.map((e: any) => {
          const t = e?.team || {}
          const stats = Array.isArray(e?.stats) ? e.stats : []
          const rec = stats.find((s: any) => (s?.name || "").toLowerCase() === "record")
          const records = Array.isArray(e?.records) ? e.records : (rec ? [{ summary: rec.displayValue || String(rec.value || "") }] : [])
          return {
            team: { name: t?.displayName || t?.name || t?.abbreviation, abbreviation: t?.abbreviation, id: String(t?.id || "") },
            records,
            stats
          }
        }).filter(r => r.team?.name)
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
              const record = r.records?.[0]?.summary || r.stats?.find(s => s.name === "record")?.value || ""
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
