'use client'

import { useState } from 'react'
import { useRouter, usePathname } from 'next/navigation'
import { Video, Repeat2, Trash2, Loader2 } from 'lucide-react'
import { PostType, MediaType } from '@/types/post'
import { getMediaUrl } from '@/lib/config'
import { PostActions } from './PostActions'
import { PostCommentsPanel } from './PostCommentsPanel'
import { usePost, usePostDispatch } from '@/contexts/PostStoreContext'
import { useAccentColors, getAccentColorsByRole, getRoleRingClass } from '@/lib/theme/useAccentColors'
import { useAuth } from '@/features/auth/AuthContext'

interface PostCardProps {
  postId: string
  /** Layout variant: 'feed' expands to 2-column for comments; 'modal' stacks comments below */
  variant?: 'feed' | 'modal'
  /** @deprecated Use useAuth() internally. Kept for backward compat. */
  currentUserId?: string | null
  /** Show delete button in header */
  showDeleteInHeader?: boolean
  /** Skip ownership check (e.g. on own profile where all posts are yours) */
  isOwnProfile?: boolean
  /** Callback when delete is clicked */
  onDelete?: (postId: string) => void
  /** Post ID currently being deleted (for loading spinner) */
  deletingPostId?: string | null
  /** Callback when repost succeeds */
  onRepostSuccess?: () => void
  /** Currently playing video post ID */
  playingVideoId?: string | null
  /** Toggle video playback */
  onVideoToggle?: (postId: string | null) => void
  /** Open photo lightbox */
  onPhotoClick?: (url: string, caption?: string) => void
}

/**
 * Shared post card component used across feeds and profiles.
 * Reads all post data from PostStore — keeps no local interaction state.
 * When comments are open, expands into a 2-column grid layout (inline, no overlay).
 */
