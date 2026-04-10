'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import { useSearchParams } from 'next/navigation'
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

  // Keep refs in sync with state
  useEffect(() => { selectedConvIdRef.current = selectedConvId }, [selectedConvId])
  useEffect(() => { activeCallPeerIdRef.current = activeCallPeerId }, [activeCallPeerId])
  useEffect(() => { activeCallConversationIdRef.current = activeCallConversationId }, [activeCallConversationId])
  useEffect(() => { callStatusRef.current = callStatus }, [callStatus])

  // ─── load conversations ───

  const loadConversations = useCallback(async () => {
    try {
      setLoadingConvs(true)
      const data = await messagesApi.getMyConversations(1, 100)
      setConversations(data.items)
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
    chatConnection.onReconnected(handleReconnected)

    chatConnection.start().catch(console.error)

    return () => {
      chatConnection.off('ReceiveMessage', handleReceiveMessage)
      chatConnection.off('ConversationUpdated', handleConversationUpdated)
      chatConnection.off('MessagesRead', handleMessagesRead)
      chatConnection.off('NewConversation', handleNewConversation)
      chatConnection.off('Error', handleError)
      chatConnection.offReconnected(handleReconnected)
    }
  }, [loadConversations, loadMessages])

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

  const createPeerConnection = useCallback((conversationId: string, targetUserId: string) => {
    if (peerConnectionRef.current) {
      peerConnectionRef.current.close()
    }

    const pc = new RTCPeerConnection({
      iceServers: [
        { urls: 'stun:stun.l.google.com:19302' },
        { urls: 'stun:stun1.l.google.com:19302' },
        {
          urls: 'stun:deviny.metered.live:80',
        },
        {
          urls: 'turn:deviny.metered.live:80',
          username: 'd8737c92a2465bc58996d30e',
          credential: 'xUMUEBHKIWMG3RUR',
        },
        {
          urls: 'turn:deviny.metered.live:80?transport=tcp',
          username: 'd8737c92a2465bc58996d30e',
          credential: 'xUMUEBHKIWMG3RUR',
        },
        {
          urls: 'turn:deviny.metered.live:443',
          username: 'd8737c92a2465bc58996d30e',
          credential: 'xUMUEBHKIWMG3RUR',
        },
        {
          urls: 'turns:deviny.metered.live:443?transport=tcp',
          username: 'd8737c92a2465bc58996d30e',
          credential: 'xUMUEBHKIWMG3RUR',
        },
      ],
    })

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
      alert('Failed to upload file')
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
        const pc = createPeerConnection(selectedConvId, selectedConv.peerUser.id)
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
          await sendCallLogMessage(selectedConvId, `📵 Missed ${type} call (no answer).`)
          setCallNotice('No answer. Missed call.')
          setTimeout(() => setCallNotice(null), 2500)
          clearCallMedia()
        }, CALL_RING_TIMEOUT_MS)
      } catch (error) {
        console.error('Failed to start call', error)
        clearCallMedia()
        setCallNotice('Could not start the call. Please check microphone/camera permissions.')
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
      const pc = createPeerConnection(incomingCall.conversationId, incomingCall.fromUserId)
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
      setCallNotice('Failed to accept call. Check device permissions and try again.')
      setTimeout(() => setCallNotice(null), 3500)
    }
  }

  const handleDeclineIncomingCall = async () => {
    if (!incomingCall) return
    if (incomingCallTimeoutRef.current) {
      clearTimeout(incomingCallTimeoutRef.current)
      incomingCallTimeoutRef.current = null
    }
    await sendCallLogMessage(incomingCall.conversationId, '📵 Incoming call declined.')
    await chatConnection.endCall(incomingCall.conversationId, incomingCall.fromUserId, 'rejected')
    setIncomingCall(null)
    setCallStatus('idle')
  }

  const handleEndCall = async () => {
    if (activeCallConversationId && activeCallPeerId) {
      await sendCallLogMessage(activeCallConversationId, '📴 Call ended.')
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
      setCallNotice(`${data.fromUserName} is calling you...`)
      setTimeout(() => setCallNotice(null), 3000)

      if (incomingCallTimeoutRef.current) clearTimeout(incomingCallTimeoutRef.current)
      incomingCallTimeoutRef.current = setTimeout(async () => {
        try {
          await chatConnection.endCall(data.conversationId, data.fromUserId, 'missed')
        } catch {
          // ignore timeout signaling failure and still cleanup locally
        }
        await sendCallLogMessage(data.conversationId, '📵 Missed incoming call.')
        setCallNotice('Missed call.')
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
        ? 'Call declined.'
        : data.reason === 'busy'
        ? 'User is busy on another call.'
        : data.reason === 'missed'
        ? 'Missed call.'
        : 'Call ended.'
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
  }, [clearCallMedia, currentUserId, sendCallLogMessage])

  useEffect(() => {
    if (callStatus === 'connected' && activeCallConversationId && !callStartLoggedRef.current) {
      callStartLoggedRef.current = true
      const callKind = activeCallType === 'video' ? 'video' : 'audio'
      const text = isCallInitiatorRef.current
        ? `📞 Started a ${callKind} call.`
        : `📞 Joined a ${callKind} call.`
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
  }, [activeCallConversationId, activeCallType, callStatus, sendCallLogMessage])

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

  // For deep-link before conversation exists
  const peerName =
    selectedConv?.peerUser.fullName ?? userNameFromUrl ?? 'Chat'
  const peerAvatar =
    selectedConv?.peerUser.avatarUrl ?? userAvatarFromUrl ?? null

  // ─── render ───
  return (
    <div className="relative h-[calc(100vh-130px)] overflow-hidden md:rounded-xl md:border md:border-border-subtle md:bg-surface-2">
      {incomingCall && (
        <div className="absolute top-4 right-4 z-30 p-3 rounded-lg border border-border-subtle bg-background shadow-xl w-72">
          <p className="text-sm text-foreground font-semibold">Incoming {incomingCall.callType} call</p>
          <p className="text-xs text-muted-foreground mt-1">{incomingCall.fromUserName}</p>
          <div className="flex items-center gap-2 mt-3">
            <button
              type="button"
              onClick={handleDeclineIncomingCall}
              className="flex-1 px-3 py-1.5 rounded-lg bg-red-500/20 text-red-300 hover:bg-red-500/30 transition-colors"
            >
              Decline
            </button>
            <button
              type="button"
              onClick={handleAcceptIncomingCall}
              className={`flex-1 px-3 py-1.5 rounded-lg bg-gradient-to-r ${accent.gradient} text-white hover:opacity-90 transition-opacity`}
            >
              Accept
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
            <h1 className="page-title mb-1 text-xl sm:text-2xl md:text-lg">Messages</h1>
            <p className="mb-3 text-sm text-muted-foreground">
              {filteredConvs.length > 0 ? `${filteredConvs.length} conversations` : 'Your recent chats will appear here'}
            </p>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <input
                type="text"
                placeholder="Search..."
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
                  {searchQuery ? 'No conversations found' : 'No messages yet'}
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
                        {conv.lastMessageText ?? 'No messages yet'}
                      </p>
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

        {/* ── Right: Chat Thread ── */}
        {selectedConvId ? (
          <div className="flex min-h-0 flex-1 flex-col bg-background md:bg-transparent">
            {/* Header */}
            <div
              className="border-b bg-surface-2 px-3 py-2.5 md:border-border-subtle md:bg-transparent md:p-4"
              style={{ borderBottomColor: 'var(--separator-color)' }}
            >
              <div className="flex items-center justify-between gap-3">
                <div className="flex items-center gap-3 min-w-0">
                  <button
                    className="rounded-lg p-1.5 md:hidden"
                    onClick={() => setSelectedConvId(null)}
                  >
                    <ArrowLeft className="w-5 h-5 text-muted-foreground" />
                  </button>
                  <Avatar url={avatarUrl(peerAvatar)} name={peerName} size={40} role={selectedConv?.peerUser.role} />
                  <p className="font-semibold text-foreground truncate">{peerName}</p>
                </div>
                <div className="flex items-center gap-1">
                  <button
                    type="button"
                    onClick={() => handleCallClick('audio')}
                    className={`p-2 rounded-lg text-muted-foreground ${accent.hoverText} transition-colors`}
                    title="Start audio call"
                  >
                    <Phone className="w-5 h-5" />
                  </button>
                  <button
                    type="button"
                    onClick={() => handleCallClick('video')}
                    className={`p-2 rounded-lg text-muted-foreground ${accent.hoverText} transition-colors`}
                    title="Start video call"
                  >
                    <Video className="w-5 h-5" />
                  </button>
                </div>
              </div>
              {callNotice && (
                <p className={`text-xs mt-2 ${accent.text}`}>{callNotice}</p>
              )}
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto bg-background px-3 py-3 space-y-3 md:bg-transparent md:p-4">
              {loadingMsgs ? (
                <div className="flex items-center justify-center h-full">
                  <Loader2 className={`w-8 h-8 ${accent.text} animate-spin`} />
                </div>
              ) : messages.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-full text-center">
                  <MessageCircle className="w-12 h-12 text-gray-600 mb-3" />
                  <p className="text-sm text-muted-foreground">No messages yet</p>
                  <p className="text-xs text-faint-foreground mt-1">
                    Send a message to start the conversation
                  </p>
                </div>
              ) : (
                messages.map(msg => {
                  const isMe =
                    currentUserId !== null &&
                    (msg.senderId.toLowerCase() === currentUserId.toLowerCase() ||
                      msg.id.startsWith('temp-'))
                  return (
                    <div
                      key={msg.id}
                      className={`flex ${isMe ? 'justify-end' : 'justify-start'}`}
                    >
                      <div className="flex max-w-[88%] items-end gap-2 sm:max-w-[75%]">
                        {!isMe && (
                          <Avatar
                            url={avatarUrl(msg.senderAvatarUrl)}
                            name={msg.senderName}
                            size={32}
                            role={msg.senderRole}
                          />
                        )}
                        <div>
                          {/* Reply preview */}
                          {msg.replyTo && (
                            <div
                              className={`text-xs px-3 py-1 mb-0.5 rounded-t-xl border-l-2 ${
                                isMe
                                  ? `${accent.border} ${accent.bgMuted20} text-foreground/80`
                                  : `${accent.border} bg-border-subtle text-muted-foreground`
                              }`}
                            >
                              <span className="font-semibold">
                                {msg.replyTo.senderName}
                              </span>
                              <p className="truncate">{msg.replyTo.text}</p>
                            </div>
                          )}
                          {/* Bubble */}
                          <div
                            className={`group relative rounded-2xl px-4 py-2.5 ${
                              isMe
                                ? `${accent.bg} text-foreground rounded-br-sm`
                                : 'border border-border-subtle bg-surface-2 text-foreground shadow-sm rounded-bl-sm'
                            }`}
                          >
                            {/* Attachment */}
                            {msg.attachmentUrl && (
                              msg.attachmentContentType?.startsWith('image/') ? (
                                <a
                                  href={`${MEDIA_BASE_URL}${msg.attachmentUrl}`}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="block mb-1"
                                >
                                  <img
                                    src={`${MEDIA_BASE_URL}${msg.attachmentUrl}`}
                                    alt={msg.attachmentFileName || 'Image'}
                                    className="max-h-[200px] max-w-[220px] rounded-lg object-cover sm:max-w-[260px]"
                                  />
                                </a>
                              ) : (
                                <a
                                  href={`${MEDIA_BASE_URL}${msg.attachmentUrl}`}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  download={msg.attachmentFileName}
                                  className={`flex items-center gap-2 mb-1 px-3 py-2 rounded-lg ${
                                    isMe ? 'bg-white/10 hover:bg-white/20' : 'bg-white/5 hover:bg-white/10'
                                  } transition-colors`}
                                >
                                  <FileText className="w-5 h-5 flex-shrink-0" />
                                  <div className="min-w-0 flex-1">
                                    <p className="text-sm font-medium truncate">{msg.attachmentFileName}</p>
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
                              <p className="text-sm whitespace-pre-wrap break-words">
                                {msg.text}
                              </p>
                            )}
                            <p
                              className={`text-xs mt-1 ${
                                isMe ? 'text-foreground/70' : 'text-faint-foreground'
                              }`}
                            >
                              {formatTime(msg.createdAt)}
                              {msg.readAt && isMe && (
                                <span className="ml-2">✓✓</span>
                              )}
                            </p>
                            {/* Reply button (shows on hover) */}
                            {!msg.id.startsWith('temp-') && (
                              <button
                                onClick={() => {
                                  setReplyTo(msg)
                                  inputRef.current?.focus()
                                }}
                                className="absolute -top-2 right-0 opacity-0 group-hover:opacity-100 transition-opacity bg-background border border-border-subtle rounded-full p-1"
                              >
                                <Reply className="w-3 h-3 text-muted-foreground" />
                              </button>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  )
                })
              )}
              <div ref={messagesEndRef} />
            </div>

            {/* Pending file preview */}
            {pendingFile && (
              <div
                className="flex items-center gap-2 border-t bg-surface-2 px-3 pt-2 md:border-border-subtle md:bg-transparent md:px-4"
                style={{ borderTopColor: 'var(--separator-color)' }}
              >
                {pendingFile.contentType.startsWith('image/') ? (
                  <ImageIcon className={`w-4 h-4 ${accent.text}`} />
                ) : (
                  <FileText className={`w-4 h-4 ${accent.text}`} />
                )}
                <div className="flex-1 text-xs text-muted-foreground truncate">
                  <span className="font-semibold text-foreground">{pendingFile.fileName}</span>
                  <span className="ml-2 text-faint-foreground">({formatFileSize(pendingFile.size)})</span>
                </div>
                <button onClick={() => setPendingFile(null)}>
                  <X className="w-4 h-4 text-faint-foreground" />
                </button>
              </div>
            )}

            {/* Reply preview bar */}
            {replyTo && (
              <div
                className="flex items-center gap-2 border-t bg-surface-2 px-3 pt-2 md:border-border-subtle md:bg-transparent md:px-4"
                style={{ borderTopColor: 'var(--separator-color)' }}
              >
                <Reply className={`w-4 h-4 ${accent.text}`} />
                <div className="flex-1 text-xs text-muted-foreground truncate">
                  <span className="font-semibold text-foreground">
                    {replyTo.senderName}
                  </span>{' '}
                  {replyTo.text}
                </div>
                <button onClick={() => setReplyTo(null)}>
                  <X className="w-4 h-4 text-faint-foreground" />
                </button>
              </div>
            )}

            {/* Input */}
            <div
              className="border-t bg-surface-2 md:border-border-subtle md:bg-surface-3 md:p-4"
              style={{ borderTopColor: 'var(--separator-color)' }}
            >
              <div className="relative flex items-end gap-2" ref={emojiPickerRef}>
                {/* Hidden file input */}
                <input
                  ref={fileInputRef}
                  type="file"
                  className="hidden"
                  onChange={handleFileSelect}
                  accept="image/*,.pdf,.doc,.docx,.xls,.xlsx,.txt,.zip,.rar,.mp4,.mov,.mp3,.wav"
                />
                {/* Paperclip button */}
                <button
                  onClick={() => fileInputRef.current?.click()}
                  disabled={uploading || sending}
                  className={`rounded-full p-2.5 text-muted-foreground ${accent.hoverText} transition-colors disabled:opacity-50`}
                  title="Attach file"
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
                  title="Add emoji"
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
                          className="p-1.5 rounded hover:bg-white/10 transition-colors text-lg"
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
                  placeholder={pendingFile ? "Add a caption..." : "Type a message..."}
                  value={inputText}
                  onChange={e => setInputText(e.target.value)}
                  onKeyDown={handleKeyDown}
                  disabled={sending}
                  className={`min-w-0 flex-1 bg-background border border-border-subtle/70 rounded-full px-4 py-2.5 text-sm text-foreground placeholder-gray-500 focus:outline-none ${accent.focusBorder}`}
                />
                <button
                  onClick={handleSend}
                  disabled={sending || (!inputText.trim() && !pendingFile)}
                  className={`rounded-full p-2.5 bg-gradient-to-r ${accent.gradient} hover:opacity-90 transition-opacity disabled:opacity-50`}
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
              <div className="border-t border-border-subtle bg-background p-3">
                <div className="mb-3 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                  <div>
                    <p className="text-sm font-semibold text-foreground">{activeCallType === 'video' ? 'Video call' : 'Audio call'} with {activeCallPeerName}</p>
                    <p className="text-xs text-muted-foreground capitalize">{callStatus}{callStatus === 'connected' ? ` · ${formatCallDuration(callDurationSeconds)}` : ''}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={toggleMic}
                      className="p-2 rounded-lg border border-border-subtle text-muted-foreground hover:bg-white/10 transition-colors"
                      title={isMicMuted ? 'Unmute microphone' : 'Mute microphone'}
                    >
                      {isMicMuted ? <MicOff className="w-4 h-4" /> : <Mic className="w-4 h-4" />}
                    </button>
                    {activeCallType === 'video' && (
                      <button
                        type="button"
                        onClick={toggleCamera}
                        className="p-2 rounded-lg border border-border-subtle text-muted-foreground hover:bg-white/10 transition-colors"
                        title={isCameraEnabled ? 'Turn off camera' : 'Turn on camera'}
                      >
                        {isCameraEnabled ? <Video className="w-4 h-4" /> : <VideoOff className="w-4 h-4" />}
                      </button>
                    )}
                    <button
                      type="button"
                      onClick={handleEndCall}
                      className="p-2 rounded-lg bg-red-600 hover:bg-red-700 transition-colors text-foreground"
                      title="End call"
                    >
                      <PhoneOff className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                <audio ref={remoteAudioCallbackRef} autoPlay />
                {activeCallType === 'video' && (
                  <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                    <video ref={localVideoCallbackRef} autoPlay muted playsInline className="w-full h-32 rounded-lg bg-black object-cover" />
                    <video ref={remoteVideoCallbackRef} autoPlay playsInline className="w-full h-32 rounded-lg bg-black object-cover" />
                  </div>
                )}
              </div>
            )}
          </div>
        ) : (
          <div className="flex-1 hidden md:flex items-center justify-center">
            <div className="text-center">
              <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-background flex items-center justify-center">
                <Send className="w-8 h-8 text-faint-foreground" />
              </div>
              <h3 className="text-lg font-semibold text-foreground mb-2">
                Select a conversation
              </h3>
              <p className="text-sm text-muted-foreground">
                Choose a chat to start messaging
              </p>
            </div>
          </div>
        )}
      </div>
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
