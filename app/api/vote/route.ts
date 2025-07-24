import { NextResponse } from "next/server"
import { kvStore } from "@/lib/kv-store" // Importe le nouveau kvStore

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { votes, userAgent } = body

    console.log("API - Received votes:", votes)

    if (!votes || typeof votes !== "object") {
      return NextResponse.json({ error: "Invalid votes data" }, { status: 400 })
    }

    let successCount = 0
    for (const [artistId, selectedOption] of Object.entries(votes)) {
      if (typeof selectedOption === "string") {
        const success = await kvStore.updateArtistVotes(artistId, selectedOption, userAgent || "") // Utilise kvStore
        if (success) {
          successCount++
        }
      }
    }

    console.log(`API - ${successCount} votes recorded successfully`)

    const response = NextResponse.json({
      success: true,
      message: `${successCount} votes enregistrés`,
      timestamp: Date.now(),
    })

    response.headers.set("Cache-Control", "no-store")
    return response
  } catch (error) {
    console.error("Error submitting votes:", error)
    return NextResponse.json({ error: "Failed to submit votes" }, { status: 500 })
  }
}
