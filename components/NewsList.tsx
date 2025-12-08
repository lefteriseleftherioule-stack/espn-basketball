"use client"
import { useEffect, useState } from "react"

type Item = {
  headline?: string
  description?: string
  link?: string
  images?: { url?: string }[]
}

export default function NewsList() {
  const [items, setItems] = useState<Item[]>([])
  const [loading, setLoading] = useState(true)
  useEffect(() => {
    const run = async () => {
      try {
        const res = await fetch("/api/news")
        const json = await res.json()
        const list: Item[] = json?.articles || json?.feed || []
        setItems(Array.isArray(list) ? list.slice(0, 10) : [])
      } finally {
        setLoading(false)
      }
    }
    run()
  }, [])
  return (
    <div className="card">
      <div className="title">News</div>
      {loading && <div className="badge">Loading</div>}
      {!loading && items.length === 0 && <div className="badge">No data</div>}
      {!loading && items.length > 0 && (
        <ul style={{ listStyle: "none", padding: 0, margin: 0 }}>
          {items.map((it, i) => (
            <li key={i} style={{ marginBottom: 12 }}>
              <a className="link" href={it.link || "#"} target="_blank" rel="noreferrer">
                {it.headline || it.description || "Untitled"}
              </a>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
