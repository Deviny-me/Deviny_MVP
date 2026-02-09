'use client'

import { useRouter } from 'next/navigation'
import { 
  Heart, 
  MessageCircle, 
  Share2, 
  MoreHorizontal, 
  Image as ImageIcon,
  Video,
  Award,
  ThumbsUp,
  Send,
  Flame,
  Trophy,
  Target,
  Loader2,
  Repeat2
} from 'lucide-react'
import { useState, useRef, useEffect } from 'react'
import { useUser } from '@/components/user/UserProvider'
import { postsApi } from '@/lib/api/postsApi'
import { PostType, PostDto } from '@/types/post'
import { getMediaUrl } from '@/lib/config'
import { Toast } from '@/components/ui/Toast'
import { ComingSoonModal } from '@/components/ui/ComingSoonModal'
import { PhotoLightbox } from '@/components/ui/PhotoLightbox'
import { PostActions } from '@/components/posts'

export function UserHomeFeed() {
  const router = useRouter()
  const { user } = useUser()
  
  // File input refs
  const photoInputRef = useRef<HTMLInputElement>(null)
  const videoInputRef = useRef<HTMLInputElement>(null)
  
  // State
  const [isUploading, setIsUploading] = useState(false)
  const [uploadProgress, setUploadProgress] = useState<string | null>(null)
  const [showAchievementModal, setShowAchievementModal] = useState(false)
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null)
  const [recentPosts, setRecentPosts] = useState<PostDto[]>([])
  const [playingVideoId, setPlayingVideoId] = useState<string | null>(null)
  const [viewingPhoto, setViewingPhoto] = useState<{ url: string; caption?: string } | null>(null)
  // Repost is now instant - no dialog needed
  // Load recent posts on mount
  useEffect(() => {
    loadRecentPosts()
  }, [])

  const loadRecentPosts = async () => {
    try {
      const response = await postsApi.getMyPosts(1, 10)
      // Filter out reposts - only show original posts in personal feed
      const originalPosts = response.posts.filter(p => p.type !== PostType.Repost && !p.isRepost)
      setRecentPosts(originalPosts.slice(0, 5))
    } catch (error) {
      console.error('Failed to load posts:', error)
    }
  }

  // Handle file selection
  const handleFileSelect = async (event: React.ChangeEvent<HTMLInputElement>, type: PostType) => {
    const file = event.target.files?.[0]
    if (!file) return

    // Reset input
    event.target.value = ''

    // Validate file
    const validation = postsApi.validateFile(file, type)
    if (!validation.valid) {
      setToast({ message: validation.error!, type: 'error' })
      return
    }

    // Upload file
    setIsUploading(true)
    setUploadProgress(type === PostType.Photo ? 'Uploading photo...' : 'Uploading video...')

    try {
      const newPost = await postsApi.createMediaPost({
        file,
        type
      })
      
      setToast({ message: 'Post uploaded successfully!', type: 'success' })
      
      // Add to recent posts
      setRecentPosts(prev => [newPost, ...prev].slice(0, 5))
      
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Upload failed'
      setToast({ message, type: 'error' })
    } finally {
      setIsUploading(false)
      setUploadProgress(null)
    }
  }

  return (
    <div className="space-y-3 pb-6">
      {/* Hidden file inputs */}
      <input
        ref={photoInputRef}
        type="file"
        accept="image/jpeg,image/png,image/gif,image/webp"
        className="hidden"
        onChange={(e) => handleFileSelect(e, PostType.Photo)}
        disabled={isUploading}
      />
      <input
        ref={videoInputRef}
        type="file"
        accept="video/mp4,video/quicktime,video/webm"
        className="hidden"
        onChange={(e) => handleFileSelect(e, PostType.Video)}
        disabled={isUploading}
      />

      {/* Create Post Card */}
      <div className="bg-[#1A1A1A] rounded-lg border border-white/10 p-4">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-full bg-gradient-to-br from-[#FF6B35] to-[#FF0844] flex items-center justify-center">
            <span className="text-white font-bold text-lg">
              {user?.fullName?.charAt(0) || 'U'}
            </span>
          </div>
          <button 
            className="flex-1 px-4 py-3 bg-[#0A0A0A] hover:bg-[#262626] border border-white/10 rounded-full text-left text-sm text-gray-400 transition-colors"
            onClick={() => router.push('/dashboard/user/profile')}
          >
            Share your fitness journey...
          </button>
        </div>
        
        {/* Upload Progress */}
        {isUploading && uploadProgress && (
          <div className="mt-3 flex items-center gap-2 px-3 py-2 bg-[#0A0A0A] rounded-lg">
            <Loader2 className="w-4 h-4 text-[#FF6B35] animate-spin" />
            <span className="text-sm text-gray-400">{uploadProgress}</span>
          </div>
        )}
        
        <div className="flex items-center gap-2 mt-3 pt-3 border-t border-white/10">
          <button 
            onClick={() => photoInputRef.current?.click()}
            disabled={isUploading}
            className="flex-1 flex items-center justify-center gap-2 py-2 px-3 rounded hover:bg-white/5 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <ImageIcon className="w-5 h-5 text-[#FF6B35]" strokeWidth={1.5} />
            <span className="text-sm font-medium text-gray-300">Photo</span>
          </button>
          <button 
            onClick={() => videoInputRef.current?.click()}
            disabled={isUploading}
            className="flex-1 flex items-center justify-center gap-2 py-2 px-3 rounded hover:bg-white/5 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Video className="w-5 h-5 text-green-500" strokeWidth={1.5} />
            <span className="text-sm font-medium text-gray-300">Video</span>
          </button>
          <button 
            onClick={() => setShowAchievementModal(true)}
            disabled={isUploading}
            className="flex-1 flex items-center justify-center gap-2 py-2 px-3 rounded hover:bg-white/5 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Award className="w-5 h-5 text-amber-500" strokeWidth={1.5} />
            <span className="text-sm font-medium text-gray-300">Achievement</span>
          </button>
        </div>
      </div>

      {/* Separator */}
      <div className="flex items-center gap-3 px-2">
        <div className="flex-1 h-px bg-white/10" />
        <span className="text-xs text-gray-500 font-medium">Recent Activity</span>
        <div className="flex-1 h-px bg-white/10" />
      </div>

      {/* Recent Posts or Empty State */}
      {recentPosts.length > 0 ? (
        <div className="space-y-3">
          {recentPosts.map((post) => {
            // For reposts, use original post content
            const isRepost = post.type === PostType.Repost || post.isRepost
            const displayMedia = isRepost ? post.originalPost?.media : post.media
            const displayCaption = isRepost ? post.originalPost?.caption : post.caption
            
            return (
            <div 
              key={post.id} 
              className="bg-[#1A1A1A] rounded-lg border border-white/10 overflow-hidden"
            >
              {/* Repost indicator */}
              {isRepost && (
                <div className="px-3 pt-2 flex items-center gap-1.5 text-gray-400 text-xs">
                  <Repeat2 className="w-3 h-3" />
                  <span>You reposted</span>
                </div>
              )}
              
              {/* Post Header - click to go to profile */}
              <div 
                className="p-3 cursor-pointer hover:bg-white/5 transition-colors"
                onClick={() => router.push('/dashboard/user/profile')}
              >
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-full bg-gradient-to-br from-[#FF6B35] to-[#FF0844] flex items-center justify-center">
                    <span className="text-white text-xs font-bold">
                      {user?.fullName?.charAt(0) || 'U'}
                    </span>
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-medium text-white">{user?.fullName || 'You'}</p>
                    <p className="text-xs text-gray-500">
                      {new Date(post.createdAt).toLocaleDateString('en-US', { 
                        month: 'short', 
                        day: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit'
                      })}
                    </p>
                  </div>
                </div>
              </div>

              {/* Post Media Preview */}
              {displayMedia && displayMedia[0] && (
                <div 
                  className="relative aspect-video bg-black cursor-pointer"
                  onClick={(e) => {
                    e.stopPropagation()
                    if (displayMedia[0].mediaType === 1) {
                      // Video - toggle play/pause
                      setPlayingVideoId(playingVideoId === post.id ? null : post.id)
                    } else {
                      // Photo - open lightbox
                      setViewingPhoto({ 
                        url: getMediaUrl(displayMedia[0].url) || '', 
                        caption: displayCaption || undefined 
                      })
                    }
                  }}
                >
                  {displayMedia[0].mediaType === 0 ? (
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
                        onEnded={() => setPlayingVideoId(null)}
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
                <div className="px-3 py-2">
                  <p className="text-sm text-gray-300">{displayCaption}</p>
                </div>
              )}

              {/* Post Actions */}
              <div className="px-3 py-2 border-t border-white/10">
                <PostActions
                  postId={post.id}
                  likeCount={post.likeCount}
                  commentCount={post.commentCount}
                  repostCount={post.repostCount}
                  isLikedByMe={post.isLikedByMe}
                  isRepostedByMe={post.isRepostedByMe || isRepost}
                  onCommentClick={() => router.push(`/post/${post.id}`)}
                  onRepostSuccess={() => loadRecentPosts()}
                />
              </div>
            </div>
          )})}
          
          {/* View All Link */}
          <button
            onClick={() => router.push('/dashboard/user/profile')}
            className="w-full py-2 text-center text-sm text-[#FF6B35] hover:text-[#FF8555] transition-colors"
          >
            View all posts in your profile →
          </button>
        </div>
      ) : (
        <div className="bg-[#1A1A1A] rounded-lg border border-white/10 p-12 text-center">
          <div className="w-16 h-16 rounded-full bg-white/5 flex items-center justify-center mx-auto mb-4">
            <Flame className="w-8 h-8 text-gray-400" />
          </div>
          <h3 className="text-lg font-semibold text-white mb-2">No Posts Yet</h3>
          <p className="text-sm text-gray-400">Share your fitness journey to inspire others!</p>
        </div>
      )}

      {/* Modals */}
      {showAchievementModal && (
        <ComingSoonModal 
          onClose={() => setShowAchievementModal(false)}
          title="Coming Soon!"
          message="Share your achievements with friends. This feature will be available in the next update!"
          icon={<Award className="w-8 h-8 text-amber-500" />}
        />
      )}

      {/* Photo Lightbox */}
      {viewingPhoto && (
        <PhotoLightbox
          imageUrl={viewingPhoto.url}
          caption={viewingPhoto.caption}
          onClose={() => setViewingPhoto(null)}
        />
      )}



      {/* Toast Notifications */}
      {toast && (
        <Toast
          message={toast.message}
          type={toast.type}
          onClose={() => setToast(null)}
        />
      )}
    </div>
  )
}
