'use client'

import { useRouter } from 'next/navigation'
import { useTranslations } from 'next-intl'
import { 
  Image as ImageIcon,
  Video,
  Award,
  Flame,
  Loader2
} from 'lucide-react'
import { useState, useRef, useEffect } from 'react'
import { postsApi } from '@/lib/api/postsApi'
import { PostType } from '@/types/post'
import { fetchTrainerProfile } from '@/lib/api/trainerProfileApi'
import { PostCard } from '@/components/posts/PostCard'
import { TrainerProfileResponse } from '@/types/trainerProfile'
import { getMediaUrl } from '@/lib/config'
import { Toast } from '@/components/ui/Toast'
import { PhotoLightbox } from '@/components/ui/PhotoLightbox'
import { useUpsertPosts, usePostDispatch } from '@/contexts/PostStoreContext'
import { useAuth } from '@/features/auth/AuthContext'
import { useRealtimeScopeRefresh } from '@/lib/signalr/useRealtimeScopeRefresh'

export function TrainerHomeFeed() {
  const router = useRouter()
  const t = useTranslations('feed')
  const tp = useTranslations('posts')
  const tc = useTranslations('common')
  const tNav = useTranslations('nav')
  const upsertPosts = useUpsertPosts()
  const dispatch = usePostDispatch()
  const { user } = useAuth()
  const isNutritionist = user?.role === 'nutritionist'
  
  // Profile state
  const [profile, setProfile] = useState<TrainerProfileResponse | null>(null)
  const [profileLoading, setProfileLoading] = useState(true)
  
  // Load profile on mount
  useEffect(() => {
    loadProfile()
    
    const handleAvatarUpdate = () => { loadProfile() }
    window.addEventListener('trainerAvatarUpdated', handleAvatarUpdate)
    return () => window.removeEventListener('trainerAvatarUpdated', handleAvatarUpdate)
  }, [])
  
  const loadProfile = async () => {
    try {
      setProfileLoading(true)
      const data = await fetchTrainerProfile()
      setProfile(data)
    } catch (error) {
      console.error('Failed to load profile:', error)
    } finally {
      setProfileLoading(false)
    }
  }
  
  // Derived values from profile
  const trainerName = profile?.trainer?.fullName || tNav(isNutritionist ? 'nutritionist' : 'trainer')
  const trainerInitials = profile?.trainer?.initials || trainerName.charAt(0)
  const avatarUrl = getMediaUrl(profile?.trainer?.avatarUrl)
  
  // File input refs
  const photoInputRef = useRef<HTMLInputElement>(null)
  const videoInputRef = useRef<HTMLInputElement>(null)
  
  // State — only IDs; data in store
  const [feedLoading, setFeedLoading] = useState(true)
  const [isUploading, setIsUploading] = useState(false)
  const [uploadProgress, setUploadProgress] = useState<string | null>(null)
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null)
  const [feedPostIds, setFeedPostIds] = useState<string[]>([])
  const [playingVideoId, setPlayingVideoId] = useState<string | null>(null)
  const [viewingPhoto, setViewingPhoto] = useState<{ url: string; caption?: string } | null>(null)
  const [deletingPostId, setDeletingPostId] = useState<string | null>(null)

  // Load feed on mount
  useEffect(() => {
    loadFeed(true)
  }, [])

  const loadFeed = async (isInitial = false) => {
    try {
      if (isInitial) setFeedLoading(true)
      const response = await postsApi.getFeed(1, 20)
      const ids = upsertPosts(response.posts)
      setFeedPostIds(ids)
    } catch (error) {
      console.error('Failed to load feed:', error)
    } finally {
      if (isInitial) setFeedLoading(false)
    }
  }

  useRealtimeScopeRefresh(['posts', 'profile'], () => {
    loadFeed()
    loadProfile()
  })

  // Handle post deletion
  const handleDeletePost = async (postId: string) => {
    if (!confirm(tp('deleteConfirm'))) return

    try {
      setDeletingPostId(postId)
      console.log('[Delete] Attempting to delete post:', postId, 'userId:', user?.id)
      await postsApi.deletePost(postId)
      console.log('[Delete] Post deleted successfully:', postId)
      dispatch({ type: 'REMOVE_POST', postId })
      setFeedPostIds(prev => prev.filter(id => id !== postId))
      setToast({ message: tp('deleted'), type: 'success' })
    } catch (error) {
      console.error('[Delete] Failed to delete post:', postId, error)
      const message = error instanceof Error ? error.message : tp('deleteError')
      setToast({ message, type: 'error' })
    } finally {
      setDeletingPostId(null)
    }
  }

  // Handle file selection
  const handleFileSelect = async (event: React.ChangeEvent<HTMLInputElement>, type: PostType) => {
    const file = event.target.files?.[0]
    if (!file) return

    event.target.value = ''

    const validation = postsApi.validateFile(file, type)
    if (!validation.valid) {
      setToast({ message: validation.error!, type: 'error' })
      return
    }

    setIsUploading(true)
    setUploadProgress(type === PostType.Photo ? t('uploadingPhoto') : t('uploadingVideo'))

    try {
      const newPost = await postsApi.createMediaPost({ file, type })
      setToast({ message: t('postUploaded'), type: 'success' })
      const ids = upsertPosts([newPost])
      setFeedPostIds(prev => [...ids, ...prev])
    } catch (error) {
      const message = error instanceof Error ? error.message : t('uploadError')
      setToast({ message, type: 'error' })
    } finally {
      setIsUploading(false)
      setUploadProgress(null)
    }
  }

  return (
    <div className="space-y-4 pb-8">
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
      <div className="bg-surface-2 rounded-xl border border-border-subtle p-4">
        {/* Upload Progress */}
        {isUploading && uploadProgress && (
          <div className="mb-3 flex items-center gap-2.5 px-3 py-2.5 bg-[#f07915]/[0.06] border border-[#f07915]/10 rounded-lg">
            <Loader2 className="w-4 h-4 text-[#f07915] animate-spin" />
            <span className="text-sm text-muted-foreground">{uploadProgress}</span>
          </div>
        )}
        
        <div className="flex items-center gap-1.5">
          <button 
            onClick={() => photoInputRef.current?.click()}
            disabled={isUploading}
            className="flex-1 flex items-center justify-center gap-2 py-2.5 px-3 rounded-lg hover:bg-hover-overlay transition-all disabled:opacity-40 disabled:cursor-not-allowed group"
          >
            <ImageIcon className="w-5 h-5 text-[#f07915] group-hover:scale-110 transition-transform" strokeWidth={1.5} />
            <span className="text-[13px] font-medium text-muted-foreground group-hover:text-muted-foreground">{t('photo')}</span>
          </button>
          <div className="w-px h-6 bg-border-subtle" />
          <button 
            onClick={() => videoInputRef.current?.click()}
            disabled={isUploading}
            className="flex-1 flex items-center justify-center gap-2 py-2.5 px-3 rounded-lg hover:bg-hover-overlay transition-all disabled:opacity-40 disabled:cursor-not-allowed group"
          >
            <Video className="w-5 h-5 text-[#f07915] group-hover:scale-110 transition-transform" strokeWidth={1.5} />
            <span className="text-[13px] font-medium text-muted-foreground group-hover:text-muted-foreground">{t('video')}</span>
          </button>
          <div className="w-px h-6 bg-border-subtle" />
          <button 
            onClick={() => router.push('/trainer/achievements')}
            disabled={isUploading}
            className="flex-1 flex items-center justify-center gap-2 py-2.5 px-3 rounded-lg hover:bg-hover-overlay transition-all disabled:opacity-40 disabled:cursor-not-allowed group"
          >
            <Award className="w-5 h-5 text-amber-500 group-hover:scale-110 transition-transform" strokeWidth={1.5} />
            <span className="text-[13px] font-medium text-muted-foreground group-hover:text-muted-foreground">{t('achievement')}</span>
          </button>
        </div>
      </div>

      {/* Separator */}
      <div className="flex items-center gap-3 px-1">
        <div className="flex-1 h-px bg-gradient-to-r from-transparent via-white/[0.06] to-transparent" />
        <span className="text-[11px] text-gray-600 font-medium uppercase tracking-wider">{t('title')}</span>
        <div className="flex-1 h-px bg-gradient-to-r from-transparent via-white/[0.06] to-transparent" />
      </div>

      {/* Feed Posts or Empty State */}
      {feedLoading ? (
        <div className="flex items-center justify-center py-16">
          <Loader2 className="w-7 h-7 text-[#f07915] animate-spin" />
        </div>
      ) : feedPostIds.length > 0 ? (
        <div className="space-y-4">
          {feedPostIds.map((id) => (
            <PostCard
              key={id}
              postId={id}
              currentUserId={user?.id}
              showDeleteInHeader
              onDelete={handleDeletePost}
              deletingPostId={deletingPostId}
              onRepostSuccess={() => loadFeed()}
              playingVideoId={playingVideoId}
              onVideoToggle={setPlayingVideoId}
              onPhotoClick={(url, caption) => setViewingPhoto({ url, caption })}
            />
          ))}
        </div>
      ) : (
        <div className="bg-surface-2 rounded-xl border border-border-subtle p-16 text-center">
          <div className="w-14 h-14 rounded-full bg-border-subtle flex items-center justify-center mx-auto mb-4">
            <Flame className="w-7 h-7 text-gray-600" />
          </div>
          <h3 className="text-base font-semibold text-gray-200 mb-1.5">{t('noPosts')}</h3>
          <p className="text-sm text-faint-foreground max-w-xs mx-auto">{t('noPostsDescription')}</p>
        </div>
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
