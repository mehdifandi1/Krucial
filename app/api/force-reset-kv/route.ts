import { NextResponse } from "next/server"
import { kvStore } from "@/lib/kv-store"

export async function POST() {
  try {
    await kvStore.forceReset()
    return NextResponse.json({ success: true, message: "KV database forcefully reset" })
  } catch (error) {
    console.error("Error forcing KV reset:", error)
    return NextResponse.json({ error: "Failed to force reset KV database" }, { status: 500 })
  }
}
