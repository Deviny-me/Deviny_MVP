'use client'

import { useUser } from '@/components/user/UserProvider'
import { useLevel } from '@/components/level/LevelProvider'
import { 
  Camera,
  MapPin,
  Grid,
  List,
  Loader2,
  X,
  Play,
  Heart,
  MessageCircle,
  Repeat2,
  Trash2,
} from 'lucide-react'

import { useState, useEffect, useCallback, useRef } from 'react'
import Link from 'next/link'
import { postsApi } from '@/lib/api/postsApi'
import { MediaType } from '@/types/post'
import type { ProfilePostTab } from '@/types/post'
import { getMediaUrl } from '@/lib/config'
import { uploadAvatar, deleteAvatar } from '@/lib/api/userApi'
import { PostCard } from '@/components/posts/PostCard'
import { ProfilePostTabs } from '@/components/posts/ProfilePostTabs'
import { PhotoLightbox } from '@/components/ui/PhotoLightbox'
import { Toast } from '@/components/ui/Toast'
import { useUpsertPosts, usePost, usePostDispatch } from '@/contexts/PostStoreContext'
import { useTranslations } from 'next-intl'

// ─── Grid cell with optimistic likes ───
function GridCell({
  postId,
  onSelect,
  onDelete,
  deletingPostId,
}: {
  postId: string
  onSelect: (postId: string) => void
  onDelete?: (postId: string) => void
  deletingPostId?: string | null
}) {
  const tPosts = useTranslations('posts')
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
      partial: { isLikedByMe: !wasLiked, likeCount: wasLiked ? prevCount - 1 : prevCount + 1 },
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
    } catch {
      if (isMountedRef.current) {
        setIsLiked(wasLiked)
        setLikeCount(prevCount)
        dispatch({ type: 'UPDATE_POST', postId, partial: { isLikedByMe: wasLiked, likeCount: prevCount } })
      }
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
          onClick={(e) => { e.stopPropagation(); doLike() }}
          disabled={isLikeLoading}
          className={`flex items-center gap-1 text-white transition-all hover:scale-110 ${
            isLikeLoading ? 'opacity-50 cursor-not-allowed' : 'hover:text-red-500'
          }`}
        >
          <Heart className={`w-5 h-5 transition-colors ${isLiked ? 'text-red-500' : ''}`} fill={isLiked ? 'currentColor' : 'white'} />
          <span className="font-semibold">{likeCount}</span>
        </button>
        <button
          type="button"
          onClick={(e) => { e.stopPropagation(); onSelect(postId) }}
          className="flex items-center gap-1 text-white transition-all hover:scale-110 hover:text-blue-400"
        >
          <MessageCircle className="w-5 h-5" fill="white" />
          <span className="font-semibold">{commentCount}</span>
        </button>
        {onDelete && (
          <button
            type="button"
            onClick={(e) => { e.stopPropagation(); onDelete(postId) }}
            disabled={deletingPostId === postId}
            className="flex items-center gap-1 text-white transition-all hover:scale-110 hover:text-red-500"
          >
            {deletingPostId === postId ? (
              <Loader2 className="w-5 h-5 animate-spin" />
            ) : (
              <Trash2 className="w-5 h-5" />
            )}
          </button>
        )}
      </div>
    </div>
  )
}

// ─── Post detail modal ───
function PostDetailModal({ postId, onClose, onDelete, deletingPostId }: { postId: string; onClose: () => void; onDelete?: (postId: string) => void; deletingPostId?: string | null }) {
  const [playingVideoId, setPlayingVideoId] = useState<string | null>(null)
  const [viewingPhoto, setViewingPhoto] = useState<{ url: string; caption?: string } | null>(null)

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose() }
    document.addEventListener('keydown', handleKeyDown)
    document.body.style.overflow = 'hidden'
    return () => {
      document.removeEventListener('keydown', handleKeyDown)
      document.body.style.overflow = 'auto'
    }
  }, [onClose])

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4" onClick={onClose}>
      <button onClick={onClose} className="absolute top-4 right-4 z-50 p-2 text-white/70 hover:text-white transition-colors">
        <X className="w-8 h-8" />
      </button>
      <div className="w-fit max-w-full rounded-xl transition-all duration-300" onClick={(e) => e.stopPropagation()}>
        <PostCard
          postId={postId}
          variant="modal"
          isOwnProfile
          showDeleteInHeader
          onDelete={onDelete}
          deletingPostId={deletingPostId}
          playingVideoId={playingVideoId}
          onVideoToggle={setPlayingVideoId}
          onPhotoClick={(url: string, caption?: string) => setViewingPhoto({ url, caption })}
        />
      </div>
      {viewingPhoto && (
        <PhotoLightbox imageUrl={viewingPhoto.url} caption={viewingPhoto.caption} onClose={() => setViewingPhoto(null)} />
      )}
    </div>
  )
}

