import { NextResponse } from "next/server"
import { addArtist } from "@/lib/kv-store" // Utilise le nouveau store KV

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { name, timeSlot, options } = body

    if (!name || !timeSlot || !options || options.length !== 2) {
      return NextResponse.json({ error: "Missing required fields or invalid options" }, { status: 400 })
    }

    const result = await addArtist({ name, timeSlot, options }) // Appel asynchrone

    const response = NextResponse.json(result)
    response.headers.set("Cache-Control", "no-store")

    return response
  } catch (error) {
    console.error("Error adding artist:", error)
    return NextResponse.json({ error: "Failed to add artist" }, { status: 500 })
  }
}
