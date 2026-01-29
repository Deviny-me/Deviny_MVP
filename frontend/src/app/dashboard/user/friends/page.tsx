'use client'

import { UserMainLayout } from '@/components/user/layout/UserMainLayout'
import { useUser } from '@/components/user/UserProvider'
import { 
  Users,
  Search,
  MessageCircle,
  UserPlus,
  MoreHorizontal
} from 'lucide-react'
import { useState } from 'react'

interface Friend {
  id: string
  name: string
  avatar?: string
  level: number
  status: 'online' | 'offline' | 'workout'
  lastActive?: string
}

export default function FriendsPage() {
  const { user } = useUser()
  const [searchQuery, setSearchQuery] = useState('')
  const [activeTab, setActiveTab] = useState<'friends' | 'requests' | 'suggestions'>('friends')

  const friends: Friend[] = [
    { id: '1', name: 'Sarah Martinez', level: 47, status: 'online', avatar: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=400' },
    { id: '2', name: 'Marcus Chen', level: 39, status: 'workout', avatar: 'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=400' },
    { id: '3', name: 'Jessica Lee', level: 42, status: 'offline', lastActive: '2h ago', avatar: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=400' },
    { id: '4', name: 'David Thompson', level: 35, status: 'online', avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400' },
  ]

  const friendRequests: Friend[] = [
    { id: '5', name: 'Emily Watson', level: 28, status: 'offline', avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=400' },
  ]

  const suggestions: Friend[] = [
    { id: '6', name: 'Michael Brown', level: 31, status: 'online', avatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=400' },
    { id: '7', name: 'Lisa Anderson', level: 25, status: 'offline', avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=400' },
  ]

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'online': return 'bg-green-500'
      case 'workout': return 'bg-[#FF6B35]'
      default: return 'bg-gray-500'
    }
  }

  const getStatusText = (status: string) => {
    switch (status) {
      case 'online': return 'Online'
      case 'workout': return 'In Workout'
      default: return 'Offline'
    }
  }

  const filteredFriends = friends.filter(friend =>
    friend.name.toLowerCase().includes(searchQuery.toLowerCase())
  )

  return (
    <UserMainLayout>
      <div className="space-y-4 pb-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-white">Friends</h1>
            <p className="text-sm text-gray-400">{friends.length} friends</p>
          </div>
        </div>

        {/* Search */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            type="text"
            placeholder="Search friends..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 bg-[#1A1A1A] border border-white/10 rounded-lg text-sm text-white placeholder-gray-500 focus:outline-none focus:border-[#FF6B35]/50 transition-colors"
          />
        </div>

        {/* Tabs */}
        <div className="flex items-center gap-2">
          <button
            onClick={() => setActiveTab('friends')}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
              activeTab === 'friends'
                ? 'bg-gradient-to-r from-[#FF6B35] to-[#FF0844] text-white'
                : 'bg-[#1A1A1A] text-gray-400 hover:text-white border border-white/10'
            }`}
          >
            Friends ({friends.length})
          </button>
          <button
            onClick={() => setActiveTab('requests')}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-all relative ${
              activeTab === 'requests'
                ? 'bg-gradient-to-r from-[#FF6B35] to-[#FF0844] text-white'
                : 'bg-[#1A1A1A] text-gray-400 hover:text-white border border-white/10'
            }`}
          >
            Requests
            {friendRequests.length > 0 && (
              <span className="absolute -top-1 -right-1 w-5 h-5 bg-[#FF0844] rounded-full text-[10px] font-bold flex items-center justify-center text-white">
                {friendRequests.length}
              </span>
            )}
          </button>
          <button
            onClick={() => setActiveTab('suggestions')}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
              activeTab === 'suggestions'
                ? 'bg-gradient-to-r from-[#FF6B35] to-[#FF0844] text-white'
                : 'bg-[#1A1A1A] text-gray-400 hover:text-white border border-white/10'
            }`}
          >
            Suggestions
          </button>
        </div>

        {/* Friends List */}
        {activeTab === 'friends' && (
          <div className="space-y-2">
            {filteredFriends.map((friend) => (
              <div
                key={friend.id}
                className="bg-[#1A1A1A] rounded-xl border border-white/10 p-4 flex items-center justify-between hover:border-white/20 transition-colors"
              >
                <div className="flex items-center gap-4">
                  <div className="relative">
                    {friend.avatar ? (
                      <img
                        src={friend.avatar}
                        alt={friend.name}
                        className="w-12 h-12 rounded-full object-cover"
                      />
                    ) : (
                      <div className="w-12 h-12 rounded-full bg-gradient-to-br from-[#FF6B35] to-[#FF0844] flex items-center justify-center">
                        <span className="text-white font-bold">{friend.name.charAt(0)}</span>
                      </div>
                    )}
                    <div className={`absolute bottom-0 right-0 w-3 h-3 rounded-full border-2 border-[#1A1A1A] ${getStatusColor(friend.status)}`} />
                  </div>
                  <div>
                    <h3 className="font-semibold text-white">{friend.name}</h3>
                    <p className="text-xs text-gray-400">
                      Level {friend.level} • {getStatusText(friend.status)}
                      {friend.lastActive && ` • ${friend.lastActive}`}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <button className="p-2 bg-[#0A0A0A] rounded-lg text-gray-400 hover:text-white transition-colors">
                    <MessageCircle className="w-5 h-5" />
                  </button>
                  <button className="p-2 bg-[#0A0A0A] rounded-lg text-gray-400 hover:text-white transition-colors">
                    <MoreHorizontal className="w-5 h-5" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Requests */}
        {activeTab === 'requests' && (
          <div className="space-y-2">
            {friendRequests.length === 0 ? (
              <div className="text-center py-12 bg-[#1A1A1A] rounded-xl border border-white/10">
                <Users className="w-12 h-12 text-gray-500 mx-auto mb-3" />
                <h3 className="font-semibold text-white mb-1">No pending requests</h3>
                <p className="text-sm text-gray-400">Friend requests will appear here</p>
              </div>
            ) : (
              friendRequests.map((friend) => (
                <div
                  key={friend.id}
                  className="bg-[#1A1A1A] rounded-xl border border-white/10 p-4 flex items-center justify-between"
                >
                  <div className="flex items-center gap-4">
                    {friend.avatar ? (
                      <img
                        src={friend.avatar}
                        alt={friend.name}
                        className="w-12 h-12 rounded-full object-cover"
                      />
                    ) : (
                      <div className="w-12 h-12 rounded-full bg-gradient-to-br from-[#FF6B35] to-[#FF0844] flex items-center justify-center">
                        <span className="text-white font-bold">{friend.name.charAt(0)}</span>
                      </div>
                    )}
                    <div>
                      <h3 className="font-semibold text-white">{friend.name}</h3>
                      <p className="text-xs text-gray-400">Level {friend.level}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <button className="px-4 py-2 bg-gradient-to-r from-[#FF6B35] to-[#FF0844] text-white text-sm font-semibold rounded-lg hover:opacity-90 transition-opacity">
                      Accept
                    </button>
                    <button className="px-4 py-2 border border-white/20 text-gray-300 text-sm font-semibold rounded-lg hover:bg-white/5 transition-colors">
                      Decline
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        )}

        {/* Suggestions */}
        {activeTab === 'suggestions' && (
          <div className="space-y-2">
            {suggestions.map((friend) => (
              <div
                key={friend.id}
                className="bg-[#1A1A1A] rounded-xl border border-white/10 p-4 flex items-center justify-between"
              >
                <div className="flex items-center gap-4">
                  {friend.avatar ? (
                    <img
                      src={friend.avatar}
                      alt={friend.name}
                      className="w-12 h-12 rounded-full object-cover"
                    />
                  ) : (
                    <div className="w-12 h-12 rounded-full bg-gradient-to-br from-[#FF6B35] to-[#FF0844] flex items-center justify-center">
                      <span className="text-white font-bold">{friend.name.charAt(0)}</span>
                    </div>
                  )}
                  <div>
                    <h3 className="font-semibold text-white">{friend.name}</h3>
                    <p className="text-xs text-gray-400">Level {friend.level}</p>
                  </div>
                </div>
                <button className="flex items-center gap-2 px-4 py-2 bg-[#0A0A0A] border border-white/10 text-gray-300 text-sm font-semibold rounded-lg hover:bg-white/5 transition-colors">
                  <UserPlus className="w-4 h-4" />
                  Add Friend
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </UserMainLayout>
  )
}
