import { NextResponse } from "next/server"
import { kvStore } from "@/lib/kv-store" // Importe le nouveau kvStore

export async function DELETE(request: Request, { params }: { params: { id: string } }) {
  try {
    const { id } = params
    const success = await kvStore.deleteArtist(id) // Utilise kvStore

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
