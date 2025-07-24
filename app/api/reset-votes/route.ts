import { NextResponse } from "next/server"
import { resetAllVotes } from "@/lib/kv-store" // Utilise le nouveau store KV

export async function POST() {
  try {
    await resetAllVotes() // Appel asynchrone
    return NextResponse.json({ success: true, message: "Tous les votes ont été réinitialisés" })
  } catch (error) {
    console.error("Error resetting votes:", error)
    return NextResponse.json({ error: "Failed to reset votes" }, { status: 500 })
  }
}
