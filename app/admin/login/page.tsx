"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Lock, Shield, Eye, EyeOff } from "lucide-react"
import { BackgroundEffects } from "@/components/background-effects"
import { KrucialLogo } from "@/components/krucial-logo"

export default function AdminLoginPage() {
  const [code, setCode] = useState("")
  const [error, setError] = useState("")
  const [showPassword, setShowPassword] = useState(false)
  const [isLoading, setIsLoading] = useState(false)

  const handleLogin = async () => {
    if (!code.trim()) {
      setError("Veuillez entrer le code d'accès")
      return
    }

    setIsLoading(true)
    setError("")

    // Vérification du code PIN
    setTimeout(() => {
      if (code === "KRUCIAL2024") {
        localStorage.setItem("adminAuth", "KRUCIAL2024")
        console.log("Admin authenticated successfully")
        window.location.href = "/admin"
      } else {
        setError("Code PIN incorrect")
        setCode("")
      }
      setIsLoading(false)
    }, 500)
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-black to-gray-900 relative overflow-hidden">
      <BackgroundEffects />

      <div className="relative z-10 container mx-auto px-4 py-8 flex items-center justify-center min-h-screen">
        <Card className="w-full max-w-md bg-gray-900/90 border-gray-700 backdrop-blur-sm slide-in">
          <CardHeader className="text-center pb-8">
            <KrucialLogo width={100} height={50} className="mx-auto mb-6" />
            <CardTitle className="text-white flex items-center justify-center gap-3 text-2xl">
              <Shield className="w-6 h-6 text-custom-green" />
              Administration
            </CardTitle>
            <p className="text-gray-400 mt-2">Interface privée - Code PIN requis</p>
          </CardHeader>

          <CardContent className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="code" className="text-gray-300 font-medium">
                Code PIN administrateur
              </Label>
              <div className="relative">
                <Input
                  id="code"
                  type={showPassword ? "text" : "password"}
                  value={code}
                  onChange={(e) => setCode(e.target.value)}
                  onKeyPress={(e) => e.key === "Enter" && !isLoading && handleLogin()}
                  className="bg-gray-800 border-gray-600 text-white pr-12 py-3 text-center text-lg font-mono"
                  placeholder="••••••••"
                  disabled={isLoading}
                  maxLength={20}
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="absolute right-2 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-white"
                  onClick={() => setShowPassword(!showPassword)}
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </Button>
              </div>
              {error && (
                <p className="text-red-400 text-sm mt-2 flex items-center gap-2">
                  <Lock className="w-4 h-4" />
                  {error}
                </p>
              )}
            </div>

            <Button
              onClick={handleLogin}
              disabled={isLoading}
              className="w-full bg-custom-green hover:bg-custom-green text-black font-bold py-3 neon-glow transition-all duration-300"
            >
              {isLoading ? (
                <>
                  <div className="w-4 h-4 border-2 border-black border-t-transparent rounded-full animate-spin mr-2"></div>
                  Vérification...
                </>
              ) : (
                <>
                  <Lock className="w-4 h-4 mr-2" />
                  Accéder à l'administration
                </>
              )}
            </Button>

            <div className="text-center pt-4 border-t border-gray-700">
              <p className="text-gray-500 text-sm">🔐 Accès sécurisé • 📊 Temps réel • 🎵 Contrôle total</p>
              <p className="text-gray-600 text-xs mt-2">Code par défaut: KRUCIAL2024</p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
