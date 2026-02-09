'use client'

import { UserMainLayout } from '@/components/user/layout/UserMainLayout'
import { useUser } from '@/components/user/UserProvider'
import { 
  Camera,
  MapPin,
  Calendar,
  Flame,
  Trophy,
  Target,
  Users,
  Edit2,
  Image as ImageIcon,
  Video,
  Grid,
  Loader2,
  X,
  ChevronLeft,
  ChevronRight,
  Play
} from 'lucide-react'
import { useRouter } from 'next/navigation'
import { useState, useEffect, useCallback, useRef } from 'react'
import { postsApi } from '@/lib/api/postsApi'
import { PostDto, PostType, MediaType } from '@/types/post'
import { getMediaUrl } from '@/lib/config'

// Media Lightbox Component
function MediaLightbox({ 
  post, 
  posts,
  onClose,
  onNavigate
}: { 
  post: PostDto
  posts: PostDto[]
  onClose: () => void
  onNavigate: (post: PostDto) => void
}) {
  const currentIndex = posts.findIndex(p => p.id === post.id)
  const hasNext = currentIndex < posts.length - 1
  const hasPrev = currentIndex > 0

  const handleKeyDown = useCallback((e: KeyboardEvent) => {
    if (e.key === 'Escape') onClose()
    if (e.key === 'ArrowRight' && hasNext) onNavigate(posts[currentIndex + 1])
    if (e.key === 'ArrowLeft' && hasPrev) onNavigate(posts[currentIndex - 1])
  }, [currentIndex, hasNext, hasPrev, onClose, onNavigate, posts])

  useEffect(() => {
    document.addEventListener('keydown', handleKeyDown)
    document.body.style.overflow = 'hidden'
    return () => {
      document.removeEventListener('keydown', handleKeyDown)
      document.body.style.overflow = 'auto'
    }
  }, [handleKeyDown])

  // For reposts, get media from originalPost
  const media = post.isRepost && post.originalPost?.media?.[0] 
    ? post.originalPost.media[0] 
    : post.media[0]
  if (!media) return null

  return (
    <div 
      className="fixed inset-0 z-50 bg-black/95 flex items-center justify-center"
      onClick={onClose}
    >
      {/* Close button */}
      <button
        onClick={onClose}
        className="absolute top-4 right-4 z-50 p-2 text-white/70 hover:text-white transition-colors"
      >
        <X className="w-8 h-8" />
      </button>

      {/* Navigation arrows */}
      {hasPrev && (
        <button
          onClick={(e) => {
            e.stopPropagation()
            onNavigate(posts[currentIndex - 1])
          }}
          className="absolute left-4 z-50 p-2 text-white/70 hover:text-white transition-colors"
        >
          <ChevronLeft className="w-10 h-10" />
        </button>
      )}
      {hasNext && (
        <button
          onClick={(e) => {
            e.stopPropagation()
            onNavigate(posts[currentIndex + 1])
          }}
          className="absolute right-4 z-50 p-2 text-white/70 hover:text-white transition-colors"
        >
          <ChevronRight className="w-10 h-10" />
        </button>
      )}

      {/* Media content */}
      <div 
        className="max-w-5xl max-h-[90vh] w-full mx-4"
        onClick={(e) => e.stopPropagation()}
      >
        {media.mediaType === MediaType.Image ? (
          <img
            src={getMediaUrl(media.url) || ''}
            alt={post.caption || 'Post image'}
            className="w-full h-full object-contain rounded-lg"
          />
        ) : (
          <video
            src={getMediaUrl(media.url) || ''}
            controls
            autoPlay
            className="w-full max-h-[90vh] object-contain rounded-lg"
          />
        )}

        {/* Caption */}
        {post.caption && (
          <div className="mt-4 px-2">
            <p className="text-white text-sm">{post.caption}</p>
            <p className="text-gray-500 text-xs mt-1">
              {new Date(post.createdAt).toLocaleDateString('en-US', {
                year: 'numeric',
                month: 'long',
                day: 'numeric',
                hour: '2-digit',
                minute: '2-digit'
              })}
            </p>
          </div>
        )}
      </div>

      {/* Counter */}
      <div className="absolute bottom-4 left-1/2 -translate-x-1/2 text-white/70 text-sm">
        {currentIndex + 1} / {posts.length}
      </div>
    </div>
  )
}

