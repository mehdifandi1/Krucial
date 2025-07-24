import { Redis } from "@upstash/redis"

// Initialise le client Redis
const redis = Redis.fromEnv()

// Clés Redis
const ARTISTS_KEY = "krucial:artists"
const GLOBAL_SETTINGS_KEY = "krucial:settings:global"
const VOTE_HISTORY_KEY = "krucial:vote_history"
const VOTE_CHANNEL = "krucial:votes" // Canal Pub/Sub pour les mises à jour

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

// Fonction pour initialiser les données par défaut si elles n'existent pas
async function initializeDefaultData() {
  const artistsExist = await redis.exists(ARTISTS_KEY)
  const settingsExist = await redis.exists(GLOBAL_SETTINGS_KEY)

  if (!artistsExist) {
    console.log("Initializing default artists data in Redis...")
    const defaultArtists: Artist[] = [
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
        options: ["Mystical Tekno → melodic tekno - acidcore - tribecore", "Rave Tekno → rave - tekno - hybrid tekno"],
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
    ]
    await redis.set(ARTISTS_KEY, JSON.stringify(defaultArtists))
  }

  if (!settingsExist) {
    console.log("Initializing default global settings in Redis...")
    await redis.set(GLOBAL_SETTINGS_KEY, JSON.stringify({ globalVotingEnabled: true }))
  }
}

// Appeler l'initialisation au démarrage du module
initializeDefaultData().catch(console.error)

// Fonctions pour manipuler l'état
export const getArtists = async (): Promise<Artist[]> => {
  const artistsData = await redis.get<string>(ARTISTS_KEY)
  return artistsData ? JSON.parse(artistsData) : []
}

export const getVoteHistory = async (): Promise<VoteRecord[]> => {
  const historyData = await redis.lrange<string>(VOTE_HISTORY_KEY, 0, 99) // Get last 100
  return historyData.map((record) => JSON.parse(record))
}

export const getGlobalVotingEnabled = async (): Promise<boolean> => {
  const settings = await redis.get<string>(GLOBAL_SETTINGS_KEY)
  return settings ? JSON.parse(settings).globalVotingEnabled : true
}

export const addArtist = async (artist: Omit<Artist, "id" | "votes" | "totalVotes" | "isBlocked">): Promise<Artist> => {
  const newArtist: Artist = {
    ...artist,
    id: Date.now().toString(), // Simple ID generation
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

  const artists = await getArtists()
  artists.push(newArtist)
  await redis.set(ARTISTS_KEY, JSON.stringify(artists))
  await redis.publish(VOTE_CHANNEL, JSON.stringify({ type: "ARTIST_ADDED", data: newArtist })) // Publier la mise à jour
  console.log("✅ Artiste ajouté:", newArtist.name)
  return newArtist
}

export const deleteArtist = async (id: string): Promise<boolean> => {
  let artists = await getArtists()
  const initialLength = artists.length
  artists = artists.filter((artist) => artist.id !== id)

  if (artists.length !== initialLength) {
    await redis.set(ARTISTS_KEY, JSON.stringify(artists))
    // Optionnel: nettoyer l'historique des votes pour cet artiste
    // Cela nécessiterait de lire tout l'historique, filtrer, puis réécrire, ce qui peut être coûteux.
    // Pour l'instant, nous laissons l'historique tel quel ou le gérons côté client si nécessaire.
    await redis.publish(VOTE_CHANNEL, JSON.stringify({ type: "ARTIST_DELETED", data: { id } })) // Publier la mise à jour
    console.log("✅ Artiste supprimé:", id)
    return true
  }
  return false
}

export const updateArtistVotes = async (
  artistId: string,
  option: string,
  userAgent = "",
  ipAddress = "",
): Promise<boolean> => {
  const artists = await getArtists()
  const artist = artists.find((a) => a.id === artistId)
  const globalVotingEnabled = await getGlobalVotingEnabled()

  if (artist && !artist.isBlocked && globalVotingEnabled) {
    artist.votes[option] = (artist.votes[option] || 0) + 1
    artist.totalVotes = Object.values(artist.votes).reduce((sum, count) => sum + count, 0)

    await redis.set(ARTISTS_KEY, JSON.stringify(artists))

    // Ajouter à l'historique
    const voteRecord: VoteRecord = {
      id: Date.now().toString() + Math.random().toString(36).substr(2, 9),
      artistId,
      artistName: artist.name,
      selectedOption: option,
      userAgent,
      ipAddress,
      createdAt: new Date().toISOString(),
    }
    await redis.lpush(VOTE_HISTORY_KEY, JSON.stringify(voteRecord))
    await redis.ltrim(VOTE_HISTORY_KEY, 0, 99) // Garder seulement les 100 derniers votes

    await redis.publish(VOTE_CHANNEL, JSON.stringify({ type: "VOTE_ADDED", data: { artistId, option } })) // Publier la mise à jour
    console.log("✅ Vote enregistré:", artist.name, "-", option)
    return true
  }
  return false
}

export const toggleArtistBlocked = async (artistId: string, isBlocked: boolean): Promise<boolean> => {
  const artists = await getArtists()
  const artist = artists.find((a) => a.id === artistId)
  if (artist) {
    artist.isBlocked = isBlocked
    await redis.set(ARTISTS_KEY, JSON.stringify(artists))
    await redis.publish(VOTE_CHANNEL, JSON.stringify({ type: "ARTIST_BLOCKED", data: { artistId, isBlocked } })) // Publier la mise à jour
    console.log("✅ Artiste", isBlocked ? "bloqué" : "débloqué")
    return true
  }
  return false
}

export const toggleGlobalVoting = async (enabled: boolean): Promise<boolean> => {
  await redis.set(GLOBAL_SETTINGS_KEY, JSON.stringify({ globalVotingEnabled: enabled }))
  await redis.publish(VOTE_CHANNEL, JSON.stringify({ type: "GLOBAL_VOTING_TOGGLED", data: { enabled } })) // Publier la mise à jour
  console.log("✅ Votes globaux", enabled ? "activés" : "désactivés")
  return enabled
}

export const resetAllVotes = async (): Promise<void> => {
  const artists = await getArtists()
  artists.forEach((artist) => {
    Object.keys(artist.votes).forEach((option) => {
      artist.votes[option] = 0
    })
    artist.totalVotes = 0
  })
  await redis.set(ARTISTS_KEY, JSON.stringify(artists))
  await redis.del(VOTE_HISTORY_KEY) // Supprimer tout l'historique
  await redis.publish(VOTE_CHANNEL, JSON.stringify({ type: "VOTES_RESET" })) // Publier la mise à jour
  console.log("✅ Tous les votes réinitialisés")
}
