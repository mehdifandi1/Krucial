"use client"

import { useState, useEffect, useCallback, useRef } from "react"

interface Artist {
  id: string
  name: string
  timeSlot: string
  options: string[]
  votes: { [key: string]: number }
  totalVotes: number
  isBlocked: boolean
}

interface VoteRecord {
  id: string
  artistId: string
  artistName: string
  selectedOption: string
  userAgent: string
  ipAddress?: string
  createdAt: string
}

interface RealTimeData {
  artists: Artist[]
  voteHistory: VoteRecord[]
  globalVotingEnabled: boolean
  lastUpdate: number
  source?: string // Indique la source des données (ex: "kv")
  isConnected: boolean // Indique si la connexion à la source de données est active
  message?: string // Message d'information ou d'erreur
  error?: string // Message d'erreur détaillé
}

export function useRealTimeData() {
  const [data, setData] = useState<RealTimeData>({
    artists: [],
    voteHistory: [],
    globalVotingEnabled: true,
    lastUpdate: Date.now(),
    source: "loading",
    isConnected: false,
    message: "Chargement des données...",
    error: null,
  })

  const eventSourceRef = useRef<EventSource | null>(null)
  const reconnectTimeoutRef = useRef<NodeJS.Timeout | null>(null)

  const fetchData = useCallback(async () => {
    try {
      console.log("🔄 Récupération des données depuis l'API locale (/api/data)...")

      const response = await fetch("/api/data", {
        cache: "no-store",
        headers: {
          "Cache-Control": "no-cache",
        },
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || `HTTP ${response.status}: ${response.statusText}`)
      }

      const newData = await response.json()

      setData((prev) => ({
        ...prev,
        artists: newData.artists || [],
        voteHistory: newData.voteHistory || [],
        globalVotingEnabled: newData.globalVotingEnabled,
        lastUpdate: newData.lastUpdate || Date.now(),
        source: newData.source || "kv",
        isConnected: newData.isConnected,
        message: newData.message || "Connecté à Vercel KV",
        error: newData.error || null,
      }))

      console.log(`✅ Données mises à jour depuis ${newData.source || "kv"}:`, {
        artists: newData.artists?.length,
        votes: newData.voteHistory?.length,
        timestamp: new Date(newData.lastUpdate || Date.now()).toLocaleTimeString(),
      })
      return newData
    } catch (error) {
      console.error("❌ Erreur récupération données (useRealTimeData):", error)
      setData((prev) => ({
        ...prev,
        isConnected: false,
        error: error instanceof Error ? error.message : "Erreur inconnue",
        message: "Connexion perdue ou erreur de l'API de données",
        source: "disconnected",
      }))
      return null
    }
  }, [])

  const connectSSE = useCallback(() => {
    if (eventSourceRef.current && eventSourceRef.current.readyState === EventSource.OPEN) {
      return // Already connected
    }

    console.log("Attempting to connect to SSE /api/realtime-updates...")
    const es = new EventSource("/api/realtime-updates")

    es.onopen = () => {
      console.log("SSE connected")
      setData((prev) => ({ ...prev, isConnected: true, error: null, message: "Connecté à Vercel KV" }))
      if (reconnectTimeoutRef.current) {
        clearTimeout(reconnectTimeoutRef.current)
        reconnectTimeoutRef.current = null
      }
      fetchData() // Fetch initial data on connect
    }

    es.onmessage = (event) => {
      // This is a fallback for generic messages, 'update' event is preferred
      console.log("SSE: Generic message received:", event.data)
      fetchData() // Trigger data refresh on any message
    }

    es.addEventListener("update", (event) => {
      console.log("SSE: 'update' event received:", event.data)
      fetchData() // Trigger data refresh on specific 'update' event
    })

    es.onerror = (error) => {
      console.error("SSE error:", error)
      es.close() // Close current connection to trigger onclose
      setData((prev) => ({
        ...prev,
        isConnected: false,
        message: "Connexion SSE perdue. Tentative de reconnexion...",
        error: "SSE connection error",
      }))
      if (!reconnectTimeoutRef.current) {
        reconnectTimeoutRef.current = setTimeout(() => {
          console.log("Reconnecting SSE...")
          connectSSE()
        }, 3000) // Try to reconnect every 3 seconds
      }
    }

    eventSourceRef.current = es
  }, [fetchData])

  useEffect(() => {
    fetchData() // Initial data fetch on component mount
    connectSSE() // Initial SSE connection attempt

    return () => {
      if (eventSourceRef.current) {
        eventSourceRef.current.close()
      }
      if (reconnectTimeoutRef.current) {
        clearTimeout(reconnectTimeoutRef.current)
      }
    }
  }, [fetchData, connectSSE])

  // Actions qui interagissent avec les API Next.js (qui utilisent Vercel KV)
  const actions = {
    voteMultiple: useCallback(async (votes: { [key: string]: string }, userAgent = "") => {
      try {
        console.log("🗳️ Envoi des votes vers l'API Next.js (/api/vote)...", Object.keys(votes))

        const response = await fetch("/api/vote", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "X-User-Agent": userAgent,
          },
          body: JSON.stringify({ votes, userAgent }),
        })

        if (!response.ok) {
          const errorData = await response.json()
          throw new Error(errorData.error || `HTTP ${response.status}`)
        }

        const result = await response.json()
        console.log("✅ Votes envoyés avec succès (via KV API):", result.votesProcessed)
        // SSE will push updates, no need to fetchData here
        return true
      } catch (error) {
        console.error("❌ Erreur envoi votes (KV API):", error)
        throw error
      }
    }, []),

    addArtist: useCallback(async (artist: Omit<Artist, "id" | "votes" | "totalVotes" | "isBlocked">) => {
      try {
        const response = await fetch("/api/admin/artists", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(artist),
        })
        if (!response.ok) throw new Error("Failed to add artist")
        // SSE will push updates
        return true
      } catch (error) {
        console.error("Error adding artist:", error)
        throw error
      }
    }, []),

    deleteArtist: useCallback(async (id: string) => {
      try {
        const response = await fetch(`/api/admin/artists/${id}`, { method: "DELETE" })
        if (!response.ok) throw new Error("Failed to delete artist")
        // SSE will push updates
        return true
      } catch (error) {
        console.error("Error deleting artist:", error)
        throw error
      }
    }, []),

    toggleArtistBlocked: useCallback(async (artistId: string, isBlocked: boolean) => {
      try {
        const response = await fetch(`/api/artists/${artistId}/toggle-voting`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ isBlocked }),
        })
        if (!response.ok) throw new Error("Failed to toggle artist")
        // SSE will push updates
        return true
      } catch (error) {
        console.error("Error toggling artist voting:", error)
        throw error
      }
    }, []),

    toggleGlobalVoting: useCallback(async (enabled: boolean) => {
      try {
        const response = await fetch("/api/toggle-global-voting", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ enabled }),
        })
        if (!response.ok) throw new Error("Failed to toggle global voting")
        // SSE will push updates
        return enabled
      } catch (error) {
        console.error("Error toggling global voting:", error)
        throw error
      }
    }, []),

    resetAllVotes: useCallback(async () => {
      try {
        const response = await fetch("/api/reset-votes", { method: "POST" })
        if (!response.ok) throw new Error("Failed to reset votes")
        // SSE will push updates
        console.log("✅ Votes réinitialisés (KV API)")
      } catch (error) {
        console.error("❌ Erreur reset (KV API):", error)
        throw error
      }
    }, []),
  }

  return {
    ...data,
    actions,
  }
}
