import { NextResponse } from "next/server"
import { supabase, isSupabaseConfigured } from "@/lib/supabase"
import { getArtists, getVoteHistory, getGlobalVotingEnabled } from "@/lib/kv-store" // Utilise le nouveau store KV

const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL

// Données par défaut si Supabase n'est pas configuré ou si les tables n'existent pas
const defaultData = {
  artists: [
    {
      id: "1",
      name: "KINESI",
      time_slot: "01h00 - 02h20",
      options: ["Que Calor ! → Latino - Rave - Hard Bounce", "Hell Raver → Metal - Hard Techno - Indus"],
      votes: {
        "Que Calor ! → Latino - Rave - Hard Bounce": 0,
        "Hell Raver → Metal - Hard Techno - Indus": 0,
      },
      total_votes: 0,
      is_blocked: false,
    },
    {
      id: "2",
      name: "AZKAËL",
      time_slot: "02h20 - 03h40",
      options: ["Mystical Tekno → melodic tekno - acidcore - tribecore", "Rave Tekno → rave - tekno - hybrid tekno"],
      votes: {
        "Mystical Tekno → melodic tekno - acidcore - tribecore": 0,
        "Rave Tekno → rave - tekno - hybrid tekno": 0,
      },
      total_votes: 0,
      is_blocked: false,
    },
    {
      id: "3",
      name: "HANNIBASS",
      time_slot: "03h40 - 04h40",
      options: ["Versatile → tekno - hard music - bass music", "Overdrive → tekno, rawstyle, uptempo"],
      votes: {
        "Versatile → tekno - hard music - bass music": 0,
        "Overdrive → tekno, rawstyle, uptempo": 0,
      },
      total_votes: 0,
      is_blocked: false,
    },
    {
      id: "4",
      name: "SKEPTX",
      time_slot: "04h40 - 06h00",
      options: ["Rapture → Tekno to DnB", "Assault → Tekno to Hardcore"],
      votes: {
        "Rapture → Tekno to DnB": 0,
        "Assault → Tekno to Hardcore": 0,
      },
      total_votes: 0,
      is_blocked: false,
    },
  ],
  voteHistory: [],
  globalVotingEnabled: true,
}

// Function to fetch data from Supabase
async function fetchSupabaseData() {
  try {
    console.log("🔄 API: Vérification de la configuration Supabase...")

    // Si Supabase n'est pas configuré (variables d'environnement manquantes), retourner les données par défaut
    if (!isSupabaseConfigured()) {
      console.log("⚠️ Supabase non configuré - utilisation des données par défaut")
      return NextResponse.json({
        ...defaultData,
        lastUpdate: Date.now(),
        source: "default",
        supabaseConfigured: false,
        message: "Supabase non configuré - veuillez définir les variables d'environnement.",
        needsSetup: true, // Indique que le setup est nécessaire
      })
    }

    // Si le client Supabase n'a pas pu être initialisé malgré la configuration (ex: URL malformée)
    if (!supabase) {
      console.error("❌ Supabase client non initialisé malgré la configuration des variables d'environnement.")
      return NextResponse.json(
        {
          ...defaultData,
          lastUpdate: Date.now(),
          source: "fallback",
          supabaseConfigured: true, // Les variables sont là, mais le client a échoué
          error: "Client Supabase non initialisé",
          message: "Erreur interne: le client Supabase n'a pas pu être créé. Vérifiez l'URL/clé.",
          needsSetup: true,
        },
        { status: 200 },
      ) // Toujours retourner 200 pour que le client puisse lire le corps JSON
    }

    console.log("🔄 API: Récupération des données depuis Supabase...")

    // Récupérer les artistes
    const { data: artists, error: artistsError } = await supabase.from("artists").select("*").order("created_at")

    // Si la relation n'existe pas, indiquer que le setup est nécessaire
    if (artistsError) {
      console.error("❌ Erreur lors de la récupération des artistes:", artistsError.message)
      if (artistsError.message.includes("relation") && artistsError.message.includes("does not exist")) {
        console.log("❌ Tables Supabase manquantes - setup requis.")
        return NextResponse.json(
          {
            ...defaultData,
            lastUpdate: Date.now(),
            source: "fallback",
            supabaseConfigured: true,
            error: "Tables Supabase manquantes",
            message: "Veuillez exécuter le script SQL dans Supabase pour créer les tables.",
            needsSetup: true,
          },
          { status: 200 },
        )
      } else {
        // Autres types d'erreurs pour la table des artistes
        throw new Error(`Erreur lors de la récupération des artistes: ${artistsError.message}`)
      }
    }

    // Récupérer l'historique des votes (100 derniers)
    const { data: voteHistory, error: votesError } = await supabase
      .from("vote_records")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(100)

    if (votesError) {
      console.error("❌ Erreur lors de la récupération de l'historique des votes:", votesError.message)
      // Continuer même si l'historique des votes échoue, mais le logger
    }

    // Récupérer les paramètres globaux
    const { data: settings, error: settingsError } = await supabase
      .from("app_settings")
      .select("*")
      .eq("id", "global")
      .single()

    if (settingsError) {
      console.error("❌ Erreur lors de la récupération des paramètres de l'application:", settingsError.message)
      // Continuer même si les paramètres échouent, mais le logger
    }

    const responseData = {
      artists: artists || [],
      voteHistory: voteHistory || [],
      globalVotingEnabled: settings?.global_voting_enabled ?? true,
      lastUpdate: Date.now(),
      source: "supabase",
      supabaseConfigured: true,
      needsSetup: false, // Setup non nécessaire
    }

    console.log("✅ API: Données récupérées depuis Supabase:", {
      artists: responseData.artists.length,
      votes: responseData.voteHistory.length,
      globalVoting: responseData.globalVotingEnabled,
    })

    const response = NextResponse.json(responseData)
    response.headers.set("Cache-Control", "no-store, no-cache, must-revalidate, proxy-revalidate")
    response.headers.set("Pragma", "no-cache")
    response.headers.set("Expires", "0")

    return response
  } catch (error) {
    console.error("Error proxying GET /api/data:", error)
    const errorMessage = error instanceof Error ? error.message : "Erreur inconnue"
    return NextResponse.json(
      {
        artists: [],
        voteHistory: [],
        globalVotingEnabled: true,
        lastUpdate: Date.now(),
        source: "error",
        isConnected: false,
        message: `Erreur de connexion au backend: ${errorMessage}`,
        error: errorMessage,
      },
      { status: 200 },
    ) // Retourner 200 pour que le client puisse lire le corps
  }
}

