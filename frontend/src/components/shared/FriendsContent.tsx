'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import {
  Search,
  Users,
  MessageCircle,
  Check,
  UserPlus,
  Loader2,
  UserMinus,
  UserCheck,
  Mail,
  Clock,
  Trash2,
  X,
} from 'lucide-react'
import { friendsApi, followsApi } from '@/lib/api/friendsApi'
import { FriendDto, FriendRequestDto, FriendRequestStatus } from '@/types/friend'
import { useTranslations } from 'next-intl'
import { useAccentColors, getRoleRingClass } from '@/lib/theme/useAccentColors'
import { chatConnection } from '@/lib/signalr/chatConnection'
import { Toast } from '@/components/ui/Toast'
import { getMediaUrl } from '@/lib/config'

interface FriendsContentProps {
  basePath: string
}

export function FriendsContent({ basePath }: FriendsContentProps) {
  const accent = useAccentColors()
  const router = useRouter()
  const t = useTranslations('friends')
  const tc = useTranslations('common')
  const [activeTab, setActiveTab] = useState<'all' | 'requests' | 'sent' | 'following'>('all')
  const [friends, setFriends] = useState<FriendDto[]>([])
  const [incomingRequests, setIncomingRequests] = useState<FriendRequestDto[]>([])
  const [outgoingRequests, setOutgoingRequests] = useState<FriendRequestDto[]>([])
  const [following, setFollowing] = useState<FriendDto[]>([])
  const [loading, setLoading] = useState(true)
  const [actionLoading, setActionLoading] = useState<string | null>(null)
  const [searchQuery, setSearchQuery] = useState('')
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' | 'info' } | null>(null)
  const [incomingCount, setIncomingCount] = useState(0)

  useEffect(() => {
    loadData()
  }, [activeTab])

  // Real-time friend request notifications via SignalR
  useEffect(() => {
    const handleFriendRequestReceived = (data: { requestId: number; senderId: string; senderName: string; senderAvatar: string | null }) => {
      setToast({ message: `${data.senderName} ${t('sentYouRequest')}`, type: 'success' })
      setIncomingCount(prev => prev + 1)
      if (activeTab === 'requests') loadData()
    }

    const handleFriendRequestAccepted = (data: { requestId: number; acceptorId: string; acceptorName: string; acceptorAvatar: string | null }) => {
      setToast({ message: `${data.acceptorName} ${t('acceptedYourRequest')}`, type: 'success' })
      loadData()
    }

    const handleFriendRemoved = (data: { removedByUserId: string; removedByName: string }) => {
      setFriends(prev => prev.filter(f => f.id !== data.removedByUserId))
      if (activeTab === 'all') loadData()
    }

    chatConnection.onFriendRequestReceived(handleFriendRequestReceived)
    chatConnection.onFriendRequestAccepted(handleFriendRequestAccepted)
    chatConnection.onFriendRemoved(handleFriendRemoved)

    return () => {
      chatConnection.off('FriendRequestReceived', handleFriendRequestReceived)
      chatConnection.off('FriendRequestAccepted', handleFriendRequestAccepted)
      chatConnection.off('FriendRemoved', handleFriendRemoved)
    }
  }, [activeTab, t])

  // Load incoming count on mount for badge
  useEffect(() => {
    friendsApi.getIncomingRequests().then(data => setIncomingCount(data.length)).catch(() => {})
  }, [])

  const loadData = async () => {
    try {
      setLoading(true)
      if (activeTab === 'all') {
        const [friendsData, incomingData, outgoingData] = await Promise.all([
          friendsApi.getMyFriends(),
          friendsApi.getIncomingRequests(),
          friendsApi.getOutgoingRequests(),
        ])
        setFriends(friendsData)
        setIncomingRequests(incomingData.filter(r => r.status === FriendRequestStatus.Pending))
        setOutgoingRequests(outgoingData.filter(r => r.status === FriendRequestStatus.Pending))
        setIncomingCount(incomingData.filter(r => r.status === FriendRequestStatus.Pending).length)
      } else if (activeTab === 'requests') {
        const data = await friendsApi.getIncomingRequests()
        setIncomingRequests(data.filter(r => r.status === FriendRequestStatus.Pending))
        setIncomingCount(data.filter(r => r.status === FriendRequestStatus.Pending).length)
      } else if (activeTab === 'sent') {
        const data = await friendsApi.getOutgoingRequests()
        setOutgoingRequests(data.filter(r => r.status === FriendRequestStatus.Pending))
      } else if (activeTab === 'following') {
        const data = await followsApi.getMyFollowing()
        setFollowing(data)
      }
    } catch (error) {
      console.error('Error loading data:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleAcceptRequest = async (requestId: number) => {
    setActionLoading(`accept-${requestId}`)
    try {
      await friendsApi.acceptFriendRequest(requestId)
      setIncomingCount(prev => Math.max(0, prev - 1))
      setToast({ message: t('requestAccepted'), type: 'success' })
      await loadData()
    } catch (error) {
      console.error('Error accepting request:', error)
      setToast({ message: t('errorAccepting'), type: 'error' })
    } finally {
      setActionLoading(null)
    }
  }

  const handleDeclineRequest = async (requestId: number) => {
    setActionLoading(`decline-${requestId}`)
    try {
      await friendsApi.declineFriendRequest(requestId)
      setIncomingCount(prev => Math.max(0, prev - 1))
      await loadData()
    } catch (error) {
      console.error('Error declining request:', error)
    } finally {
      setActionLoading(null)
    }
  }

  const handleCancelRequest = async (requestId: number) => {
    setActionLoading(`cancel-${requestId}`)
    try {
      await friendsApi.cancelFriendRequest(requestId)
      await loadData()
    } catch (error) {
      console.error('Error canceling request:', error)
    } finally {
      setActionLoading(null)
    }
  }

  const handleRemoveFriend = async (friendId: string) => {
    setActionLoading(`remove-${friendId}`)
    try {
      await friendsApi.removeFriend(friendId)
      await loadData()
    } catch (error) {
      console.error('Error removing friend:', error)
    } finally {
      setActionLoading(null)
    }
  }

  const handleUnfollow = async (trainerId: string) => {
    setActionLoading(`unfollow-${trainerId}`)
    try {
      await followsApi.unfollowTrainer(trainerId)
      await loadData()
    } catch (error) {
      console.error('Error unfollowing:', error)
    } finally {
      setActionLoading(null)
    }
  }

  const handleMessage = (userId: string) => {
    router.push(`${basePath}/messages?userId=${userId}`)
  }

  const filteredFriends = friends.filter(friend =>
    (friend.fullName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
     friend.email.toLowerCase().includes(searchQuery.toLowerCase()))
  )

  const pendingRequestsCount = incomingRequests.length + outgoingRequests.length

  if (loading && friends.length === 0) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Loader2 className={`w-8 h-8 ${accent.text} animate-spin`} />
      </div>
    )
  }

  return (
    <>
      <div className="space-y-4 pb-6">
        {/* Header */}
        <div className="bg-[#1A1A1A] rounded-lg border border-white/10 p-6">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h1 className="text-2xl font-bold text-white">{t('title')}</h1>
              <p className="text-sm text-gray-400 mt-1">
                {friends.length} {t('friendsCount')} • {pendingRequestsCount} {t('pendingRequests')}
              </p>
            </div>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="text"
                placeholder={t('searchPlaceholder')}
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className={`w-64 bg-[#0A0A0A] border border-white/10 rounded-lg pl-10 pr-4 py-2.5 text-sm text-white placeholder:text-gray-500 focus:outline-none ${accent.focusBorder}`}
              />
            </div>
          </div>

          {/* Tabs */}
          <div className="flex items-center gap-2 border-b border-white/10">
            {[
              { id: 'all' as const, label: t('allFriends'), count: friends.length },
              { id: 'requests' as const, label: t('requests'), count: incomingCount },
              { id: 'sent' as const, label: t('tabs.sent'), count: outgoingRequests.length },
              { id: 'following' as const, label: t('tabs.following'), count: following.length },
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`px-4 py-2.5 text-sm font-semibold transition-colors relative ${
                  activeTab === tab.id ? accent.text : 'text-gray-400 hover:text-white'
                }`}
              >
                {tab.label} ({tab.count})
                {activeTab === tab.id && <div className={`absolute bottom-0 left-0 right-0 h-0.5 ${accent.bg}`} />}
              </button>
            ))}
          </div>
        </div>

        {/* All Friends */}
        {activeTab === 'all' && (
          <div className="grid grid-cols-1 gap-4">
            {filteredFriends.length === 0 ? (
              <div className="bg-[#1A1A1A] rounded-lg border border-white/10 p-8 text-center">
                <Users className="w-12 h-12 text-gray-600 mx-auto mb-4" />
                <h3 className="text-white font-semibold mb-2">{t('noFriends')}</h3>
                <p className="text-gray-400 text-sm">{t('startConnecting')}</p>
              </div>
            ) : (
              filteredFriends.map((friend) => (
                <div
                  key={friend.id}
                  className="bg-[#1A1A1A] rounded-lg border border-white/10 p-5 hover:border-white/20 transition-all"
                >
                  <div className="flex items-center justify-between">
                    <div
                      className="flex items-center gap-4 flex-1 cursor-pointer"
                      onClick={() => router.push(`${basePath}/profile/${friend.id}`)}
                    >
                      {friend.avatar ? (
                        <img
                          src={getMediaUrl(friend.avatar) || friend.avatar}
                          alt={friend.fullName || friend.email}
                          className={`w-16 h-16 rounded-full object-cover ${getRoleRingClass(friend.role)}`}
                        />
                      ) : (
                        <div className={`w-16 h-16 rounded-full bg-gradient-to-br ${accent.gradient} flex items-center justify-center text-white font-bold text-lg`}>
                          {friend.fullName?.[0] || friend.email[0].toUpperCase()}
                        </div>
                      )}
                      <div>
                        <h3 className="text-white font-semibold text-lg">{friend.fullName || tc('user')}</h3>
                        <p className="text-sm text-gray-400">{friend.email}</p>
                        <p className="text-xs text-gray-500 mt-1">
                          {t('friendsSince')} {new Date(friend.friendsSince).toLocaleDateString()}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => handleMessage(friend.id)}
                        className="px-4 py-2 bg-white/5 hover:bg-white/10 border border-white/10 text-white rounded-lg transition-all flex items-center gap-2"
                      >
                        <MessageCircle className="w-4 h-4" />
                        <span className="text-sm font-medium">{t('message')}</span>
                      </button>
                      <button
                        onClick={() => handleRemoveFriend(friend.id)}
                        disabled={actionLoading === `remove-${friend.id}`}
                        className="p-2 hover:bg-red-500/10 rounded-lg transition-colors group"
                        title={t('removeFriend')}
                      >
                        {actionLoading === `remove-${friend.id}` ? (
                          <Loader2 className="w-5 h-5 animate-spin text-gray-400" />
                        ) : (
                          <UserMinus className="w-5 h-5 text-gray-400 group-hover:text-red-500" />
                        )}
                      </button>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        )}

        {/* Incoming Requests */}
        {activeTab === 'requests' && (
          <div className="space-y-4">
            {incomingRequests.length === 0 ? (
              <div className="bg-[#1A1A1A] rounded-lg border border-white/10 p-8 text-center">
                <UserPlus className="w-12 h-12 text-gray-600 mx-auto mb-4" />
                <h3 className="text-white font-semibold mb-2">{t('noPendingRequests')}</h3>
                <p className="text-gray-400 text-sm">{t('requestsWillAppear')}</p>
              </div>
            ) : (
              <div>
                <h3 className="text-white font-semibold mb-3">{t('incomingRequests')} ({incomingRequests.length})</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {incomingRequests.map((request) => (
                    <div
                      key={request.id}
                      className="bg-[#1A1A1A] rounded-lg border border-white/10 p-5 hover:border-white/20 transition-all"
                    >
                      <div className="flex items-center gap-4">
                        {request.senderAvatar ? (
                          <img
                            src={getMediaUrl(request.senderAvatar) || request.senderAvatar}
                            alt={request.senderFullName || request.senderEmail}
                            className={`w-14 h-14 rounded-full object-cover ${getRoleRingClass(request.senderRole)}`}
                          />
                        ) : (
                          <div className={`w-14 h-14 rounded-full bg-gradient-to-br ${accent.gradient} flex items-center justify-center text-white font-bold`}>
                            {request.senderFullName?.[0] || request.senderEmail[0].toUpperCase()}
                          </div>
                        )}
                        <div className="flex-1">
                          <h3 className="text-white font-semibold">{request.senderFullName || tc('user')}</h3>
                          <p className="text-sm text-gray-400">{request.senderEmail}</p>
                          <p className="text-xs text-gray-500 mt-1">
                            {new Date(request.createdAt).toLocaleDateString()}
                          </p>
                        </div>
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => handleAcceptRequest(request.id)}
                            disabled={actionLoading === `accept-${request.id}`}
                            className={`px-3 py-2 bg-gradient-to-r ${accent.gradient} text-white rounded-lg transition-all flex items-center gap-2 disabled:opacity-50`}
                          >
                            {actionLoading === `accept-${request.id}` ? (
                              <Loader2 className="w-4 h-4 animate-spin" />
                            ) : (
                              <Check className="w-4 h-4" />
                            )}
                            <span className="text-sm font-medium">{t('accept')}</span>
                          </button>
                          <button
                            onClick={() => handleDeclineRequest(request.id)}
                            disabled={actionLoading === `decline-${request.id}`}
                            className="px-3 py-2 bg-white/5 hover:bg-white/10 border border-white/10 text-white rounded-lg transition-all disabled:opacity-50"
                          >
                            {actionLoading === `decline-${request.id}` ? (
                              <Loader2 className="w-4 h-4 animate-spin" />
                            ) : (
                              <span className="text-sm font-medium">{t('decline')}</span>
                            )}
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* Sent Requests */}
        {activeTab === 'sent' && (
          <div className="space-y-4">
            {outgoingRequests.length === 0 ? (
              <div className="bg-[#1A1A1A] rounded-lg border border-white/10 p-8 text-center">
                <UserPlus className="w-12 h-12 text-gray-600 mx-auto mb-4" />
                <h3 className="text-white font-semibold mb-2">{t('noPendingSent')}</h3>
                <p className="text-gray-400 text-sm">{t('requestsWillAppear')}</p>
              </div>
            ) : (
              <div>
                <h3 className="text-white font-semibold mb-3">{t('sentRequests')} ({outgoingRequests.length})</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {outgoingRequests.map((request) => (
                    <div
                      key={request.id}
                      className="bg-[#1A1A1A] rounded-lg border border-white/10 p-5 hover:border-white/20 transition-all"
                    >
                      <div className="flex items-center gap-4">
                        {request.receiverAvatar ? (
                          <img
                            src={getMediaUrl(request.receiverAvatar) || request.receiverAvatar}
                            alt={request.receiverFullName || request.receiverEmail}
                            className={`w-14 h-14 rounded-full object-cover ${getRoleRingClass(request.receiverRole)}`}
                          />
                        ) : (
                          <div className={`w-14 h-14 rounded-full bg-gradient-to-br ${accent.gradient} flex items-center justify-center text-white font-bold`}>
                            {request.receiverFullName?.[0] || request.receiverEmail[0].toUpperCase()}
                          </div>
                        )}
                        <div className="flex-1">
                          <h3 className="text-white font-semibold">{request.receiverFullName || tc('user')}</h3>
                          <p className="text-sm text-gray-400">{request.receiverEmail}</p>
                          <div className="flex items-center gap-1 text-xs text-yellow-500 mt-1">
                            <Clock className="w-3 h-3" />
                            <span>{t('pending')}</span>
                          </div>
                        </div>
                        <button
                          onClick={() => handleCancelRequest(request.id)}
                          disabled={actionLoading === `cancel-${request.id}`}
                          className="px-3 py-2 bg-white/5 hover:bg-red-500/10 border border-white/10 text-gray-400 hover:text-red-400 rounded-lg transition-all disabled:opacity-50"
                        >
                          {actionLoading === `cancel-${request.id}` ? (
                            <Loader2 className="w-4 h-4 animate-spin" />
                          ) : (
                            <span className="text-sm font-medium">{tc('cancel')}</span>
                          )}
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* Following */}
        {activeTab === 'following' && (
          <div className="grid grid-cols-1 gap-4">
            {following.length === 0 ? (
              <div className="bg-[#1A1A1A] rounded-lg border border-white/10 p-8 text-center">
                <UserCheck className="w-12 h-12 text-gray-600 mx-auto mb-4" />
                <h3 className="text-white font-semibold mb-2">{t('notFollowingYet')}</h3>
                <p className="text-gray-400 text-sm">{t('startConnecting')}</p>
              </div>
            ) : (
              following.map((trainer) => (
                <div
                  key={trainer.id}
                  className="bg-[#1A1A1A] rounded-lg border border-white/10 p-5 hover:border-white/20 transition-all"
                >
                  <div className="flex items-center justify-between">
                    <div
                      className="flex items-center gap-4 flex-1 cursor-pointer"
                      onClick={() => router.push(`${basePath}/profile/${trainer.id}`)}
                    >
                      {trainer.avatar ? (
                        <img
                          src={getMediaUrl(trainer.avatar) || trainer.avatar}
                          alt={trainer.fullName || trainer.email}
                          className={`w-16 h-16 rounded-full object-cover ${getRoleRingClass(trainer.role)}`}
                        />
                      ) : (
                        <div className="w-16 h-16 rounded-full bg-gradient-to-br from-green-400 to-teal-500 flex items-center justify-center text-white font-bold text-lg">
                          {trainer.fullName?.[0] || trainer.email[0].toUpperCase()}
                        </div>
                      )}
                      <div>
                        <h3 className="text-white font-semibold text-lg">{trainer.fullName || tc('user')}</h3>
                        <p className="text-sm text-gray-400">{trainer.email}</p>
                        {trainer.role && (
                          <span className="text-xs text-green-500">{trainer.role}</span>
                        )}
                      </div>
                    </div>
                    <button
                      onClick={() => handleUnfollow(trainer.id)}
                      disabled={actionLoading === `unfollow-${trainer.id}`}
                      className="px-4 py-2 text-red-500 hover:bg-red-500/10 rounded-lg transition-colors disabled:opacity-50"
                    >
                      {actionLoading === `unfollow-${trainer.id}` ? (
                        <Loader2 className="w-5 h-5 animate-spin" />
                      ) : (
                        <>{t('unfollow')}</>
                      )}
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        )}
      </div>

      {toast && (
        <Toast
          message={toast.message}
          type={toast.type}
          onClose={() => setToast(null)}
        />
      )}
    </>
  )
}
