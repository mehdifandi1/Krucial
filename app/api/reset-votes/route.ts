import { NextResponse } from "next/server"
import { kvStore } from "@/lib/kv-store" // Importe le nouveau kvStore

export async function POST() {
  try {
    await kvStore.resetAllVotes() // Utilise kvStore
    return NextResponse.json({ success: true, message: "Tous les votes ont été réinitialisés" })
  } catch (error) {
    console.error("Error resetting votes:", error)
    return NextResponse.json({ error: "Failed to reset votes" }, { status: 500 })
  }
}
