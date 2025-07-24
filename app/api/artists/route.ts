import { NextResponse } from "next/server"
import { getArtists } from "@/lib/kv-store" // Utilise le nouveau store KV

export async function GET() {
  try {
    const artists = await getArtists() // Appel asynchrone

    const response = NextResponse.json({
      artists: artists,
      timestamp: Date.now(), // Le timestamp est généré ici pour le client
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

// POST route for artists is now handled by app/api/admin/artists/route.ts
// This file only needs GET for public access