// ─── Main page ───
export default function UserProfilePage() {
  const { user, updateUser } = useUser()
  const { level } = useLevel()
  const upsertPosts = useUpsertPosts()
  const dispatch = usePostDispatch()
  const tp = useTranslations('profile')
  const tPosts = useTranslations('posts')

  const [postIds, setPostIds] = useState<string[]>([])
  const [isLoadingPosts, setIsLoadingPosts] = useState(true)
  const [page, setPage] = useState(1)
  const [hasMore, setHasMore] = useState(true)
  const [totalPosts, setTotalPosts] = useState(0)
  const [activeTab, setActiveTab] = useState<ProfilePostTab>('all')
  const [selectedPostId, setSelectedPostId] = useState<string | null>(null)
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid')
  const [playingVideoId, setPlayingVideoId] = useState<string | null>(null)
  const [viewingPhoto, setViewingPhoto] = useState<{ url: string; caption?: string } | null>(null)
  const [deletingPostId, setDeletingPostId] = useState<string | null>(null)
  const [toastData, setToastData] = useState<{ message: string; type: 'success' | 'error' } | null>(null)
  const observerRef = useRef<HTMLDivElement>(null)
  const abortRef = useRef<AbortController | null>(null)

  // Calculate level progress from LevelProvider
  const currentLevel = level?.currentLevel ?? user?.level ?? 1

  const loadPosts = useCallback(async (pageNum: number, append: boolean = false) => {
    // Abort previous request
    if (abortRef.current) abortRef.current.abort()
    const controller = new AbortController()
    abortRef.current = controller

    try {
      setIsLoadingPosts(true)
      const response = await postsApi.getMyPosts(pageNum, 12, activeTab, controller.signal)
      if (controller.signal.aborted) return
      const ids = upsertPosts(response.posts)
      if (append) {
        setPostIds(prev => [...prev, ...ids])
      } else {
        setPostIds(ids)
      }
      setTotalPosts(response.totalCount)
      setHasMore(response.hasMore)
    } catch (error) {
      if (error instanceof DOMException && error.name === 'AbortError') return
      console.error('Failed to load posts:', error)
    } finally {
      if (!controller.signal.aborted) setIsLoadingPosts(false)
    }
  }, [activeTab, upsertPosts])

  const handleTabChange = useCallback((tab: ProfilePostTab) => {
    setActiveTab(tab)
    setPostIds([])
    setPage(1)
    setHasMore(true)
    setIsLoadingPosts(true)
  }, [])

  useEffect(() => {
    loadPosts(1)
  }, [loadPosts])

  const handleLoadMore = useCallback(() => {
    if (!isLoadingPosts && hasMore && postIds.length > 0) {
      const nextPage = page + 1
      setPage(nextPage)
      loadPosts(nextPage, true)
    }
  }, [isLoadingPosts, hasMore, page, postIds.length, loadPosts])

  const [uploadingAvatar, setUploadingAvatar] = useState(false)
  const [deletingAvatar, setDeletingAvatar] = useState(false)

  const handleAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    if (!file.type.startsWith('image/')) {
      alert(tp('toasts.avatarSelectImage'))
      return
    }
    if (file.size > 5 * 1024 * 1024) {
      alert(tp('toasts.avatarSizeLimit'))
      return
    }

    try {
      setUploadingAvatar(true)
      const response = await uploadAvatar(file)
      if (response.avatarUrl) {
        updateUser({ avatarUrl: response.avatarUrl })
      }
    } catch (error) {
      console.error('Failed to upload avatar:', error)
      alert(tp('toasts.avatarUploadError'))
    } finally {
      setUploadingAvatar(false)
    }
  }

  const handleAvatarDelete = async () => {
    if (!confirm(tp('toasts.avatarDeleteConfirm'))) return
    try {
      setDeletingAvatar(true)
      await deleteAvatar()
      updateUser({ avatarUrl: null })
    } catch (error) {
      console.error('Failed to delete avatar:', error)
      alert(tp('toasts.avatarDeleteError'))
    } finally {
      setDeletingAvatar(false)
    }
  }

  const handleDeletePost = async (postId: string) => {
    if (!confirm(tPosts('deleteConfirm'))) return
    try {
      setDeletingPostId(postId)
      await postsApi.deletePost(postId)
      dispatch({ type: 'REMOVE_POST', postId })
      setPostIds(prev => prev.filter(id => id !== postId))
      setSelectedPostId(null)
      setToastData({ message: tPosts('deleted'), type: 'success' })
    } catch (error) {
      console.error('[Delete] Failed to delete post:', postId, error)
      const message = error instanceof Error ? error.message : tPosts('deleteError')
      setToastData({ message, type: 'error' })
    } finally {
      setDeletingPostId(null)
    }
  }

  // Infinite scroll
  useEffect(() => {
    if (!hasMore || isLoadingPosts) return
    const observer = new IntersectionObserver(
      (entries) => { if (entries[0].isIntersecting) handleLoadMore() },
      { threshold: 0.1 }
    )
    if (observerRef.current) observer.observe(observerRef.current)
    return () => observer.disconnect()
  }, [hasMore, isLoadingPosts, handleLoadMore])

  return (
    <>
      <div className="space-y-4 pb-6">
        {/* Profile Header */}
        <div className="bg-[#1A1A1A] rounded-xl border border-white/10 overflow-hidden">
          <div className="h-32 bg-gradient-to-r from-[#3B82F6] to-[#2563EB]" />

          <div className="px-6 pb-6">
            <div className="flex items-end gap-4 -mt-16 relative z-10">
              <div className="relative">
                {/* Level badge above avatar */}
                <div className="absolute -top-3 left-1/2 -translate-x-1/2 z-20 px-2 py-0.5 bg-gradient-to-r from-[#3B82F6] to-[#2563EB] rounded-full border border-white/20 shadow-lg">
                  <span className="text-[11px] font-bold text-white whitespace-nowrap">Lv. {currentLevel}</span>
                </div>
                {user?.avatarUrl ? (
                  <img
                    src={getMediaUrl(user.avatarUrl) || ''}
                    alt={user?.fullName || 'User'}
                    className="w-32 h-32 rounded-full object-cover border-4 border-[#1A1A1A]"
                  />
                ) : (
                  <div className="w-32 h-32 rounded-full bg-gradient-to-br from-[#3B82F6] to-[#2563EB] flex items-center justify-center border-4 border-[#1A1A1A]">
                    <span className="text-white text-4xl font-bold">
                      {user?.fullName?.charAt(0) || 'U'}
                    </span>
                  </div>
                )}
                <input
                  type="file"
                  id="user-avatar-upload"
                  accept="image/*"
                  onChange={handleAvatarUpload}
                  className="hidden"
                />
                <label
                  htmlFor="user-avatar-upload"
                  className="absolute bottom-1 right-1 p-1.5 bg-[#0A0A0A] rounded-full border border-white/10 hover:bg-white/10 transition-colors cursor-pointer"
                >
                  {uploadingAvatar ? (
                    <Loader2 className="w-3 h-3 text-gray-400 animate-spin" />
                  ) : (
                    <Camera className="w-3 h-3 text-gray-400" />
                  )}
                </label>
                {user?.avatarUrl && (
                  <button
                    onClick={handleAvatarDelete}
                    disabled={deletingAvatar}
                    className="absolute bottom-1 left-1 p-1.5 bg-[#0A0A0A] rounded-full border border-white/10 hover:bg-red-500/20 transition-colors"
                  >
                    {deletingAvatar ? (
                      <Loader2 className="w-3 h-3 text-gray-400 animate-spin" />
                    ) : (
                      <Trash2 className="w-3 h-3 text-red-400" />
                    )}
                  </button>
                )}
              </div>
              <div className="flex-1 pb-2">
                <h1 className="text-xl font-bold text-white">{user?.fullName || 'User'}</h1>
                <div className="flex items-center gap-5 mt-2">
                  <Link href="/user/journey" className="text-center hover:opacity-70 transition-opacity">
                    <span className="text-sm font-bold text-white">{(user?.workoutsCompleted || 0).toLocaleString()}</span>
                    <p className="text-xs text-gray-400 leading-tight">{tp('workouts')}</p>
                  </Link>
                  <div className="w-px h-7 bg-white/10" />
                  <Link href="/user/friends" className="text-center hover:opacity-70 transition-opacity">
                    <span className="text-sm font-bold text-white">{(user?.followersCount || 0).toLocaleString()}</span>
                    <p className="text-xs text-gray-400 leading-tight">{tp('followers')}</p>
                  </Link>
                  <div className="w-px h-7 bg-white/10" />
                  <Link href="/user/friends" className="text-center hover:opacity-70 transition-opacity">
                    <span className="text-sm font-bold text-white">{(user?.followingCount || 0).toLocaleString()}</span>
                    <p className="text-xs text-gray-400 leading-tight">{tp('following')}</p>
                  </Link>
                  <div className="w-px h-7 bg-white/10" />
                  <Link href="/user/achievements" className="text-center hover:opacity-70 transition-opacity">
                    <span className="text-sm font-bold text-white">{(user?.achievementsCount || 0).toLocaleString()}</span>
                    <p className="text-xs text-gray-400 leading-tight">{tp('achievements')}</p>
                  </Link>
                </div>
              </div>
            </div>

            <div className="mt-4">
              {user?.bio && <p className="text-sm text-gray-300">{user.bio}</p>}
              {(user?.city || user?.country) && (
                <div className="flex items-center gap-1 mt-3 text-xs text-gray-400">
                  <MapPin className="w-3.5 h-3.5" />
                  <span>{[user?.city, user?.country].filter(Boolean).join(', ')}</span>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Posts Section */}
        <div className="bg-[#1A1A1A] rounded-xl border border-white/10 overflow-hidden">
          <div className="px-4 py-3 border-b border-white/10 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Grid className="w-5 h-5 text-[#3B82F6]" />
              <h3 className="font-semibold text-white">{tPosts('postsTab')}</h3>
              {totalPosts > 0 && <span className="text-xs text-gray-500">({totalPosts})</span>}
            </div>
            <div className="flex items-center gap-1 bg-[#0A0A0A] rounded-lg p-0.5">
              <button
                onClick={() => setViewMode('grid')}
                className={`p-1.5 rounded-md transition-colors ${viewMode === 'grid' ? 'bg-white/10 text-[#3B82F6]' : 'text-gray-500 hover:text-gray-300'}`}
              >
                <Grid className="w-4 h-4" />
              </button>
              <button
                onClick={() => setViewMode('list')}
                className={`p-1.5 rounded-md transition-colors ${viewMode === 'list' ? 'bg-white/10 text-[#3B82F6]' : 'text-gray-500 hover:text-gray-300'}`}
              >
                <List className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Post type tabs */}
          <ProfilePostTabs activeTab={activeTab} onTabChange={handleTabChange} disabled={isLoadingPosts} />

          {postIds.length === 0 && !isLoadingPosts ? (
            <div className="py-12 text-center">
              <div className="w-20 h-20 rounded-full bg-white/5 flex items-center justify-center mx-auto mb-4">
                <Camera className="w-10 h-10 text-gray-400" />
              </div>
              <h3 className="text-lg font-semibold text-white mb-2">{tPosts('noPublications')}</h3>
              <p className="text-sm text-gray-400">{tp('uploadPhotoOrVideo')}</p>
            </div>
          ) : viewMode === 'grid' ? (
            <div>
              <div className="grid grid-cols-3 gap-1">
                {postIds.map((id) => (
                  <GridCell key={id} postId={id} onSelect={setSelectedPostId} onDelete={handleDeletePost} deletingPostId={deletingPostId} />
                ))}
              </div>
              {(isLoadingPosts || hasMore) && (
                <div ref={observerRef} className="py-8 flex justify-center">
                  {isLoadingPosts && <Loader2 className="w-6 h-6 text-[#3B82F6] animate-spin" />}
                </div>
              )}
            </div>
          ) : (
            <div className="p-3 space-y-3">
              {postIds.map((id) => (
                <PostCard
                  key={id}
                  postId={id}
                  isOwnProfile
                  showDeleteInHeader
                  onDelete={handleDeletePost}
                  deletingPostId={deletingPostId}
                  onRepostSuccess={() => loadPosts(1)}
                  playingVideoId={playingVideoId}
                  onVideoToggle={setPlayingVideoId}
                  onPhotoClick={(url: string, caption?: string) => setViewingPhoto({ url, caption })}
                />
              ))}
              {(isLoadingPosts || hasMore) && (
                <div ref={observerRef} className="py-8 flex justify-center">
                  {isLoadingPosts && <Loader2 className="w-6 h-6 text-[#3B82F6] animate-spin" />}
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Post Detail Modal */}
      {selectedPostId && (
        <PostDetailModal postId={selectedPostId} onClose={() => setSelectedPostId(null)} onDelete={handleDeletePost} deletingPostId={deletingPostId} />
      )}

      {/* Photo Lightbox */}
      {viewingPhoto && (
        <PhotoLightbox imageUrl={viewingPhoto.url} caption={viewingPhoto.caption} onClose={() => setViewingPhoto(null)} />
      )}

      {/* Toast Notifications */}
      {toastData && (
        <Toast
          message={toastData.message}
          type={toastData.type}
          onClose={() => setToastData(null)}
        />
      )}
    </>
  )
}
