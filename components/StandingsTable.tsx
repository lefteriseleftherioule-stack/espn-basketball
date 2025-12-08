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
        const children = json?.children || json?.standings?.children || []
        const leaf = Array.isArray(children) ? children.flatMap((c: any) => c.children || []) : []
        const tables = leaf.length ? leaf : children
        const teams: Row[] = []
        tables.forEach((t: any) => {
          const entries = t?.standings?.entries || t?.entries || []
          entries.forEach((e: any) => {
            teams.push({
              team: { name: e?.team?.name, abbreviation: e?.team?.abbreviation, id: e?.team?.id },
              records: e?.stats ? [{ summary: e?.stats?.find((s: any) => s?.name === "record")?.displayValue }] : e?.records,
              stats: e?.stats
            })
          })
        })
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
