import { NextResponse } from "next/server"
import { database } from "@/lib/database"

export async function POST(request: Request, { params }: { params: { id: string } }) {
  try {
    const { id } = params
    const body = await request.json()
    const { isBlocked } = body

    const success = database.toggleArtistBlocked(id, isBlocked)

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
