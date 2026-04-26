'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import { usePathname, useRouter, useSearchParams } from 'next/navigation'
import {
  Send,
  Search,
  MessageCircle,
  Loader2,
  ArrowLeft,
  Reply,
  X,
  Paperclip,
  FileText,
  Download,
  Image as ImageIcon,
  Smile,
  Phone,
  Video,
  PhoneOff,
  Mic,
  MicOff,
  VideoOff,
} from 'lucide-react'
import { messagesApi } from '@/lib/api/messagesApi'
import { chatConnection } from '@/lib/signalr/chatConnection'
import { MEDIA_BASE_URL } from '@/lib/config'
import { useAccentColors, getRoleRingClass, getAccentColorsByRole } from '@/lib/theme/useAccentColors'
import { useLocale, useTranslations } from 'next-intl'
import type {
  ConversationListItemDto,
  MessageDto,
  ChatFileUploadResult,
} from '@/types/message'

// ─── helpers ───

function getUserIdFromToken(): string | null {
  if (typeof window === 'undefined') return null
  const token = localStorage.getItem('accessToken') || sessionStorage.getItem('accessToken')
  if (!token) return null
  try {
    const payload = JSON.parse(atob(token.split('.')[1]))
    return (
      payload.sub ??
      payload[
        'http://schemas.xmlsoap.org/ws/2005/05/identity/claims/nameidentifier'
      ] ?? null
    )
  } catch {
    return null
  }
}

function formatRelative(dateStr: string | null): string {
  if (!dateStr) return ''
  const diff = Date.now() - new Date(dateStr).getTime()
  const mins = Math.floor(diff / 60_000)
  if (mins < 1) return 'now'
  if (mins < 60) return `${mins}m`
  const hrs = Math.floor(diff / 3_600_000)
  if (hrs < 24) return `${hrs}h`
  const days = Math.floor(diff / 86_400_000)
  if (days < 7) return `${days}d`
  return new Date(dateStr).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
  })
}

function formatTime(dateStr: string): string {
  return new Date(dateStr).toLocaleTimeString([], {
    hour: '2-digit',
    minute: '2-digit',
  })
}

function formatLastSeen(
  lastSeenAtUtc: string | null | undefined,
  t: (key: string, values?: any) => any,
  locale: string
): string {
  if (!lastSeenAtUtc) return t('lastSeenRecently')

  const seenAt = new Date(lastSeenAtUtc)
  if (Number.isNaN(seenAt.getTime())) return t('lastSeenRecently')

  const now = Date.now()
  const diffMs = now - seenAt.getTime()
  const minutes = Math.floor(diffMs / 60_000)
  if (minutes < 1) return t('lastSeenJustNow')
  if (minutes < 60) return t('lastSeenMinutesAgo', { count: minutes })

  const sameDay = seenAt.toDateString() === new Date(now).toDateString()
  const time = seenAt.toLocaleTimeString(locale, { hour: '2-digit', minute: '2-digit' })
  if (sameDay) {
    return t('lastSeenAt', { time })
  }

  const date = seenAt.toLocaleDateString(locale, { month: 'short', day: 'numeric' })
  return t('lastSeenDateTime', { date, time })
}

function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
  if (bytes < 1024 * 1024 * 1024) return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
  return `${(bytes / (1024 * 1024 * 1024)).toFixed(1)} GB`
}

function avatarUrl(path: string | null | undefined): string | null {
  if (!path) return null
  if (path.startsWith('http')) return path
  return `${MEDIA_BASE_URL}${path}`
}

function sameId(a: string | null | undefined, b: string | null | undefined): boolean {
  if (!a || !b) return false
  return a.toLowerCase() === b.toLowerCase()
}

// ─── component ───

type CallType = 'audio' | 'video'

interface IncomingCallState {
  conversationId: string
  fromUserId: string
  fromUserName: string
  callType: CallType
  offer: RTCSessionDescriptionInit
}

const CALL_RING_TIMEOUT_MS = 30_000

function formatCallDuration(totalSeconds: number): string {
  const minutes = Math.floor(totalSeconds / 60)
  const seconds = totalSeconds % 60
  return `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`
}

