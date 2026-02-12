'use client';

import { useState, useEffect } from 'react';
import { friendsApi, followsApi } from '@/lib/api/friendsApi';
import { FriendDto, FriendRequestDto } from '@/types/friend';
import { Users, UserPlus, UserCheck, Loader2, Mail, Check, X, Trash2 } from 'lucide-react';

type Tab = 'friends' | 'requests' | 'sent' | 'following';

export default function FriendsPage() {
  const [activeTab, setActiveTab] = useState<Tab>('friends');
  const [friends, setFriends] = useState<FriendDto[]>([]);
  const [incomingRequests, setIncomingRequests] = useState<FriendRequestDto[]>([]);
  const [outgoingRequests, setOutgoingRequests] = useState<FriendRequestDto[]>([]);
  const [following, setFollowing] = useState<FriendDto[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  useEffect(() => {
    loadData();
  }, [activeTab]);

  const loadData = async () => {
    setLoading(true);
    try {
      if (activeTab === 'friends') {
        const data = await friendsApi.getMyFriends();
        setFriends(data);
      } else if (activeTab === 'requests') {
        const data = await friendsApi.getIncomingRequests();
        setIncomingRequests(data);
      } else if (activeTab === 'sent') {
        const data = await friendsApi.getOutgoingRequests();
        setOutgoingRequests(data);
      } else if (activeTab === 'following') {
        const data = await followsApi.getMyFollowing();
        setFollowing(data);
      }
    } catch (error) {
      console.error('Error loading data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleAcceptRequest = async (requestId: number) => {
    setActionLoading(`accept-${requestId}`);
    try {
      await friendsApi.acceptFriendRequest(requestId);
      await loadData();
    } catch (error) {
      console.error('Error accepting request:', error);
    } finally {
      setActionLoading(null);
    }
  };

  const handleDeclineRequest = async (requestId: number) => {
    setActionLoading(`decline-${requestId}`);
    try {
      await friendsApi.declineFriendRequest(requestId);
      await loadData();
    } catch (error) {
      console.error('Error declining request:', error);
    } finally {
      setActionLoading(null);
    }
  };

  const handleCancelRequest = async (requestId: number) => {
    setActionLoading(`cancel-${requestId}`);
    try {
      await friendsApi.cancelFriendRequest(requestId);
      await loadData();
    } catch (error) {
      console.error('Error canceling request:', error);
    } finally {
      setActionLoading(null);
    }
  };

  const handleRemoveFriend = async (friendId: string) => {
    if (!confirm('Are you sure you want to remove this friend?')) return;
    setActionLoading(`remove-${friendId}`);
    try {
      await friendsApi.removeFriend(friendId);
      await loadData();
    } catch (error) {
      console.error('Error removing friend:', error);
    } finally {
      setActionLoading(null);
    }
  };

  const handleUnfollow = async (trainerId: string) => {
    setActionLoading(`unfollow-${trainerId}`);
    try {
      await followsApi.unfollowTrainer(trainerId);
      await loadData();
    } catch (error) {
      console.error('Error unfollowing trainer:', error);
    } finally {
      setActionLoading(null);
    }
  };

  const tabs = [
    { id: 'friends', label: 'Friends', icon: Users, count: friends.length },
    { id: 'requests', label: 'Requests', icon: Mail, count: incomingRequests.length },
    { id: 'sent', label: 'Sent', icon: UserPlus, count: outgoingRequests.length },
    { id: 'following', label: 'Following', icon: UserCheck, count: following.length },
  ];

  return (
    <>
      <div className="space-y-6">
        <h1 className="text-3xl font-bold text-white">Friends & Following</h1>

        {/* Tabs */}
        <div className="flex gap-2 border-b border-white/10">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as Tab)}
              className={`px-4 py-3 font-medium transition-all flex items-center gap-2 ${
                activeTab === tab.id
                  ? 'text-[#FF6B35] border-b-2 border-[#FF6B35]'
                  : 'text-gray-400 hover:text-white'
              }`}
            >
              <tab.icon className="w-5 h-5" />
              {tab.label}
              {tab.count > 0 && (
                <span className="bg-[#FF6B35]/20 text-[#FF6B35] text-xs font-semibold px-2 py-0.5 rounded-full">
                  {tab.count}
                </span>
              )}
            </button>
          ))}
        </div>

        {/* Content */}
        {loading ? (
          <div className="flex justify-center items-center h-64">
            <Loader2 className="w-8 h-8 animate-spin text-[#FF6B35]" />
          </div>
        ) : (
          <div className="space-y-3">
            {/* Friends Tab */}
            {activeTab === 'friends' && (
              <>
                {friends.length === 0 ? (
                  <div className="text-center py-12 bg-[#1A1A1A] rounded-xl border border-white/10">
                    <Users className="w-16 h-16 mx-auto mb-4 text-gray-500" />
                    <p className="text-gray-400">No friends yet. Start connecting!</p>
                  </div>
                ) : (
                  friends.map((friend) => (
                    <div
                      key={friend.id}
                      className="flex items-center gap-4 p-4 bg-[#1A1A1A] rounded-lg border border-white/10 hover:border-white/20 transition-colors"
                    >
                      <div className="w-12 h-12 rounded-full bg-gradient-to-br from-[#FF6B35] to-[#FF0844] flex items-center justify-center text-white font-bold">
                        {friend.fullName?.[0] || friend.email[0].toUpperCase()}
                      </div>
                      <div className="flex-1">
                        <h3 className="font-semibold text-white">
                          {friend.fullName || friend.email}
                        </h3>
                        <p className="text-sm text-gray-400">{friend.email}</p>
                      </div>
                      <button
                        onClick={() => handleRemoveFriend(friend.id)}
                        disabled={actionLoading === `remove-${friend.id}`}
                        className="px-3 py-2 text-red-500 hover:bg-red-500/10 rounded-lg transition-colors disabled:opacity-50"
                      >
                        {actionLoading === `remove-${friend.id}` ? (
                          <Loader2 className="w-5 h-5 animate-spin" />
                        ) : (
                          <Trash2 className="w-5 h-5" />
                        )}
                      </button>
                    </div>
                  ))
                )}
              </>
            )}

            {/* Incoming Requests Tab */}
            {activeTab === 'requests' && (
              <>
                {incomingRequests.length === 0 ? (
                  <div className="text-center py-12 bg-[#1A1A1A] rounded-xl border border-white/10">
                    <Mail className="w-16 h-16 mx-auto mb-4 text-gray-500" />
                    <p className="text-gray-400">No pending requests</p>
                  </div>
                ) : (
                  incomingRequests.map((request) => (
                    <div
                      key={request.id}
                      className="flex items-center gap-4 p-4 bg-[#1A1A1A] rounded-lg border border-white/10 hover:border-white/20 transition-colors"
                    >
                      <div className="w-12 h-12 rounded-full bg-gradient-to-br from-blue-400 to-purple-500 flex items-center justify-center text-white font-bold">
                        {request.senderFullName?.[0] || request.senderEmail[0].toUpperCase()}
                      </div>
                      <div className="flex-1">
                        <h3 className="font-semibold text-white">
                          {request.senderFullName || request.senderEmail}
                        </h3>
                        <p className="text-sm text-gray-400">{request.senderEmail}</p>
                      </div>
                      <div className="flex gap-2">
                        <button
                          onClick={() => handleAcceptRequest(request.id)}
                          disabled={actionLoading === `accept-${request.id}`}
                          className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg transition-colors disabled:opacity-50 flex items-center gap-2"
                        >
                          {actionLoading === `accept-${request.id}` ? (
                            <Loader2 className="w-5 h-5 animate-spin" />
                          ) : (
                            <>
                              <Check className="w-5 h-5" />
                              Accept
                            </>
                          )}
                        </button>
                        <button
                          onClick={() => handleDeclineRequest(request.id)}
                          disabled={actionLoading === `decline-${request.id}`}
                          className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg transition-colors disabled:opacity-50 flex items-center gap-2"
                        >
                          {actionLoading === `decline-${request.id}` ? (
                            <Loader2 className="w-5 h-5 animate-spin" />
                          ) : (
                            <>
                              <X className="w-5 h-5" />
                              Decline
                            </>
                          )}
                        </button>
                      </div>
                    </div>
                  ))
                )}
              </>
            )}

            {/* Outgoing Requests Tab */}
            {activeTab === 'sent' && (
              <>
                {outgoingRequests.length === 0 ? (
                  <div className="text-center py-12 bg-[#1A1A1A] rounded-xl border border-white/10">
                    <UserPlus className="w-16 h-16 mx-auto mb-4 text-gray-500" />
                    <p className="text-gray-400">No pending requests sent</p>
                  </div>
                ) : (
                  outgoingRequests.map((request) => (
                    <div
                      key={request.id}
                      className="flex items-center gap-4 p-4 bg-[#1A1A1A] rounded-lg border border-white/10 hover:border-white/20 transition-colors"
                    >
                      <div className="w-12 h-12 rounded-full bg-gradient-to-br from-yellow-400 to-orange-500 flex items-center justify-center text-white font-bold">
                        {request.receiverFullName?.[0] || request.receiverEmail[0].toUpperCase()}
                      </div>
                      <div className="flex-1">
                        <h3 className="font-semibold text-white">
                          {request.receiverFullName || request.receiverEmail}
                        </h3>
                        <p className="text-sm text-gray-400">{request.receiverEmail}</p>
                        <span className="text-xs text-[#FF6B35]">Pending</span>
                      </div>
                      <button
                        onClick={() => handleCancelRequest(request.id)}
                        disabled={actionLoading === `cancel-${request.id}`}
                        className="px-4 py-2 text-red-500 hover:bg-red-500/10 rounded-lg transition-colors disabled:opacity-50"
                      >
                        {actionLoading === `cancel-${request.id}` ? (
                          <Loader2 className="w-5 h-5 animate-spin" />
                        ) : (
                          <>Cancel</>
                        )}
                      </button>
                    </div>
                  ))
                )}
              </>
            )}

            {/* Following Tab */}
            {activeTab === 'following' && (
              <>
                {following.length === 0 ? (
                  <div className="text-center py-12 bg-[#1A1A1A] rounded-xl border border-white/10">
                    <UserCheck className="w-16 h-16 mx-auto mb-4 text-gray-500" />
                    <p className="text-gray-400">Not following any trainers yet</p>
                  </div>
                ) : (
                  following.map((trainer) => (
                    <div
                      key={trainer.id}
                      className="flex items-center gap-4 p-4 bg-[#1A1A1A] rounded-lg border border-white/10 hover:border-white/20 transition-colors"
                    >
                      <div className="w-12 h-12 rounded-full bg-gradient-to-br from-green-400 to-teal-500 flex items-center justify-center text-white font-bold">
                        {trainer.fullName?.[0] || trainer.email[0].toUpperCase()}
                      </div>
                      <div className="flex-1">
                        <h3 className="font-semibold text-white">
                          {trainer.fullName || trainer.email}
                        </h3>
                        <p className="text-sm text-gray-400">{trainer.email}</p>
                        <span className="text-xs text-green-500">Trainer</span>
                      </div>
                      <button
                        onClick={() => handleUnfollow(trainer.id)}
                        disabled={actionLoading === `unfollow-${trainer.id}`}
                        className="px-4 py-2 text-red-500 hover:bg-red-500/10 rounded-lg transition-colors disabled:opacity-50"
                      >
                        {actionLoading === `unfollow-${trainer.id}` ? (
                          <Loader2 className="w-5 h-5 animate-spin" />
                        ) : (
                          <>Unfollow</>
                        )}
                      </button>
                    </div>
                  ))
                )}
              </>
            )}
          </div>
        )}
      </div>
    </>
  );
}
