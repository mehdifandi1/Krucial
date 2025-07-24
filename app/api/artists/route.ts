import { NextResponse } from "next/server"
import { kvStore } from "@/lib/kv-store" // Importe le nouveau kvStore

export async function GET() {
  try {
    const state = await kvStore.getState() // Utilise kvStore

    const response = NextResponse.json({
      artists: state.artists,
      globalVotingEnabled: state.globalVotingEnabled,
      timestamp: state.lastUpdate,
    })

    // Headers pour éviter le cache
    response.headers.set("Cache-Control", "no-store, no-cache, must-revalidate, proxy-revalidate")
    response.headers.set("Pragma", "no-cache")
    response.headers.set("Expires", "0")

    return response
  } catch (error) {
    console.error("Error in artists API:", error)
    return NextResponse.json({ error: "Failed to fetch artists" }, { status: 500 })
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { name, timeSlot, options } = body

    if (!name || !timeSlot || !options || options.length !== 2) {
      return NextResponse.json({ error: "Missing required fields or invalid options" }, { status: 400 })
    }

    const result = await kvStore.addArtist({ name, timeSlot, options }) // Utilise kvStore

    const response = NextResponse.json(result)
    response.headers.set("Cache-Control", "no-store")

    return response
  } catch (error) {
    console.error("Error adding artist:", error)
    return NextResponse.json({ error: "Failed to add artist" }, { status: 500 })
  }
}
