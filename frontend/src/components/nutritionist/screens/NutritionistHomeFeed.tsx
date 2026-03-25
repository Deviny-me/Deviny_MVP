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
import { fetchNutritionistProfile } from '@/lib/api/nutritionistProfileApi'
import { PostCard } from '@/components/posts/PostCard'
import { TrainerProfileResponse } from '@/types/trainerProfile'
import { getMediaUrl } from '@/lib/config'
import { Toast } from '@/components/ui/Toast'
import { PhotoLightbox } from '@/components/ui/PhotoLightbox'
import { useUpsertPosts, usePostDispatch } from '@/contexts/PostStoreContext'
import { useLevel } from '@/components/level/LevelProvider'
import { useAuth } from '@/features/auth/AuthContext'
import { useRealtimeScopeRefresh } from '@/lib/signalr/useRealtimeScopeRefresh'

export function NutritionistHomeFeed() {
  const router = useRouter()
  const t = useTranslations('feed')
  const tp = useTranslations('posts')
  const tNav = useTranslations('nav')
  const upsertPosts = useUpsertPosts()
  const dispatch = usePostDispatch()
  const { refreshLevel } = useLevel()
  const { user: authUser } = useAuth()
  
  // Profile state
  const [profile, setProfile] = useState<TrainerProfileResponse | null>(null)
  const [profileLoading, setProfileLoading] = useState(true)
  
  // Load profile on mount
  useEffect(() => {
    loadProfile()
    
    const handleAvatarUpdate = () => { loadProfile() }
    window.addEventListener('nutritionistAvatarUpdated', handleAvatarUpdate)
    return () => window.removeEventListener('nutritionistAvatarUpdated', handleAvatarUpdate)
  }, [])
  
  const loadProfile = async () => {
    try {
      setProfileLoading(true)
      const data = await fetchNutritionistProfile()
      setProfile(data)
    } catch (error) {
      console.error('Failed to load profile:', error)
    } finally {
      setProfileLoading(false)
    }
  }
  
  // Derived values from profile
  const nutritionistName = profile?.trainer?.fullName || tNav('nutritionist')
  const nutritionistInitials = profile?.trainer?.initials || nutritionistName.charAt(0)
  const avatarUrl = getMediaUrl(profile?.trainer?.avatarUrl)
  
  // File input refs
  const photoInputRef = useRef<HTMLInputElement>(null)
  const videoInputRef = useRef<HTMLInputElement>(null)
  
  // State — only IDs; data in store
  const [isUploading, setIsUploading] = useState(false)
  const [uploadProgress, setUploadProgress] = useState<string | null>(null)
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null)
  const [feedPostIds, setFeedPostIds] = useState<string[]>([])
  const [playingVideoId, setPlayingVideoId] = useState<string | null>(null)
  const [viewingPhoto, setViewingPhoto] = useState<{ url: string; caption?: string } | null>(null)
  const [deletingPostId, setDeletingPostId] = useState<string | null>(null)

  // Load feed on mount
  useEffect(() => {
    loadFeed()
  }, [])

  const loadFeed = async () => {
    try {
      const response = await postsApi.getFeed(1, 20)
      const ids = upsertPosts(response.posts)
      setFeedPostIds(ids)
    } catch (error) {
      console.error('Failed to load feed:', error)
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
      console.log('[Delete] Attempting to delete post:', postId, 'userId:', authUser?.id)
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
      // Refresh XP/level after posting
      await refreshLevel()
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
      <div className="bg-[#141414] rounded-xl border border-white/[0.06] p-4">
        {/* Upload Progress */}
        {isUploading && uploadProgress && (
          <div className="mb-3 flex items-center gap-2.5 px-3 py-2.5 bg-[#28bf68]/[0.06] border border-[#28bf68]/10 rounded-lg">
            <Loader2 className="w-4 h-4 text-[#28bf68] animate-spin" />
            <span className="text-sm text-gray-400">{uploadProgress}</span>
          </div>
        )}
        
        <div className="flex items-center gap-2">
          <button 
            onClick={() => photoInputRef.current?.click()}
            disabled={isUploading}
            className="flex-1 flex items-center justify-center gap-2 py-2.5 px-3 rounded-lg hover:bg-white/[0.04] transition-all disabled:opacity-40 disabled:cursor-not-allowed group"
          >
            <ImageIcon className="w-5 h-5 text-[#28bf68]" strokeWidth={1.5} />
            <span className="text-sm font-medium text-gray-300">{t('photo')}</span>
          </button>
          <button 
            onClick={() => videoInputRef.current?.click()}
            disabled={isUploading}
            className="flex-1 flex items-center justify-center gap-2 py-2.5 px-3 rounded-lg hover:bg-white/[0.04] transition-all disabled:opacity-40 disabled:cursor-not-allowed group"
          >
            <Video className="w-5 h-5 text-green-500" strokeWidth={1.5} />
            <span className="text-sm font-medium text-gray-300">{t('video')}</span>
          </button>
          <button 
            onClick={() => router.push('/nutritionist/achievements')}
            disabled={isUploading}
            className="flex-1 flex items-center justify-center gap-2 py-2.5 px-3 rounded-lg hover:bg-white/[0.04] transition-all disabled:opacity-40 disabled:cursor-not-allowed group"
          >
            <Award className="w-5 h-5 text-green-500" strokeWidth={1.5} />
            <span className="text-sm font-medium text-gray-300">{t('achievement')}</span>
          </button>
        </div>
      </div>

      {/* Separator */}
      <div className="flex items-center gap-3 px-2">
        <div className="flex-1 h-px bg-gradient-to-r from-transparent via-white/[0.06] to-transparent" />
        <span className="text-[11px] text-gray-600 font-medium uppercase tracking-wider">{t('title')}</span>
        <div className="flex-1 h-px bg-gradient-to-r from-transparent via-white/[0.06] to-transparent" />
      </div>

      {/* Feed Posts or Empty State */}
      {feedPostIds.length > 0 ? (
        <div className="space-y-4">
          {feedPostIds.map((id) => (
            <PostCard
              key={id}
              postId={id}
              currentUserId={authUser?.id}
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
        <div className="bg-[#141414] rounded-xl border border-white/[0.06] p-16 text-center">
          <div className="w-14 h-14 rounded-full bg-white/[0.04] flex items-center justify-center mx-auto mb-4">
            <Flame className="w-7 h-7 text-gray-600" />
          </div>
          <h3 className="text-base font-semibold text-gray-200 mb-1.5">{t('noPosts')}</h3>
          <p className="text-sm text-gray-500 max-w-xs mx-auto">{t('noPostsDescription')}</p>
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
