'use client'

import {
  Camera,
  Grid,
  List,
  Loader2,
  Heart,
  MessageCircle,
  Play,
  Repeat2,
  X,
  UserPlus,
  UserCheck,
  UserMinus,
  Mail,
  Ban,
  Clock,
  Check,
} from 'lucide-react'
import { useRouter, useSearchParams } from 'next/navigation'
import { useState, useEffect, useCallback, useRef } from 'react'
import { postsApi } from '@/lib/api/postsApi'
import { friendsApi, followsApi, blocksApi } from '@/lib/api/friendsApi'
import { chatConnection } from '@/lib/signalr/chatConnection'
import { MediaType } from '@/types/post'
import type { ProfilePostTab } from '@/types/post'
import type { RelationshipStatus } from '@/types/friend'
import { getMediaUrl } from '@/lib/config'
import { PostCard } from '@/components/posts/PostCard'
import { ProfilePostTabs } from '@/components/posts/ProfilePostTabs'
import { getRoleRingClass, getAccentColorsByRole } from '@/lib/theme/useAccentColors'
import { PhotoLightbox } from '@/components/ui/PhotoLightbox'
import { Toast } from '@/components/ui/Toast'
import { useUpsertPosts, usePost, usePostDispatch } from '@/contexts/PostStoreContext'
import { useTranslations } from 'next-intl'

