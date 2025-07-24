import { NextResponse } from "next/server"
import { getVoteHistory } from "@/lib/kv-store" // Utilise le nouveau store KV

export async function GET() {
  try {
    const history = await getVoteHistory() // Appel asynchrone

    const response = NextResponse.json({
      history: history,
      count: history.length,
    })

    // Headers pour éviter le cache
    response.headers.set("Cache-Control", "no-store, no-cache, must-revalidate, proxy-revalidate")
    response.headers.set("Pragma", "no-cache")
    response.headers.set("Expires", "0")

    return response
  } catch (error) {
    console.error("Error fetching vote history:", error)
    return NextResponse.json({ error: "Failed to fetch vote history" }, { status: 500 })
  }
}