export default function ChatInbox() {
  const QUICK_EMOJIS = ['😀', '😂', '😍', '😎', '😭', '😡', '👍', '👏', '🙏', '🔥', '❤️', '🎉']
  const accent = useAccentColors()
  const t = useTranslations('chat')
  const locale = useLocale()
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const userIdFromUrl = searchParams.get('userId')
  const userNameFromUrl = searchParams.get('userName')
  const userAvatarFromUrl = searchParams.get('userAvatar')
  const startCallFromUrl = searchParams.get('startCall')

  const [currentUserId] = useState<string | null>(() => getUserIdFromToken())
  const [conversations, setConversations] = useState<ConversationListItemDto[]>([])
  const [selectedConvId, setSelectedConvId] = useState<string | null>(null)
  const [messages, setMessages] = useState<MessageDto[]>([])
  const [inputText, setInputText] = useState('')
  const draftsRef = useRef<Record<string, string>>({})
  const [searchQuery, setSearchQuery] = useState('')
  const [replyTo, setReplyTo] = useState<MessageDto | null>(null)
  const [showEmojiPicker, setShowEmojiPicker] = useState(false)
  const [callNotice, setCallNotice] = useState<string | null>(null)
  const [incomingCall, setIncomingCall] = useState<IncomingCallState | null>(null)
  const [callStatus, setCallStatus] = useState<'idle' | 'calling' | 'ringing' | 'connecting' | 'connected'>('idle')
  const [activeCallType, setActiveCallType] = useState<CallType | null>(null)
  const [activeCallPeerId, setActiveCallPeerId] = useState<string | null>(null)
  const [activeCallPeerName, setActiveCallPeerName] = useState<string | null>(null)
  const [activeCallConversationId, setActiveCallConversationId] = useState<string | null>(null)
  const [isMicMuted, setIsMicMuted] = useState(false)
  const [isCameraEnabled, setIsCameraEnabled] = useState(true)
  const [callDurationSeconds, setCallDurationSeconds] = useState(0)
  const [presenceByUserId, setPresenceByUserId] = useState<Record<string, { isOnline: boolean; lastSeenAtUtc: string | null }>>({})

  const [loadingConvs, setLoadingConvs] = useState(true)
  const [loadingMsgs, setLoadingMsgs] = useState(false)
  const [sending, setSending] = useState(false)
  const [pendingFile, setPendingFile] = useState<ChatFileUploadResult | null>(null)
  const [uploading, setUploading] = useState(false)

  const messagesEndRef = useRef<HTMLDivElement>(null)
  const lastVisibleMessageIdRef = useRef<string | null>(null)
  const selectedConvIdRef = useRef<string | null>(null)
  const inputRef = useRef<HTMLInputElement>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const emojiPickerRef = useRef<HTMLDivElement>(null)
  const localVideoRef = useRef<HTMLVideoElement | null>(null)
  const remoteVideoRef = useRef<HTMLVideoElement | null>(null)
  const remoteAudioRef = useRef<HTMLAudioElement | null>(null)
  const peerConnectionRef = useRef<RTCPeerConnection | null>(null)
  const localStreamRef = useRef<MediaStream | null>(null)
  const remoteStreamRef = useRef<MediaStream | null>(null)
  const isCallInitiatorRef = useRef(false)
  const callStartLoggedRef = useRef(false)
  const incomingCallTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const outgoingCallTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const connectedCallTimerRef = useRef<ReturnType<typeof setInterval> | null>(null)
  const connectedAtRef = useRef<number | null>(null)
  const creatingConvRef = useRef(false)
  const deepLinkHandledRef = useRef(false)
  const startCallHandledRef = useRef(false)
  const activeCallPeerIdRef = useRef<string | null>(null)
  const activeCallConversationIdRef = useRef<string | null>(null)
  const callStatusRef = useRef<'idle' | 'calling' | 'ringing' | 'connecting' | 'connected'>('idle')
  const pendingIceCandidatesRef = useRef<RTCIceCandidateInit[]>([])
  const subscribedPresenceIdsRef = useRef<Set<string>>(new Set())

  // Keep refs in sync with state
  useEffect(() => { selectedConvIdRef.current = selectedConvId }, [selectedConvId])
  useEffect(() => { activeCallPeerIdRef.current = activeCallPeerId }, [activeCallPeerId])
  useEffect(() => { activeCallConversationIdRef.current = activeCallConversationId }, [activeCallConversationId])
  useEffect(() => { callStatusRef.current = callStatus }, [callStatus])

  const callTypeText = useCallback(
    (type: CallType | null | undefined) =>
      type === 'video' ? t('videoCallLower') : t('audioCallLower'),
    [t]
  )

  // ─── load conversations ───

  const loadConversations = useCallback(async () => {
    try {
      setLoadingConvs(true)
      const data = await messagesApi.getMyConversations(1, 100)
      setConversations(data.items)
      setPresenceByUserId(prev => {
        const next = { ...prev }
        for (const conv of data.items) {
          const key = conv.peerUser.id.toLowerCase()
          next[key] = {
            isOnline: !!conv.peerUser.isOnline,
            lastSeenAtUtc: conv.peerUser.lastSeenAtUtc ?? null,
          }
        }
        return next
      })
    } catch (err) {
      console.error('Failed to load conversations', err)
    } finally {
      setLoadingConvs(false)
    }
  }, [])

  // ─── load messages for selected conversation ───

  const loadMessages = useCallback(async (convId: string) => {
    try {
      setLoadingMsgs(true)
      const data = await messagesApi.getConversationMessages(convId)
      setMessages(data)

      // Mark as read
      const hasUnread = data.some(m => !m.readAt && m.senderId !== currentUserId)
      if (hasUnread) {
        chatConnection.markRead(convId).catch(() => {})
      }
    } catch (err) {
      console.error('Failed to load messages', err)
    } finally {
      setLoadingMsgs(false)
    }
  }, [currentUserId])

  // ─── initial load ───
  useEffect(() => { loadConversations() }, [loadConversations])

  // ─── SignalR setup (once) ───
  useEffect(() => {
    const myId = getUserIdFromToken()

    // Handle incoming messages — only updates message thread
    const handleReceiveMessage = (msg: MessageDto) => {
      const activeConvId = selectedConvIdRef.current

      // If this conv is open → append message
      if (msg.conversationId === activeConvId) {
        setMessages(prev => {
          if (prev.some(m => m.id === msg.id)) return prev
          const filtered = prev.filter(m => !m.id.startsWith('temp-'))
          return [...filtered, msg]
        })

        // Auto-read if not mine
        if (msg.senderId !== myId) {
          chatConnection.markRead(msg.conversationId).catch(() => {})
        }
      }
    }

    // Handle conversation list updates — arrives via personal user group
    const handleConversationUpdated = (data: {
      conversationId: string
      lastMessageText: string
      lastMessageAt: string
      senderId: string
      messageId: string
    }) => {
      const activeConvId = selectedConvIdRef.current
      const myIdLower = myId?.toLowerCase()

      setConversations(prev => {
        const idx = prev.findIndex(c => c.id.toLowerCase() === data.conversationId.toLowerCase())
        if (idx === -1) {
          // New conversation we didn't know about → full reload
          loadConversations()
          return prev
        }
        const updated = [...prev]
        const isMine = data.senderId.toLowerCase() === myIdLower
        const isOpen = activeConvId?.toLowerCase() === data.conversationId.toLowerCase()
        updated[idx] = {
          ...updated[idx],
          lastMessageText: data.lastMessageText,
          lastMessageAt: data.lastMessageAt,
          unreadCount:
            !isMine && !isOpen
              ? updated[idx].unreadCount + 1
              : updated[idx].unreadCount,
        }
        // Re-sort by lastMessageAt desc
        updated.sort(
          (a, b) =>
            new Date(b.lastMessageAt ?? 0).getTime() -
            new Date(a.lastMessageAt ?? 0).getTime()
        )
        return updated
      })
    }

    const handleMessagesRead = (data: any) => {
      setMessages(prev =>
        prev.map(m =>
          data.messageIds.includes(m.id) ? { ...m, readAt: data.readAt } : m
        )
      )
    }

    const handleNewConversation = () => {
      loadConversations()
    }

    const handleError = (err: string) => {
      console.error('[Chat] error:', err)
    }

    const handlePresenceUpdated = (data: { userId: string; isOnline: boolean; lastSeenAtUtc: string | null }) => {
      const key = data.userId.toLowerCase()
      setPresenceByUserId(prev => ({
        ...prev,
        [key]: {
          isOnline: data.isOnline,
          lastSeenAtUtc: data.lastSeenAtUtc,
        },
      }))

      setConversations(prev => prev.map(conv =>
        conv.peerUser.id.toLowerCase() === key
          ? {
              ...conv,
              peerUser: {
                ...conv.peerUser,
                isOnline: data.isOnline,
                lastSeenAtUtc: data.lastSeenAtUtc,
              },
            }
          : conv
      ))
    }

    // Re-join conversation group + reload data after SignalR reconnects
    const handleReconnected = () => {
      console.log('[Chat] SignalR reconnected, re-joining groups and reloading data')
      const activeConvId = selectedConvIdRef.current
      if (activeConvId) {
        chatConnection.joinConversation(activeConvId).catch(() => {})
        loadMessages(activeConvId)
      }
      loadConversations()
    }

    chatConnection.onReceiveMessage(handleReceiveMessage)
    chatConnection.onConversationUpdated(handleConversationUpdated)
    chatConnection.onMessagesRead(handleMessagesRead)
    chatConnection.onNewConversation(handleNewConversation)
    chatConnection.onError(handleError)
    chatConnection.onPresenceUpdated(handlePresenceUpdated)
    chatConnection.onReconnected(handleReconnected)

    chatConnection.start().catch(console.error)

    return () => {
      chatConnection.off('ReceiveMessage', handleReceiveMessage)
      chatConnection.off('ConversationUpdated', handleConversationUpdated)
      chatConnection.off('MessagesRead', handleMessagesRead)
      chatConnection.off('NewConversation', handleNewConversation)
      chatConnection.off('Error', handleError)
      chatConnection.off('PresenceUpdated', handlePresenceUpdated)
      chatConnection.offReconnected(handleReconnected)
    }
  }, [loadConversations, loadMessages])

  useEffect(() => {
    let cancelled = false

    const syncPresenceSubscriptions = async () => {
      try {
        await chatConnection.start()
      } catch {
        return
      }

      if (cancelled) return

      const desiredIds = new Set(
        conversations.map(c => c.peerUser.id.toLowerCase())
      )

      for (const id of desiredIds) {
        if (!subscribedPresenceIdsRef.current.has(id)) {
          chatConnection.subscribePresence(id).catch(() => {})
          subscribedPresenceIdsRef.current.add(id)
        }
      }

      for (const id of Array.from(subscribedPresenceIdsRef.current)) {
        if (!desiredIds.has(id)) {
          chatConnection.unsubscribePresence(id).catch(() => {})
          subscribedPresenceIdsRef.current.delete(id)
        }
      }
    }

    syncPresenceSubscriptions()

    return () => {
      cancelled = true
    }
  }, [conversations])

  useEffect(() => {
    let timer: ReturnType<typeof setInterval> | null = null
    let stopped = false

    const startHeartbeat = async () => {
      try {
        await chatConnection.start()
      } catch {
        return
      }

      if (stopped) return

      chatConnection.heartbeat().catch(() => {})
      timer = setInterval(() => {
        chatConnection.heartbeat().catch(() => {})
      }, 25_000)
    }

    startHeartbeat()

    return () => {
      stopped = true
      if (timer) clearInterval(timer)
    }
  }, [])

  useEffect(() => {
    return () => {
      for (const id of Array.from(subscribedPresenceIdsRef.current)) {
        chatConnection.unsubscribePresence(id).catch(() => {})
      }
      subscribedPresenceIdsRef.current.clear()
    }
  }, [])

  // ─── handle userId from URL (deep link into a DM) ───
  // Runs ONLY once per deep-link to prevent overriding manual contact selection
  useEffect(() => {
    if (!userIdFromUrl || loadingConvs || creatingConvRef.current || deepLinkHandledRef.current) return

    // Prevent self-messaging: ignore if target is own user
    if (currentUserId && userIdFromUrl.toLowerCase() === currentUserId.toLowerCase()) return

    const targetId = userIdFromUrl.toLowerCase()
    const existing = conversations.find(c => c.peerUser.id.toLowerCase() === targetId)
    if (existing) {
      setSelectedConvId(existing.id)
      deepLinkHandledRef.current = true
      return
    }

    // Create conversation — guard with ref to prevent double calls
    creatingConvRef.current = true
    ;(async () => {
      try {
        const { conversationId } = await messagesApi.getOrCreateConversation(userIdFromUrl)
        await loadConversations()
        setSelectedConvId(conversationId)
        deepLinkHandledRef.current = true
      } catch (err) {
        console.error('Failed to create conversation', err)
      } finally {
        creatingConvRef.current = false
      }
    })()
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [userIdFromUrl, loadingConvs, conversations])

  // ─── when selected conv changes → load messages + join group ───
  useEffect(() => {
    if (!selectedConvId) return

    // Clear previous messages immediately to prevent stale flash
    setMessages([])
    setReplyTo(null)
    setPendingFile(null)
    // Restore draft for this conversation (or clear if none)
    setInputText(draftsRef.current[selectedConvId] ?? '')

    loadMessages(selectedConvId)
    chatConnection.joinConversation(selectedConvId).catch(() => {})

    return () => {
      chatConnection.leaveConversation(selectedConvId).catch(() => {})
    }
  }, [selectedConvId, loadMessages])

  // ─── scroll to bottom on new messages ───
  useEffect(() => {
    const latestMessageId = messages[messages.length - 1]?.id ?? null
    if (!latestMessageId) {
      lastVisibleMessageIdRef.current = null
      return
    }

    if (lastVisibleMessageIdRef.current === null) {
      lastVisibleMessageIdRef.current = latestMessageId
      return
    }

    if (lastVisibleMessageIdRef.current !== latestMessageId) {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
      lastVisibleMessageIdRef.current = latestMessageId
    }
  }, [messages])

  useEffect(() => {
    lastVisibleMessageIdRef.current = null
  }, [selectedConvId])

  useEffect(() => {
    if (!selectedConvId) return

    const previousBodyOverflow = document.body.style.overflow
    const previousDocumentOverflow = document.documentElement.style.overflow

    document.body.style.overflow = 'hidden'
    document.documentElement.style.overflow = 'hidden'

    return () => {
      document.body.style.overflow = previousBodyOverflow
      document.documentElement.style.overflow = previousDocumentOverflow
    }
  }, [selectedConvId])

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (!emojiPickerRef.current) return
      if (!emojiPickerRef.current.contains(event.target as Node)) {
        setShowEmojiPicker(false)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const clearCallMedia = useCallback(() => {
    if (incomingCallTimeoutRef.current) {
      clearTimeout(incomingCallTimeoutRef.current)
      incomingCallTimeoutRef.current = null
    }
    if (outgoingCallTimeoutRef.current) {
      clearTimeout(outgoingCallTimeoutRef.current)
      outgoingCallTimeoutRef.current = null
    }
    if (connectedCallTimerRef.current) {
      clearInterval(connectedCallTimerRef.current)
      connectedCallTimerRef.current = null
    }
    connectedAtRef.current = null
    callStartLoggedRef.current = false
    isCallInitiatorRef.current = false
    pendingIceCandidatesRef.current = []

    if (peerConnectionRef.current) {
      peerConnectionRef.current.close()
      peerConnectionRef.current = null
    }
    if (localStreamRef.current) {
      localStreamRef.current.getTracks().forEach(track => track.stop())
      localStreamRef.current = null
    }
    if (remoteStreamRef.current) {
      remoteStreamRef.current.getTracks().forEach(track => track.stop())
      remoteStreamRef.current = null
    }
    if (localVideoRef.current) localVideoRef.current.srcObject = null
    if (remoteVideoRef.current) remoteVideoRef.current.srcObject = null
    if (remoteAudioRef.current) remoteAudioRef.current.srcObject = null

    setCallStatus('idle')
    setActiveCallType(null)
    setActiveCallPeerId(null)
    setActiveCallPeerName(null)
    setActiveCallConversationId(null)
    setIncomingCall(null)
    setIsMicMuted(false)
    setIsCameraEnabled(true)
    setCallDurationSeconds(0)
  }, [])

  const sendCallLogMessage = useCallback(async (conversationId: string, text: string) => {
    try {
      await chatConnection.sendMessage(conversationId, text)
    } catch (err) {
      console.error('Failed to send call log message', err)
    }
  }, [])

  const createPeerConnection = useCallback(async (conversationId: string, targetUserId: string) => {
    if (peerConnectionRef.current) {
      peerConnectionRef.current.close()
    }

    // Fetch TURN credentials dynamically from metered.ca API
    let iceServers: RTCIceServer[] = [
      { urls: 'stun:stun.l.google.com:19302' },
      { urls: 'stun:stun1.l.google.com:19302' },
    ]
    try {
      const res = await fetch('https://deviny.metered.live/api/v1/turn/credentials?apiKey=5694937899d6b5a3161dd5741438e044f1c4')
      const turnServers = await res.json()
      console.log('[WebRTC] Fetched TURN servers:', turnServers.length)
      iceServers = [...iceServers, ...turnServers]
    } catch (e) {
      console.error('[WebRTC] Failed to fetch TURN credentials, using STUN only:', e)
    }

    const pc = new RTCPeerConnection({ iceServers })

    const remoteStream = new MediaStream()
    remoteStreamRef.current = remoteStream
    if (remoteVideoRef.current) remoteVideoRef.current.srcObject = remoteStream
    if (remoteAudioRef.current) remoteAudioRef.current.srcObject = remoteStream

    pc.onicecandidate = async (event) => {
      if (!event.candidate) return
      try {
        await chatConnection.sendCallIceCandidate(conversationId, targetUserId, event.candidate.toJSON())
      } catch (error) {
        console.error('Failed to send ICE candidate', error)
      }
    }

    pc.ontrack = (event) => {
      console.log('[WebRTC] ontrack fired:', event.track.kind, 'readyState:', event.track.readyState, 'muted:', event.track.muted)
      if (event.streams[0]) {
        event.streams[0].getTracks().forEach(track => {
          const exists = remoteStream.getTracks().some(t => t.id === track.id)
          if (!exists) {
            remoteStream.addTrack(track)
          }
        })
      } else {
        remoteStream.addTrack(event.track)
      }
      console.log('[WebRTC] Remote stream tracks:', remoteStream.getTracks().map(t => `${t.kind}:${t.readyState}:muted=${t.muted}`))
      // Don't re-assign srcObject here — callback refs and the useEffect handle it.
      // Don't call play() here — it causes AbortError when ontrack fires multiple times.
      setCallStatus('connected')
    }

    // Play remote media once ICE connection is established and media can flow
    const playRemoteMedia = () => {
      if (remoteAudioRef.current) {
        remoteAudioRef.current.play().catch(e => console.warn('[WebRTC] Remote audio play failed:', e))
      }
      if (remoteVideoRef.current) {
        remoteVideoRef.current.play().catch(e => console.warn('[WebRTC] Remote video play failed:', e))
      }
    }

    pc.oniceconnectionstatechange = () => {
      console.log('[WebRTC] ICE connection state:', pc.iceConnectionState)
      if (pc.iceConnectionState === 'connected' || pc.iceConnectionState === 'completed') {
        // Media can now flow — trigger playback
        playRemoteMedia()
      }
    }

    pc.onconnectionstatechange = () => {
      console.log('[WebRTC] Connection state:', pc.connectionState)
      if (pc.connectionState === 'connected') {
        playRemoteMedia()
      }
      if (pc.connectionState === 'failed' || pc.connectionState === 'closed') {
        clearCallMedia()
      }
      if (pc.connectionState === 'disconnected') {
        setCallNotice('Call connection lost.')
        setTimeout(() => setCallNotice(null), 2500)
      }
    }

    peerConnectionRef.current = pc
    return pc
  }, [clearCallMedia])

  const getLocalMedia = useCallback(async (callType: CallType) => {
    const stream = await navigator.mediaDevices.getUserMedia({
      audio: true,
      video: callType === 'video',
    })
    localStreamRef.current = stream
    if (localVideoRef.current) localVideoRef.current.srcObject = stream
    return stream
  }, [])

  // ─── file upload handler ───
  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    // Reset input so same file can be re-selected
    e.target.value = ''

    if (file.size > 25 * 1024 * 1024) {
      alert('File size exceeds 25 MB limit')
      return
    }

    try {
      setUploading(true)
      const result = await messagesApi.uploadChatFile(file)
      setPendingFile(result)
      inputRef.current?.focus()
    } catch (err) {
      console.error('File upload failed', err)
      alert(t('fileUploadFailed'))
    } finally {
      setUploading(false)
    }
  }

  // ─── send message ───
  const handleSend = async () => {
    if ((!inputText.trim() && !pendingFile) || !selectedConvId || sending) return

    const text = inputText.trim()
    const replyId = replyTo?.id
    const attachment = pendingFile

    // Optimistic message
    const optimistic: MessageDto = {
      id: `temp-${Date.now()}`,
      conversationId: selectedConvId,
      senderId: currentUserId ?? '',
      senderName: '',
      senderAvatarUrl: null,
      text,
      attachmentUrl: attachment?.url ?? null,
      attachmentFileName: attachment?.fileName ?? null,
      attachmentContentType: attachment?.contentType ?? null,
      attachmentSize: attachment?.size ?? null,
      createdAt: new Date().toISOString(),
      readAt: null,
      replyTo: replyTo
        ? { id: replyTo.id, text: replyTo.text, senderName: replyTo.senderName }
        : null,
    }

    setMessages(prev => [...prev, optimistic])
    setInputText('')
    if (selectedConvId) delete draftsRef.current[selectedConvId]
    setReplyTo(null)
    setPendingFile(null)
    setSending(true)

    try {
      await chatConnection.sendMessage(
        selectedConvId, text, replyId,
        attachment?.url, attachment?.fileName, attachment?.contentType, attachment?.size
      )
    } catch (err) {
      console.error('Send failed', err)
      setMessages(prev => prev.filter(m => !m.id.startsWith('temp-')))
      setInputText(text)
      if (attachment) setPendingFile(attachment)
    } finally {
      setSending(false)
    }
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSend()
    }
  }

  const handlePickEmoji = (emoji: string) => {
    setInputText(prev => prev + emoji)
    inputRef.current?.focus()
  }

  const handleBackToMessages = useCallback(() => {
    setSelectedConvId(null)
    setReplyTo(null)
    setPendingFile(null)
    setShowEmojiPicker(false)
    router.replace(pathname)
  }, [pathname, router])

  const handleCallClick = (type: 'audio' | 'video') => {
    if (!selectedConv || !selectedConvId) return
    if (callStatus !== 'idle') return

    ;(async () => {
      try {
        setCallStatus('calling')
        isCallInitiatorRef.current = true
        callStartLoggedRef.current = false
        setActiveCallType(type)
        setActiveCallPeerId(selectedConv.peerUser.id)
        setActiveCallPeerName(selectedConv.peerUser.fullName)
        setActiveCallConversationId(selectedConvId)

        const stream = await getLocalMedia(type)
        const pc = await createPeerConnection(selectedConvId, selectedConv.peerUser.id)
        stream.getTracks().forEach(track => pc.addTrack(track, stream))

        const offer = await pc.createOffer()
        await pc.setLocalDescription(offer)
        await chatConnection.sendCallOffer(selectedConvId, selectedConv.peerUser.id, type, offer)
        setCallStatus('connecting')

        if (outgoingCallTimeoutRef.current) clearTimeout(outgoingCallTimeoutRef.current)
        outgoingCallTimeoutRef.current = setTimeout(async () => {
          if (peerConnectionRef.current?.connectionState === 'connected') return
          try {
            await chatConnection.endCall(selectedConvId, selectedConv.peerUser.id, 'missed')
          } catch {
            // ignore timeout signaling failure and still cleanup locally
          }
          await sendCallLogMessage(selectedConvId, t('callLogMissedNoAnswer', { callType: callTypeText(type) }))
          setCallNotice(t('noAnswerMissedCall'))
          setTimeout(() => setCallNotice(null), 2500)
          clearCallMedia()
        }, CALL_RING_TIMEOUT_MS)
      } catch (error) {
        console.error('Failed to start call', error)
        clearCallMedia()
        setCallNotice(t('couldNotStartCall'))
        setTimeout(() => setCallNotice(null), 3500)
      }
    })()
  }

  const handleAcceptIncomingCall = async () => {
    if (!incomingCall) return

    try {
      setSelectedConvId(incomingCall.conversationId)
      if (incomingCallTimeoutRef.current) {
        clearTimeout(incomingCallTimeoutRef.current)
        incomingCallTimeoutRef.current = null
      }
      setCallStatus('connecting')
      isCallInitiatorRef.current = false
      callStartLoggedRef.current = false
      setActiveCallType(incomingCall.callType)
      setActiveCallPeerId(incomingCall.fromUserId)
      setActiveCallPeerName(incomingCall.fromUserName)
      setActiveCallConversationId(incomingCall.conversationId)

      const stream = await getLocalMedia(incomingCall.callType)
      const pc = await createPeerConnection(incomingCall.conversationId, incomingCall.fromUserId)
      stream.getTracks().forEach(track => pc.addTrack(track, stream))

      await pc.setRemoteDescription(new RTCSessionDescription(incomingCall.offer))
      // Flush any ICE candidates that arrived before remote description was set
      const pending = pendingIceCandidatesRef.current
      pendingIceCandidatesRef.current = []
      for (const candidate of pending) {
        try {
          await pc.addIceCandidate(new RTCIceCandidate(candidate))
        } catch (err) {
          console.error('Failed to add queued ICE candidate', err)
        }
      }
      const answer = await pc.createAnswer()
      await pc.setLocalDescription(answer)
      await chatConnection.sendCallAnswer(incomingCall.conversationId, incomingCall.fromUserId, answer)

      setIncomingCall(null)
    } catch (error) {
      console.error('Failed to accept call', error)
      if (incomingCall) {
        await chatConnection.endCall(incomingCall.conversationId, incomingCall.fromUserId, 'failed')
      }
      clearCallMedia()
      setCallNotice(t('failedToAcceptCall'))
      setTimeout(() => setCallNotice(null), 3500)
    }
  }

  const handleDeclineIncomingCall = async () => {
    if (!incomingCall) return
    if (incomingCallTimeoutRef.current) {
      clearTimeout(incomingCallTimeoutRef.current)
      incomingCallTimeoutRef.current = null
    }
    await sendCallLogMessage(incomingCall.conversationId, t('callLogIncomingDeclined'))
    await chatConnection.endCall(incomingCall.conversationId, incomingCall.fromUserId, 'rejected')
    setIncomingCall(null)
    setCallStatus('idle')
  }

  const handleEndCall = async () => {
    if (activeCallConversationId && activeCallPeerId) {
      await sendCallLogMessage(activeCallConversationId, t('callLogEnded'))
      await chatConnection.endCall(activeCallConversationId, activeCallPeerId, 'ended')
    }
    clearCallMedia()
  }

  const toggleMic = () => {
    if (!localStreamRef.current) return
    localStreamRef.current.getAudioTracks().forEach(track => {
      track.enabled = !track.enabled
      setIsMicMuted(!track.enabled)
    })
  }

  const toggleCamera = () => {
    if (!localStreamRef.current || activeCallType !== 'video') return
    localStreamRef.current.getVideoTracks().forEach(track => {
      track.enabled = !track.enabled
      setIsCameraEnabled(track.enabled)
    })
  }

  useEffect(() => {
    const handleCallOffer = async (data: { conversationId: string; fromUserId: string; fromUserName: string; callType: CallType; offer: RTCSessionDescriptionInit }) => {
      if (sameId(currentUserId, data.fromUserId)) return

      if (callStatusRef.current !== 'idle') {
        await chatConnection.endCall(data.conversationId, data.fromUserId, 'busy')
        return
      }

      setIncomingCall(data)
      setCallStatus('ringing')
      setCallNotice(t('incomingCallFromUser', { name: data.fromUserName }))
      setTimeout(() => setCallNotice(null), 3000)

      if (incomingCallTimeoutRef.current) clearTimeout(incomingCallTimeoutRef.current)
      incomingCallTimeoutRef.current = setTimeout(async () => {
        try {
          await chatConnection.endCall(data.conversationId, data.fromUserId, 'missed')
        } catch {
          // ignore timeout signaling failure and still cleanup locally
        }
        await sendCallLogMessage(data.conversationId, t('callLogMissedIncoming'))
        setCallNotice(t('missedCall'))
        setTimeout(() => setCallNotice(null), 2500)
        setIncomingCall(null)
        setCallStatus('idle')
      }, CALL_RING_TIMEOUT_MS)
    }

    const handleCallAnswer = async (data: { conversationId: string; fromUserId: string; answer: RTCSessionDescriptionInit }) => {
      if (!peerConnectionRef.current) return
      // Use refs for latest values to avoid stale closure
      if (activeCallPeerIdRef.current && !sameId(data.fromUserId, activeCallPeerIdRef.current)) return
      if (activeCallConversationIdRef.current && !sameId(data.conversationId, activeCallConversationIdRef.current)) return
      try {
        await peerConnectionRef.current.setRemoteDescription(new RTCSessionDescription(data.answer))
        // Flush any ICE candidates that arrived before remote description was set
        const pending = pendingIceCandidatesRef.current
        pendingIceCandidatesRef.current = []
        for (const candidate of pending) {
          try {
            await peerConnectionRef.current.addIceCandidate(new RTCIceCandidate(candidate))
          } catch (err) {
            console.error('Failed to add queued ICE candidate', err)
          }
        }
        setCallStatus('connected')
        if (outgoingCallTimeoutRef.current) {
          clearTimeout(outgoingCallTimeoutRef.current)
          outgoingCallTimeoutRef.current = null
        }
      } catch (error) {
        console.error('Failed to apply call answer', error)
      }
    }

    const handleCallIce = async (data: { conversationId: string; fromUserId: string; candidate: RTCIceCandidateInit }) => {
      if (!peerConnectionRef.current) return
      if (activeCallConversationIdRef.current && !sameId(data.conversationId, activeCallConversationIdRef.current)) return
      if (activeCallPeerIdRef.current && !sameId(data.fromUserId, activeCallPeerIdRef.current)) return
      // Queue ICE candidates if remote description is not yet set
      if (!peerConnectionRef.current.remoteDescription) {
        pendingIceCandidatesRef.current.push(data.candidate)
        return
      }
      try {
        await peerConnectionRef.current.addIceCandidate(new RTCIceCandidate(data.candidate))
      } catch (error) {
        console.error('Failed to add ICE candidate', error)
      }
    }

    const handleCallEnded = (data: { conversationId: string; fromUserId: string; reason: string }) => {
      if (activeCallConversationIdRef.current && !sameId(data.conversationId, activeCallConversationIdRef.current)) return
      const reasonText = data.reason === 'rejected'
        ? t('callDeclined')
        : data.reason === 'busy'
        ? t('userBusyOnAnotherCall')
        : data.reason === 'missed'
        ? t('missedCall')
        : t('callEnded')
      setCallNotice(reasonText)
      setTimeout(() => setCallNotice(null), 2500)
      clearCallMedia()
    }

    chatConnection.onCallOffer(handleCallOffer)
    chatConnection.onCallAnswer(handleCallAnswer)
    chatConnection.onCallIceCandidate(handleCallIce)
    chatConnection.onCallEnded(handleCallEnded)

    return () => {
      chatConnection.off('CallOffer', handleCallOffer)
      chatConnection.off('CallAnswer', handleCallAnswer)
      chatConnection.off('CallIceCandidate', handleCallIce)
      chatConnection.off('CallEnded', handleCallEnded)
    }
  }, [callTypeText, clearCallMedia, currentUserId, sendCallLogMessage, t])

  useEffect(() => {
    if (callStatus === 'connected' && activeCallConversationId && !callStartLoggedRef.current) {
      callStartLoggedRef.current = true
      const callKind: CallType = activeCallType === 'video' ? 'video' : 'audio'
      const text = isCallInitiatorRef.current
        ? t('callLogStarted', { callType: callTypeText(callKind) })
        : t('callLogJoined', { callType: callTypeText(callKind) })
      sendCallLogMessage(activeCallConversationId, text)
    }

    if (callStatus !== 'connected') {
      if (connectedCallTimerRef.current) {
        clearInterval(connectedCallTimerRef.current)
        connectedCallTimerRef.current = null
      }
      connectedAtRef.current = null
      setCallDurationSeconds(0)
      return
    }

    if (!connectedAtRef.current) connectedAtRef.current = Date.now()
    setCallDurationSeconds(0)

    connectedCallTimerRef.current = setInterval(() => {
      if (!connectedAtRef.current) return
      const elapsed = Math.floor((Date.now() - connectedAtRef.current) / 1000)
      setCallDurationSeconds(elapsed)
    }, 1000)

    return () => {
      if (connectedCallTimerRef.current) {
        clearInterval(connectedCallTimerRef.current)
        connectedCallTimerRef.current = null
      }
    }
  }, [activeCallConversationId, activeCallType, callStatus, callTypeText, sendCallLogMessage, t])

  // Callback refs: attach streams the instant the DOM element mounts.
  // This solves the race where ontrack fires before React renders the elements.
  const remoteAudioCallbackRef = useCallback((el: HTMLAudioElement | null) => {
    remoteAudioRef.current = el
    if (el && remoteStreamRef.current) {
      el.srcObject = remoteStreamRef.current
      el.play().catch(e => console.warn('[WebRTC] Audio autoplay blocked on mount:', e))
    }
  }, [])

  const remoteVideoCallbackRef = useCallback((el: HTMLVideoElement | null) => {
    remoteVideoRef.current = el
    if (el && remoteStreamRef.current) {
      el.srcObject = remoteStreamRef.current
      el.play().catch(e => console.warn('[WebRTC] Remote video autoplay blocked on mount:', e))
    }
  }, [])

  const localVideoCallbackRef = useCallback((el: HTMLVideoElement | null) => {
    localVideoRef.current = el
    if (el && localStreamRef.current) {
      el.srcObject = localStreamRef.current
      el.play().catch(e => console.warn('[WebRTC] Local video autoplay blocked on mount:', e))
    }
  }, [])

  // Also re-assign when callStatus changes, as a safety net
  useEffect(() => {
    if (callStatus === 'idle') return
    if (localStreamRef.current && localVideoRef.current) {
      localVideoRef.current.srcObject = localStreamRef.current
    }
    if (remoteStreamRef.current && remoteVideoRef.current) {
      remoteVideoRef.current.srcObject = remoteStreamRef.current
    }
    if (remoteStreamRef.current && remoteAudioRef.current) {
      remoteAudioRef.current.srcObject = remoteStreamRef.current
    }
  }, [callStatus, activeCallType])

  useEffect(() => {
    return () => {
      clearCallMedia()
    }
  }, [clearCallMedia])

  useEffect(() => {
    if (startCallHandledRef.current) return
    if (!selectedConvId) return
    if (callStatus !== 'idle') return
    if (startCallFromUrl !== 'audio' && startCallFromUrl !== 'video') return

    const selectedConversation = conversations.find(c => c.id === selectedConvId)
    if (!selectedConversation) return

    startCallHandledRef.current = true
    handleCallClick(startCallFromUrl)
  }, [callStatus, conversations, selectedConvId, startCallFromUrl])

  // ─── derived ───
  const filteredConvs = conversations.filter(c =>
    c.peerUser.fullName.toLowerCase().includes(searchQuery.toLowerCase())
  )

  const selectedConv = conversations.find(c => c.id === selectedConvId) ?? null
  const selectedPresence = selectedConv
    ? presenceByUserId[selectedConv.peerUser.id.toLowerCase()] ?? {
        isOnline: !!selectedConv.peerUser.isOnline,
        lastSeenAtUtc: selectedConv.peerUser.lastSeenAtUtc ?? null,
      }
    : null

  // For deep-link before conversation exists
  const peerName =
    selectedConv?.peerUser.fullName ?? userNameFromUrl ?? t('chatFallbackName')
  const peerAvatar =
    selectedConv?.peerUser.avatarUrl ?? userAvatarFromUrl ?? null

  const callStatusText = (status: 'idle' | 'calling' | 'ringing' | 'connecting' | 'connected') => {
    if (status === 'calling') return t('callStatusCalling')
    if (status === 'ringing') return t('callStatusRinging')
    if (status === 'connecting') return t('callStatusConnecting')
    if (status === 'connected') return t('callStatusConnected')
    return status
  }

  // ─── render ───
  return (
    <div className="relative h-[calc(100vh-130px)] overflow-hidden md:rounded-xl md:border md:border-border-subtle md:bg-surface-2">
      {incomingCall && (
        <div className="fixed right-4 top-4 z-[220] w-72 rounded-lg border border-border-subtle bg-background p-3 shadow-xl">
          <p className="text-sm text-foreground font-semibold">
            {t('incomingCallTitle', { callType: callTypeText(incomingCall.callType) })}
          </p>
          <p className="text-xs text-muted-foreground mt-1">{incomingCall.fromUserName}</p>
          <div className="flex items-center gap-2 mt-3">
            <button
              type="button"
              onClick={handleDeclineIncomingCall}
              className="flex-1 px-3 py-1.5 rounded-lg bg-red-500/20 text-red-300 hover:bg-red-500/30 transition-colors"
            >
              {t('decline')}
            </button>
            <button
              type="button"
              onClick={handleAcceptIncomingCall}
              className={`flex-1 px-3 py-1.5 rounded-lg bg-gradient-to-r ${accent.gradient} text-white hover:opacity-90 transition-opacity`}
            >
              {t('accept')}
            </button>
          </div>
        </div>
      )}
      <div className="flex h-full min-h-[calc(100dvh-10rem)] flex-col overflow-hidden md:flex-row md:rounded-xl md:border md:border-border-subtle md:bg-surface-3">
        {/* ── Left: Conversations List ── */}
        <div
          className={`flex min-h-0 w-full flex-col border-b border-border-subtle md:w-80 md:border-b-0 md:border-r ${
            selectedConvId ? 'hidden md:flex' : 'flex'
          }`}
        >
          {/* Header + search */}
          <div className="border-b border-border-subtle p-4">
            <h1 className="page-title mb-1 text-xl sm:text-2xl md:text-lg">{t('messagesTitle')}</h1>
            <p className="mb-3 text-sm text-muted-foreground">
              {filteredConvs.length > 0
                ? t('conversationsCount', { count: filteredConvs.length })
                : t('recentChatsHint')}
            </p>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <input
                type="text"
                placeholder={t('searchPlaceholder')}
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                className={`w-full pl-10 pr-4 py-2 bg-background border border-border-subtle rounded-lg text-sm text-foreground placeholder-gray-500 focus:outline-none ${accent.focusBorder}`}
              />
            </div>
          </div>

          {/* List */}
          <div className="flex-1 overflow-y-auto">
            {loadingConvs ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className={`w-6 h-6 ${accent.text} animate-spin`} />
              </div>
            ) : filteredConvs.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-full p-6 text-center">
                <MessageCircle className="w-12 h-12 text-gray-600 mb-2" />
                <p className="text-muted-foreground text-sm">
                  {searchQuery ? t('noConversationsFound') : t('noMessagesYet')}
                </p>
              </div>
            ) : (
              filteredConvs.map(conv => (
                <button
                  key={conv.id}
                  onClick={() => {
                    setSelectedConvId(conv.id)
                    // Clear unread locally
                    setConversations(prev =>
                      prev.map(c =>
                        c.id === conv.id ? { ...c, unreadCount: 0 } : c
                      )
                    )
                  }}
                  className={`w-full border-b border-border-subtle/10 p-4 text-left transition-colors ${
                    selectedConvId === conv.id
                      ? 'bg-white/5'
                      : 'hover:bg-hover-overlay'
                  }`}
                  style={{ borderBottomColor: 'var(--separator-color)' }}
                >
                  <div className="flex items-center gap-3">
                    <Avatar
                      url={avatarUrl(conv.peerUser.avatarUrl)}
                      name={conv.peerUser.fullName}
                      size={48}
                      role={conv.peerUser.role}
                    />
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center justify-between gap-2">
                        <p className="truncate text-sm font-semibold text-foreground">
                          {conv.peerUser.fullName}
                        </p>
                        <span className="text-xs text-faint-foreground">
                          {formatRelative(conv.lastMessageAt)}
                        </span>
                      </div>
                      <p className="truncate text-sm text-muted-foreground">
                        {conv.lastMessageText ?? t('noMessagesYet')}
                      </p>
                      <div className="mt-0.5 flex items-center gap-1.5">
                        {(presenceByUserId[conv.peerUser.id.toLowerCase()]?.isOnline ?? conv.peerUser.isOnline) ? (
                          <>
                            <span className="h-2 w-2 rounded-full bg-emerald-400" />
                            <span className="text-[11px] text-emerald-400">{t('online')}</span>
                          </>
                        ) : (
                          <span className="text-[11px] text-faint-foreground">
                            {formatLastSeen((presenceByUserId[conv.peerUser.id.toLowerCase()]?.lastSeenAtUtc ?? conv.peerUser.lastSeenAtUtc) ?? null, t, locale)}
                          </span>
                        )}
                      </div>
                    </div>
                    {conv.unreadCount > 0 && (
                      <div className={`flex h-5 w-5 items-center justify-center rounded-full ${accent.bg}`}>
                        <span className="text-[10px] font-bold text-foreground">
                          {conv.unreadCount}
                        </span>
                      </div>
                    )}
                  </div>
                </button>
              ))
            )}
          </div>
        </div>

        {!selectedConvId && (
          <div className="flex-1 hidden md:flex items-center justify-center">
            <div className="text-center">
              <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-background flex items-center justify-center">
                <Send className="w-8 h-8 text-faint-foreground" />
              </div>
              <h3 className="text-lg font-semibold text-foreground mb-2">
                {t('selectConversation')}
              </h3>
              <p className="text-sm text-muted-foreground">
                {t('selectConversationHint')}
              </p>
            </div>
          </div>
        )}
      </div>

      {selectedConvId && (
        <div className="fixed inset-0 z-[180] overflow-hidden bg-background">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,rgba(255,255,255,0.06),transparent_30%),linear-gradient(to_bottom,rgba(255,255,255,0.02),transparent_35%)]" />
          <div className="relative flex h-full min-h-0 flex-col">
            <div
              className="border-b border-border-subtle bg-background/95 px-4 py-3 backdrop-blur-xl sm:px-5"
              style={{ borderBottomColor: 'var(--separator-color)' }}
            >
              <div className="flex items-center justify-between gap-3">
                <div className="flex min-w-0 items-center gap-3">
                  <button
                    type="button"
                    className="inline-flex items-center gap-2 rounded-xl border border-border-subtle bg-surface-2/85 px-3 py-2 text-sm font-medium text-muted-foreground transition-colors hover:bg-hover-overlay hover:text-foreground"
                    onClick={handleBackToMessages}
                  >
                    <ArrowLeft className="h-4 w-4" />
                    <span className="hidden sm:inline">{t('backToMessages')}</span>
                  </button>
                  <Avatar url={avatarUrl(peerAvatar)} name={peerName} size={44} role={selectedConv?.peerUser.role} />
                  <div className="min-w-0">
                    <p className="truncate text-base font-semibold text-foreground">{peerName}</p>
                    <div className="truncate text-xs text-muted-foreground">
                      {selectedPresence?.isOnline ? (
                        <span className="inline-flex items-center gap-1.5 text-emerald-400">
                          <span className="h-2 w-2 rounded-full bg-emerald-400" />
                          {t('online')}
                        </span>
                      ) : (
                        <span>{formatLastSeen(selectedPresence?.lastSeenAtUtc, t, locale)}</span>
                      )}
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-1">
                  <button
                    type="button"
                    onClick={() => handleCallClick('audio')}
                    className={`rounded-xl p-2.5 text-muted-foreground ${accent.hoverText} transition-colors`}
                    title={t('startAudioCall')}
                  >
                    <Phone className="w-5 h-5" />
                  </button>
                  <button
                    type="button"
                    onClick={() => handleCallClick('video')}
                    className={`rounded-xl p-2.5 text-muted-foreground ${accent.hoverText} transition-colors`}
                    title={t('startVideoCall')}
                  >
                    <Video className="w-5 h-5" />
                  </button>
                </div>
              </div>
              {callNotice && (
                <p className={`mt-2 pl-[3.6rem] text-xs ${accent.text} sm:pl-[9.25rem]`}>{callNotice}</p>
              )}
            </div>

            <div className="flex-1 overflow-y-auto px-3 py-4 sm:px-5 sm:py-5">
              {loadingMsgs ? (
                <div className="flex h-full items-center justify-center">
                  <Loader2 className={`w-8 h-8 ${accent.text} animate-spin`} />
                </div>
              ) : messages.length === 0 ? (
                <div className="flex h-full flex-col items-center justify-center text-center">
                  <MessageCircle className="mb-3 h-12 w-12 text-gray-600" />
                  <p className="text-sm text-muted-foreground">{t('noMessagesYet')}</p>
                  <p className="mt-1 text-xs text-faint-foreground">
                    {t('sendMessageToStart')}
                  </p>
                </div>
              ) : (
                <div className="space-y-3">
                  {messages.map(msg => {
                    const isMe =
                      currentUserId !== null &&
                      (msg.senderId.toLowerCase() === currentUserId.toLowerCase() ||
                        msg.id.startsWith('temp-'))
                    return (
                      <div
                        key={msg.id}
                        className={`flex ${isMe ? 'justify-end' : 'justify-start'}`}
                      >
                        <div className="flex max-w-[92%] items-end gap-2 sm:max-w-[72%]">
                          {!isMe && (
                            <Avatar
                              url={avatarUrl(msg.senderAvatarUrl)}
                              name={msg.senderName}
                              size={32}
                              role={msg.senderRole}
                            />
                          )}
                          <div className="flex items-end gap-2">
                            {isMe && (
                              <div className="mb-1 shrink-0 whitespace-nowrap text-[11px] text-foreground/60">
                                {formatTime(msg.createdAt)}
                                {msg.readAt && <span className="ml-1">{`· ${t('read')}`}</span>}
                              </div>
                            )}
                            <div>
                              {msg.replyTo && (
                                <div
                                  className={`mb-0.5 rounded-t-xl border-l-2 px-3 py-1 text-xs ${
                                    isMe
                                      ? `${accent.border} ${accent.bgMuted20} text-foreground/80`
                                      : `${accent.border} bg-border-subtle text-muted-foreground`
                                  }`}
                                >
                                  <span className="font-semibold">{msg.replyTo.senderName}</span>
                                  <p className="truncate">{msg.replyTo.text}</p>
                                </div>
                              )}
                              <div
                                className={`group relative rounded-2xl px-4 py-2.5 ${
                                  isMe
                                    ? `${accent.bg} rounded-br-sm text-foreground`
                                    : 'rounded-bl-sm border border-border-subtle bg-surface-2 text-foreground shadow-sm'
                                }`}
                              >
                                {msg.attachmentUrl && (
                                  msg.attachmentContentType?.startsWith('image/') ? (
                                    <a
                                      href={`${MEDIA_BASE_URL}${msg.attachmentUrl}`}
                                      target="_blank"
                                      rel="noopener noreferrer"
                                      className="mb-1 block"
                                    >
                                      <img
                                        src={`${MEDIA_BASE_URL}${msg.attachmentUrl}`}
                                        alt={msg.attachmentFileName || 'Image'}
                                        className="max-h-[240px] max-w-[240px] rounded-lg object-cover sm:max-w-[320px]"
                                      />
                                    </a>
                                  ) : (
                                    <a
                                      href={`${MEDIA_BASE_URL}${msg.attachmentUrl}`}
                                      target="_blank"
                                      rel="noopener noreferrer"
                                      download={msg.attachmentFileName}
                                      className={`mb-1 flex items-center gap-2 rounded-lg px-3 py-2 transition-colors ${
                                        isMe ? 'bg-white/10 hover:bg-white/20' : 'bg-white/5 hover:bg-white/10'
                                      }`}
                                    >
                                      <FileText className="w-5 h-5 flex-shrink-0" />
                                      <div className="min-w-0 flex-1">
                                        <p className="truncate text-sm font-medium">{msg.attachmentFileName}</p>
                                        {msg.attachmentSize && (
                                          <p className={`text-xs ${isMe ? 'text-foreground/60' : 'text-faint-foreground'}`}>
                                            {formatFileSize(msg.attachmentSize)}
                                          </p>
                                        )}
                                      </div>
                                      <Download className="w-4 h-4 flex-shrink-0 opacity-60" />
                                    </a>
                                  )
                                )}
                                {msg.text && (
                                  <p className="text-sm whitespace-pre-wrap break-words">{msg.text}</p>
                                )}
                                {!msg.id.startsWith('temp-') && (
                                  <button
                                    onClick={() => {
                                      setReplyTo(msg)
                                      inputRef.current?.focus()
                                    }}
                                    className="absolute -top-2 right-0 rounded-full border border-border-subtle bg-background p-1 opacity-0 transition-opacity group-hover:opacity-100"
                                  >
                                    <Reply className="w-3 h-3 text-muted-foreground" />
                                  </button>
                                )}
                              </div>
                            </div>
                            {!isMe && (
                              <div className="mb-1 shrink-0 whitespace-nowrap text-[11px] text-faint-foreground">
                                {formatTime(msg.createdAt)}
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    )
                  })}
                </div>
              )}
              <div ref={messagesEndRef} />
            </div>

            {pendingFile && (
              <div
                className="flex items-center gap-2 border-t border-border-subtle bg-background/95 px-4 pt-3 backdrop-blur-xl sm:px-5"
                style={{ borderTopColor: 'var(--separator-color)' }}
              >
                {pendingFile.contentType.startsWith('image/') ? (
                  <ImageIcon className={`w-4 h-4 ${accent.text}`} />
                ) : (
                  <FileText className={`w-4 h-4 ${accent.text}`} />
                )}
                <div className="flex-1 truncate text-xs text-muted-foreground">
                  <span className="font-semibold text-foreground">{pendingFile.fileName}</span>
                  <span className="ml-2 text-faint-foreground">({formatFileSize(pendingFile.size)})</span>
                </div>
                <button onClick={() => setPendingFile(null)}>
                  <X className="w-4 h-4 text-faint-foreground" />
                </button>
              </div>
            )}

            {replyTo && (
              <div
                className="flex items-center gap-2 border-t border-border-subtle bg-background/95 px-4 pt-3 backdrop-blur-xl sm:px-5"
                style={{ borderTopColor: 'var(--separator-color)' }}
              >
                <Reply className={`w-4 h-4 ${accent.text}`} />
                <div className="flex-1 truncate text-xs text-muted-foreground">
                  <span className="font-semibold text-foreground">{replyTo.senderName}</span>{' '}
                  {replyTo.text}
                </div>
                <button onClick={() => setReplyTo(null)}>
                  <X className="w-4 h-4 text-faint-foreground" />
                </button>
              </div>
            )}

            <div
              className="border-t border-border-subtle bg-background/95 px-3 pb-[calc(1rem+env(safe-area-inset-bottom))] pt-3 backdrop-blur-xl sm:px-5"
              style={{ borderTopColor: 'var(--separator-color)' }}
            >
              <div className="relative flex items-end gap-2" ref={emojiPickerRef}>
                <input
                  ref={fileInputRef}
                  type="file"
                  className="hidden"
                  onChange={handleFileSelect}
                  accept="image/*,.pdf,.doc,.docx,.xls,.xlsx,.txt,.zip,.rar,.mp4,.mov,.mp3,.wav"
                />
                <button
                  onClick={() => fileInputRef.current?.click()}
                  disabled={uploading || sending}
                  className={`rounded-full p-2.5 text-muted-foreground ${accent.hoverText} transition-colors disabled:opacity-50`}
                  title={t('attachFile')}
                >
                  {uploading ? (
                    <Loader2 className="w-5 h-5 animate-spin" />
                  ) : (
                    <Paperclip className="w-5 h-5" />
                  )}
                </button>
                <button
                  type="button"
                  onClick={() => setShowEmojiPicker(prev => !prev)}
                  disabled={sending}
                  className={`rounded-full p-2.5 text-muted-foreground ${accent.hoverText} transition-colors disabled:opacity-50`}
                  title={t('addEmoji')}
                >
                  <Smile className="w-5 h-5" />
                </button>
                {showEmojiPicker && (
                  <div className="absolute bottom-14 left-0 z-20 w-56 rounded-xl border border-border-subtle bg-background p-2 shadow-xl sm:left-12">
                    <div className="grid grid-cols-6 gap-1">
                      {QUICK_EMOJIS.map(emoji => (
                        <button
                          key={emoji}
                          type="button"
                          onClick={() => handlePickEmoji(emoji)}
                          className="rounded p-1.5 text-lg transition-colors hover:bg-white/10"
                        >
                          {emoji}
                        </button>
                      ))}
                    </div>
                  </div>
                )}
                <input
                  ref={inputRef}
                  type="text"
                  placeholder={pendingFile ? t('addCaptionPlaceholder') : t('typeMessagePlaceholder')}
                  value={inputText}
                  onChange={e => {
                    setInputText(e.target.value)
                    if (selectedConvId) draftsRef.current[selectedConvId] = e.target.value
                  }}
                  onKeyDown={handleKeyDown}
                  disabled={sending}
                  className={`min-w-0 flex-1 rounded-full border border-border-subtle/70 bg-background px-4 py-3 text-sm text-foreground placeholder-gray-500 focus:outline-none ${accent.focusBorder}`}
                />
                <button
                  onClick={handleSend}
                  disabled={sending || (!inputText.trim() && !pendingFile)}
                  className={`rounded-full bg-gradient-to-r p-3 ${accent.gradient} transition-opacity hover:opacity-90 disabled:opacity-50`}
                >
                  {sending ? (
                    <Loader2 className="w-5 h-5 text-foreground animate-spin" />
                  ) : (
                    <Send className="w-5 h-5 text-foreground" />
                  )}
                </button>
              </div>
            </div>

            {callStatus !== 'idle' && activeCallPeerName && (
              <div className="border-t border-border-subtle bg-background p-3 sm:px-5">
                <div className="mb-3 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                  <div>
                    <p className="text-sm font-semibold text-foreground">
                      {t('callWithUser', { callType: callTypeText(activeCallType), name: activeCallPeerName })}
                    </p>
                    <p className="text-xs capitalize text-muted-foreground">
                      {callStatusText(callStatus)}{callStatus === 'connected' ? ` · ${formatCallDuration(callDurationSeconds)}` : ''}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={toggleMic}
                      className="rounded-lg border border-border-subtle p-2 text-muted-foreground transition-colors hover:bg-white/10"
                      title={isMicMuted ? t('unmuteMicrophone') : t('muteMicrophone')}
                    >
                      {isMicMuted ? <MicOff className="w-4 h-4" /> : <Mic className="w-4 h-4" />}
                    </button>
                    {activeCallType === 'video' && (
                      <button
                        type="button"
                        onClick={toggleCamera}
                        className="rounded-lg border border-border-subtle p-2 text-muted-foreground transition-colors hover:bg-white/10"
                        title={isCameraEnabled ? t('turnOffCamera') : t('turnOnCamera')}
                      >
                        {isCameraEnabled ? <Video className="w-4 h-4" /> : <VideoOff className="w-4 h-4" />}
                      </button>
                    )}
                    <button
                      type="button"
                      onClick={handleEndCall}
                      className="rounded-lg bg-red-600 p-2 text-foreground transition-colors hover:bg-red-700"
                      title={t('endCall')}
                    >
                      <PhoneOff className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                <audio ref={remoteAudioCallbackRef} autoPlay />
                {activeCallType === 'video' && (
                  <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                    <video ref={localVideoCallbackRef} autoPlay muted playsInline className="h-32 w-full rounded-lg bg-black object-cover" />
                    <video ref={remoteVideoCallbackRef} autoPlay playsInline className="h-32 w-full rounded-lg bg-black object-cover" />
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}

// ─── Avatar sub-component ───

function Avatar({
  url,
  name,
  size,
  role,
}: {
  url: string | null
  name: string
  size: number
  role?: string | null
}) {
  const accent = useAccentColors()
  const roleAccent = role ? getAccentColorsByRole(role) : accent
  const initials = name
    .split(' ')
    .map(n => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2)

  return url ? (
    <img
      src={url}
      alt={name}
      className={`rounded-full object-cover flex-shrink-0 ${getRoleRingClass(role)}`}
      style={{ width: size, height: size }}
      onError={e => {
        ;(e.target as HTMLImageElement).style.display = 'none'
      }}
    />
  ) : (
    <div
      className={`rounded-full bg-gradient-to-br ${roleAccent.gradient} flex items-center justify-center flex-shrink-0`}
      style={{ width: size, height: size }}
    >
      <span
        className="text-foreground font-bold"
        style={{ fontSize: size * 0.35 }}
      >
        {initials || '?'}
      </span>
    </div>
  )
}