// Media Grid Component
function MediaGrid({ 
  posts, 
  onSelectPost,
  isLoading,
  onLoadMore,
  hasMore
}: { 
  posts: PostDto[]
  onSelectPost: (post: PostDto) => void
  isLoading: boolean
  onLoadMore: () => void
  hasMore: boolean
}) {
  const observerRef = useRef<HTMLDivElement>(null)

  // Infinite scroll observer
  useEffect(() => {
    if (!hasMore || isLoading) return

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting) {
          onLoadMore()
        }
      },
      { threshold: 0.1 }
    )

    if (observerRef.current) {
      observer.observe(observerRef.current)
    }

    return () => observer.disconnect()
  }, [hasMore, isLoading, onLoadMore])

  if (posts.length === 0 && !isLoading) {
    return (
      <div className="py-12 text-center">
        <div className="w-20 h-20 rounded-full bg-white/5 flex items-center justify-center mx-auto mb-4">
          <Camera className="w-10 h-10 text-gray-400" />
        </div>
        <h3 className="text-lg font-semibold text-white mb-2">No Posts Yet</h3>
        <p className="text-sm text-gray-400">
          Share your fitness journey by uploading photos and videos!
        </p>
      </div>
    )
  }

  return (
    <div>
      {/* Grid */}
      <div className="grid grid-cols-3 gap-1">
        {posts.map((post) => {
          // For reposts, get media from originalPost
          const media = post.isRepost && post.originalPost?.media?.[0] 
            ? post.originalPost.media[0] 
            : post.media[0]
          if (!media) return null

          return (
            <button
              key={post.id}
              onClick={() => onSelectPost(post)}
              className="relative aspect-square bg-[#0A0A0A] overflow-hidden group"
            >
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
                  {/* Video overlay */}
                  <div className="absolute inset-0 flex items-center justify-center bg-black/20">
                    <div className="w-10 h-10 rounded-full bg-white/30 backdrop-blur-sm flex items-center justify-center">
                      <Play className="w-5 h-5 text-white ml-0.5" fill="white" />
                    </div>
                  </div>
                </>
              )}

              {/* Hover overlay */}
              <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                {media.mediaType === MediaType.Image ? (
                  <ImageIcon className="w-8 h-8 text-white" />
                ) : (
                  <Video className="w-8 h-8 text-white" />
                )}
              </div>
            </button>
          )
        })}
      </div>

      {/* Loading / Load more trigger */}
      {(isLoading || hasMore) && (
        <div ref={observerRef} className="py-8 flex justify-center">
          {isLoading && (
            <Loader2 className="w-6 h-6 text-[#FF6B35] animate-spin" />
          )}
        </div>
      )}
    </div>
  )
}

