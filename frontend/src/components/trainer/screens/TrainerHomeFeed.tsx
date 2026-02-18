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

export function TrainerHomeFeed() {
  const router = useRouter()
  const t = useTranslations('feed')
  const tp = useTranslations('posts')
  const tc = useTranslations('common')
  const upsertPosts = useUpsertPosts()
  const dispatch = usePostDispatch()
  
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
  const trainerName = profile?.trainer?.fullName || 'Trainer'
  const trainerInitials = profile?.trainer?.initials || trainerName.charAt(0)
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

  // Handle post deletion
  const handleDeletePost = async (postId: string) => {
    if (!confirm(tp('deleteConfirm'))) return

    try {
      setDeletingPostId(postId)
      await postsApi.deletePost(postId)
      dispatch({ type: 'REMOVE_POST', postId })
      setFeedPostIds(prev => prev.filter(id => id !== postId))
      setToast({ message: tp('deleted'), type: 'success' })
    } catch (error) {
      if (error instanceof Error && error.message.toLowerCase().includes('not found')) {
        dispatch({ type: 'REMOVE_POST', postId })
        setFeedPostIds(prev => prev.filter(id => id !== postId))
        setToast({ message: tp('deleted'), type: 'success' })
      } else {
        const message = error instanceof Error ? error.message : tp('deleteError')
        setToast({ message, type: 'error' })
      }
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
          {avatarUrl ? (
            <img 
              src={avatarUrl} 
              alt={trainerName}
              className="w-12 h-12 rounded-full object-cover"
            />
          ) : (
            <div className="w-12 h-12 rounded-full bg-gradient-to-br from-[#FF6B35] to-[#FF0844] flex items-center justify-center">
              <span className="text-white font-bold text-lg">{trainerInitials}</span>
            </div>
          )}
          <button 
            className="flex-1 px-4 py-3 bg-[#0A0A0A] hover:bg-[#262626] border border-white/10 rounded-full text-left text-sm text-gray-400 transition-colors"
            onClick={() => router.push('/trainer/profile')}
          >
            {t('shareProgress')}
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
            <span className="text-sm font-medium text-gray-300">{t('photo')}</span>
          </button>
          <button 
            onClick={() => videoInputRef.current?.click()}
            disabled={isUploading}
            className="flex-1 flex items-center justify-center gap-2 py-2 px-3 rounded hover:bg-white/5 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Video className="w-5 h-5 text-green-500" strokeWidth={1.5} />
            <span className="text-sm font-medium text-gray-300">{t('video')}</span>
          </button>
          <button 
            onClick={() => router.push('/trainer/achievements')}
            disabled={isUploading}
            className="flex-1 flex items-center justify-center gap-2 py-2 px-3 rounded hover:bg-white/5 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Award className="w-5 h-5 text-amber-500" strokeWidth={1.5} />
            <span className="text-sm font-medium text-gray-300">{t('achievement')}</span>
          </button>
        </div>
      </div>

      {/* Separator */}
      <div className="flex items-center gap-3 px-2">
        <div className="flex-1 h-px bg-white/10" />
        <span className="text-xs text-gray-500 font-medium">{t('title')}</span>
        <div className="flex-1 h-px bg-white/10" />
      </div>

      {/* Feed Posts or Empty State */}
      {feedPostIds.length > 0 ? (
        <div className="space-y-3">
          {feedPostIds.map((id) => (
            <PostCard
              key={id}
              postId={id}
              currentUserId={profile?.trainer?.userId}
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
        <div className="bg-[#1A1A1A] rounded-lg border border-white/10 p-12 text-center">
          <div className="w-16 h-16 rounded-full bg-white/5 flex items-center justify-center mx-auto mb-4">
            <Flame className="w-8 h-8 text-gray-400" />
          </div>
          <h3 className="text-lg font-semibold text-white mb-2">{t('noPosts')}</h3>
          <p className="text-sm text-gray-400">{t('noPostsDescription')}</p>
        </div>
      )}

      {/* Modals */}
      {showAchievementModal && (
        <ComingSoonModal 
          onClose={() => setShowAchievementModal(false)}
          title={tc('comingSoon')}
          message={t('achievementComingSoon')}
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
