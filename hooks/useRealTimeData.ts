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
  timestamp: string
  userAgent: string
}

interface RealTimeData {
  artists: Artist[]
  voteHistory: VoteRecord[]
  globalVotingEnabled: boolean
  lastUpdate: number
}

export function useRealTimeData() {
  const [data, setData] = useState<RealTimeData>({
    artists: [],
    voteHistory: [],
    globalVotingEnabled: true,
    lastUpdate: Date.now(),
  })
  const [isConnected, setIsConnected] = useState(true)
  const lastFetchedTimestamp = useRef(0) // Pour optimiser le polling

  // Fonction pour récupérer les données depuis l'API
  const fetchData = useCallback(async () => {
    try {
      const response = await fetch(`/api/artists?_=${Date.now()}`) // Ajout d'un paramètre pour éviter le cache
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }
      const result = await response.json()

      // Récupérer l'historique séparément
      const historyResponse = await fetch(`/api/vote-history?_=${Date.now()}`)
      if (!historyResponse.ok) {
        throw new Error(`HTTP error! status: ${historyResponse.status}`)
      }
      const historyResult = await historyResponse.json()

      // Mettre à jour l'état seulement si le timestamp est plus récent
      if (result.timestamp > lastFetchedTimestamp.current) {
        setData({
          artists: result.artists,
          globalVotingEnabled: result.globalVotingEnabled,
          voteHistory: historyResult.history,
          lastUpdate: result.timestamp,
        })
        lastFetchedTimestamp.current = result.timestamp
        setIsConnected(true)
      }
    } catch (error) {
      console.error("Failed to fetch real-time data:", error)
      setIsConnected(false)
    }
  }, [])

  useEffect(() => {
    // Récupérer les données initiales
    fetchData()

    // Mettre en place le polling toutes les 1.5 secondes
    const interval = setInterval(fetchData, 1500)

    return () => clearInterval(interval)
  }, [fetchData])

  // Actions qui appellent les API routes
  const actions = {
    addArtist: useCallback(
      async (artist: Omit<Artist, "id" | "votes" | "totalVotes" | "isBlocked">) => {
        const response = await fetch("/api/artists", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(artist),
        })
        if (!response.ok) throw new Error("Failed to add artist")
        await fetchData() // Rafraîchir les données après l'action
        return response.json()
      },
      [fetchData],
    ),

    deleteArtist: useCallback(
      async (id: string) => {
        const response = await fetch(`/api/artists/${id}`, {
          method: "DELETE",
        })
        if (!response.ok) throw new Error("Failed to delete artist")
        await fetchData()
        return response.json()
      },
      [fetchData],
    ),

    vote: useCallback(
      async (artistId: string, option: string, userAgent = "") => {
        const response = await fetch("/api/vote", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ votes: { [artistId]: option }, userAgent }),
        })
        if (!response.ok) throw new Error("Failed to submit vote")
        await fetchData()
        return response.json()
      },
      [fetchData],
    ),

    toggleArtistBlocked: useCallback(
      async (artistId: string, isBlocked: boolean) => {
        const response = await fetch(`/api/artists/${artistId}/toggle-voting`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ isBlocked }),
        })
        if (!response.ok) throw new Error("Failed to toggle artist voting")
        await fetchData()
        return response.json()
      },
      [fetchData],
    ),

    toggleGlobalVoting: useCallback(
      async (enabled: boolean) => {
        const response = await fetch("/api/toggle-global-voting", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ enabled }),
        })
        if (!response.ok) throw new Error("Failed to toggle global voting")
        await fetchData()
        return response.json()
      },
      [fetchData],
    ),

    resetAllVotes: useCallback(async () => {
      const response = await fetch("/api/reset-votes", {
        method: "POST",
      })
      if (!response.ok) throw new Error("Failed to reset votes")
      await fetchData()
      return response.json()
    }, [fetchData]),

    // Nouvelle action pour forcer la réinitialisation de la DB KV
    forceResetKV: useCallback(async () => {
      const response = await fetch("/api/force-reset-kv", {
        method: "POST",
      })
      if (!response.ok) throw new Error("Failed to force reset KV database")
      await fetchData()
      return response.json()
    }, [fetchData]),
  }

  return {
    ...data,
    isConnected,
    actions,
  }
}
