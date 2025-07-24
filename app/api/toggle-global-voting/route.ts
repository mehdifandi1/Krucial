import { NextResponse } from "next/server"
import { kvStore } from "@/lib/kv-store" // Importe le nouveau kvStore

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { enabled } = body

    const newState = await kvStore.toggleGlobalVoting(enabled) // Utilise kvStore

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