// ─── Grid cell with like overlay ───
function GridCell({
  postId,
  onSelect,
}: {
  postId: string
  onSelect: (postId: string) => void
}) {
  const t = useTranslations('posts')
  const post = usePost(postId)
  const dispatch = usePostDispatch()
  const [isLikeLoading, setIsLikeLoading] = useState(false)
  const isMountedRef = useRef(true)

  const [isLiked, setIsLiked] = useState(false)
  const [likeCount, setLikeCount] = useState(0)
  const [commentCount, setCommentCount] = useState(0)

  useEffect(() => {
    if (post) {
      setIsLiked(post.isLikedByMe)
      setLikeCount(post.likeCount)
      setCommentCount(post.commentCount)
    }
  }, [post?.isLikedByMe, post?.likeCount, post?.commentCount])

  useEffect(() => {
    isMountedRef.current = true
    return () => { isMountedRef.current = false }
  }, [])

  const doLike = useCallback(async () => {
    if (!post || isLikeLoading) return

    const wasLiked = isLiked
    const prevCount = likeCount

    setIsLiked(!wasLiked)
    setLikeCount(wasLiked ? prevCount - 1 : prevCount + 1)

    dispatch({
      type: 'UPDATE_POST',
      postId,
      partial: {
        isLikedByMe: !wasLiked,
        likeCount: wasLiked ? prevCount - 1 : prevCount + 1,
      },
    })
    setIsLikeLoading(true)

    try {
      const stats = wasLiked
        ? await postsApi.unlikePost(postId)
        : await postsApi.likePost(postId)

      if (isMountedRef.current) {
        setIsLiked(stats.isLikedByMe)
        setLikeCount(stats.likeCount)
        setCommentCount(stats.commentCount)
        dispatch({
          type: 'UPDATE_POST',
          postId,
          partial: {
            likeCount: stats.likeCount,
            commentCount: stats.commentCount,
            repostCount: stats.repostCount,
            isLikedByMe: stats.isLikedByMe,
            isRepostedByMe: stats.isRepostedByMe,
          },
        })
      }
    } catch (error) {
      if (isMountedRef.current) {
        setIsLiked(wasLiked)
        setLikeCount(prevCount)
        dispatch({
          type: 'UPDATE_POST',
          postId,
          partial: { isLikedByMe: wasLiked, likeCount: prevCount },
        })
      }
      console.error('Failed to update like:', error)
    } finally {
      if (isMountedRef.current) setIsLikeLoading(false)
    }
  }, [post, postId, dispatch, isLikeLoading, isLiked, likeCount])

  if (!post) return null

  const media = post.isRepost && post.originalPost?.media?.[0]
    ? post.originalPost.media[0]
    : post.media[0]

  if (post.isRepost && !post.originalPost) {
    return (
      <div className="relative aspect-square bg-[#0A0A0A] overflow-hidden flex flex-col items-center justify-center text-center p-2">
        <Repeat2 className="w-6 h-6 text-gray-600 mb-1" />
        <p className="text-[10px] text-gray-600 leading-tight">{t('postDeleted')}</p>
      </div>
    )
  }

  if (!media) return null

  return (
    <div
      className="relative aspect-square bg-[#0A0A0A] overflow-hidden group cursor-pointer"
      onClick={(e) => {
        if ((e.target as HTMLElement).closest('button')) return
        onSelect(postId)
      }}
    >
      <div className="w-full h-full">
        {media.mediaType === MediaType.Image ? (
          <img
            src={getMediaUrl(media.url) || ''}
            alt={post.caption || 'Post'}
            className="w-full h-full object-cover transition-transform group-hover:scale-105"
            loading="lazy"
          />
        ) : (
          <>
            {media.thumbnailUrl ? (
              <img
                src={getMediaUrl(media.thumbnailUrl) || ''}
                alt={post.caption || 'Video thumbnail'}
                className="w-full h-full object-cover transition-transform group-hover:scale-105"
                loading="lazy"
              />
            ) : (
              <video
                src={getMediaUrl(media.url) || ''}
                className="w-full h-full object-cover transition-transform group-hover:scale-105"
                muted
                playsInline
              />
            )}
            <div className="absolute inset-0 flex items-center justify-center bg-black/20">
              <div className="w-10 h-10 rounded-full bg-white/30 backdrop-blur-sm flex items-center justify-center">
                <Play className="w-5 h-5 text-white ml-0.5" fill="white" />
              </div>
            </div>
          </>
        )}
      </div>

      {/* Hover overlay */}
      <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-4">
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation()
            doLike()
          }}
          disabled={isLikeLoading}
          className={`flex items-center gap-1 text-white transition-all hover:scale-110 ${
            isLikeLoading ? 'opacity-50 cursor-not-allowed' : 'hover:text-red-500'
          }`}
          title={isLiked ? t('removeLike') : t('addLike')}
        >
          <Heart
            className={`w-5 h-5 transition-colors ${isLiked ? 'text-red-500' : ''}`}
            fill={isLiked ? 'currentColor' : 'white'}
          />
          <span className="font-semibold">{likeCount}</span>
        </button>
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation()
            onSelect(postId)
          }}
          className="flex items-center gap-1 text-white transition-all hover:scale-110 hover:text-blue-400"
          title={t('openComments')}
        >
          <MessageCircle className="w-5 h-5" fill="white" />
          <span className="font-semibold">{commentCount}</span>
        </button>
      </div>
    </div>
  )
}

// ─── Post detail modal ───
function PostDetailModal({
  postId,
  onClose,
}: {
  postId: string
  onClose: () => void
}) {
  const [playingVideoId, setPlayingVideoId] = useState<string | null>(null)
  const [viewingPhoto, setViewingPhoto] = useState<{ url: string; caption?: string } | null>(null)

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }
    document.addEventListener('keydown', handleKeyDown)
    document.body.style.overflow = 'hidden'
    return () => {
      document.removeEventListener('keydown', handleKeyDown)
      document.body.style.overflow = 'auto'
    }
  }, [onClose])

  return (
    <div
      className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4"
      onClick={onClose}
    >
      <button
        onClick={onClose}
        className="absolute top-4 right-4 z-50 p-2 text-white/70 hover:text-white transition-colors"
      >
        <X className="w-8 h-8" />
      </button>
      <div
        className="w-fit max-w-full rounded-xl transition-all duration-300"
        onClick={(e) => e.stopPropagation()}
      >
        <PostCard
          postId={postId}
          variant="modal"
          playingVideoId={playingVideoId}
          onVideoToggle={setPlayingVideoId}
          onPhotoClick={(url: string, caption?: string) => setViewingPhoto({ url, caption })}
        />
      </div>
      {viewingPhoto && (
        <PhotoLightbox
          imageUrl={viewingPhoto.url}
          caption={viewingPhoto.caption}
          onClose={() => setViewingPhoto(null)}
        />
      )}
    </div>
  )
}

