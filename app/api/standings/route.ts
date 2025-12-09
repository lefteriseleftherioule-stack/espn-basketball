import { NextResponse } from "next/server"

const url = "https://site.api.espn.com/apis/site/v2/sports/basketball/nba/standings"

export const revalidate = 1800

export async function GET() {
  try {
    const res = await fetch(url, { next: { revalidate } })
    if (!res.ok) return NextResponse.json({ error: "upstream" }, { status: 502, headers: { "Access-Control-Allow-Origin": "*" } })
    const data = await res.json()
    return NextResponse.json(data, { headers: { "Access-Control-Allow-Origin": "*" } })
  } catch (e) {
    return NextResponse.json({ error: "failed" }, { status: 502, headers: { "Access-Control-Allow-Origin": "*" } })
  }
}

export async function OPTIONS() {
  return NextResponse.json({}, { headers: { "Access-Control-Allow-Origin": "*", "Access-Control-Allow-Methods": "GET,OPTIONS", "Access-Control-Allow-Headers": "Content-Type" } })
}
