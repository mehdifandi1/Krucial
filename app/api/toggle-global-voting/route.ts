import { NextResponse } from "next/server"
import { toggleGlobalVoting } from "@/lib/kv-store" // Utilise le nouveau store KV

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { enabled } = body

    const newState = await toggleGlobalVoting(enabled) // Appel asynchrone

    return NextResponse.json({
      success: true,
      enabled: newState,
      message: `Votes globaux ${newState ? "activés" : "désactivés"}`,
    })
  } catch (error) {
    console.error("Error toggling global voting:", error)
    return NextResponse.json({ error: "Failed to toggle global voting" }, { status: 500 })
  }
}
