"use client"

import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Clock, Users, Music, Zap, Star, TrendingUp, Shield, Wifi, WifiOff, AlertTriangle } from "lucide-react"
import { BackgroundEffects } from "@/components/background-effects"
import { KrucialLogo } from "@/components/krucial-logo"
import { useRealTimeData } from "@/hooks/useRealTimeData"

export default function HomePage() {
  const { artists, isConnected, lastUpdate, source, message, error: dataError } = useRealTimeData()

  const totalVotes = artists.reduce((sum, artist) => sum + artist.totalVotes, 0)

  // Afficher une alerte si le backend n'est pas connecté
  const showKVConnectionWarning = !isConnected && dataError

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-black to-gray-900 relative overflow-hidden">
      <BackgroundEffects />

      {/* Bouton Admin (coin supérieur droit) */}
      <div className="fixed top-4 right-4 z-50">
        <Button
          onClick={() => (window.location.href = "/admin/login")}
          className="bg-gray-800/80 hover:bg-gray-700/80 text-custom-green border border-custom-green/30 backdrop-blur-sm"
        >
          <Shield className="w-4 h-4 mr-2" />
          Admin
        </Button>
      </div>

      {/* Indicateurs de statut */}
      <div className="fixed top-4 left-4 z-50 flex gap-2">
        <Badge
          variant="outline"
          className={`${isConnected ? "border-custom-green text-custom-green" : "border-red-500 text-red-400"}`}
        >
          {isConnected ? <Wifi className="w-3 h-3 mr-1" /> : <WifiOff className="w-3 h-3 mr-1" />}
          {isConnected ? "Connecté" : "Déconnecté"}
        </Badge>
        <Badge
          variant="outline"
          className={`${isConnected ? "border-custom-green text-custom-green" : "border-red-500 text-red-400"}`}
        >
          <Clock className="w-3 h-3 mr-1" />
          {source === "kv" ? "KV" : "Déconnecté"}
        </Badge>
      </div>

      {/* Alerte connexion backend */}
      {showKVConnectionWarning && (
        <div className="fixed top-16 left-4 right-4 z-40">
          <Card className="bg-red-900/20 border-red-500/50 backdrop-blur-sm">
            <CardContent className="p-4 text-center">
              <div className="flex items-center justify-center gap-2 mb-3">
                <AlertTriangle className="w-5 h-5 text-red-400" />
                <p className="text-red-400 text-lg font-bold">Vercel KV Déconnecté</p>
              </div>
              <p className="text-red-300 text-sm mb-4">
                {message || "Impossible de se connecter à Vercel KV. Les données ne sont pas synchronisées."}
              </p>
              <p className="text-gray-400 text-xs mt-2">
                Veuillez vous assurer que vos variables d'environnement Upstash (`KV_REST_API_URL`, `KV_REST_API_TOKEN`)
                sont correctement configurées sur Vercel.
              </p>
            </CardContent>
          </Card>
        </div>
      )}

      <div className="relative z-10 container mx-auto px-4 py-8">
        {/* Header */}
        <div className="text-center mb-12 slide-in" style={{ marginTop: showKVConnectionWarning ? "120px" : "0" }}>
          <div className="mb-6">
            <KrucialLogo className="mx-auto" />
          </div>
          <h1 className="text-5xl md:text-7xl font-bold text-white mb-6 neon-text">KRUCIAL</h1>
          <div className="max-w-2xl mx-auto mb-8">
            <p className="text-xl text-gray-300 mb-4">
              🎵 <strong>{artists.length} artistes</strong> exceptionnels, <strong>2 sets</strong> par DJ
            </p>
            <p className="text-lg text-custom-green font-semibold mb-6">
              TON CHOIX EST KRUCIAL - Deviens acteur de ta soirée !
            </p>
          </div>

          {/* Stats en temps réel */}
          <div className="flex flex-wrap justify-center gap-4 mb-8">
            <Badge variant="outline" className="border-custom-green text-custom-green bg-custom-green/10 px-4 py-2">
              <TrendingUp className="w-4 h-4 mr-2" />
              {totalVotes} votes enregistrés
            </Badge>
            <Badge variant="outline" className="border-custom-green text-custom-green bg-custom-green/10 px-4 py-2">
              <Clock className="w-4 h-4 mr-2" />
              Temps réel (KV)
            </Badge>
            <Badge variant="outline" className="border-custom-green text-custom-green bg-custom-green/10 px-4 py-2">
              <Users className="w-4 h-4 mr-2" />
              Communauté active
            </Badge>
            <Badge variant="outline" className="border-custom-green text-custom-green bg-custom-green/10 px-4 py-2">
              <Music className="w-4 h-4 mr-2" />
              {artists.length} DJ Sets
            </Badge>
          </div>

          {/* Timestamp de dernière mise à jour */}
          <div className="text-xs text-gray-500 mb-8">
            Dernière mise à jour: {new Date(lastUpdate).toLocaleTimeString()} ({source || "unknown"})
          </div>
        </div>

        {/* Artists Preview */}
        <div className="grid gap-6 md:gap-8 max-w-5xl mx-auto mb-12">
          {artists.map((artist, index) => (
            <Card
              key={artist.id}
              className="bg-gray-900/80 border-gray-700 backdrop-blur-sm hover:border-custom-green/50 transition-all duration-300 slide-in"
              style={{ animationDelay: `${index * 0.1}s` }}
            >
              <CardContent className="p-6">
                <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                  <div className="flex items-center gap-4">
                    <div className="relative">
                      <div
                        className={`w-4 h-4 rounded-full ${artist.isBlocked ? "bg-red-500" : "bg-custom-green"} ${!artist.isBlocked ? "pulse-green" : ""}`}
                      ></div>
                      {artist.totalVotes > 0 && (
                        <div className="absolute -top-1 -right-1 w-3 h-3 bg-green-400 rounded-full animate-ping"></div>
                      )}
                    </div>
                    <div>
                      <h3 className="text-2xl font-bold text-white mb-2 flex items-center gap-2">
                        {artist.name}
                        <Star className="w-5 h-5 text-yellow-400" />
                      </h3>
                      <div className="flex items-center gap-2 text-custom-green font-medium">
                        <Clock className="w-4 h-4" />
                        {artist.timeSlot}
                      </div>
                    </div>
                  </div>

                  <div className="flex flex-col gap-2">
                    <div className="flex flex-wrap gap-2">
                      {artist.options.map((option, index) => (
                        <Badge
                          key={index}
                          variant="secondary"
                          className="bg-gray-800 text-gray-300 border-gray-600 hover:border-custom-green/50 transition-colors"
                        >
                          <Music className="w-3 h-3 mr-1" />
                          {option.split(" → ")[0]}
                        </Badge>
                      ))}
                    </div>
                    {artist.totalVotes > 0 && (
                      <div className="text-right">
                        <Badge className="bg-custom-green/20 text-custom-green border-custom-green/50">
                          <Zap className="w-3 h-3 mr-1" />
                          {artist.totalVotes} votes
                        </Badge>
                      </div>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* CTA Section */}
        <div className="text-center">
          <div className="max-w-md mx-auto mb-8">
            <h2 className="text-2xl font-bold text-white mb-4">Prêt à voter ?</h2>
            <p className="text-gray-300 mb-6">
              Chaque vote compte ! Influence le cours de la soirée et crée l'expérience musicale parfaite.
            </p>
          </div>

          <Button
            size="lg"
            className="bg-custom-green hover:bg-custom-green text-black font-bold px-16 py-6 text-xl rounded-full neon-glow transition-all duration-300 transform hover:scale-105"
            onClick={() => (window.location.href = "/vote")}
          >
            <Music className="w-6 h-6 mr-3" />
            JE CHOISIS !
          </Button>

          <div className="mt-6 text-sm text-gray-400">
            <p>🎧 Interface optimisée • 🚀 Résultats en temps réel (KV) • 🎵 Expérience immersive</p>
          </div>
        </div>
      </div>
    </div>
  )
}
