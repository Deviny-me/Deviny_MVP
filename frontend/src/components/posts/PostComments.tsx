'use client'

import { useState, useCallback, useEffect, useRef } from 'react'
import { Send, Trash2, Loader2, ChevronDown } from 'lucide-react'
import { cn } from '@/lib/utils/cn'
import { postsApi } from '@/lib/api/postsApi'
import { PostCommentDto } from '@/types/post'

interface PostCommentsProps {
  postId: string
  currentUserId?: string
  className?: string
  onCommentCountChange?: (delta: number) => void
}

/**
 * Comments section for a post.
 * Supports pagination, adding comments, and deleting own comments.
 */
export function PostComments({
  postId,
  currentUserId,
  className,
  onCommentCountChange,
}: PostCommentsProps) {
  const [comments, setComments] = useState<PostCommentDto[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isLoadingMore, setIsLoadingMore] = useState(false)
  const [hasMore, setHasMore] = useState(false)
  const [page, setPage] = useState(1)
  const [newComment, setNewComment] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [deletingIds, setDeletingIds] = useState<Set<string>>(new Set())
  
  const inputRef = useRef<HTMLInputElement>(null)
  const PAGE_SIZE = 10

  // Load initial comments
  useEffect(() => {
    loadComments(1)
  }, [postId])

  const loadComments = useCallback(async (pageNum: number) => {
    try {
      if (pageNum === 1) {
        setIsLoading(true)
      } else {
        setIsLoadingMore(true)
      }

      const response = await postsApi.getComments(postId, pageNum, PAGE_SIZE)
      
      if (pageNum === 1) {
        setComments(response.comments)
      } else {
        setComments(prev => [...prev, ...response.comments])
      }
      
      setHasMore(response.hasMore)
      setPage(pageNum)
    } catch (error) {
      console.error('Failed to load comments:', error)
    } finally {
      setIsLoading(false)
      setIsLoadingMore(false)
    }
  }, [postId])

  const handleLoadMore = useCallback(() => {
    if (!isLoadingMore && hasMore) {
      loadComments(page + 1)
    }
  }, [isLoadingMore, hasMore, page, loadComments])

  const handleSubmitComment = useCallback(async (e: React.FormEvent) => {
    e.preventDefault()
    
    const content = newComment.trim()
    if (!content || isSubmitting) return

    setIsSubmitting(true)
    
    try {
      const comment = await postsApi.addComment(postId, { content })
      setComments(prev => [comment, ...prev])
      setNewComment('')
      onCommentCountChange?.(1)
    } catch (error) {
      console.error('Failed to add comment:', error)
    } finally {
      setIsSubmitting(false)
      inputRef.current?.focus()
    }
  }, [postId, newComment, isSubmitting, onCommentCountChange])

  const handleDeleteComment = useCallback(async (commentId: string) => {
    if (deletingIds.has(commentId)) return

    setDeletingIds(prev => new Set(prev).add(commentId))
    
    try {
      await postsApi.deleteComment(commentId)
      setComments(prev => prev.filter(c => c.id !== commentId))
      onCommentCountChange?.(-1)
    } catch (error) {
      console.error('Failed to delete comment:', error)
    } finally {
      setDeletingIds(prev => {
        const next = new Set(prev)
        next.delete(commentId)
        return next
      })
    }
  }, [deletingIds, onCommentCountChange])

  const formatTimeAgo = (dateStr: string): string => {
    const date = new Date(dateStr)
    const now = new Date()
    const diffMs = now.getTime() - date.getTime()
    const diffMins = Math.floor(diffMs / 60000)
    const diffHours = Math.floor(diffMs / 3600000)
    const diffDays = Math.floor(diffMs / 86400000)

    if (diffMins < 1) return 'just now'
    if (diffMins < 60) return `${diffMins}m`
    if (diffHours < 24) return `${diffHours}h`
    if (diffDays < 7) return `${diffDays}d`
    return date.toLocaleDateString()
  }

  const getInitials = (firstName: string, lastName: string): string => {
    return `${firstName?.[0] || ''}${lastName?.[0] || ''}`.toUpperCase()
  }

  if (isLoading) {
    return (
      <div className={cn('flex justify-center py-8', className)}>
        <Loader2 className="w-6 h-6 animate-spin text-gray-400" />
      </div>
    )
  }

  return (
    <div className={cn('space-y-4', className)}>
      {/* Add Comment Form */}
      <form onSubmit={handleSubmitComment} className="flex gap-2">
        <input
          ref={inputRef}
          type="text"
          value={newComment}
          onChange={(e) => setNewComment(e.target.value)}
          placeholder="Write a comment..."
          className="flex-1 px-4 py-2 text-sm border border-gray-200 rounded-full focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
          disabled={isSubmitting}
          maxLength={500}
        />
        <button
          type="submit"
          disabled={!newComment.trim() || isSubmitting}
          className={cn(
            'p-2 rounded-full transition-colors',
            newComment.trim() && !isSubmitting
              ? 'bg-primary-500 text-white hover:bg-primary-600'
              : 'bg-gray-100 text-gray-400 cursor-not-allowed'
          )}
          aria-label="Post comment"
        >
          {isSubmitting ? (
            <Loader2 className="w-5 h-5 animate-spin" />
          ) : (
            <Send className="w-5 h-5" />
          )}
        </button>
      </form>

      {/* Comments List */}
      {comments.length === 0 ? (
        <p className="text-center text-gray-500 py-4">
          No comments yet. Be the first to comment!
        </p>
      ) : (
        <div className="space-y-3">
          {comments.map((comment) => (
            <div
              key={comment.id}
              className="flex gap-3 group"
            >
              {/* Avatar */}
              {comment.author.avatarUrl ? (
                <img
                  src={comment.author.avatarUrl}
                  alt={`${comment.author.firstName} ${comment.author.lastName}`}
                  className="w-8 h-8 rounded-full object-cover flex-shrink-0"
                />
              ) : (
                <div className="w-8 h-8 rounded-full bg-gray-200 flex items-center justify-center flex-shrink-0">
                  <span className="text-xs font-medium text-gray-600">
                    {getInitials(comment.author.firstName, comment.author.lastName)}
                  </span>
                </div>
              )}

              {/* Content */}
              <div className="flex-1 min-w-0">
                <div className="bg-gray-100 rounded-2xl px-4 py-2">
                  <p className="text-sm font-medium text-gray-900">
                    {comment.author.firstName} {comment.author.lastName}
                  </p>
                  <p className="text-sm text-gray-700 whitespace-pre-wrap break-words">
                    {comment.content}
                  </p>
                </div>
                <div className="flex items-center gap-3 mt-1 px-2">
                  <span className="text-xs text-gray-500">
                    {formatTimeAgo(comment.createdAt)}
                  </span>
                  
                  {/* Delete button (only for own comments) */}
                  {currentUserId && comment.author.id === currentUserId && (
                    <button
                      onClick={() => handleDeleteComment(comment.id)}
                      disabled={deletingIds.has(comment.id)}
                      className="text-xs text-gray-400 hover:text-red-500 transition-colors opacity-0 group-hover:opacity-100"
                      aria-label="Delete comment"
                    >
                      {deletingIds.has(comment.id) ? (
                        <Loader2 className="w-3 h-3 animate-spin" />
                      ) : (
                        <Trash2 className="w-3 h-3" />
                      )}
                    </button>
                  )}
                </div>
              </div>
            </div>
          ))}

          {/* Load More Button */}
          {hasMore && (
            <button
              onClick={handleLoadMore}
              disabled={isLoadingMore}
              className="w-full py-2 text-sm text-gray-500 hover:text-gray-700 transition-colors flex items-center justify-center gap-1"
            >
              {isLoadingMore ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <>
                  <ChevronDown className="w-4 h-4" />
                  Load more comments
                </>
              )}
            </button>
          )}
        </div>
      )}
    </div>
  )
}
