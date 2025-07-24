"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Progress } from "@/components/ui/progress"
import { Badge } from "@/components/ui/badge"
import {
  Trash2,
  Plus,
  BarChart3,
  RefreshCw,
  Lock,
  Unlock,
  Users,
  TrendingUp,
  LogOut,
  Settings,
  Zap,
  AlertCircle,
  CheckCircle,
  Music,
  Clock,
  Home,
  History,
  Volume2,
  Wifi,
  WifiOff,
  RotateCcw,
} from "lucide-react"
import { BackgroundEffects } from "@/components/background-effects"
import { KrucialLogo } from "@/components/krucial-logo"
import { useRealTimeData } from "@/hooks/useRealTimeData"

export default function AdminPage() {
  const { artists, voteHistory, globalVotingEnabled, isConnected, actions, lastUpdate } = useRealTimeData()
  const [newArtist, setNewArtist] = useState({
    name: "",
    timeSlot: "",
    options: ["", ""],
  })
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [showHistory, setShowHistory] = useState(false)

  useEffect(() => {
    // Vérification de l'authentification
    const auth = localStorage.getItem("adminAuth")
    if (auth !== "KRUCIAL2024") {
      window.location.href = "/admin/login"
      return
    }
    setIsAuthenticated(true)
  }, [])

  const logout = () => {
    localStorage.removeItem("adminAuth")
    window.location.href = "/admin/login"
  }

  const handleForceReset = async () => {
    if (confirm("🔄 Réinitialiser avec les données par défaut ? (Cela supprimera tous les votes)")) {
      try {
        await actions.forceResetKV() // Utilise la nouvelle action
        alert("✅ Base de données réinitialisée avec les nouvelles données !")
      } catch (error) {
        console.error("Error forcing KV reset:", error)
        alert("❌ Erreur lors de la réinitialisation de la base de données.")
      }
    }
  }

  const handleToggleGlobalVoting = async () => {
    setIsLoading(true)
    try {
      await actions.toggleGlobalVoting(!globalVotingEnabled)
    } catch (error) {
      console.error("Error toggling global voting:", error)
    } finally {
      setIsLoading(false)
    }
  }

  const handleToggleArtistVoting = async (artistId: string, isBlocked: boolean) => {
    try {
      await actions.toggleArtistBlocked(artistId, !isBlocked)
    } catch (error) {
      console.error("Error toggling artist voting:", error)
    }
  }

  const handleAddArtist = async () => {
    if (!newArtist.name || !newArtist.timeSlot || newArtist.options.some((opt) => !opt.trim())) {
      alert("⚠️ Veuillez remplir tous les champs")
      return
    }

    setIsLoading(true)
    try {
      await actions.addArtist(newArtist)
      setNewArtist({ name: "", timeSlot: "", options: ["", ""] })
    } catch (error) {
      console.error("Error adding artist:", error)
    } finally {
      setIsLoading(false)
    }
  }

  const handleDeleteArtist = async (id: string, name: string) => {
    if (confirm(`🗑️ Supprimer "${name}" ?`)) {
      try {
        const success = await actions.deleteArtist(id)
        if (!success) {
          alert("❌ Erreur lors de la suppression")
        }
      } catch (error) {
        console.error("Error deleting artist:", error)
        alert("❌ Erreur lors de la suppression")
      }
    }
  }

  const handleResetVotes = async () => {
    if (confirm("🔄 Réinitialiser TOUS les votes ?")) {
      setIsLoading(true)
      try {
        await actions.resetAllVotes()
      } catch (error) {
        console.error("Error resetting votes:", error)
      } finally {
        setIsLoading(false)
      }
    }
  }

  const getVotePercentage = (artist: any, option: string) => {
    if (artist.totalVotes === 0) return 0
    return Math.round((artist.votes[option] / artist.totalVotes) * 100)
  }

  const updateNewArtistOption = (index: number, value: string) => {
    const newOptions = [...newArtist.options]
    newOptions[index] = value
    setNewArtist({ ...newArtist, options: newOptions })
  }

  const getTotalVotes = () => artists.reduce((total, artist) => total + artist.totalVotes, 0)
  const getActiveArtists = () => artists.filter((artist) => !artist.isBlocked).length
  const getBlockedArtists = () => artists.filter((artist) => artist.isBlocked).length

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

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-black to-gray-900 flex items-center justify-center">
        <div className="text-white">🔐 Vérification des autorisations...</div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-black to-gray-900 relative overflow-hidden">
      <BackgroundEffects />

      {/* Header fixe */}
      <div className="sticky top-0 z-50 bg-gray-900/90 backdrop-blur-sm border-b border-gray-700">
        <div className="container mx-auto px-4 py-4">
          <div className="flex justify-between items-center">
            <Button
              onClick={() => (window.location.href = "/")}
              className="bg-gray-800/80 hover:bg-gray-700/80 text-custom-green border border-custom-green/30"
              size="sm"
            >
              <Home className="w-4 h-4 mr-2" />
              Accueil
            </Button>
            <div className="text-center">
              <KrucialLogo width={80} height={40} />
              <h1 className="text-xl font-bold text-white">ADMIN KRUCIAL</h1>
            </div>
            <div className="flex items-center gap-2">
              <Badge
                variant="outline"
                className={`${isConnected ? "border-custom-green text-custom-green" : "border-red-500 text-red-400"}`}
              >
                {isConnected ? <Wifi className="w-3 h-3 mr-1" /> : <WifiOff className="w-3 h-3 mr-1" />}
                {isConnected ? "Sync" : "Off"}
              </Badge>
              <Button
                onClick={logout}
                variant="ghost"
                size="sm"
                className="text-red-400 hover:text-red-300 hover:bg-red-500/10"
              >
                <LogOut className="w-4 h-4 mr-2" />
                Sortir
              </Button>
            </div>
          </div>
        </div>
      </div>

      <div className="relative z-10 container mx-auto px-4 py-6">
        {/* Barre de statut */}
        <div className="flex flex-wrap justify-center items-center gap-4 mb-6">
          <Badge variant="outline" className="border-custom-green text-custom-green">
            <Clock className="w-3 h-3 mr-1" />
            {new Date(lastUpdate).toLocaleTimeString()}
          </Badge>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setShowHistory(!showHistory)}
            className="text-blue-400 hover:text-blue-300 hover:bg-blue-500/10"
          >
            <History className="w-4 h-4 mr-1" />
            Historique ({voteHistory.length})
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={handleForceReset}
            className="text-orange-400 hover:text-orange-300 hover:bg-orange-500/10"
          >
            <RotateCcw className="w-4 h-4 mr-1" />
            Reset DB
          </Button>
        </div>

        {/* Contrôles globaux */}
        <Card className="bg-gray-900/80 border-gray-700 backdrop-blur-sm mb-6">
          <CardHeader>
            <CardTitle className="text-white flex items-center justify-between text-lg">
              <div className="flex items-center gap-3">
                <Settings className="w-5 h-5 text-custom-green" />
                Contrôles Globaux
              </div>
              <div className="flex items-center gap-3">
                <Button
                  onClick={handleToggleGlobalVoting}
                  disabled={isLoading}
                  size="sm"
                  className={`${
                    globalVotingEnabled
                      ? "bg-red-600 hover:bg-red-700 text-white"
                      : "bg-custom-green hover:bg-custom-green text-white"
                  }`}
                >
                  {globalVotingEnabled ? (
                    <>
                      <Lock className="w-4 h-4 mr-1" />
                      Fermer votes
                    </>
                  ) : (
                    <>
                      <Unlock className="w-4 h-4 mr-1" />
                      Ouvrir votes
                    </>
                  )}
                </Button>
                <Button
                  onClick={handleResetVotes}
                  disabled={isLoading}
                  variant="destructive"
                  size="sm"
                  className="bg-red-600 hover:bg-red-700"
                >
                  <RefreshCw className="w-4 h-4 mr-1" />
                  Reset
                </Button>
              </div>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-4">
              {globalVotingEnabled ? (
                <div className="flex items-center gap-2 text-custom-green">
                  <CheckCircle className="w-5 h-5" />
                  <span className="font-semibold">Votes OUVERTS</span>
                </div>
              ) : (
                <div className="flex items-center gap-2 text-red-400">
                  <AlertCircle className="w-5 h-5" />
                  <span className="font-semibold">Votes FERMÉS</span>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Statistiques */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
          <Card className="bg-gray-900/80 border-gray-700 backdrop-blur-sm">
            <CardContent className="p-4 text-center">
              <div className="flex items-center justify-center mb-2">
                <TrendingUp className="w-5 h-5 text-custom-green mr-2" />
                <div className="text-2xl font-bold text-custom-green">{getTotalVotes()}</div>
              </div>
              <div className="text-xs text-gray-300">Total votes</div>
            </CardContent>
          </Card>

          <Card className="bg-gray-900/80 border-gray-700 backdrop-blur-sm">
            <CardContent className="p-4 text-center">
              <div className="flex items-center justify-center mb-2">
                <Music className="w-5 h-5 text-blue-400 mr-2" />
                <div className="text-2xl font-bold text-blue-400">{artists.length}</div>
              </div>
              <div className="text-xs text-gray-300">Artistes</div>
            </CardContent>
          </Card>

          <Card className="bg-gray-900/80 border-gray-700 backdrop-blur-sm">
            <CardContent className="p-4 text-center">
              <div className="flex items-center justify-center mb-2">
                <Unlock className="w-5 h-5 text-custom-green mr-2" />
                <div className="text-2xl font-bold text-custom-green">{getActiveArtists()}</div>
              </div>
              <div className="text-xs text-gray-300">Ouverts</div>
            </CardContent>
          </Card>

          <Card className="bg-gray-900/80 border-gray-700 backdrop-blur-sm">
            <CardContent className="p-4 text-center">
              <div className="flex items-center justify-center mb-2">
                <Lock className="w-5 h-5 text-red-400 mr-2" />
                <div className="text-2xl font-bold text-red-400">{getBlockedArtists()}</div>
              </div>
              <div className="text-xs text-gray-300">Fermés</div>
            </CardContent>
          </Card>
        </div>

        {/* Historique des votes */}
        {showHistory && (
          <Card className="bg-gray-900/80 border-gray-700 backdrop-blur-sm mb-6">
            <CardHeader>
              <CardTitle className="text-white flex items-center gap-3">
                <History className="w-5 h-5 text-blue-400" />
                Historique des votes (temps réel)
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="max-h-64 overflow-y-auto space-y-2">
                {voteHistory
                  .slice(-20)
                  .reverse()
                  .map((vote, index) => (
                    <div
                      key={vote.id || index}
                      className="flex justify-between items-center text-sm bg-gray-800/50 p-2 rounded"
                    >
                      <div>
                        <span className="text-white font-medium">{vote.artistName}</span>
                        <span className="text-custom-green ml-2">{vote.selectedOption}</span>
                      </div>
                      <div className="text-gray-400 text-xs">{new Date(vote.timestamp).toLocaleString()}</div>
                    </div>
                  ))}
                {voteHistory.length === 0 && (
                  <div className="text-gray-400 text-center py-4">Aucun vote enregistré</div>
                )}
              </div>
            </CardContent>
          </Card>
        )}

        <div className="grid lg:grid-cols-3 gap-6">
          {/* Formulaire d'ajout d'artiste */}
          <Card className="bg-gray-900/80 border-gray-700 backdrop-blur-sm">
            <CardHeader>
              <CardTitle className="text-white flex items-center gap-3">
                <Plus className="w-5 h-5 text-custom-green" />
                Ajouter un artiste
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="name" className="text-gray-300 font-medium">
                  Nom de l'artiste
                </Label>
                <Input
                  id="name"
                  value={newArtist.name}
                  onChange={(e) => setNewArtist({ ...newArtist, name: e.target.value })}
                  className="bg-gray-800 border-gray-600 text-white mt-1"
                  placeholder="Ex: DJ KRUCIAL"
                />
              </div>
              <div>
                <Label htmlFor="timeSlot" className="text-gray-300 font-medium">
                  Créneau horaire
                </Label>
                <Input
                  id="timeSlot"
                  value={newArtist.timeSlot}
                  onChange={(e) => setNewArtist({ ...newArtist, timeSlot: e.target.value })}
                  className="bg-gray-800 border-gray-600 text-white mt-1"
                  placeholder="Ex: 22h00 - 23h30"
                />
              </div>
              <div>
                <Label className="text-gray-300 font-medium">2 styles</Label>
                {newArtist.options.map((option, index) => (
                  <Input
                    key={index}
                    value={option}
                    onChange={(e) => updateNewArtistOption(index, e.target.value)}
                    placeholder={`Style ${index + 1} - Ex: Nom → genres`}
                    className="bg-gray-800 border-gray-600 text-white mt-2"
                  />
                ))}
              </div>
              <Button
                onClick={handleAddArtist}
                disabled={isLoading || !isConnected}
                className="w-full bg-custom-green hover:bg-custom-green text-black font-bold neon-glow"
              >
                {isLoading ? (
                  <>
                    <div className="w-4 h-4 border-2 border-black border-t-transparent rounded-full animate-spin mr-2"></div>
                    Ajout...
                  </>
                ) : (
                  <>
                    <Plus className="w-4 h-4 mr-2" />
                    Ajouter
                  </>
                )}
              </Button>
            </CardContent>
          </Card>

          {/* Résultats en temps réel */}
          <Card className="lg:col-span-2 bg-gray-900/80 border-gray-700 backdrop-blur-sm">
            <CardHeader>
              <CardTitle className="text-white flex items-center gap-3">
                <BarChart3 className="w-5 h-5 text-custom-green" />
                Résultats temps réel
                <Badge className="bg-custom-green/20 text-custom-green border-custom-green/50">
                  <Zap className="w-3 h-3 mr-1" />
                  Live
                </Badge>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-6 max-h-96 overflow-y-auto">
                {artists.map((artist) => (
                  <div key={artist.id} className="border-b border-gray-700 pb-4 last:border-b-0">
                    <div className="flex justify-between items-center mb-3">
                      <div className="flex items-center gap-3">
                        <div
                          className={`w-4 h-4 rounded-full ${artist.isBlocked ? "bg-red-500" : "bg-custom-green"} ${!artist.isBlocked ? "pulse-green" : ""}`}
                        ></div>
                        <div>
                          <h4 className="font-bold text-white">{artist.name}</h4>
                          <span className="text-gray-400 text-sm">({artist.timeSlot})</span>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge className="bg-custom-green/20 text-custom-green border-custom-green/50">
                          <Users className="w-3 h-3 mr-1" />
                          {artist.totalVotes}
                        </Badge>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => handleToggleArtistVoting(artist.id, artist.isBlocked)}
                          className={`${
                            artist.isBlocked
                              ? "text-red-400 hover:text-red-300 hover:bg-red-500/10"
                              : "text-custom-green hover:text-custom-green hover:bg-custom-green/10"
                          }`}
                        >
                          {artist.isBlocked ? <Lock className="w-4 h-4" /> : <Unlock className="w-4 h-4" />}
                        </Button>
                        <Button
                          onClick={() => handleDeleteArtist(artist.id, artist.name)}
                          variant="ghost"
                          size="sm"
                          className="text-red-400 hover:text-red-300 hover:bg-red-500/10"
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                    <div className="space-y-2">
                      {artist.options.map((option) => {
                        const formatted = formatOptionForDisplay(option)
                        return (
                          <div key={option} className="space-y-1">
                            <div className="flex justify-between items-center text-sm">
                              <span className="text-gray-300 font-medium flex items-center gap-2">
                                <Volume2 className="w-3 h-3 text-custom-green" />
                                <div>
                                  <div className="font-bold">{formatted.title}</div>
                                  {formatted.description && (
                                    <div className="text-xs text-gray-500">{formatted.description}</div>
                                  )}
                                </div>
                              </span>
                              <span className="text-custom-green font-bold">
                                {artist.votes[option] || 0} ({getVotePercentage(artist, option)}%)
                              </span>
                            </div>
                            <Progress value={getVotePercentage(artist, option)} className="h-2 bg-gray-800" />
                          </div>
                        )
                      })}
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
