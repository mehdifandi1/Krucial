// Store de données en mémoire avec synchronisation temps réel
let artistsData = [
  {
    id: "1",
    name: "HANNIBASS",
    timeSlot: "00h00 - 01h30",
    options: ["Acid Tekno", "Mental Tekno"],
    votes: {
      "Acid Tekno": 0,
      "Mental Tekno": 0,
    },
    totalVotes: 0,
    isBlocked: false,
  },
  {
    id: "2",
    name: "SKEPTX",
    timeSlot: "01h30 - 02h30",
    options: ["Hard Tekno", "Industrial Tekno"],
    votes: {
      "Hard Tekno": 0,
      "Industrial Tekno": 0,
    },
    totalVotes: 0,
    isBlocked: false,
  },
  {
    id: "3",
    name: "AZKAËL",
    timeSlot: "02h30 - 03h30",
    options: ["Acidcore", "Tribecore"],
    votes: {
      Acidcore: 0,
      Tribecore: 0,
    },
    totalVotes: 0,
    isBlocked: false,
  },
  {
    id: "4",
    name: "KINESI",
    timeSlot: "04h30 - 05h30",
    options: ["Schranz", "Frenchcore"],
    votes: {
      Schranz: 0,
      Frenchcore: 0,
    },
    totalVotes: 0,
    isBlocked: false,
  },
]

let lastUpdateTimestamp = Date.now()
let globalVotingEnabled = true
let voteHistory: Array<{
  artistId: string
  artistName: string
  selectedOption: string
  timestamp: Date
  userAgent: string
}> = []

// Fonctions de gestion des données
export const getArtists = () => {
  return {
    artists: artistsData,
    timestamp: lastUpdateTimestamp,
    globalVotingEnabled,
  }
}

export const getVoteHistory = () => {
  return voteHistory
}

export const addArtist = (artist: any) => {
  const newArtist = {
    ...artist,
    id: Date.now().toString(),
    votes: artist.options.reduce((acc: any, option: string) => {
      acc[option] = 0
      return acc
    }, {}),
    totalVotes: 0,
    isBlocked: false,
  }
  artistsData.push(newArtist)
  lastUpdateTimestamp = Date.now()
  console.log("Artist added, new timestamp:", lastUpdateTimestamp)
  return newArtist
}

export const deleteArtist = (id: string) => {
  const initialLength = artistsData.length
  artistsData = artistsData.filter((artist) => artist.id !== id)
  if (artistsData.length !== initialLength) {
    lastUpdateTimestamp = Date.now()
    console.log("Artist deleted, new timestamp:", lastUpdateTimestamp)
    return true
  }
  return false
}

export const updateArtistVotes = (artistId: string, option: string, userAgent = "") => {
  const artist = artistsData.find((a) => a.id === artistId)
  if (artist && !artist.isBlocked && globalVotingEnabled) {
    artist.votes[option] = (artist.votes[option] || 0) + 1
    artist.totalVotes = Object.values(artist.votes).reduce((sum: number, count: number) => sum + count, 0)

    // Enregistrer l'historique du vote avec horodatage
    voteHistory.push({
      artistId,
      artistName: artist.name,
      selectedOption: option,
      timestamp: new Date(),
      userAgent,
    })

    lastUpdateTimestamp = Date.now()
    console.log(`Vote recorded: ${artist.name} - ${option} at ${new Date().toISOString()}`)
    return true
  }
  return false
}

export const toggleArtistBlocked = (artistId: string, isBlocked: boolean) => {
  const artist = artistsData.find((a) => a.id === artistId)
  if (artist) {
    artist.isBlocked = isBlocked
    lastUpdateTimestamp = Date.now()
    console.log(`Artist ${artist.name} voting ${isBlocked ? "blocked" : "unblocked"} at ${new Date().toISOString()}`)
    return true
  }
  return false
}

export const toggleGlobalVoting = (enabled: boolean) => {
  globalVotingEnabled = enabled
  lastUpdateTimestamp = Date.now()
  console.log(`Global voting ${enabled ? "enabled" : "disabled"} at ${new Date().toISOString()}`)
  return globalVotingEnabled
}

export const resetAllVotes = () => {
  artistsData.forEach((artist) => {
    Object.keys(artist.votes).forEach((option) => {
      artist.votes[option] = 0
    })
    artist.totalVotes = 0
  })
  voteHistory = []
  lastUpdateTimestamp = Date.now()
  console.log(`All votes reset at ${new Date().toISOString()}`)
}

export const getLastUpdateTimestamp = () => lastUpdateTimestamp
