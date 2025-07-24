// Simulation WebSocket avec EventSource pour la synchronisation temps réel
type WebSocketMessage = {
  type:
    | "STATE_UPDATE"
    | "VOTE_ADDED"
    | "ARTIST_ADDED"
    | "ARTIST_DELETED"
    | "ARTIST_BLOCKED"
    | "GLOBAL_VOTING_TOGGLED"
    | "VOTES_RESET"
  data: any
  timestamp: number
}

class WebSocketManager {
  private listeners: Set<(message: WebSocketMessage) => void> = new Set()
  private connected = false

  constructor() {
    this.connect()
  }

  private connect() {
    this.connected = true
    console.log("WebSocket simulation connected")
  }

  subscribe(listener: (message: WebSocketMessage) => void): () => void {
    this.listeners.add(listener)
    return () => this.listeners.delete(listener)
  }

  broadcast(type: WebSocketMessage["type"], data: any) {
    const message: WebSocketMessage = {
      type,
      data,
      timestamp: Date.now(),
    }

    // Simuler un délai réseau minimal
    setTimeout(() => {
      this.listeners.forEach((listener) => {
        try {
          listener(message)
        } catch (error) {
          console.error("Error in WebSocket listener:", error)
        }
      })
    }, 10)
  }

  // Correction: méthode getter au lieu de fonction
  get isConnected(): boolean {
    return this.connected
  }

  // Méthode pour déconnecter si nécessaire
  disconnect() {
    this.connected = false
    console.log("WebSocket simulation disconnected")
  }

  // Méthode pour reconnecter si nécessaire
  reconnect() {
    this.connected = true
    console.log("WebSocket simulation reconnected")
  }
}

export const websocket = new WebSocketManager()
