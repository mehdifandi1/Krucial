"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Label } from "@/components/ui/label"
import { Progress } from "@/components/ui/progress"
import { Badge } from "@/components/ui/badge"
import { ArrowLeft, Check, Music, Clock, Zap, Users, AlertCircle, Shield, Volume2, Wifi, WifiOff } from "lucide-react"
import { BackgroundEffects } from "@/components/background-effects"
import { KrucialLogo } from "@/components/krucial-logo"
import { useRealTimeData } from "@/hooks/useRealTimeData"

export default function VotePage() {
  const {
    artists,
    globalVotingEnabled,
    isConnected,
    actions,
    lastUpdate,
    error: dataError,
    source, // Pour afficher la source des données (KV)
  } = useRealTimeData()
  const [votes, setVotes] = useState<{ [key: string]: string }>({})
  const [hasVoted, setHasVoted] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)

  const handleVoteChange = (artistId: string, option: string) => {
    const artist = artists.find((a) => a.id === artistId)
    if (artist?.isBlocked) {
      alert("⚠️ Les votes pour cet artiste sont fermés")
      return
    }

    if (!globalVotingEnabled) {
      alert("⚠️ Les votes sont temporairement fermés")
      return
    }

    setVotes((prev) => ({
      ...prev,
      [artistId]: option,
    }))
  }

  const handleSubmit = async () => {
    const availableArtists = artists.filter((a) => !a.isBlocked)
    if (Object.keys(votes).length !== availableArtists.length) {
      alert(`⚠️ Veuillez voter pour tous les artistes (${Object.keys(votes).length}/${availableArtists.length})`)
      return
    }

    setIsSubmitting(true)
    try {
      const success = await actions.voteMultiple(votes, navigator.userAgent)

      if (success) {
        setHasVoted(true)
        // Reset automatique après 5 secondes
        setTimeout(() => {
          setHasVoted(false)
          setVotes({})
        }, 5000)
      } else {
        alert("❌ Erreur lors de l'enregistrement des votes")
      }
    } catch (error) {
      console.error("Error submitting votes:", error)
      alert("❌ Erreur de connexion à Vercel KV. Veuillez réessayer.")
    } finally {
      setIsSubmitting(false)
    }
  }

  const getSelectedCount = () => Object.keys(votes).length
  const getAvailableArtistsCount = () => artists.filter((a) => !a.isBlocked).length
  const getProgressPercentage = () => {
    const available = getAvailableArtistsCount()
    return available > 0 ? (getSelectedCount() / available) * 100 : 0
  }

  // Fonction pour formater les options d'affichage
  const formatOptionForDisplay = (option: string) => {
    const parts = option.split(" → ")
    if (parts.length === 2) {
      return {
        title: parts[0],
        description: parts[1],
      }
    }
    return {
      title: option,
      description: "",
    }
  }

  // Écran de confirmation après vote
  if (hasVoted) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-black to-gray-900 relative overflow-hidden">
        <BackgroundEffects />
        <div className="relative z-10 container mx-auto px-4 py-8">
          <div className="max-w-lg mx-auto text-center">
            <Card className="bg-gray-900/90 border-custom-green/50 backdrop-blur-sm p-8 vote-success">
              <div className="inline-flex items-center justify-center w-20 h-20 bg-custom-green rounded-full mb-6 neon-glow">
                <Check className="w-10 h-10 text-black" />
              </div>
              <h2 className="text-3xl font-bold text-white mb-4 neon-text">🎉 VOTES ENREGISTRÉS !</h2>
              <p className="text-gray-300 text-lg mb-4">Merci ! Vos choix influencent la soirée en temps réel.</p>
              <div className="flex items-center justify-center gap-2 text-custom-green font-semibold mb-6">
                <Zap className="w-5 h-5" />
                <span>Synchronisé: {new Date().toLocaleTimeString()}</span>
              </div>
              <div className="text-gray-400">
                <p className="mb-2">🎵 Interface prête pour le prochain votant...</p>
                <div className="w-full bg-gray-700 rounded-full h-2 mt-4">
                  <div className="bg-custom-green h-2 rounded-full animate-pulse" style={{ width: "100%" }}></div>
                </div>
              </div>
            </Card>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-black to-gray-900 relative overflow-hidden">
      <BackgroundEffects />

      {/* Header mobile-optimized */}
      <div className="sticky top-0 z-50 bg-gray-900/80 backdrop-blur-sm border-b border-gray-700">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <Button
              variant="ghost"
              onClick={() => (window.location.href = "/")}
              className="text-custom-green hover:text-custom-green hover:bg-custom-green/10"
              size="sm"
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              Retour
            </Button>
            <div className="text-center">
              <KrucialLogo width={60} height={30} className="mx-auto mb-1" />
              <h1 className="text-lg font-bold text-white neon-text">VOTE TECHNO</h1>
            </div>
            <div className="flex items-center gap-2">
              <Badge
                variant="outline"
                className={`${isConnected ? "border-custom-green text-custom-green" : "border-red-500 text-red-400"} text-xs`}
              >
                {isConnected ? <Wifi className="w-3 h-3" /> : <WifiOff className="w-3 h-3" />}
              </Badge>
              <Badge
                variant="outline"
                className={`${isConnected ? "border-custom-green text-custom-green" : "border-red-500 text-red-400"} text-xs`}
              >
                <Clock className="w-3 h-3 mr-1" />
                {source === "kv" ? "KV" : "Déconnecté"}
              </Badge>
              <Button
                onClick={() => (window.location.href = "/admin")}
                className="bg-gray-800/80 hover:bg-gray-700/80 text-custom-green border border-custom-green/30"
                size="sm"
              >
                <Shield className="w-4 h-4" />
              </Button>
            </div>
          </div>
        </div>
      </div>

      <div className="relative z-10 container mx-auto px-4 py-6">
        {/* Message d'erreur de connexion au backend */}
        {!isConnected && dataError && (
          <Card className="bg-red-900/20 border-red-500/50 backdrop-blur-sm mb-6">
            <CardContent className="p-4 text-center">
              <div className="flex items-center justify-center gap-2 text-red-400">
                <AlertCircle className="w-5 h-5" />
                <span className="font-semibold">Erreur de connexion à Vercel KV:</span>
              </div>
              <p className="text-red-300 text-sm mt-2">{dataError}</p>
              <p className="text-gray-400 text-xs mt-2">
                Veuillez vérifier que vos variables d'environnement Upstash sont correctement configurées.
              </p>
            </CardContent>
          </Card>
        )}

        {/* Status Global */}
        {!globalVotingEnabled && (
          <div className="mb-6">
            <Card className="bg-red-900/20 border-red-500/50 backdrop-blur-sm">
              <CardContent className="p-4 text-center">
                <div className="flex items-center justify-center gap-2 text-red-400">
                  <AlertCircle className="w-5 h-5" />
                  <span className="font-semibold">Votes fermés</span>
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Titre principal mobile-optimized */}
        <div className="text-center mb-8">
          <h2 className="text-3xl md:text-4xl font-bold text-white mb-4 neon-text">CHOISISSEZ VOS STYLES</h2>
          <p className="text-lg text-gray-300 mb-4 flex items-center justify-center gap-2">
            <Volume2 className="w-5 h-5 text-custom-green" />2 styles par artiste
          </p>
          <p className="text-gray-400 mb-6 text-sm px-4">
            🎵 Votez une seule fois par artiste. Synchronisation temps réel !
          </p>

          {/* Indicateur de progression mobile-optimized */}
          <div className="max-w-sm mx-auto">
            <div className="bg-custom-green/30 border border-custom-green/30 rounded-lg p-3 mb-4">
              <div className="flex items-center justify-center gap-2 mb-2">
                <Music className="w-4 h-4 text-custom-green" />
                <span className="text-custom-green font-bold">
                  {getSelectedCount()} / {getAvailableArtistsCount()} artistes
                </span>
              </div>
              <Progress value={getProgressPercentage()} className="h-2 bg-gray-800" />
            </div>
          </div>

          {/* Timestamp de dernière mise à jour */}
          <div className="text-xs text-gray-500 mb-4">Dernière sync: {new Date(lastUpdate).toLocaleTimeString()}</div>
        </div>

        {/* Cartes des artistes - Mobile First */}
        <div className="max-w-2xl mx-auto space-y-6 mb-8">
          {artists.map((artist, index) => (
            <Card
              key={artist.id}
              className={`bg-gray-900/80 border-gray-700 backdrop-blur-sm transition-all duration-300 ${
                artist.isBlocked ? "opacity-60" : "hover:border-custom-green/50"
              } ${votes[artist.id] ? "border-custom-green/70 bg-custom-green/10" : ""}`}
            >
              <CardContent className="p-6">
                <div className="text-center mb-6">
                  <div className="flex items-center justify-center gap-3 mb-2">
                    <div
                      className={`w-4 h-4 rounded-full ${artist.isBlocked ? "bg-red-500" : "bg-custom-green"} ${!artist.isBlocked ? "pulse-green" : ""}`}
                    />
                    {artist.totalVotes > 0 && <div className="w-3 h-3 bg-custom-green rounded-full animate-ping" />}
                  </div>
                  <div className="flex items-center justify-center gap-2 text-gray-300 text-sm">
                    <Clock className="w-4 h-4 text-custom-green" />
                    <span>{artist.timeSlot}</span>
                  </div>
                  {artist.totalVotes > 0 && (
                    <div className="mt-2">
                      <span className="text-custom-green text-xs bg-custom-green/30 px-2 py-1 rounded-full">
                        <Users className="w-3 h-3 inline mr-1" />
                        {artist.totalVotes} votes
                      </span>
                    </div>
                  )}
                </div>

                {!artist.isBlocked && globalVotingEnabled ? (
                  <RadioGroup
                    value={votes[artist.id] || ""}
                    onValueChange={(value) => handleVoteChange(artist.id, value)}
                  >
                    <div className="space-y-4">
                      {artist.options.map((option, index) => {
                        const formatted = formatOptionForDisplay(option)
                        return (
                          <div key={index} className="flex items-center space-x-4">
                            <RadioGroupItem
                              value={option}
                              id={`${artist.id}-${option}`}
                              className="border-custom-green text-custom-green w-5 h-5 flex-shrink-0"
                            />
                            <Label
                              htmlFor={`${artist.id}-${option}`}
                              className={`text-gray-300 cursor-pointer flex-1 py-4 px-4 rounded-lg border transition-all duration-300 text-center ${
                                votes[artist.id] === option
                                  ? "border-custom-green bg-custom-green/20 text-white"
                                  : "border-gray-600 bg-gray-800/50 hover:border-custom-green/50 hover:bg-gray-700/50"
                              }`}
                            >
                              <div>
                                <div className="font-bold text-lg mb-1 flex items-center justify-center gap-2">
                                  <Volume2 className="w-4 h-4 text-custom-green" />
                                  {formatted.title}
                                </div>
                                {formatted.description && (
                                  <div className="text-sm text-gray-400">{formatted.description}</div>
                                )}
                              </div>
                            </Label>
                          </div>
                        )
                      })}
                    </div>
                  </RadioGroup>
                ) : (
                  <div className="space-y-4">
                    {artist.options.map((option, index) => {
                      const formatted = formatOptionForDisplay(option)
                      return (
                        <div
                          key={index}
                          className="py-4 px-4 bg-gray-800/30 rounded-lg border border-gray-700 text-center"
                        >
                          <div className="font-bold text-gray-500 mb-1 flex items-center justify-center gap-2">
                            <Volume2 className="w-4 h-4 text-gray-500" />
                            {formatted.title}
                          </div>
                          {formatted.description && (
                            <div className="text-sm text-gray-600">{formatted.description}</div>
                          )}
                        </div>
                      )
                    })}
                  </div>
                )}

                {artist.isBlocked && (
                  <div className="text-center mt-4">
                    <span className="text-red-400 text-sm font-medium bg-red-900/30 px-3 py-1 rounded-full">
                      🔒 Votes fermés pour cet artiste
                    </span>
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Bouton de validation mobile-optimized */}
        {getSelectedCount() === getAvailableArtistsCount() && getAvailableArtistsCount() > 0 && globalVotingEnabled && (
          <div className="text-center mb-8">
            <Button
              onClick={handleSubmit}
              disabled={isSubmitting || !isConnected}
              className="bg-custom-green hover:bg-custom-green text-black font-bold px-12 py-4 text-lg rounded-full neon-glow transition-all duration-300 transform hover:scale-105 w-full max-w-sm"
            >
              {isSubmitting ? (
                <>
                  <div className="w-5 h-5 border-2 border-black border-t-transparent rounded-full animate-spin mr-3"></div>
                  Synchronisation...
                </>
              ) : (
                <>
                  <Check className="w-5 h-5 mr-3" />
                  VALIDER MES VOTES
                </>
              )}
            </Button>
            <p className="text-gray-400 mt-3 text-sm">🎵 Synchronisation temps réel</p>
          </div>
        )}

        {/* Messages d'état */}
        {artists.length === 0 && (
          <div className="text-center">
            <Card className="bg-gray-900/80 border-gray-700 backdrop-blur-sm p-6">
              <p className="text-gray-400">🎵 Aucun artiste disponible...</p>
            </Card>
          </div>
        )}

        {artists.length > 0 && getAvailableArtistsCount() === 0 && (
          <div className="text-center">
            <Card className="bg-red-900/20 border-red-500/50 backdrop-blur-sm p-6">
              <p className="text-red-400">🔒 Tous les votes sont fermés</p>
            </Card>
          </div>
        )}

        {!isConnected && (
          <div className="fixed bottom-4 right-4 bg-red-900/90 border border-red-500 text-red-300 px-4 py-2 rounded-lg text-sm">
            Connexion perdue - Reconnexion...
          </div>
        )}
      </div>
    </div>
  )
}
