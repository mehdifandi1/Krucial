import { Redis } from "@upstash/redis"
import { type NextRequest, NextResponse } from "next/server"

const VOTE_CHANNEL = "krucial:votes" // Le même canal que dans kv-store.ts

export const runtime = "edge" // Utiliser le runtime Edge pour les SSE

export async function GET(req: NextRequest) {
  const redis = Redis.fromEnv()

  // Headers pour les Server-Sent Events
  const headers = {
    "Content-Type": "text/event-stream",
    "Cache-Control": "no-cache, no-transform",
    Connection: "keep-alive",
  }

  // Créer un ReadableStream pour envoyer les événements
  const stream = new ReadableStream({
    start(controller) {
      let subscriber: any = null // Pour stocker l'instance du subscriber

      const connectRedis = async () => {
        try {
          // Utiliser un client Redis séparé pour le mode SUBSCRIBE
          // Upstash recommande un client dédié pour Pub/Sub
          const subRedis = Redis.fromEnv()
          subscriber = subRedis.subscribe(VOTE_CHANNEL)

          console.log(`SSE: Subscribed to Redis channel: ${VOTE_CHANNEL}`)

          for await (const message of subscriber) {
            if (message.type === "message") {
              console.log("SSE: Received message from Redis:", message.message)
              // Envoyer un événement "update" au client
              controller.enqueue(`event: update\ndata: ${message.message}\n\n`)
            }
          }
        } catch (error) {
          console.error("SSE: Redis subscription error:", error)
          controller.enqueue(
            `event: error\ndata: ${JSON.stringify({ error: error instanceof Error ? error.message : "Unknown error" })}\n\n`,
          )
          controller.close()
        }
      }

      connectRedis()

      // Gérer la déconnexion du client
      req.signal.onabort = () => {
        console.log("SSE: Client disconnected. Unsubscribing from Redis.")
        if (subscriber) {
          subscriber.return() // Terminer l'itération asynchrone du subscriber
        }
        controller.close()
      }
    },
    cancel() {
      console.log("SSE: Stream cancelled.")
    },
  })

  return new NextResponse(stream, { headers })
}
