"use client"
import { useEffect, useState } from "react"

type Team = {
  shortDisplayName?: string
  displayName?: string
  abbreviation?: string
}

type CompetitionTeam = {
  team?: Team
  score?: string
  winner?: boolean
}

type Event = {
  name?: string
  competitions?: { competitors?: CompetitionTeam[] }[]
  status?: { type?: { name?: string, state?: string, detail?: string } }
}

export default function Scoreboard() {
  const [events, setEvents] = useState<Event[]>([])
  const [loading, setLoading] = useState(true)
  useEffect(() => {
    const run = async () => {
      try {
        const res = await fetch("/api/scoreboard")
        const json = await res.json()
        const list: Event[] = json?.events || []
        setEvents(Array.isArray(list) ? list : [])
      } finally {
        setLoading(false)
      }
    }
    run()
  }, [])
  return (
    <div className="card">
      <div className="title">Scores</div>
      {loading && <div className="badge">Loading</div>}
      {!loading && events.length === 0 && <div className="badge">No games</div>}
      {!loading && events.length > 0 && (
        <ul style={{ listStyle: "none", padding: 0, margin: 0 }}>
          {events.map((ev, i) => {
            const comp = ev.competitions?.[0]
            const teams = comp?.competitors || []
            return (
              <li key={i} style={{ marginBottom: 12 }}>
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                  <div>
                    <span className="badge">{ev.status?.type?.detail || ev.status?.type?.name || ""}</span>
                  </div>
                </div>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 60px", gap: 8 }}>
                  {teams.map((t, idx) => (
                    <>
                      <div key={idx + "name"} className={t.winner ? "win" : "loss"}>{t.team?.displayName || t.team?.shortDisplayName || t.team?.abbreviation}</div>
                      <div key={idx + "score"} className="score" style={{ textAlign: "right" }}>{t.score}</div>
                    </>
                  ))}
                </div>
              </li>
            )
          })}
        </ul>
      )}
    </div>
  )
}
