import { NextResponse } from "next/server"
import { database } from "@/lib/database"

export async function DELETE(request: Request, { params }: { params: { id: string } }) {
  try {
    const { id } = params
    const success = database.deleteArtist(id)

    if (success) {
      return NextResponse.json({ success: true })
    } else {
      return NextResponse.json({ error: "Artist not found" }, { status: 404 })
    }
  } catch (error) {
    console.error("Error deleting artist:", error)
    return NextResponse.json({ error: "Failed to delete artist" }, { status: 500 })
  }
}
