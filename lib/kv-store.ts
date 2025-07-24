import { Redis } from "@upstash/redis"

// Interfaces pour les types de données
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
  version: number // Version de la structure de la base de données
}

// Initialisation du client Redis (singleton pour éviter de multiples connexions)
let redis: Redis | null = null
const getRedisClient = () => {
  if (!redis) {
    if (!process.env.KV_REST_API_URL || !process.env.KV_REST_API_TOKEN) {
      // En environnement de développement, on peut simuler ou lancer une erreur
      // En production, ces variables DOIVENT être définies
      console.warn("KV_REST_API_URL or KV_REST_API_TOKEN is not set. Using a dummy Redis client for development.")
      // Fallback pour le développement local sans variables d'env
      // En production, cela devrait être une erreur fatale
      return {
        get: async () => null,
        set: async () => {},
        del: async () => {},
      } as any // Cast pour éviter les erreurs de type en dev
    }
    redis = new Redis({
      url: process.env.KV_REST_API_URL,
      token: process.env.KV_REST_API_TOKEN,
    })
  }
  return redis
}

const STATE_KEY = "krucial-voting-state"
const VERSION_KEY = "krucial-voting-version"
const CURRENT_DB_VERSION = 3 // Incrémenter pour forcer la mise à jour des données par défaut

class KVStore {
  private redis: Redis

  constructor() {
    this.redis = getRedisClient()
  }

  // Charge l'état depuis Redis, ou initialise avec les données par défaut si vide ou version différente
  private async loadState(): Promise<DatabaseState> {
    try {
      const savedState = await this.redis.get<DatabaseState>(STATE_KEY)
      const savedVersion = await this.redis.get<number>(VERSION_KEY)

      if (savedState && savedVersion === CURRENT_DB_VERSION) {
        return { ...savedState, lastUpdate: Date.now() }
      } else {
        // Si pas d'état sauvegardé ou version différente, initialiser avec les données par défaut
        const defaultState = this.getDefaultState()
        await this.saveState(defaultState) // Sauvegarde l'état par défaut
        await this.redis.set(VERSION_KEY, CURRENT_DB_VERSION) // Sauvegarde la version
        console.log("KVStore initialized/updated to default state (version mismatch or no state).")
        return defaultState
      }
    } catch (error) {
      console.error("Error loading state from KVStore, returning default:", error)
      // En cas d'erreur (ex: connexion Redis), retourner l'état par défaut
      return this.getDefaultState()
    }
  }

  // Sauvegarde l'état actuel dans Redis
  private async saveState(state: DatabaseState): Promise<void> {
    state.lastUpdate = Date.now()
    state.version = CURRENT_DB_VERSION // S'assurer que la version est toujours à jour
    try {
      await this.redis.set(STATE_KEY, state)
    } catch (error) {
      console.error("Error saving state to KVStore:", error)
    }
  }

  // Définit l'état par défaut de l'application
  private getDefaultState(): DatabaseState {
    return {
      version: CURRENT_DB_VERSION,
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

  // Méthodes publiques pour interagir avec l'état
  async getState(): Promise<DatabaseState> {
    return this.loadState()
  }

  async addArtist(artist: Omit<Artist, "id" | "votes" | "totalVotes" | "isBlocked">): Promise<Artist> {
    const state = await this.loadState()
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
    state.artists.push(newArtist)
    await this.saveState(state)
    console.log("Artist added:", newArtist.name)
    return newArtist
  }

  async deleteArtist(id: string): Promise<boolean> {
    const state = await this.loadState()
    const initialLength = state.artists.length
    state.artists = state.artists.filter((artist) => artist.id !== id)

    if (state.artists.length !== initialLength) {
      state.voteHistory = state.voteHistory.filter((vote) => vote.artistId !== id)
      await this.saveState(state)
      console.log("Artist deleted:", id)
      return true
    }
    return false
  }

  async updateArtistVotes(artistId: string, option: string, userAgent = ""): Promise<boolean> {
    const state = await this.loadState()
    const artist = state.artists.find((a) => a.id === artistId)

    if (artist && !artist.isBlocked && state.globalVotingEnabled) {
      artist.votes[option] = (artist.votes[option] || 0) + 1
      artist.totalVotes = Object.values(artist.votes).reduce((sum, count) => sum + count, 0)

      const voteRecord: VoteRecord = {
        id: Date.now().toString() + Math.random().toString(36).substr(2, 9),
        artistId,
        artistName: artist.name,
        selectedOption: option,
        timestamp: new Date().toISOString(),
        userAgent,
      }
      state.voteHistory.push(voteRecord)

      await this.saveState(state)
      console.log(`Vote recorded: ${artist.name} - ${option}`)
      return true
    }
    return false
  }

  async toggleArtistBlocked(artistId: string, isBlocked: boolean): Promise<boolean> {
    const state = await this.loadState()
    const artist = state.artists.find((a) => a.id === artistId)
    if (artist) {
      artist.isBlocked = isBlocked
      await this.saveState(state)
      console.log(`Artist ${artist.name} ${isBlocked ? "blocked" : "unblocked"}`)
      return true
    }
    return false
  }

  async toggleGlobalVoting(enabled: boolean): Promise<boolean> {
    const state = await this.loadState()
    state.globalVotingEnabled = enabled
    await this.saveState(state)
    console.log(`Global voting ${enabled ? "enabled" : "disabled"}`)
    return enabled
  }

  async resetAllVotes(): Promise<void> {
    const state = await this.loadState()
    state.artists.forEach((artist) => {
      Object.keys(artist.votes).forEach((option) => {
        artist.votes[option] = 0
      })
      artist.totalVotes = 0
    })
    state.voteHistory = []
    await this.saveState(state)
    console.log("All votes reset")
  }

  async forceReset(): Promise<void> {
    const defaultState = this.getDefaultState()
    await this.saveState(defaultState)
    await this.redis.set(VERSION_KEY, CURRENT_DB_VERSION)
    console.log("KVStore forcefully reset with new data")
  }
}

export const kvStore = new KVStore()
