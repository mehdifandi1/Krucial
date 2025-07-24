import { NextResponse } from "next/server"
import { database } from "@/lib/database"

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { votes, userAgent } = body

    console.log("API - Received votes:", votes)

    if (!votes || typeof votes !== "object") {
      return NextResponse.json({ error: "Invalid votes data" }, { status: 400 })
    }

    // Traiter chaque vote
    let successCount = 0
    Object.entries(votes).forEach(([artistId, selectedOption]) => {
      if (typeof selectedOption === "string") {
        const success = database.updateArtistVotes(artistId, selectedOption, userAgent || "")
        if (success) {
          successCount++
        }
      }
    })

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
