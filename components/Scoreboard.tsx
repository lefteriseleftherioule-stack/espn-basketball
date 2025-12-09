"use client"
import { useEffect, useRef, useState } from "react"

type Team = {
  shortDisplayName?: string
  displayName?: string
  abbreviation?: string
  logo?: string
  logos?: { href?: string }[]
}

type CompetitionTeam = {
  team?: Team
  score?: string
  winner?: boolean
  homeAway?: string
  records?: { summary?: string; type?: string }[]
  linescores?: { displayValue?: string }[]
  leaders?: { leaders?: { athlete?: { displayName?: string; shortName?: string; jersey?: string; headshot?: { href?: string }; images?: { href?: string }[] }; value?: number; displayValue?: string }[]; shortDisplayName?: string }[]
}

type Event = {
  name?: string
  competitions?: { competitors?: CompetitionTeam[]; venue?: { fullName?: string; address?: { city?: string; state?: string } } }[]
  status?: { type?: { name?: string, state?: string, detail?: string } }
  links?: { href?: string; text?: string; shortText?: string; rel?: string[] }[]
}

export default function Scoreboard() {
  const [groups, setGroups] = useState<{ date: string; events: Event[] }[]>([])
  const [selectedDate, setSelectedDate] = useState<string>("")
  const [loading, setLoading] = useState(true)
  const [calendarOpen, setCalendarOpen] = useState(false)
  const [calendarMonth, setCalendarMonth] = useState<Date>(new Date())

  const toYmd = (d: Date) => {
    const y = d.getFullYear()
    const m = String(d.getMonth() + 1).padStart(2, "0")
    const day = String(d.getDate()).padStart(2, "0")
    return `${y}${m}${day}`
  }
  const label = (d: Date) => (
    d.toLocaleDateString(undefined, { weekday: "short" }) + " " + d.toLocaleDateString(undefined, { month: "short", day: "numeric" })
  )
  const parseInputYmd = (v: string) => v.replace(/-/g, "")
  const dashed = (ymd: string) => `${ymd.slice(0,4)}-${ymd.slice(4,6)}-${ymd.slice(6,8)}`
  const fromYmd = (ymd: string) => new Date(Number(ymd.slice(0,4)), Number(ymd.slice(4,6)) - 1, Number(ymd.slice(6,8)))

  const loadDateAndPrevious = async (ymd: string) => {
    setLoading(true)
    try {
      const y = Number(ymd.slice(0, 4))
      const m = Number(ymd.slice(4, 6)) - 1
      const d = Number(ymd.slice(6, 8))
      const base = new Date(y, m, d)
      const days = [0, -1, -2, -3].map(offset => {
        const dt = new Date(base)
        dt.setDate(base.getDate() + offset)
        return { ymd: toYmd(dt), dateObj: dt }
      })
      const results = await Promise.all(
        days.map(async x => {
          const res = await fetch(`/api/scoreboard?date=${x.ymd}`)
          const json = await res.json()
          const list: Event[] = json?.events || []
          return { date: x.ymd, events: Array.isArray(list) ? list : [] }
        })
      )
      setGroups(results)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    const today = toYmd(new Date())
    setSelectedDate(today)
    loadDateAndPrevious(today)
    setCalendarMonth(new Date())
  }, [])
  const daysbarRef = useRef<HTMLDivElement | null>(null)
  const dateInputRef = useRef<HTMLInputElement | null>(null)
  useEffect(() => {
    const el = typeof document !== "undefined" ? document.querySelector(".daypill-active") as HTMLElement | null : null
    el?.scrollIntoView({ behavior: "smooth", inline: "center", block: "nearest" })
  }, [selectedDate])
  useEffect(() => {
    const onDocClick = (e: MouseEvent) => {
      const tgt = e.target as HTMLElement
      const inside = tgt && (tgt.closest?.(".calpop") || tgt.closest?.(".selector-right"))
      if (!inside) setCalendarOpen(false)
    }
    if (calendarOpen) {
      setTimeout(() => document.addEventListener("click", onDocClick), 0)
    }
    return () => document.removeEventListener("click", onDocClick)
  }, [calendarOpen])
  return (
    <div className="card">
      <div className="title">Scores</div>
      <div className="selector" style={{ marginBottom: 12, flexWrap: "wrap" as any }}>
        <div className="daysbar" ref={daysbarRef}>
          {(() => {
            if (!selectedDate) return null
            const y = Number(selectedDate.slice(0, 4))
            const m = Number(selectedDate.slice(4, 6)) - 1
            const d = Number(selectedDate.slice(6, 8))
            const base = new Date(y, m, d)
            const range = [-3, -2, -1, 0, 1, 2, 3].map(off => {
              const dt = new Date(base)
              dt.setDate(base.getDate() + off)
              return dt
            })
            return range.map((dt, i) => {
              const ymd = toYmd(dt)
              const isSel = ymd === selectedDate
              return (
                <button key={i} onClick={() => { setSelectedDate(ymd); loadDateAndPrevious(ymd) }} className={"daypill" + (isSel ? " daypill-active" : "")}>
                  <div className="muted">{dt.toLocaleDateString(undefined, { weekday: "short" })}</div>
                  <div>{dt.toLocaleDateString(undefined, { month: "short", day: "numeric" })}</div>
                </button>
              )
            })
          })()}
        </div>
        <div className="selector-right">
          <input ref={dateInputRef} type="date" value={selectedDate ? dashed(selectedDate) : dashed(toYmd(new Date()))}
            onChange={e => {
              const val = e.currentTarget.value
              if (val) {
                const ymd = parseInputYmd(val)
                setSelectedDate(ymd)
                loadDateAndPrevious(ymd)
                setCalendarMonth(fromYmd(ymd))
              }
            }}
          />
          <button type="button" className="calendarbtn" onClick={() => setCalendarOpen(true)}>📅</button>
          {calendarOpen && (
            <div className="calpop">
              <div className="calheader">
                <button className="calnav" onClick={() => { const d = new Date(calendarMonth); d.setMonth(d.getMonth() - 1); setCalendarMonth(d) }}>‹</button>
                <span className="badge">{calendarMonth.toLocaleDateString(undefined, { month: "long", year: "numeric" })}</span>
                <button className="calnav" onClick={() => { const d = new Date(calendarMonth); d.setMonth(d.getMonth() + 1); setCalendarMonth(d) }}>›</button>
              </div>
              <div className="calgrid">
                {(() => {
                  const y = calendarMonth.getFullYear()
                  const m = calendarMonth.getMonth()
                  const start = new Date(y, m, 1)
                  const startIdx = start.getDay()
                  const daysInMonth = new Date(y, m + 1, 0).getDate()
                  const prevDays = new Date(y, m, 0).getDate()
                  const cells = [] as { d: Date; inMonth: boolean }[]
                  for (let i = 0; i < 42; i++) {
                    let dateNum: number
                    let inMonth = true
                    if (i < startIdx) { dateNum = prevDays - (startIdx - 1 - i); inMonth = false }
                    else if (i - startIdx + 1 <= daysInMonth) { dateNum = i - startIdx + 1; inMonth = true }
                    else { dateNum = i - startIdx + 1 - daysInMonth; inMonth = false }
                    const d = new Date(y, inMonth ? m : (i < startIdx ? m - 1 : m + 1), dateNum)
                    cells.push({ d, inMonth })
                  }
                  const sel = fromYmd(selectedDate || toYmd(new Date()))
                  return cells.map((c, idx) => {
                    const isSel = c.d.getFullYear() === sel.getFullYear() && c.d.getMonth() === sel.getMonth() && c.d.getDate() === sel.getDate()
                    const cls = "calcell" + (isSel ? " calcell-selected" : "") + (c.inMonth ? "" : " calcell-muted")
                    return (
                      <div key={idx} className={cls} onClick={() => { const ymd = toYmd(c.d); setSelectedDate(ymd); loadDateAndPrevious(ymd); setCalendarMonth(new Date(c.d)); setCalendarOpen(false) }}>
                        {c.d.getDate()}
                      </div>
                    )
                  })
                })()}
              </div>
            </div>
          )}
        </div>
      </div>
      {loading && <div className="badge">Loading</div>}
      {!loading && groups.every(g => g.events.length === 0) && <div className="badge">No games</div>}
      {!loading && groups.length > 0 && (
        <ul style={{ listStyle: "none", padding: 0, margin: 0 }}>
          {groups.map((grp, gi) => (
            <li key={gi} style={{ marginBottom: 16 }}>
              <div className="badge" style={{ marginBottom: 8 }}>{label(new Date(Number(grp.date.slice(0,4)), Number(grp.date.slice(4,6)) - 1, Number(grp.date.slice(6,8))))}</div>
              {(grp.events || []).map((ev, i) => {
                const comp = ev.competitions?.[0]
                let teams = comp?.competitors || []
                teams = Array.isArray(teams) ? teams.slice().sort((a, b) => (a.homeAway === "away" ? -1 : 1)) : []
                const venueName = comp?.venue?.fullName || ""
                const city = comp?.venue?.address?.city || ""
                const state = comp?.venue?.address?.state || ""
                const maxPeriods = Math.max(
                  teams[0]?.linescores?.length || 0,
                  teams[1]?.linescores?.length || 0
                )
                const cols = Array.from({ length: Math.max(4, maxPeriods) }, (_, k) => k)
                return (
                  <div key={i} className="gamecard">
                    <div className="gameheader">
                      <span className="badge">{ev.status?.type?.detail || ev.status?.type?.name || ""}</span>
                    </div>
                    <div>
                        <div style={{ overflowX: "auto" }}>
                          <table style={{ width: "100%", borderCollapse: "collapse" }}>
                            <thead>
                              <tr>
                                <th style={{ textAlign: "left", fontWeight: 600 }}></th>
                                {cols.map((c) => (
                                  <th key={c} style={{ textAlign: "right", fontWeight: 600 }}>{c + 1}</th>
                                ))}
                                <th style={{ textAlign: "right", fontWeight: 600 }}>T</th>
                              </tr>
                            </thead>
                            <tbody>
                              {teams.map((t, idx) => {
                                const name = t.team?.displayName || t.team?.shortDisplayName || t.team?.abbreviation || ""
                                const overall = (t.records || []).find(r => (r.type || "").toLowerCase().includes("overall") || (r.type || "").toLowerCase().includes("total"))?.summary || (t.records || [])[0]?.summary || ""
                                const ha = t.homeAway ? (t.homeAway.charAt(0).toUpperCase() + t.homeAway.slice(1)) : ""
                                const line = (t.linescores || []).map(ls => ls.displayValue || "")
                                const q = cols.map(i => line[i] || "")
                                const logo = (t.team as any)?.logo || (t.team as any)?.logos?.[0]?.href || ""
                                return (
                                  <tr key={idx}>
                                  <td>
                                    <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                                      {logo && <img src={logo} alt={t.team?.abbreviation || name} style={{ width: 24, height: 24, borderRadius: 4, objectFit: "contain", background: "#fff" }} />}
                                      <span className={t.winner ? "win" : "loss"}>{name}</span>
                                      <span className="badge">{overall ? `(${overall} ${ha})` : ha ? `(${ha})` : ""}</span>
                                    </div>
                                  </td>
                                  {q.map((val, qi) => (
                                    <td key={qi} style={{ textAlign: "right" }}>{val}</td>
                                  ))}
                                  <td style={{ textAlign: "right" }} className="score">{t.score}</td>
                                  </tr>
                                )
                              })}
                            </tbody>
                          </table>
                        </div>
                        <div className="hdivider" />
                        {(venueName || city || state) && (
                          <div style={{ marginTop: 8 }}>
                            <div className="badge">{venueName}</div>
                            <div className="badge" style={{ marginLeft: 8 }}>{[city, state].filter(Boolean).join(", ")}</div>
                          </div>
                        )}
                        <div className="hdivider" />
                        <div style={{ marginTop: 8 }}>
                          <div className="title" style={{ fontSize: 16 }}>Top Performers</div>
                          <div className="btnstack">
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
                              const avatar = (athlete as any)?.headshot?.href || (athlete as any)?.images?.[0]?.href || (t.team as any)?.logo || (t.team as any)?.logos?.[0]?.href || ""
                              return (
                                <div key={idx} className="leader">
                                  {avatar && <img className="avatar" src={avatar} alt={name || "leader"} />}
                                  <div>
                                    <div style={{ fontWeight: 600 }}>{name}</div>
                                    <div className="badge">{[jersey, abbr].filter(Boolean).join(" ")}</div>
                                    <div style={{ marginTop: 4 }}>{stats}</div>
                                  </div>
                                </div>
                              )
                            })}
                          </div>
                        </div>
                        <div className="hdivider" />
                        <div className="btnstack" style={{ marginTop: 8 }}>
                          {(() => {
                            const id = (ev as any)?.id || ""
                            const found = (ev.links || [])
                              .map(l => ({ text: l.shortText || l.text || "", href: l.href || "#", rel: (l.rel || []).join(",") }))
                              .filter(x => /boxscore|highlights|gamecast/i.test(x.rel) || /box score|highlights|gamecast/i.test(x.text))
                            const byText = (t: string) => found.find(x => new RegExp(t, "i").test(x.text))
                            const gamecast = byText("Gamecast")?.href || (id ? `https://www.espn.com/nba/game?gameId=${id}` : "#")
                            const boxscore = byText("Box Score")?.href || (id ? `https://www.espn.com/nba/boxscore/_/gameId/${id}` : "#")
                            const highlights = byText("Highlights")?.href || (id ? `https://www.espn.com/nba/recap/_/gameId/${id}` : "#")
                            return (
                              <>
                                <a className="btnpill" href={gamecast} target="_blank" rel="noreferrer">Gamecast</a>
                                <a className="btnpill" href={boxscore} target="_blank" rel="noreferrer">Box Score</a>
                                <a className="btnpill" href={highlights} target="_blank" rel="noreferrer">Highlights</a>
                              </>
                            )
                          })()}
                        </div>
                    </div>
                  </div>
                )
              })}
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
