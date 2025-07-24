"use client"

import { useState, useEffect, useCallback } from "react"
import { database } from "@/lib/database"
import { websocket } from "@/lib/websocket"

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
  const [data, setData] = useState<RealTimeData>(() => database.getState())
  const [isConnected, setIsConnected] = useState(true)

  useEffect(() => {
    // S'abonner aux changements de la base de données
    const unsubscribeDb = database.subscribe((newState) => {
      setData(newState)
      console.log("Real-time data updated:", newState.lastUpdate)
    })

    // S'abonner aux messages WebSocket
    const unsubscribeWs = websocket.subscribe((message) => {
      console.log("WebSocket message received:", message.type)
      // Forcer une mise à jour depuis la base de données
      setData(database.getState())
    })

    // Correction: utiliser la propriété getter au lieu de la méthode
    setIsConnected(websocket.isConnected)

    return () => {
      unsubscribeDb()
      unsubscribeWs()
    }
  }, [])

  // Actions qui déclenchent des mises à jour temps réel
  const actions = {
    addArtist: useCallback((artist: Omit<Artist, "id" | "votes" | "totalVotes" | "isBlocked">) => {
      try {
        const newArtist = database.addArtist(artist)
        websocket.broadcast("ARTIST_ADDED", newArtist)
        return newArtist
      } catch (error) {
        console.error("Error adding artist:", error)
        throw error
      }
    }, []),

    deleteArtist: useCallback((id: string) => {
      try {
        const success = database.deleteArtist(id)
        if (success) {
          websocket.broadcast("ARTIST_DELETED", { id })
        }
        return success
      } catch (error) {
        console.error("Error deleting artist:", error)
        throw error
      }
    }, []),

    vote: useCallback((artistId: string, option: string, userAgent = "") => {
      try {
        const success = database.updateArtistVotes(artistId, option, userAgent)
        if (success) {
          websocket.broadcast("VOTE_ADDED", { artistId, option })
        }
        return success
      } catch (error) {
        console.error("Error voting:", error)
        throw error
      }
    }, []),

    toggleArtistBlocked: useCallback((artistId: string, isBlocked: boolean) => {
      try {
        const success = database.toggleArtistBlocked(artistId, isBlocked)
        if (success) {
          websocket.broadcast("ARTIST_BLOCKED", { artistId, isBlocked })
        }
        return success
      } catch (error) {
        console.error("Error toggling artist:", error)
        throw error
      }
    }, []),

    toggleGlobalVoting: useCallback((enabled: boolean) => {
      try {
        const newState = database.toggleGlobalVoting(enabled)
        websocket.broadcast("GLOBAL_VOTING_TOGGLED", { enabled: newState })
        return newState
      } catch (error) {
        console.error("Error toggling global voting:", error)
        throw error
      }
    }, []),

    resetAllVotes: useCallback(() => {
      try {
        database.resetAllVotes()
        websocket.broadcast("VOTES_RESET", {})
      } catch (error) {
        console.error("Error resetting votes:", error)
        throw error
      }
    }, []),
  }

  return {
    ...data,
    isConnected,
    actions,
  }
}
