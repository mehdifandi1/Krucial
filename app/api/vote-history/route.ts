import { NextResponse } from "next/server"
import { kvStore } from "@/lib/kv-store" // Importe le nouveau kvStore

export async function GET() {
  try {
    const state = await kvStore.getState() // Utilise kvStore

    const response = NextResponse.json({
      history: state.voteHistory,
      count: state.voteHistory.length,
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
