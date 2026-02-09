'use client'

import { useState, useCallback, useEffect, useRef } from 'react'
import { Heart, MessageCircle, Repeat2 } from 'lucide-react'
import { cn } from '@/lib/utils/cn'
import { postsApi } from '@/lib/api/postsApi'

interface PostActionsProps {
  postId: string
  likeCount: number
  commentCount: number
  repostCount: number
  isLikedByMe: boolean
  isRepostedByMe: boolean
  onCommentClick?: () => void
  onRepostSuccess?: () => void
  className?: string
}

/**
 * Social interaction actions for a post (like, comment, repost).
 * Implements optimistic updates for instant feedback.
 */
export function PostActions({
  postId,
  likeCount: initialLikeCount,
  commentCount,
  repostCount: initialRepostCount,
  isLikedByMe: initialIsLiked,
  isRepostedByMe: initialIsReposted,
  onCommentClick,
  onRepostSuccess,
  className,
}: PostActionsProps) {
  const [isLiked, setIsLiked] = useState(initialIsLiked)
  const [likeCount, setLikeCount] = useState(initialLikeCount)
  const [isLikeLoading, setIsLikeLoading] = useState(false)
  
  const [isReposted, setIsReposted] = useState(initialIsReposted)
  const [repostCount, setRepostCount] = useState(initialRepostCount)
  const [isRepostLoading, setIsRepostLoading] = useState(false)
  const isMountedRef = useRef(true)

  // Sync isReposted state when parent provides updated props (e.g. after feed reload)
  useEffect(() => {
    setIsReposted(initialIsReposted)
  }, [initialIsReposted])

  // Sync repostCount when parent provides updated props
  useEffect(() => {
    setRepostCount(initialRepostCount)
  }, [initialRepostCount])

  // Track mounted state to avoid state updates after unmount
  useEffect(() => {
    isMountedRef.current = true
    return () => { isMountedRef.current = false }
  }, [])

  const handleLikeClick = useCallback(async () => {
    if (isLikeLoading) return

    // Optimistic update
    const wasLiked = isLiked
    const previousCount = likeCount
    
    setIsLiked(!wasLiked)
    setLikeCount(wasLiked ? previousCount - 1 : previousCount + 1)
    setIsLikeLoading(true)

    try {
      if (wasLiked) {
        await postsApi.unlikePost(postId)
      } else {
        await postsApi.likePost(postId)
      }
    } catch (error) {
      // Revert on error
      setIsLiked(wasLiked)
      setLikeCount(previousCount)
      console.error('Failed to update like:', error)
    } finally {
      setIsLikeLoading(false)
    }
  }, [postId, isLiked, likeCount, isLikeLoading])

  const handleRepostClick = useCallback(async () => {
    if (isRepostLoading) return

    // Optimistic update
    const wasReposted = isReposted
    const previousCount = repostCount
    
    setIsReposted(!wasReposted)
    setRepostCount(wasReposted ? previousCount - 1 : previousCount + 1)
    setIsRepostLoading(true)

    try {
      if (wasReposted) {
        await postsApi.removeRepost(postId)
      } else {
        await postsApi.repost(postId)
      }
      if (isMountedRef.current) {
        onRepostSuccess?.()
      }
    } catch (error) {
      // Revert on error
      if (isMountedRef.current) {
        setIsReposted(wasReposted)
        setRepostCount(previousCount)
      }
      console.error('Failed to update repost:', error)
    } finally {
      if (isMountedRef.current) {
        setIsRepostLoading(false)
      }
    }
  }, [postId, isReposted, repostCount, isRepostLoading, onRepostSuccess])

  const formatCount = (count: number): string => {
    if (count >= 1000000) {
      return `${(count / 1000000).toFixed(1)}M`
    }
    if (count >= 1000) {
      return `${(count / 1000).toFixed(1)}K`
    }
    return count.toString()
  }

  return (
    <div className={cn('flex items-center gap-4', className)}>
      {/* Like Button */}
      <button
        onClick={handleLikeClick}
        disabled={isLikeLoading}
        className={cn(
          'flex items-center gap-1.5 transition-colors group',
          isLiked
            ? 'text-red-500'
            : 'text-gray-500 hover:text-red-500'
        )}
        aria-label={isLiked ? 'Unlike post' : 'Like post'}
      >
        <Heart
          className={cn(
            'w-5 h-5 transition-transform group-hover:scale-110',
            isLiked && 'fill-current'
          )}
        />
        {likeCount > 0 && (
          <span className="text-sm font-medium">{formatCount(likeCount)}</span>
        )}
      </button>

      {/* Comment Button */}
      <button
        onClick={onCommentClick}
        className="flex items-center gap-1.5 text-gray-500 hover:text-blue-500 transition-colors group"
        aria-label="View comments"
      >
        <MessageCircle className="w-5 h-5 transition-transform group-hover:scale-110" />
        {commentCount > 0 && (
          <span className="text-sm font-medium">{formatCount(commentCount)}</span>
        )}
      </button>

      {/* Repost Button */}
      <button
        onClick={handleRepostClick}
        className={cn(
          'flex items-center gap-1.5 transition-colors group cursor-pointer',
          isReposted
            ? 'text-green-500'
            : 'text-gray-500 hover:text-green-500',
          isRepostLoading && 'opacity-70 pointer-events-none'
        )}
        aria-label={isReposted ? 'Remove repost' : 'Repost'}
      >
        <Repeat2
          className={cn(
            'w-5 h-5 transition-transform group-hover:scale-110',
            isReposted && 'stroke-[2.5]'
          )}
        />
        {repostCount > 0 && (
          <span className="text-sm font-medium">{formatCount(repostCount)}</span>
        )}
      </button>
    </div>
  )
}
