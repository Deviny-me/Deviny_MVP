import * as signalR from '@microsoft/signalr'
import { MEDIA_BASE_URL } from '@/lib/config'
import type { MessageDto } from '@/types/message'
import type { AchievementAwardedEvent } from '@/types/achievement'

/**
 * Singleton wrapper around the SignalR chat hub.
 * Uses Groups (user:{id} and conv:{id}) instead of the old static Dictionary.
 */
export class ChatConnection {
  private connection: signalR.HubConnection | null = null
  private startPromise: Promise<void> | null = null
  private handlers: Map<string, ((...args: any[]) => void)[]> = new Map()
  private lifecycleCallbacks: Map<string, (() => void)[]> = new Map()

  // ─── connection lifecycle ───

  async start() {
    if (this.startPromise) return this.startPromise
    if (this.connection?.state === signalR.HubConnectionState.Connected) return

    this.startPromise = this._startConnection()
    try {
      await this.startPromise
    } finally {
      this.startPromise = null
    }
  }

  private async _startConnection() {
    const token = localStorage.getItem('accessToken') || sessionStorage.getItem('accessToken')
    if (!token) throw new Error('No access token found. Please login again.')

    this.connection = new signalR.HubConnectionBuilder()
      .withUrl(`${MEDIA_BASE_URL}/hubs/chat?access_token=${token}`)
      .withAutomaticReconnect({
        nextRetryDelayInMilliseconds: (ctx) => {
          if (ctx.previousRetryCount < 5) {
            return Math.min(1000 * Math.pow(2, ctx.previousRetryCount), 30000)
          }
          return null
        },
      })
      .configureLogging(signalR.LogLevel.Information)
      .build()

    // Re-register all stored handlers BEFORE starting
    console.log(`[ChatConnection] Re-registering ${this.handlers.size} event types with ${Array.from(this.handlers.values()).reduce((sum, arr) => sum + arr.length, 0)} total handlers`)
    this.handlers.forEach((callbacks, event) => {
      console.log(`[ChatConnection] Registering ${callbacks.length} handler(s) for '${event}'`)
      callbacks.forEach(cb => this.connection?.on(event, cb))
    })

    // Register lifecycle callbacks
    this.connection.onreconnecting(() => {
      console.log('[SignalR] reconnecting...')
      this._executeLifecycleCallbacks('reconnecting')
    })
    
    this.connection.onreconnected(() => {
      console.log('[SignalR] reconnected')
      this._executeLifecycleCallbacks('reconnected')
    })
    
    this.connection.onclose((err) => {
      console.error('[SignalR] closed', err)
      this._executeLifecycleCallbacks('closed')
    })

    try {
      await this.connection.start()
      console.log('[SignalR] connected')
    } catch (error) {
      console.error('[SignalR] start failed', error)
      this.connection = null
      throw error
    }
  }

  async stop() {
    if (this.connection) {
      await this.connection.stop()
      this.connection = null
    }
  }

  /** Clear all event handlers (call when unmounting top-level chat pages). */
  clearHandlers() {
    this.handlers.clear()
    // Don't touch the connection itself; just remove listeners
    if (this.connection) {
      ;(this.connection as any)._methods = {}
    }
  }

  // ─── lifecycle callbacks ───

  private _executeLifecycleCallbacks(event: string) {
    const callbacks = this.lifecycleCallbacks.get(event)
    if (callbacks) {
      callbacks.forEach(cb => cb())
    }
  }

  onReconnected(cb: () => void) {
    if (!this.lifecycleCallbacks.has('reconnected')) {
      this.lifecycleCallbacks.set('reconnected', [])
    }
    this.lifecycleCallbacks.get('reconnected')!.push(cb)
  }

  offReconnected(cb: () => void) {
    const callbacks = this.lifecycleCallbacks.get('reconnected')
    if (callbacks) {
      const index = callbacks.indexOf(cb)
      if (index > -1) callbacks.splice(index, 1)
    }
  }

  // ─── private helper to register an event handler ───

  private _on(event: string, cb: (...args: any[]) => void) {
    if (!this.handlers.has(event)) this.handlers.set(event, [])
    this.handlers.get(event)!.push(cb)
    
    // If connection already exists, register handler immediately
    if (this.connection) {
      console.log(`[ChatConnection] Registering handler for '${event}' on active connection`)
      this.connection.on(event, cb)
    } else {
      console.log(`[ChatConnection] Storing handler for '${event}' (no connection yet)`)
    }
  }

  // ─── event subscriptions ───

  on(event: string, cb: (...args: any[]) => void) { this._on(event, cb) }
  off(event: string, cb: (...args: any[]) => void) {
    const handlers = this.handlers.get(event)
    if (handlers) {
      const index = handlers.indexOf(cb)
      if (index > -1) handlers.splice(index, 1)
    }
    this.connection?.off(event, cb)
  }

  onReceiveMessage(cb: (msg: MessageDto) => void) { this._on('ReceiveMessage', cb) }
  onConversationUpdated(cb: (data: { conversationId: string; lastMessageText: string; lastMessageAt: string; senderId: string; messageId: string }) => void) { this._on('ConversationUpdated', cb) }
  onNewConversation(cb: (data: { conversationId: string; messageDto: MessageDto }) => void) { this._on('NewConversation', cb) }
  onMessagesRead(cb: (data: { conversationId: string; messageIds: string[]; readBy: string; readAt: string }) => void) { this._on('MessagesRead', cb) }
  onUserTyping(cb: (data: { conversationId: string; userId: string }) => void) { this._on('UserTyping', cb) }
  onUserStoppedTyping(cb: (data: { conversationId: string; userId: string }) => void) { this._on('UserStoppedTyping', cb) }
  onError(cb: (error: string) => void) { this._on('Error', cb) }
  onAchievementAwarded(cb: (data: AchievementAwardedEvent) => void) { this._on('AchievementAwarded', cb) }

  // ─── hub invocations ───

  async joinConversation(conversationId: string) {
    await this.ensureConnected()
    await this.connection!.invoke('JoinConversation', conversationId)
  }

  async leaveConversation(conversationId: string) {
    await this.ensureConnected()
    await this.connection!.invoke('LeaveConversation', conversationId)
  }

  async sendMessage(conversationId: string, text: string, replyToMessageId?: string, attachmentUrl?: string, attachmentFileName?: string, attachmentContentType?: string, attachmentSize?: number) {
    await this.ensureConnected()
    await this.connection!.invoke('SendMessage', conversationId, text, replyToMessageId ?? null, attachmentUrl ?? null, attachmentFileName ?? null, attachmentContentType ?? null, attachmentSize ?? null)
  }

  async startDirectMessage(receiverId: string, text: string) {
    await this.ensureConnected()
    await this.connection!.invoke('StartDirectMessage', receiverId, text)
  }

  async markRead(conversationId: string) {
    await this.ensureConnected()
    await this.connection!.invoke('MarkRead', conversationId)
  }

  async typing(conversationId: string) {
    await this.ensureConnected()
    await this.connection!.invoke('Typing', conversationId)
  }

  async stopTyping(conversationId: string) {
    await this.ensureConnected()
    await this.connection!.invoke('StopTyping', conversationId)
  }

  getState() {
    return this.connection?.state
  }

  private async ensureConnected() {
    if (!this.connection || this.connection.state !== signalR.HubConnectionState.Connected) {
      await this.start()
    }
  }
}

/** Singleton instance – shared across all pages. */
export const chatConnection = new ChatConnection()
