import type { Metadata } from "next"
import "./globals.css"

export const metadata: Metadata = {
  title: "Basketball Hub",
  description: "NBA news, scores, standings"
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  )
}