export function PostCard({
  postId,
  variant = 'feed',
  currentUserId,
  showDeleteInHeader = false,
  isOwnProfile = false,
  onDelete,
  deletingPostId,
  onRepostSuccess,
  playingVideoId,
  onVideoToggle,
  onPhotoClick,
}: PostCardProps) {
  const accent = useAccentColors()
  const { user: authUser } = useAuth()
  const post = usePost(postId)
  const dispatch = usePostDispatch()
  const router = useRouter()
  const pathname = usePathname()
  const [commentsOpen, setCommentsOpen] = useState(false)

  if (!post) return null

  const authorName = post.author?.fullName || `${post.author?.firstName ?? ''} ${post.author?.lastName ?? ''}`.trim() || 'User'
  const authorAvatarUrl = post.author?.avatarUrl
  const authorInitials = (post.author?.firstName?.charAt(0) || 'U').toUpperCase()

  const isRepost = post.type === PostType.Repost || post.isRepost
  const originalDeleted = isRepost && !post.originalPost

  // --- Robust ownership detection ---
  // 1. Prefer explicit prop, then auth context
  // 2. Fallback: decode JWT token from storage to cover race-condition / stale-state edge cases
  const resolvedUserId = currentUserId ?? authUser?.id ?? (() => {
    try {
      const token = typeof window !== 'undefined'
        ? (localStorage.getItem('accessToken') || sessionStorage.getItem('accessToken'))
        : null
      if (!token) return undefined
      const payload = JSON.parse(atob(token.split('.')[1]))
      return (
        payload.sub ??
        payload['http://schemas.xmlsoap.org/ws/2005/05/identity/claims/nameidentifier']
      ) as string | undefined
    } catch {
      return undefined
    }
  })()

  // Normalise IDs (trim + lowercase) before comparison to avoid format mismatches
  const normalizeId = (id: string | undefined | null): string | undefined =>
    id?.toString().trim().toLowerCase() || undefined

  const normResolved = normalizeId(resolvedUserId)
  const isOwner = isOwnProfile || (!!normResolved && (
    normalizeId(post.userId) === normResolved ||
    normalizeId(post.author?.id) === normResolved
  ))

  // Determine avatar color based on author's role, not current user's role
  const authorRole = post.author?.role
  const authorAccent = getAccentColorsByRole(authorRole)
  
  const displayMedia = isRepost ? post.originalPost?.media : post.media
  const displayCaption = isRepost ? post.originalPost?.caption : post.caption

  const handleCommentCountChange = (delta: number) => {
    dispatch({
      type: 'UPDATE_POST',
      postId: post.id,
      partial: { commentCount: post.commentCount + delta },
    })
  }

  const handleAuthorClick = () => {
    const basePath = pathname?.startsWith('/trainer')
      ? '/trainer'
      : pathname?.startsWith('/nutritionist')
        ? '/nutritionist'
        : '/user'
    // Navigate directly to own profile page (not [userId] route) when clicking own name
    if (isOwner) {
      router.push(`${basePath}/profile`)
    } else {
      router.push(`${basePath}/profile/${post.userId}`)
    }
  }

  const isModal = variant === 'modal'

  return (
    <div className={`bg-[#141414] rounded-xl border border-white/[0.06] overflow-hidden transition-all duration-300 hover:border-white/[0.1] ${
      isModal
        ? commentsOpen && !originalDeleted
          ? 'md:w-[920px] max-w-full'
          : 'md:w-[540px] max-w-full'
        : commentsOpen && !originalDeleted
          ? 'md:w-[calc(100%+420px)] md:-mr-[420px] relative z-10'
          : ''
    }`}>
      <div className={commentsOpen && !originalDeleted
        ? isModal
          ? 'grid grid-cols-1 md:grid-cols-[540px_1fr]'
          : 'grid grid-cols-1 md:grid-cols-[1fr_420px]'
        : ''
      }>
        {/* ===== LEFT: Post content ===== */}
        <div className="min-w-0">
          {/* Repost indicator */}
          {isRepost && (
            <div className="px-4 pt-2.5 flex items-center gap-1.5 text-gray-500 text-xs">
              <Repeat2 className="w-3.5 h-3.5" />
              <span>Репост</span>
            </div>
          )}

          {/* If original was deleted, show placeholder */}
          {originalDeleted ? (
            <div className="px-4 py-6 text-center relative">
              {isOwner && onDelete && (
                <button
                  onClick={(e) => { e.stopPropagation(); onDelete(post.id) }}
                  disabled={deletingPostId === post.id}
                  className="absolute top-2 right-2 p-1.5 hover:bg-red-500/10 rounded-lg transition-colors group"
                  title="Удалить репост"
                >
                  {deletingPostId === post.id ? (
                    <Loader2 className="w-4 h-4 text-gray-400 animate-spin" />
                  ) : (
                    <Trash2 className="w-4 h-4 text-gray-500 group-hover:text-red-500 transition-colors" />
                  )}
                </button>
              )}
              <div className="w-12 h-12 mx-auto mb-3 rounded-full bg-white/[0.04] flex items-center justify-center">
                <Repeat2 className="w-6 h-6 text-gray-600" />
              </div>
              <p className="text-sm text-gray-500">Публикация была удалена</p>
            </div>
          ) : (
            <>
              {/* Post Header */}
              <div className="p-3.5 hover:bg-white/[0.02] transition-colors">
                <div className="flex items-center gap-2">
                  <div
                    className="flex items-center gap-2 flex-1 cursor-pointer"
                    onClick={handleAuthorClick}
                  >
                    {authorAvatarUrl ? (
                      <img
                        src={authorAvatarUrl}
                        alt={authorName}
                        className={`w-8 h-8 rounded-full object-cover ${getRoleRingClass(authorRole)}`}
                      />
                    ) : (
                      <div className={`w-8 h-8 rounded-full bg-gradient-to-br ${authorAccent.gradient} flex items-center justify-center`}>
                        <span className="text-white text-xs font-bold">{authorInitials}</span>
                      </div>
                    )}
                    <div className="flex-1">
                      <p className="text-sm font-medium text-white">{authorName}</p>
                      <p className="text-xs text-gray-500">
                        {new Date(post.createdAt).toLocaleDateString('ru-RU', {
                          month: 'short',
                          day: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit'
                        })}
                      </p>
                    </div>
                  </div>

                  {/* Delete button in header */}
                  {showDeleteInHeader && isOwner && onDelete && (
                    <button
                      onClick={(e) => { e.stopPropagation(); onDelete(post.id) }}
                      disabled={deletingPostId === post.id}
                      className="p-1.5 hover:bg-red-500/10 rounded-lg transition-colors group"
                      title="Удалить публикацию"
                    >
                      {deletingPostId === post.id ? (
                        <Loader2 className="w-4 h-4 text-gray-400 animate-spin" />
                      ) : (
                        <Trash2 className="w-4 h-4 text-gray-500 group-hover:text-red-500 transition-colors" />
                      )}
                    </button>
                  )}
                </div>
              </div>

              {/* Post Media Preview */}
              {displayMedia && displayMedia[0] && (
                <div
                  className="relative aspect-video bg-black cursor-pointer"
                  onClick={(e) => {
                    e.stopPropagation()
                    if (displayMedia[0].mediaType === MediaType.Video) {
                      onVideoToggle?.(playingVideoId === post.id ? null : post.id)
                    } else {
                      onPhotoClick?.(
                        getMediaUrl(displayMedia[0].url) || '',
                        displayCaption || undefined
                      )
                    }
                  }}
                >
                  {displayMedia[0].mediaType === MediaType.Image ? (
                    <img
                      src={getMediaUrl(displayMedia[0].url) || ''}
                      alt={displayCaption || 'Post image'}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="relative w-full h-full">
                      <video
                        src={getMediaUrl(displayMedia[0].url) || ''}
                        className="w-full h-full object-cover"
                        controls={playingVideoId === post.id}
                        autoPlay={playingVideoId === post.id}
                        muted={playingVideoId !== post.id}
                        playsInline
                        onEnded={() => onVideoToggle?.(null)}
                      />
                      {playingVideoId !== post.id && (
                        <div className="absolute inset-0 flex items-center justify-center bg-black/30 hover:bg-black/40 transition-colors">
                          <div className="w-16 h-16 rounded-full bg-white/20 backdrop-blur flex items-center justify-center hover:bg-white/30 transition-colors">
                            <Video className="w-8 h-8 text-white ml-1" />
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              )}

              {/* Post Caption */}
              {displayCaption && (
                <div className="px-4 py-2.5">
                  <p className="text-sm text-gray-300 leading-relaxed">{displayCaption}</p>
                </div>
              )}

              {/* Post Actions */}
              <div className="px-3 py-1.5 border-t border-white/[0.06]">
                <PostActions
                  postId={post.id}
                  onCommentClick={() => setCommentsOpen(prev => !prev)}
                  onRepostSuccess={onRepostSuccess}
                />
              </div>
            </>
          )}
        </div>

        {/* ===== RIGHT: Inline comments panel ===== */}
        {commentsOpen && !originalDeleted && (
          <div className={`border-t border-white/[0.06] flex flex-col ${
            isModal
              ? 'max-h-[70vh] md:border-t-0 md:border-l md:border-white/[0.06]'
              : 'h-[500px] md:h-auto md:max-h-[650px] md:border-t-0 md:border-l md:border-white/[0.06]'
          }`}>
            <PostCommentsPanel
              postId={post.id}
              commentCount={post.commentCount}
              onCommentCountChange={handleCommentCountChange}
              onClose={() => setCommentsOpen(false)}
            />
          </div>
        )}
      </div>
    </div>
  )
}
