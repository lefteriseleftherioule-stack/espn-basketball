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
  homeAway?: string
  records?: { summary?: string; type?: string }[]
  linescores?: { displayValue?: string }[]
  leaders?: { leaders?: { athlete?: { displayName?: string; shortName?: string; jersey?: string }; value?: number; displayValue?: string }[]; shortDisplayName?: string }[]
}

type Event = {
  name?: string
  competitions?: { competitors?: CompetitionTeam[]; venue?: { fullName?: string; address?: { city?: string; state?: string } } }[]
  status?: { type?: { name?: string, state?: string, detail?: string } }
  links?: { href?: string; text?: string; shortText?: string; rel?: string[] }[]
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
            let teams = comp?.competitors || []
            teams = Array.isArray(teams) ? teams.slice().sort((a, b) => (a.homeAway === "away" ? -1 : 1)) : []
            const venueName = comp?.venue?.fullName || ""
            const city = comp?.venue?.address?.city || ""
            const state = comp?.venue?.address?.state || ""
            return (
              <li key={i} style={{ marginBottom: 12 }}>
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 8 }}>
                  <span className="badge">{ev.status?.type?.detail || ev.status?.type?.name || ""}</span>
                </div>
                <div style={{ overflowX: "auto" }}>
                  <table style={{ width: "100%", borderCollapse: "collapse" }}>
                    <thead>
                      <tr>
                        <th style={{ textAlign: "left", fontWeight: 600 }}></th>
                        <th style={{ textAlign: "right", fontWeight: 600 }}>1</th>
                        <th style={{ textAlign: "right", fontWeight: 600 }}>2</th>
                        <th style={{ textAlign: "right", fontWeight: 600 }}>3</th>
                        <th style={{ textAlign: "right", fontWeight: 600 }}>4</th>
                        <th style={{ textAlign: "right", fontWeight: 600 }}>T</th>
                      </tr>
                    </thead>
                    <tbody>
                      {teams.map((t, idx) => {
                        const name = t.team?.displayName || t.team?.shortDisplayName || t.team?.abbreviation || ""
                        const overall = (t.records || []).find(r => (r.type || "").toLowerCase().includes("overall") || (r.type || "").toLowerCase().includes("total"))?.summary || (t.records || [])[0]?.summary || ""
                        const ha = t.homeAway ? (t.homeAway.charAt(0).toUpperCase() + t.homeAway.slice(1)) : ""
                        const line = (t.linescores || []).map(ls => ls.displayValue || "")
                        const q = [line[0] || "", line[1] || "", line[2] || "", line[3] || ""]
                        return (
                          <tr key={idx}>
                            <td>
                              <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                                <span className={t.winner ? "win" : "loss"}>{name}</span>
                                <span className="badge">{overall ? `(${overall} ${ha})` : ha ? `(${ha})` : ""}</span>
                              </div>
                            </td>
                            <td style={{ textAlign: "right" }}>{q[0]}</td>
                            <td style={{ textAlign: "right" }}>{q[1]}</td>
                            <td style={{ textAlign: "right" }}>{q[2]}</td>
                            <td style={{ textAlign: "right" }}>{q[3]}</td>
                            <td style={{ textAlign: "right" }} className="score">{t.score}</td>
                          </tr>
                        )
                      })}
                    </tbody>
                  </table>
                </div>
                {(venueName || city || state) && (
                  <div style={{ marginTop: 8 }}>
                    <div className="badge">{venueName}</div>
                    <div className="badge" style={{ marginLeft: 8 }}>{[city, state].filter(Boolean).join(", ")}</div>
                  </div>
                )}
                <div style={{ marginTop: 8 }}>
                  <div className="title" style={{ fontSize: 16 }}>Top Performers</div>
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
                    {teams.map((t, idx) => {
                      const leaders = t.leaders || []
                      const pick = (preds: RegExp[]) => leaders.find(l => preds.some(rx => rx.test(l.shortDisplayName || "")))?.leaders?.[0]
                      const lp = pick([/PTS/i, /Points/i])
                      const lr = pick([/REB/i, /Rebounds/i])
                      const la = pick([/AST/i, /Assists/i])
                      const athlete = lp?.athlete || lr?.athlete || la?.athlete || {}
                      const name = athlete.shortName || athlete.displayName || ""
                      const jersey = athlete.jersey ? `#${athlete.jersey}` : ""
                      const abbr = t.team?.abbreviation ? ` - ${t.team?.abbreviation}` : ""
                      const stats = [lp?.value ? `${lp.value}PTS` : null, lr?.value ? `${lr.value}REB` : null, la?.value ? `${la.value}AST` : null].filter(Boolean).join("")
                      return (
                        <div key={idx}>
                          <div style={{ fontWeight: 600 }}>{name}</div>
                          <div className="badge">{[jersey, abbr].filter(Boolean).join(" ")}</div>
                          <div style={{ marginTop: 4 }}>{stats}</div>
                        </div>
                      )
                    })}
                  </div>
                </div>
                <div style={{ marginTop: 8, display: "flex", gap: 12, flexWrap: "wrap" }}>
                  {(ev.links || []).map((l, idx) => {
                    const text = l.shortText || l.text || ""
                    const rel = (l.rel || []).join(",")
                    const show = /boxscore|highlights|gamecast/i.test(rel) || /box score|highlights|gamecast/i.test(text)
                    if (!show) return null
                    return <a key={idx} className="link" href={l.href || "#"} target="_blank" rel="noreferrer">{text || "Link"}</a>
                  })}
                </div>
              </li>
            )
          })}
        </ul>
      )}
    </div>
  )
}
