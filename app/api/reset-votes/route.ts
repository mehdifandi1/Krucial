import { NextResponse } from "next/server"
import { database } from "@/lib/database"

export async function POST() {
  try {
    database.resetAllVotes()
    return NextResponse.json({ success: true, message: "Tous les votes ont été réinitialisés" })
  } catch (error) {
    console.error("Error resetting votes:", error)
    return NextResponse.json({ error: "Failed to reset votes" }, { status: 500 })
  }
}
