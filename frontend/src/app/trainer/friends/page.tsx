'use client'

import { useState, useEffect } from 'react'
import { Search, Users, MessageCircle, MoreVertical, Check, UserPlus, Loader2, UserMinus, Clock } from 'lucide-react'
import { friendsApi } from '@/lib/api/friendsApi'
import { useTranslations } from 'next-intl'
import { FriendDto, FriendRequestDto, FriendRequestStatus } from '@/types/friend'

export default function FriendsPage() {
  const t = useTranslations('friends')
  const tc = useTranslations('common')
  const [activeTab, setActiveTab] = useState<'all' | 'requests'>('all')
  const [friends, setFriends] = useState<FriendDto[]>([])
  const [incomingRequests, setIncomingRequests] = useState<FriendRequestDto[]>([])
  const [outgoingRequests, setOutgoingRequests] = useState<FriendRequestDto[]>([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')

  useEffect(() => {
    loadData()
  }, [])

  const loadData = async () => {
    try {
      setLoading(true)
      const [friendsData, incomingData, outgoingData] = await Promise.all([
        friendsApi.getMyFriends(),
        friendsApi.getIncomingRequests(),
        friendsApi.getOutgoingRequests(),
      ])
      setFriends(friendsData)
      setIncomingRequests(incomingData.filter(r => r.status === FriendRequestStatus.Pending))
      setOutgoingRequests(outgoingData.filter(r => r.status === FriendRequestStatus.Pending))
    } catch (error) {
      console.error('Failed to load friends:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleAcceptRequest = async (requestId: number) => {
    try {
      await friendsApi.acceptFriendRequest(requestId)
      await loadData()
    } catch (error) {
      console.error('Failed to accept request:', error)
    }
  }

  const handleDeclineRequest = async (requestId: number) => {
    try {
      await friendsApi.declineFriendRequest(requestId)
      await loadData()
    } catch (error) {
      console.error('Failed to decline request:', error)
    }
  }

  const handleCancelRequest = async (requestId: number) => {
    try {
      await friendsApi.cancelFriendRequest(requestId)
      await loadData()
    } catch (error) {
      console.error('Failed to cancel request:', error)
    }
  }

  const handleRemoveFriend = async (friendId: string) => {
    try {
      await friendsApi.removeFriend(friendId)
      await loadData()
    } catch (error) {
      console.error('Failed to remove friend:', error)
    }
  }

  const filteredFriends = friends.filter(friend => 
    (friend.fullName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
     friend.email.toLowerCase().includes(searchQuery.toLowerCase()))
  )

  const pendingRequestsCount = incomingRequests.length + outgoingRequests.length

  if (loading) {
    return (
      <>
        <div className="flex items-center justify-center min-h-[60vh]">
          <Loader2 className="w-8 h-8 text-[#FF6B35] animate-spin" />
        </div>
      </>
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
                className="w-64 bg-[#0A0A0A] border border-white/10 rounded-lg pl-10 pr-4 py-2.5 text-sm text-white placeholder:text-gray-500 focus:outline-none focus:border-[#FF6B35]"
              />
            </div>
          </div>

          {/* Tabs */}
          <div className="flex items-center gap-2 border-b border-white/10">
            <button
              onClick={() => setActiveTab('all')}
              className={`px-4 py-2.5 text-sm font-semibold transition-colors relative ${
                activeTab === 'all' ? 'text-[#FF6B35]' : 'text-gray-400 hover:text-white'
              }`}
            >
              {t('allFriends')} ({friends.length})
              {activeTab === 'all' && <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-[#FF6B35]" />}
            </button>
            <button
              onClick={() => setActiveTab('requests')}
              className={`px-4 py-2.5 text-sm font-semibold transition-colors relative ${
                activeTab === 'requests' ? 'text-[#FF6B35]' : 'text-gray-400 hover:text-white'
              }`}
            >
              {t('requests')} ({pendingRequestsCount})
              {activeTab === 'requests' && <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-[#FF6B35]" />}
            </button>
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
                    <div className="flex items-center gap-4">
                      <img
                        src={friend.avatar || '/default-avatar.png'}
                        alt={friend.fullName || friend.email}
                        className="w-16 h-16 rounded-full object-cover"
                      />
                      <div>
                        <h3 className="text-white font-semibold text-lg">{friend.fullName || tc('user')}</h3>
                        <p className="text-sm text-gray-400">{friend.email}</p>
                        <p className="text-xs text-gray-500 mt-1">
                          {t('friendsSince')} {new Date(friend.friendsSince).toLocaleDateString()}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <button className="px-4 py-2 bg-white/5 hover:bg-white/10 border border-white/10 text-white rounded-lg transition-all flex items-center gap-2">
                        <MessageCircle className="w-4 h-4" />
                        <span className="text-sm font-medium">{t('message')}</span>
                      </button>
                      <button 
                        onClick={() => handleRemoveFriend(friend.id)}
                        className="p-2 hover:bg-red-500/10 rounded-lg transition-colors group"
                        title="Remove friend"
                      >
                        <UserMinus className="w-5 h-5 text-gray-400 group-hover:text-red-500" />
                      </button>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        )}

        {/* Requests */}
        {activeTab === 'requests' && (
          <div className="space-y-4">
            {/* Incoming Requests */}
            {incomingRequests.length > 0 && (
              <div>
                <h3 className="text-white font-semibold mb-3">{t('incomingRequests')} ({incomingRequests.length})</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {incomingRequests.map((request) => (
                    <div
                      key={request.id}
                      className="bg-[#1A1A1A] rounded-lg border border-white/10 p-5 hover:border-white/20 transition-all"
                    >
                      <div className="flex items-center gap-4">
                        <img
                          src={request.senderAvatar || '/default-avatar.png'}
                          alt={request.senderFullName || request.senderEmail}
                          className="w-14 h-14 rounded-full object-cover"
                        />
                        <div className="flex-1">
                          <h3 className="text-white font-semibold">{request.senderFullName || tc('user')}</h3>
                          <p className="text-sm text-gray-400">{request.senderEmail}</p>
                          <p className="text-xs text-gray-500 mt-1">
                            Sent {new Date(request.createdAt).toLocaleDateString()}
                          </p>
                        </div>
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => handleAcceptRequest(request.id)}
                            className="px-3 py-2 bg-gradient-to-r from-[#FF6B35] to-[#FF0844] text-white rounded-lg transition-all flex items-center gap-2"
                          >
                            <Check className="w-4 h-4" />
                            <span className="text-sm font-medium">{t('accept')}</span>
                          </button>
                          <button
                            onClick={() => handleDeclineRequest(request.id)}
                            className="px-3 py-2 bg-white/5 hover:bg-white/10 border border-white/10 text-white rounded-lg transition-all"
                          >
                            <span className="text-sm font-medium">{t('decline')}</span>
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Outgoing Requests */}
            {outgoingRequests.length > 0 && (
              <div>
                <h3 className="text-white font-semibold mb-3">{t('sentRequests')} ({outgoingRequests.length})</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {outgoingRequests.map((request) => (
                    <div
                      key={request.id}
                      className="bg-[#1A1A1A] rounded-lg border border-white/10 p-5 hover:border-white/20 transition-all"
                    >
                      <div className="flex items-center gap-4">
                        <img
                          src={request.receiverAvatar || '/default-avatar.png'}
                          alt={request.receiverFullName || request.receiverEmail}
                          className="w-14 h-14 rounded-full object-cover"
                        />
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
                          className="px-3 py-2 bg-white/5 hover:bg-red-500/10 border border-white/10 text-gray-400 hover:text-red-400 rounded-lg transition-all"
                        >
                          <span className="text-sm font-medium">{tc('cancel')}</span>
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {incomingRequests.length === 0 && outgoingRequests.length === 0 && (
              <div className="bg-[#1A1A1A] rounded-lg border border-white/10 p-8 text-center">
                <UserPlus className="w-12 h-12 text-gray-600 mx-auto mb-4" />
                <h3 className="text-white font-semibold mb-2">{t('noPendingRequests')}</h3>
                <p className="text-gray-400 text-sm">{t('requestsWillAppear')}</p>
              </div>
            )}
          </div>
        )}
      </div>
    </>
  )
}
