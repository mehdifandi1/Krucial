import { NextResponse } from "next/server"
import { updateArtistVotes } from "@/lib/kv-store" // Utilise le nouveau store KV
import { headers } from "next/headers"

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { votes, userAgent } = body

    console.log("🗳️ API: Nouveau vote reçu (KV):", Object.keys(votes))

    if (!votes || typeof votes !== "object") {
      return NextResponse.json({ error: "Invalid votes data" }, { status: 400 })
    }

    // Récupérer l'IP du client
    const headersList = headers()
    const forwardedFor = headersList.get("x-forwarded-for")
    const realIp = headersList.get("x-real-ip")
    const clientIp = forwardedFor?.split(",")[0] || realIp || "unknown"

    let successCount = 0

    // Traiter chaque vote
    for (const [artistId, selectedOption] of Object.entries(votes)) {
      if (typeof selectedOption !== "string") continue

      try {
        const success = await updateArtistVotes(artistId, selectedOption, userAgent, clientIp) // Met à jour les votes dans KV

        if (success) {
          successCount++
          console.log("✅ Vote enregistré (KV):", artistId, "-", selectedOption)
        } else {
          console.warn("⚠️ Vote non enregistré (KV) pour:", artistId, "-", selectedOption)
        }
      } catch (error) {
        console.error("❌ Erreur traitement vote (KV):", error)
      }
    }

    console.log(`✅ API: ${successCount} votes enregistrés (KV)`)

    return NextResponse.json({
      success: true,
      message: `${successCount} votes enregistrés (KV)`,
      votesProcessed: successCount,
      timestamp: Date.now(),
      source: "kv",
    })
  } catch (error) {
    console.error("❌ API Vote Error (KV):", error)
    return NextResponse.json(
      {
        error: "Failed to submit votes",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    )
  }
}