// Function to fetch data from Vercel KV
async function fetchKVData() {
  try {
    console.log("🔄 API: Récupération des données depuis Vercel KV...")

    const artists = await getArtists()
    const voteHistory = await getVoteHistory()
    const globalVotingEnabled = await getGlobalVotingEnabled()

    const responseData = {
      artists: artists,
      voteHistory: voteHistory,
      globalVotingEnabled: globalVotingEnabled,
      lastUpdate: Date.now(),
      source: "kv",
      isConnected: true, // Toujours connecté si les appels KV réussissent
      message: "Données synchronisées via Vercel KV",
      error: null,
    }

    console.log("✅ API: Données récupérées depuis Vercel KV:", {
      artists: responseData.artists.length,
      votes: responseData.voteHistory.length,
      globalVoting: responseData.globalVotingEnabled,
    })

    const response = NextResponse.json(responseData)
    response.headers.set("Cache-Control", "no-store, no-cache, must-revalidate, proxy-revalidate")
    response.headers.set("Pragma", "no-cache")
    response.headers.set("Expires", "0")

    return response
  } catch (error) {
    console.error("❌ API Error (KV data fetch):", error)
    const errorMessage = error instanceof Error ? error.message : "Erreur inconnue"

    return NextResponse.json(
      {
        artists: [],
        voteHistory: [],
        globalVotingEnabled: true,
        lastUpdate: Date.now(),
        source: "error-kv",
        isConnected: false,
        error: errorMessage,
        message: `Erreur lors de la récupération des données depuis Vercel KV: ${errorMessage}. Vérifiez vos variables d'environnement Upstash.`,
      },
      { status: 500 },
    )
  }
}

// Main GET function that decides which data source to use
export async function GET() {
  if (!BACKEND_URL) {
    return NextResponse.json(
      {
        artists: [],
        voteHistory: [],
        globalVotingEnabled: true,
        lastUpdate: Date.now(),
        source: "disconnected",
        isConnected: false,
        message: "Backend URL non configurée. Veuillez définir NEXT_PUBLIC_BACKEND_URL.",
        error: "Backend URL non configurée",
      },
      { status: 200 },
    ) // Retourner 200 pour que le client puisse lire le corps
  }

  // Try to fetch data from Supabase first
  const supabaseResponse = await fetchSupabaseData()
  if (supabaseResponse.status === 200) {
    return supabaseResponse
  }

  // If Supabase fails, fetch data from Vercel KV
  return await fetchKVData()
}