export default function UserProfilePage() {
  const router = useRouter()
  const { user } = useUser()

  // Posts state
  const [posts, setPosts] = useState<PostDto[]>([])
  const [isLoadingPosts, setIsLoadingPosts] = useState(true)
  const [page, setPage] = useState(1)
  const [hasMore, setHasMore] = useState(true)
  const [totalPosts, setTotalPosts] = useState(0)
  const [selectedPost, setSelectedPost] = useState<PostDto | null>(null)

  // Calculate level progress
  const currentXp = user?.xp || 0
  const xpToNextLevel = user?.xpToNextLevel || 1000
  const levelProgress = (currentXp / xpToNextLevel) * 100

  const stats = [
    { label: 'Workouts', value: user?.workoutsCompleted || 0, icon: Target },
    { label: 'Day Streak', value: user?.streak || 0, icon: Flame },
    { label: 'Achievements', value: user?.achievementsCount || 0, icon: Trophy },
    { label: 'Following', value: user?.followingCount || 0, icon: Users },
  ]

  // Load posts
  const loadPosts = useCallback(async (pageNum: number, append: boolean = false) => {
    try {
      setIsLoadingPosts(true)
      const response = await postsApi.getMyPosts(pageNum, 12)
      
      // Filter out reposts whose original post was deleted
      const filteredPosts = response.posts.filter(p => 
        !p.isRepost || (p.isRepost && p.originalPost !== null)
      )
      
      if (append) {
        setPosts(prev => [...prev, ...filteredPosts])
      } else {
        setPosts(filteredPosts)
      }
      
      setTotalPosts(response.totalCount)
      setHasMore(response.hasMore)
    } catch (error) {
      console.error('Failed to load posts:', error)
    } finally {
      setIsLoadingPosts(false)
    }
  }, [])

  // Initial load
  useEffect(() => {
    loadPosts(1)
  }, [loadPosts])

  // Load more handler
  const handleLoadMore = useCallback(() => {
    if (!isLoadingPosts && hasMore) {
      const nextPage = page + 1
      setPage(nextPage)
      loadPosts(nextPage, true)
    }
  }, [isLoadingPosts, hasMore, page, loadPosts])

  return (
    <UserMainLayout>
      <div className="space-y-4 pb-6">
        {/* Profile Header */}
        <div className="bg-[#1A1A1A] rounded-xl border border-white/10 overflow-hidden">
          {/* Cover */}
          <div className="h-32 bg-gradient-to-r from-[#FF6B35] to-[#FF0844] relative">
            <button className="absolute bottom-3 right-3 p-2 bg-black/30 backdrop-blur-sm rounded-lg text-white hover:bg-black/50 transition-colors">
              <Camera className="w-4 h-4" />
            </button>
          </div>

          {/* Profile Info */}
          <div className="px-6 pb-6">
            <div className="flex items-end gap-4 -mt-12">
              {/* Avatar */}
              <div className="relative">
                <div className="w-24 h-24 rounded-xl bg-gradient-to-br from-[#FF6B35] to-[#FF0844] flex items-center justify-center border-4 border-[#1A1A1A]">
                  <span className="text-white text-3xl font-bold">
                    {user?.fullName?.charAt(0) || 'U'}
                  </span>
                </div>
                <button className="absolute bottom-0 right-0 p-1.5 bg-[#0A0A0A] rounded-full border border-white/10 hover:bg-white/10 transition-colors">
                  <Camera className="w-3 h-3 text-gray-400" />
                </button>
              </div>

              {/* Name & Actions */}
              <div className="flex-1 flex items-end justify-between pb-2">
                <div>
                  <h1 className="text-xl font-bold text-white">{user?.fullName || 'User'}</h1>
                  <p className="text-sm text-gray-400">@{user?.email?.split('@')[0] || 'user'}</p>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => router.push('/dashboard/user/settings')}
                    className="flex items-center gap-2 px-4 py-2 bg-[#0A0A0A] border border-white/10 rounded-lg text-sm text-gray-300 hover:bg-white/5 transition-colors"
                  >
                    <Edit2 className="w-4 h-4" />
                    Edit Profile
                  </button>
                </div>
              </div>
            </div>

            {/* Bio & Info */}
            <div className="mt-4">
              {user?.bio && (
                <p className="text-sm text-gray-300">
                  {user.bio}
                </p>
              )}
              <div className="flex items-center gap-4 mt-3 text-xs text-gray-400">
                {(user?.city || user?.country) && (
                  <div className="flex items-center gap-1">
                    <MapPin className="w-3.5 h-3.5" />
                    <span>{[user?.city, user?.country].filter(Boolean).join(', ')}</span>
                  </div>
                )}
                {user?.createdAt && (
                  <div className="flex items-center gap-1">
                    <Calendar className="w-3.5 h-3.5" />
                    <span>Joined {new Date(user.createdAt).toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}</span>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Level Card */}
        <div className="bg-[#1A1A1A] rounded-xl border border-white/10 p-4">
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 rounded-xl bg-gradient-to-br from-[#FF6B35] to-[#FF0844] flex items-center justify-center">
              <span className="text-2xl font-bold text-white">{user?.level || 1}</span>
            </div>
            <div className="flex-1">
              <div className="flex items-center justify-between mb-1">
                <span className="text-sm font-semibold text-white">Level {user?.level || 1}</span>
                <span className="text-xs text-gray-400">{currentXp} / {xpToNextLevel} XP</span>
              </div>
              <div className="h-2 bg-[#0A0A0A] rounded-full overflow-hidden">
                <div 
                  className="h-full bg-gradient-to-r from-[#FF6B35] to-[#FF0844] rounded-full transition-all"
                  style={{ width: `${levelProgress}%` }}
                />
              </div>
              <p className="text-xs text-gray-400 mt-1">{xpToNextLevel - currentXp} XP to Level {(user?.level || 1) + 1}</p>
            </div>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {stats.map((stat, index) => (
            <div key={index} className="bg-[#1A1A1A] rounded-xl border border-white/10 p-4 text-center">
              <stat.icon className="w-5 h-5 text-[#FF6B35] mx-auto mb-2" />
              <p className="text-2xl font-bold text-white">{stat.value}</p>
              <p className="text-xs text-gray-400">{stat.label}</p>
            </div>
          ))}
        </div>

        {/* Media Grid Section */}
        <div className="bg-[#1A1A1A] rounded-xl border border-white/10 overflow-hidden">
          {/* Section Header */}
          <div className="px-4 py-3 border-b border-white/10 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Grid className="w-5 h-5 text-[#FF6B35]" />
              <h3 className="font-semibold text-white">Media</h3>
              {totalPosts > 0 && (
                <span className="text-xs text-gray-500">({totalPosts} posts)</span>
              )}
            </div>
          </div>

          {/* Media Grid */}
          <MediaGrid
            posts={posts}
            onSelectPost={setSelectedPost}
            isLoading={isLoadingPosts}
            onLoadMore={handleLoadMore}
            hasMore={hasMore}
          />
        </div>
      </div>

      {/* Lightbox */}
      {selectedPost && (
        <MediaLightbox
          post={selectedPost}
          posts={posts}
          onClose={() => setSelectedPost(null)}
          onNavigate={setSelectedPost}
        />
      )}
    </UserMainLayout>
  )
}
