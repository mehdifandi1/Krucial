// Base de données persistante avec localStorage comme fallback
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

interface DatabaseState {
  artists: Artist[]
  voteHistory: VoteRecord[]
  globalVotingEnabled: boolean
  lastUpdate: number
  version: number // Ajout d'une version pour forcer les mises à jour
}

class Database {
  private state: DatabaseState
  private listeners: Set<(state: DatabaseState) => void> = new Set()
  private currentVersion = 2 // Incrémenter pour forcer la mise à jour

  constructor() {
    this.state = this.loadFromStorage()
  }

  private loadFromStorage(): DatabaseState {
    if (typeof window === "undefined") {
      return this.getDefaultState()
    }

    try {
      const saved = localStorage.getItem("krucial-voting-db")
      if (saved) {
        const parsed = JSON.parse(saved)
        // Vérifier la version - si différente, utiliser les nouvelles données
        if (parsed.version !== this.currentVersion) {
          console.log("Database version mismatch, loading new data")
          return this.getDefaultState()
        }
        return {
          ...this.getDefaultState(),
          ...parsed,
          lastUpdate: Date.now(),
        }
      }
    } catch (error) {
      console.error("Error loading from storage:", error)
    }

    return this.getDefaultState()
  }

  private getDefaultState(): DatabaseState {
    return {
      version: this.currentVersion,
      artists: [
        {
          id: "1",
          name: "KINESI",
          timeSlot: "01h00 - 02h20",
          options: ["Que Calor ! → Latino - Rave - Hard Bounce", "Hell Raver → Metal - Hard Techno - Indus"],
          votes: {
            "Que Calor ! → Latino - Rave - Hard Bounce": 0,
            "Hell Raver → Metal - Hard Techno - Indus": 0,
          },
          totalVotes: 0,
          isBlocked: false,
        },
        {
          id: "2",
          name: "AZKAËL",
          timeSlot: "02h20 - 03h40",
          options: [
            "Mystical Tekno → melodic tekno - acidcore - tribecore",
            "Rave Tekno → rave - tekno - hybrid tekno",
          ],
          votes: {
            "Mystical Tekno → melodic tekno - acidcore - tribecore": 0,
            "Rave Tekno → rave - tekno - hybrid tekno": 0,
          },
          totalVotes: 0,
          isBlocked: false,
        },
        {
          id: "3",
          name: "HANNIBASS",
          timeSlot: "03h40 - 04h40",
          options: ["Versatile → tekno - hard music - bass music", "Overdrive → tekno, rawstyle, uptempo"],
          votes: {
            "Versatile → tekno - hard music - bass music": 0,
            "Overdrive → tekno, rawstyle, uptempo": 0,
          },
          totalVotes: 0,
          isBlocked: false,
        },
        {
          id: "4",
          name: "SKEPTX",
          timeSlot: "04h40 - 06h00",
          options: ["Rapture → Tekno to DnB", "Assault → Tekno to Hardcore"],
          votes: {
            "Rapture → Tekno to DnB": 0,
            "Assault → Tekno to Hardcore": 0,
          },
          totalVotes: 0,
          isBlocked: false,
        },
      ],
      voteHistory: [],
      globalVotingEnabled: true,
      lastUpdate: Date.now(),
    }
  }

  private saveToStorage() {
    if (typeof window !== "undefined") {
      try {
        localStorage.setItem("krucial-voting-db", JSON.stringify(this.state))
      } catch (error) {
        console.error("Error saving to storage:", error)
      }
    }
  }

  private notifyListeners() {
    this.state.lastUpdate = Date.now()
    this.saveToStorage()
    this.listeners.forEach((listener) => {
      try {
        listener({ ...this.state })
      } catch (error) {
        console.error("Error notifying listener:", error)
      }
    })
  }

  // Méthode pour forcer la réinitialisation avec les nouvelles données
  forceReset() {
    this.state = this.getDefaultState()
    this.notifyListeners()
    console.log("Database forcefully reset with new data")
  }

  // Public methods
  getState(): DatabaseState {
    return { ...this.state }
  }

  subscribe(listener: (state: DatabaseState) => void): () => void {
    this.listeners.add(listener)
    // Envoyer l'état initial
    listener({ ...this.state })
    return () => this.listeners.delete(listener)
  }

  addArtist(artist: Omit<Artist, "id" | "votes" | "totalVotes" | "isBlocked">): Artist {
    const newArtist: Artist = {
      ...artist,
      id: Date.now().toString(),
      votes: artist.options.reduce(
        (acc, option) => {
          acc[option] = 0
          return acc
        },
        {} as { [key: string]: number },
      ),
      totalVotes: 0,
      isBlocked: false,
    }

    this.state.artists.push(newArtist)
    this.notifyListeners()
    console.log("Artist added:", newArtist.name)
    return newArtist
  }

  deleteArtist(id: string): boolean {
    const initialLength = this.state.artists.length
    this.state.artists = this.state.artists.filter((artist) => artist.id !== id)

    if (this.state.artists.length !== initialLength) {
      // Nettoyer l'historique des votes pour cet artiste
      this.state.voteHistory = this.state.voteHistory.filter((vote) => vote.artistId !== id)
      this.notifyListeners()
      console.log("Artist deleted:", id)
      return true
    }
    return false
  }

  updateArtistVotes(artistId: string, option: string, userAgent = ""): boolean {
    const artist = this.state.artists.find((a) => a.id === artistId)

    if (artist && !artist.isBlocked && this.state.globalVotingEnabled) {
      artist.votes[option] = (artist.votes[option] || 0) + 1
      artist.totalVotes = Object.values(artist.votes).reduce((sum, count) => sum + count, 0)

      // Ajouter à l'historique
      const voteRecord: VoteRecord = {
        id: Date.now().toString() + Math.random().toString(36).substr(2, 9),
        artistId,
        artistName: artist.name,
        selectedOption: option,
        timestamp: new Date().toISOString(),
        userAgent,
      }
      this.state.voteHistory.push(voteRecord)

      this.notifyListeners()
      console.log(`Vote recorded: ${artist.name} - ${option}`)
      return true
    }
    return false
  }

  toggleArtistBlocked(artistId: string, isBlocked: boolean): boolean {
    const artist = this.state.artists.find((a) => a.id === artistId)
    if (artist) {
      artist.isBlocked = isBlocked
      this.notifyListeners()
      console.log(`Artist ${artist.name} ${isBlocked ? "blocked" : "unblocked"}`)
      return true
    }
    return false
  }

  toggleGlobalVoting(enabled: boolean): boolean {
    this.state.globalVotingEnabled = enabled
    this.notifyListeners()
    console.log(`Global voting ${enabled ? "enabled" : "disabled"}`)
    return enabled
  }

  resetAllVotes(): void {
    this.state.artists.forEach((artist) => {
      Object.keys(artist.votes).forEach((option) => {
        artist.votes[option] = 0
      })
      artist.totalVotes = 0
    })
    this.state.voteHistory = []
    this.notifyListeners()
    console.log("All votes reset")
  }
}

// Instance globale
export const database = new Database()

// Forcer la mise à jour au chargement si nécessaire
if (typeof window !== "undefined") {
  // Vérifier si on doit forcer la mise à jour
  const saved = localStorage.getItem("krucial-voting-db")
  if (saved) {
    try {
      const parsed = JSON.parse(saved)
      if (parsed.version !== 2) {
        console.log("Forcing database update...")
        database.forceReset()
      }
    } catch (error) {
      console.log("Error checking version, forcing reset...")
      database.forceReset()
    }
  }
}
