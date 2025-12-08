import NewsList from "@/components/NewsList"
import Scoreboard from "@/components/Scoreboard"
import StandingsTable from "@/components/StandingsTable"

export const dynamic = "force-static"

export default function EmbedPage() {
  return (
    <main className="container">
      <div className="grid">
        <NewsList />
        <Scoreboard />
        <StandingsTable />
      </div>
    </main>
  )
}