// ─── Main public profile component ───
interface PublicProfileContentProps {
  /** The ID of the user whose profile is being viewed */
  userId: string
  /** The ID of the currently logged-in user */
  currentUserId: string | undefined
  /** Base path for the current viewer's section (e.g. '/user', '/trainer', '/nutritionist') */
  basePath: string
  /** Redirect path when viewing own profile */
  ownProfilePath: string
}

export function PublicProfileContent({
  userId,
  currentUserId,
  basePath,
  ownProfilePath,
}: PublicProfileContentProps) {
  const router = useRouter()
  const searchParams = useSearchParams()
  const upsertPosts = useUpsertPosts()
  const tPosts = useTranslations('posts')
  const tc = useTranslations('common')
  const tp = useTranslations('profile')
  const tUp = useTranslations('userProfile')

  // Tab state from URL
  const tabParam = (searchParams.get('tab') || 'all') as ProfilePostTab
  const [activeTab, setActiveTab] = useState<ProfilePostTab>(
    ['all', 'videos', 'reposts'].includes(tabParam) ? tabParam : 'all'
  )

  const [postIds, setPostIds] = useState<string[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [page, setPage] = useState(1)
  const [hasMore, setHasMore] = useState(true)
  const [totalPosts, setTotalPosts] = useState(0)
  const [selectedPostId, setSelectedPostId] = useState<string | null>(null)
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid')
  const [playingVideoId, setPlayingVideoId] = useState<string | null>(null)
  const [viewingPhoto, setViewingPhoto] = useState<{ url: string; caption?: string } | null>(null)
  const observerRef = useRef<HTMLDivElement>(null)
  const abortRef = useRef<AbortController | null>(null)

  // ─── Fetch user profile from API ───
  const [profileData, setProfileData] = useState<{
    fullName: string
    firstName: string
    avatarUrl: string | null
    role: string | null
    country: string | null
    city: string | null
    createdAt: string | null
    followingCount: number
    followersCount: number
    achievementsCount: number
    postsCount: number
  } | null>(null)
  const [profileLoading, setProfileLoading] = useState(true)

  useEffect(() => {
    if (!userId) return
    let cancelled = false
    ;(async () => {
      try {
        setProfileLoading(true)
        const response = await fetch(`/api/users/${userId}/profile`)
        if (response.ok && !cancelled) {
          const data = await response.json()
          setProfileData({
            fullName: data.fullName || `${data.firstName || ''} ${data.lastName || ''}`.trim() || tc('user'),
            firstName: data.firstName || '',
            avatarUrl: data.avatarUrl || null,
            role: data.role || null,
            country: data.country || null,
            city: data.city || null,
            createdAt: data.createdAt || null,
            followingCount: data.followingCount ?? 0,
            followersCount: data.followersCount ?? 0,
            achievementsCount: data.achievementsCount ?? 0,
            postsCount: data.postsCount ?? 0,
          })
        }
      } catch (err) {
        console.error('Failed to load user profile:', err)
      } finally {
        if (!cancelled) setProfileLoading(false)
      }
    })()
    return () => { cancelled = true }
  }, [userId, tc])

  const authorName = profileData?.fullName || tc('user')
  const authorInitials = (profileData?.firstName?.charAt(0) || authorName?.charAt(0) || 'U').toUpperCase()
  const authorAvatar = profileData?.avatarUrl ? getMediaUrl(profileData.avatarUrl) : null
  const profileAccent = getAccentColorsByRole(profileData?.role)

  // Redirect to own profile if viewing self
  useEffect(() => {
    if (currentUserId && userId.toLowerCase() === currentUserId.toLowerCase()) {
      router.replace(ownProfilePath)
    }
  }, [currentUserId, userId, router, ownProfilePath])

  // ─── Relationship status ───
  const [relationship, setRelationship] = useState<RelationshipStatus | null>(null)
  const [relationshipLoading, setRelationshipLoading] = useState(true)
  const [actionLoading, setActionLoading] = useState(false)
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' | 'info' } | null>(null)

  useEffect(() => {
    if (!userId || !currentUserId || userId.toLowerCase() === currentUserId.toLowerCase()) return
    let cancelled = false
    ;(async () => {
      try {
        setRelationshipLoading(true)
        const status = await friendsApi.getRelationshipStatus(userId)
        if (!cancelled) setRelationship(status)
      } catch (err) {
        console.error('Failed to load relationship status:', err)
      } finally {
        if (!cancelled) setRelationshipLoading(false)
      }
    })()
    return () => { cancelled = true }
  }, [userId, currentUserId])

  // ─── Real-time relationship updates via SignalR ───
  useEffect(() => {
    if (!userId || !currentUserId) return

    const handleFriendRequestAccepted = (data: { requestId: number; acceptorId: string; acceptorName: string; acceptorAvatar: string | null }) => {
      if (data.acceptorId === userId) {
        setRelationship(prev => prev ? {
          ...prev,
          isFriend: true,
          friendsSince: new Date().toISOString(),
          hasPendingRequest: false,
          pendingRequestId: undefined,
          isRequestSender: false,
        } : prev)
        setToast({ message: `${data.acceptorName} ${tUp('requestAccepted')}`, type: 'success' })
      }
    }

    const handleFriendRemoved = (data: { removedByUserId: string; removedByName: string }) => {
      if (data.removedByUserId === userId) {
        setRelationship(prev => prev ? {
          ...prev,
          isFriend: false,
          friendsSince: undefined,
        } : prev)
      }
    }

    const handleFriendRequestReceived = (data: { requestId: number; senderId: string; senderName: string; senderAvatar: string | null }) => {
      if (data.senderId === userId) {
        setRelationship(prev => prev ? {
          ...prev,
          hasPendingRequest: true,
          pendingRequestId: data.requestId,
          isRequestSender: false,
        } : prev)
      }
    }

    chatConnection.onFriendRequestAccepted(handleFriendRequestAccepted)
    chatConnection.onFriendRemoved(handleFriendRemoved)
    chatConnection.onFriendRequestReceived(handleFriendRequestReceived)

    return () => {
      chatConnection.off('FriendRequestAccepted', handleFriendRequestAccepted)
      chatConnection.off('FriendRemoved', handleFriendRemoved)
      chatConnection.off('FriendRequestReceived', handleFriendRequestReceived)
    }
  }, [userId, currentUserId, tUp])

  // ─── Social actions ───
  const handleSendFriendRequest = useCallback(async () => {
    if (actionLoading) return
    setActionLoading(true)
    try {
      const request = await friendsApi.sendFriendRequest(userId)
      setRelationship(prev => prev ? {
        ...prev,
        hasPendingRequest: true,
        pendingRequestId: request.id,
        isRequestSender: true,
      } : prev)
      setToast({ message: tUp('friendRequestSent'), type: 'success' })
    } catch (err) {
      setToast({ message: tUp('friendRequestError'), type: 'error' })
    } finally {
      setActionLoading(false)
    }
  }, [userId, actionLoading, tUp])

  const handleCancelFriendRequest = useCallback(async () => {
    if (actionLoading || !relationship?.pendingRequestId) return
    setActionLoading(true)
    try {
      await friendsApi.cancelFriendRequest(relationship.pendingRequestId)
      setRelationship(prev => prev ? {
        ...prev,
        hasPendingRequest: false,
        pendingRequestId: undefined,
        isRequestSender: false,
      } : prev)
      setToast({ message: tUp('requestCancelled'), type: 'info' })
    } catch (err) {
      setToast({ message: tUp('errorCancellingRequest'), type: 'error' })
    } finally {
      setActionLoading(false)
    }
  }, [actionLoading, relationship?.pendingRequestId, tUp])

  const handleAcceptFriendRequest = useCallback(async () => {
    if (actionLoading || !relationship?.pendingRequestId) return
    setActionLoading(true)
    try {
      await friendsApi.acceptFriendRequest(relationship.pendingRequestId)
      setRelationship(prev => prev ? {
        ...prev,
        isFriend: true,
        friendsSince: new Date().toISOString(),
        hasPendingRequest: false,
        pendingRequestId: undefined,
        isRequestSender: false,
      } : prev)
      setToast({ message: tUp('requestAccepted'), type: 'success' })
    } catch (err) {
      setToast({ message: tUp('errorAccepting'), type: 'error' })
    } finally {
      setActionLoading(false)
    }
  }, [actionLoading, relationship?.pendingRequestId, tUp])

  const handleDeclineFriendRequest = useCallback(async () => {
    if (actionLoading || !relationship?.pendingRequestId) return
    setActionLoading(true)
    try {
      await friendsApi.declineFriendRequest(relationship.pendingRequestId)
      setRelationship(prev => prev ? {
        ...prev,
        hasPendingRequest: false,
        pendingRequestId: undefined,
        isRequestSender: false,
      } : prev)
      setToast({ message: tUp('requestDeclined'), type: 'info' })
    } catch (err) {
      setToast({ message: tUp('errorDeclining'), type: 'error' })
    } finally {
      setActionLoading(false)
    }
  }, [actionLoading, relationship?.pendingRequestId, tUp])

  const handleRemoveFriend = useCallback(async () => {
    if (actionLoading) return
    setActionLoading(true)
    try {
      await friendsApi.removeFriend(userId)
      setRelationship(prev => prev ? {
        ...prev,
        isFriend: false,
        friendsSince: undefined,
      } : prev)
      setToast({ message: tUp('friendRemoved'), type: 'info' })
    } catch (err) {
      setToast({ message: tUp('errorRemovingFriend'), type: 'error' })
    } finally {
      setActionLoading(false)
    }
  }, [userId, actionLoading, tUp])

  const handleFollow = useCallback(async () => {
    if (actionLoading) return
    setActionLoading(true)
    try {
      await followsApi.followTrainer(userId)
      setRelationship(prev => prev ? { ...prev, isFollowing: true } : prev)
      setToast({ message: tUp('nowFollowing'), type: 'success' })
    } catch (err) {
      setToast({ message: tUp('errorFollowing'), type: 'error' })
    } finally {
      setActionLoading(false)
    }
  }, [userId, actionLoading, tUp])

  const handleUnfollow = useCallback(async () => {
    if (actionLoading) return
    setActionLoading(true)
    try {
      await followsApi.unfollowTrainer(userId)
      setRelationship(prev => prev ? { ...prev, isFollowing: false } : prev)
      setToast({ message: tUp('unfollowed'), type: 'info' })
    } catch (err) {
      setToast({ message: tUp('errorUnfollowing'), type: 'error' })
    } finally {
      setActionLoading(false)
    }
  }, [userId, actionLoading, tUp])

  const handleBlock = useCallback(async () => {
    if (actionLoading) return
    setActionLoading(true)
    try {
      await blocksApi.blockUser(userId)
      setRelationship(prev => prev ? { ...prev, isBlocked: true } : prev)
      setToast({ message: tUp('userBlocked'), type: 'info' })
    } catch (err) {
      setToast({ message: tUp('errorBlocking'), type: 'error' })
    } finally {
      setActionLoading(false)
    }
  }, [userId, actionLoading, tUp])

  const handleUnblock = useCallback(async () => {
    if (actionLoading) return
    setActionLoading(true)
    try {
      await blocksApi.unblockUser(userId)
      setRelationship(prev => prev ? { ...prev, isBlocked: false } : prev)
      setToast({ message: tUp('userUnblocked'), type: 'success' })
    } catch (err) {
      setToast({ message: tUp('errorUnblocking'), type: 'error' })
    } finally {
      setActionLoading(false)
    }
  }, [userId, actionLoading, tUp])

  // ─── Posts loading ───
  const loadPosts = useCallback(
    async (pageNum: number, append: boolean = false) => {
      if (abortRef.current) abortRef.current.abort()
      const controller = new AbortController()
      abortRef.current = controller

      try {
        setIsLoading(true)
        const response = await postsApi.getUserPosts(userId, pageNum, 12, activeTab, controller.signal)
        if (controller.signal.aborted) return
        const ids = upsertPosts(response.posts)
        if (append) {
          setPostIds((prev) => [...prev, ...ids])
        } else {
          setPostIds(ids)
        }
        setTotalPosts(response.totalCount)
        setHasMore(response.hasMore)
      } catch (error) {
        if (error instanceof DOMException && error.name === 'AbortError') return
        console.error('Failed to load user posts:', error)
      } finally {
        if (!controller.signal.aborted) setIsLoading(false)
      }
    },
    [userId, upsertPosts, activeTab]
  )

  const handleTabChange = useCallback((tab: ProfilePostTab) => {
    setActiveTab(tab)
    setPostIds([])
    setPage(1)
    setHasMore(true)
    setIsLoading(true)
    const url = new URL(window.location.href)
    if (tab === 'all') {
      url.searchParams.delete('tab')
    } else {
      url.searchParams.set('tab', tab)
    }
    window.history.replaceState({}, '', url.toString())
  }, [])

  useEffect(() => {
    if (userId) loadPosts(1)
  }, [userId, loadPosts])

  const handleLoadMore = useCallback(() => {
    if (!isLoading && hasMore && postIds.length > 0) {
      const nextPage = page + 1
      setPage(nextPage)
      loadPosts(nextPage, true)
    }
  }, [isLoading, hasMore, page, postIds.length, loadPosts])

  // Infinite scroll
  useEffect(() => {
    if (!hasMore || isLoading) return
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting) handleLoadMore()
      },
      { threshold: 0.1 }
    )
    if (observerRef.current) observer.observe(observerRef.current)
    return () => observer.disconnect()
  }, [hasMore, isLoading, handleLoadMore])

  // Use the viewed user's accent color for the section icons
  const accentColor = profileAccent.primary

  return (
    <>
      <div className="space-y-4 pb-6">
        {/* Profile Header */}
        <div className="bg-[#1A1A1A] rounded-xl border border-white/10 overflow-hidden">
          <div className={`h-32 bg-gradient-to-r ${profileAccent.gradient}`} />
          <div className="px-6 pb-6">
            <div className="flex items-end gap-4 -mt-12">
              <div className="relative">
                {authorAvatar ? (
                  <img
                    src={authorAvatar}
                    alt={authorName}
                    className={`w-24 h-24 rounded-xl object-cover border-4 border-[#1A1A1A] ${getRoleRingClass(profileData?.role)}`}
                  />
                ) : (
                  <div className={`w-24 h-24 rounded-xl bg-gradient-to-br ${profileAccent.gradient} flex items-center justify-center border-4 border-[#1A1A1A]`}>
                    <span className="text-white text-3xl font-bold">{authorInitials}</span>
                  </div>
                )}
              </div>
              <div className="flex-1 pb-2">
                <h1 className="text-xl font-bold text-white">{authorName}</h1>
                {(profileData?.postsCount ?? totalPosts) > 0 && (
                  <p className="text-sm text-gray-400">{profileData?.postsCount ?? totalPosts} {tPosts('publications')}</p>
                )}
                {profileData?.createdAt && (
                  <p className="text-xs text-gray-500 mt-1">
                    {tp('joined')} {new Date(profileData.createdAt).toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
                  </p>
                )}
              </div>
            </div>

            {/* Social Action Buttons */}
            {!relationshipLoading && relationship && !relationship.isBlockedByThem && (
              <div className="flex flex-wrap items-center gap-2 mt-4">
                {/* Friend button */}
                {relationship.isFriend ? (
                  <button
                    onClick={handleRemoveFriend}
                    disabled={actionLoading}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium bg-white/10 text-green-400 hover:bg-red-500/20 hover:text-red-400 transition-all group disabled:opacity-50"
                  >
                    <UserCheck className="w-4 h-4 group-hover:hidden" />
                    <UserMinus className="w-4 h-4 hidden group-hover:block" />
                    <span className="group-hover:hidden">{tUp('friends')}</span>
                    <span className="hidden group-hover:inline">{tUp('removeFriend')}</span>
                  </button>
                ) : relationship.hasPendingRequest ? (
                  relationship.isRequestSender ? (
                    <button
                      onClick={handleCancelFriendRequest}
                      disabled={actionLoading}
                      className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium bg-white/10 text-yellow-400 hover:bg-red-500/20 hover:text-red-400 transition-all disabled:opacity-50"
                    >
                      <Clock className="w-4 h-4" />
                      <span>{tUp('requestPending')}</span>
                    </button>
                  ) : (
                    <div className="flex items-center gap-1.5">
                      <button
                        onClick={handleAcceptFriendRequest}
                        disabled={actionLoading}
                        className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium bg-green-500/20 text-green-400 hover:bg-green-500/30 transition-all disabled:opacity-50"
                      >
                        <Check className="w-4 h-4" />
                        <span>{tUp('accept')}</span>
                      </button>
                      <button
                        onClick={handleDeclineFriendRequest}
                        disabled={actionLoading}
                        className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium bg-white/10 text-red-400 hover:bg-red-500/20 transition-all disabled:opacity-50"
                      >
                        <X className="w-4 h-4" />
                        <span>{tUp('decline')}</span>
                      </button>
                    </div>
                  )
                ) : (
                  <button
                    onClick={handleSendFriendRequest}
                    disabled={actionLoading}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium bg-blue-500/20 text-blue-400 hover:bg-blue-500/30 transition-all disabled:opacity-50"
                  >
                    <UserPlus className="w-4 h-4" />
                    <span>{tUp('addFriend')}</span>
                  </button>
                )}

                {/* Follow button (for trainers/nutritionists) */}
                {profileData?.role && ['Trainer', 'Nutritionist'].includes(profileData.role) && (
                  relationship.isFollowing ? (
                    <button
                      onClick={handleUnfollow}
                      disabled={actionLoading}
                      className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium bg-white/10 text-purple-400 hover:bg-red-500/20 hover:text-red-400 transition-all disabled:opacity-50"
                    >
                      <span>{tUp('following')}</span>
                    </button>
                  ) : (
                    <button
                      onClick={handleFollow}
                      disabled={actionLoading}
                      className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium bg-purple-500/20 text-purple-400 hover:bg-purple-500/30 transition-all disabled:opacity-50"
                    >
                      <span>{tUp('follow')}</span>
                    </button>
                  )
                )}

                {/* Message button */}
                <button
                  onClick={() => router.push(`${basePath}/messages?userId=${userId}`)}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium bg-white/10 text-gray-300 hover:bg-white/20 transition-all"
                >
                  <Mail className="w-4 h-4" />
                  <span>{tUp('message')}</span>
                </button>

                {/* Block button */}
                {relationship.isBlocked ? (
                  <button
                    onClick={handleUnblock}
                    disabled={actionLoading}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium bg-red-500/20 text-red-400 hover:bg-red-500/30 transition-all disabled:opacity-50"
                  >
                    <Ban className="w-4 h-4" />
                    <span>{tUp('unblock')}</span>
                  </button>
                ) : (
                  <button
                    onClick={handleBlock}
                    disabled={actionLoading}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium bg-white/5 text-gray-500 hover:bg-red-500/20 hover:text-red-400 transition-all disabled:opacity-50"
                  >
                    <Ban className="w-4 h-4" />
                    <span>{tUp('block')}</span>
                  </button>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Posts Section */}
        <div className="bg-[#1A1A1A] rounded-xl border border-white/10 overflow-hidden">
          <div className="px-4 py-3 border-b border-white/10 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Grid className="w-5 h-5" style={{ color: accentColor }} />
              <h3 className="font-semibold text-white">{tPosts('postsTab')}</h3>
              {totalPosts > 0 && (
                <span className="text-xs text-gray-500">({totalPosts})</span>
              )}
            </div>
            <div className="flex items-center gap-1 bg-[#0A0A0A] rounded-lg p-0.5">
              <button
                onClick={() => setViewMode('grid')}
                className={`p-1.5 rounded-md transition-colors ${
                  viewMode === 'grid'
                    ? 'bg-white/10'
                    : 'text-gray-500 hover:text-gray-300'
                }`}
                style={viewMode === 'grid' ? { color: accentColor } : undefined}
              >
                <Grid className="w-4 h-4" />
              </button>
              <button
                onClick={() => setViewMode('list')}
                className={`p-1.5 rounded-md transition-colors ${
                  viewMode === 'list'
                    ? 'bg-white/10'
                    : 'text-gray-500 hover:text-gray-300'
                }`}
                style={viewMode === 'list' ? { color: accentColor } : undefined}
              >
                <List className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Post type tabs */}
          <ProfilePostTabs activeTab={activeTab} onTabChange={handleTabChange} disabled={isLoading} />

          {postIds.length === 0 && !isLoading ? (
            <div className="py-12 text-center">
              <div className="w-20 h-20 rounded-full bg-white/5 flex items-center justify-center mx-auto mb-4">
                <Camera className="w-10 h-10 text-gray-400" />
              </div>
              <h3 className="text-lg font-semibold text-white mb-2">{tPosts('noPublications')}</h3>
            </div>
          ) : viewMode === 'grid' ? (
            <div>
              <div className="grid grid-cols-3 gap-1">
                {postIds.map((id) => (
                  <GridCell key={id} postId={id} onSelect={setSelectedPostId} />
                ))}
              </div>
              {(isLoading || hasMore) && (
                <div ref={observerRef} className="py-8 flex justify-center">
                  {isLoading && <Loader2 className="w-6 h-6 animate-spin" style={{ color: accentColor }} />}
                </div>
              )}
            </div>
          ) : (
            <div className="p-3 space-y-3">
              {postIds.map((id) => (
                <PostCard
                  key={id}
                  postId={id}
                  playingVideoId={playingVideoId}
                  onVideoToggle={setPlayingVideoId}
                  onPhotoClick={(url: string, caption?: string) => setViewingPhoto({ url, caption })}
                />
              ))}
              {(isLoading || hasMore) && (
                <div ref={observerRef} className="py-8 flex justify-center">
                  {isLoading && <Loader2 className="w-6 h-6 animate-spin" style={{ color: accentColor }} />}
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {selectedPostId && (
        <PostDetailModal
          postId={selectedPostId}
          onClose={() => setSelectedPostId(null)}
        />
      )}
      {viewingPhoto && (
        <PhotoLightbox
          imageUrl={viewingPhoto.url}
          caption={viewingPhoto.caption}
          onClose={() => setViewingPhoto(null)}
        />
      )}
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
