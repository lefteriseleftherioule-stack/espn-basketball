import Scoreboard from "@/components/Scoreboard"

export const dynamic = "force-static"

export default function EmbedPage() {
  return (
    <main className="container">
      <div>
        <Scoreboard />
      </div>
    </main>
  )
}
