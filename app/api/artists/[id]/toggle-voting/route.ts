import { NextResponse } from "next/server"
import { toggleArtistBlocked } from "@/lib/kv-store" // Utilise le nouveau store KV

export async function POST(request: Request, { params }: { params: { id: string } }) {
  try {
    const { id } = params
    const body = await request.json()
    const { isBlocked } = body

    const success = await toggleArtistBlocked(id, isBlocked) // Appel asynchrone

    if (success) {
      return NextResponse.json({ success: true, isBlocked })
    } else {
      return NextResponse.json({ error: "Artist not found" }, { status: 404 })
    }
  } catch (error) {
    console.error("Error toggling artist voting:", error)
    return NextResponse.json({ error: "Failed to toggle voting" }, { status: 500 })
  }
}
