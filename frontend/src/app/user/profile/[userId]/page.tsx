'use client'

import { useUser } from '@/components/user/UserProvider'
import {
  Camera,
  Grid,
  List,
  Loader2,
  Heart,
  MessageCircle,
  Play,
  Repeat2,
  Trash2,
  Video,
  Image as ImageIcon,
  X,
} from 'lucide-react'
import { useRouter, useParams, useSearchParams } from 'next/navigation'
import { useState, useEffect, useCallback, useRef, Suspense } from 'react'
import { postsApi } from '@/lib/api/postsApi'
import { MediaType } from '@/types/post'
import type { ProfilePostTab } from '@/types/post'
import { getMediaUrl } from '@/lib/config'
import { PostCard } from '@/components/posts/PostCard'
import { ProfilePostTabs } from '@/components/posts/ProfilePostTabs'
import { getRoleRingClass, getAccentColorsByRole } from '@/lib/theme/useAccentColors'
import { PhotoLightbox } from '@/components/ui/PhotoLightbox'
import { useUpsertPosts, usePost, usePostDispatch } from '@/contexts/PostStoreContext'
import { useTranslations } from 'next-intl'

// Grid cell — uses local state for guaranteed instant UI updates
function GridCell({
  postId,
  onSelect,
}: {
  postId: string
  onSelect: (postId: string) => void
}) {
  const tPosts = useTranslations('posts')
  const post = usePost(postId)
  const dispatch = usePostDispatch()
  const [isLikeLoading, setIsLikeLoading] = useState(false)
  const isMountedRef = useRef(true)

  // Local display state — setState guarantees re-render
  const [isLiked, setIsLiked] = useState(false)
  const [likeCount, setLikeCount] = useState(0)
  const [commentCount, setCommentCount] = useState(0)

  // Sync from store (initial load + external changes)
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

    // Immediate local update
    setIsLiked(!wasLiked)
    setLikeCount(wasLiked ? prevCount - 1 : prevCount + 1)

    // Store dispatch for cross-component sync
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
        <p className="text-[10px] text-gray-600 leading-tight">{tPosts('deleted')}</p>
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
          title={isLiked ? tPosts('removeLike') : tPosts('addLike')}
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
          title={tPosts('openComments')}
        >
          <MessageCircle className="w-5 h-5" fill="white" />
          <span className="font-semibold">{commentCount}</span>
        </button>
      </div>
    </div>
  )
}

// Post detail modal — shows full PostCard when clicking on a grid cell
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

function OtherUserProfilePageInner() {
  const router = useRouter()
  const params = useParams()
  const searchParams = useSearchParams()
  const userId = params.userId as string
  const { user: currentUser } = useUser()
  const upsertPosts = useUpsertPosts()
  const tPosts = useTranslations('posts')
  const tc = useTranslations('common')

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

  // Derive profile info from posts author data
  const firstPost = usePost(postIds[0] || '')
  const profileAuthor = firstPost?.author
  const authorName = profileAuthor?.fullName || `${profileAuthor?.firstName ?? ''} ${profileAuthor?.lastName ?? ''}`.trim() || tc('user')
  const authorInitials = (profileAuthor?.firstName?.charAt(0) || 'U').toUpperCase()
  const authorAvatar = profileAuthor?.avatarUrl
  const profileAccent = getAccentColorsByRole(profileAuthor?.role)

  // Redirect to own profile if viewing self
  useEffect(() => {
    if (currentUser?.id && userId === currentUser.id) {
      router.replace('/user/profile')
    }
  }, [currentUser?.id, userId, router])

  const loadPosts = useCallback(
    async (pageNum: number, append: boolean = false) => {
      // Abort previous request
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

  // Reset pagination on tab change
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
                    className={`w-24 h-24 rounded-xl object-cover border-4 border-[#1A1A1A] ${getRoleRingClass(profileAuthor?.role)}`}
                  />
                ) : (
                  <div className={`w-24 h-24 rounded-xl bg-gradient-to-br ${profileAccent.gradient} flex items-center justify-center border-4 border-[#1A1A1A]`}>
                    <span className="text-white text-3xl font-bold">{authorInitials}</span>
                  </div>
                )}
              </div>
              <div className="flex-1 pb-2">
                <h1 className="text-xl font-bold text-white">{authorName}</h1>
                {totalPosts > 0 && (
                  <p className="text-sm text-gray-400">{totalPosts} {tPosts('publications')}</p>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Posts Section */}
        <div className="bg-[#1A1A1A] rounded-xl border border-white/10 overflow-hidden">
          <div className="px-4 py-3 border-b border-white/10 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Grid className="w-5 h-5 text-[#FF6B35]" />
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
                    ? 'bg-white/10 text-[#FF6B35]'
                    : 'text-gray-500 hover:text-gray-300'
                }`}
              >
                <Grid className="w-4 h-4" />
              </button>
              <button
                onClick={() => setViewMode('list')}
                className={`p-1.5 rounded-md transition-colors ${
                  viewMode === 'list'
                    ? 'bg-white/10 text-[#FF6B35]'
                    : 'text-gray-500 hover:text-gray-300'
                }`}
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
                  {isLoading && <Loader2 className="w-6 h-6 text-[#FF6B35] animate-spin" />}
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
                  {isLoading && <Loader2 className="w-6 h-6 text-[#FF6B35] animate-spin" />}
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
    </>
  )
}

export default function OtherUserProfilePage() {
  return (
    <Suspense fallback={
      <>
        <div className="flex items-center justify-center min-h-[50vh]">
          <Loader2 className="w-8 h-8 text-[#FF6B35] animate-spin" />
        </div>
      </>
    }>
      <OtherUserProfilePageInner />
    </Suspense>
  )
}
