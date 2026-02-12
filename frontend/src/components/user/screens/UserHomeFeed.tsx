'use client'

import { useRouter } from 'next/navigation'
import { 
  Image as ImageIcon,
  Video,
  Award,
  Flame,
  Loader2
} from 'lucide-react'
import { useState, useRef, useEffect } from 'react'
import { useUser } from '@/components/user/UserProvider'
import { postsApi } from '@/lib/api/postsApi'
import { PostType } from '@/types/post'
import { Toast } from '@/components/ui/Toast'
import { ComingSoonModal } from '@/components/ui/ComingSoonModal'
import { PhotoLightbox } from '@/components/ui/PhotoLightbox'
import { PostCard } from '@/components/posts/PostCard'
import { useUpsertPosts, usePostDispatch } from '@/contexts/PostStoreContext'

export function UserHomeFeed() {
  const router = useRouter()
  const { user } = useUser()
  const upsertPosts = useUpsertPosts()
  const dispatch = usePostDispatch()
  
  // File input refs
  const photoInputRef = useRef<HTMLInputElement>(null)
  const videoInputRef = useRef<HTMLInputElement>(null)
  
  // State — only keep ordered IDs; actual data lives in the store
  const [isUploading, setIsUploading] = useState(false)
  const [uploadProgress, setUploadProgress] = useState<string | null>(null)
  const [showAchievementModal, setShowAchievementModal] = useState(false)
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

  const handleDeletePost = async (postId: string) => {
    if (!confirm('Вы уверены, что хотите удалить эту публикацию?')) return
    try {
      setDeletingPostId(postId)
      await postsApi.deletePost(postId)
      dispatch({ type: 'REMOVE_POST', postId })
      setFeedPostIds(prev => prev.filter(id => id !== postId))
      setToast({ message: 'Публикация удалена', type: 'success' })
    } catch (error) {
      if (error instanceof Error && error.message.toLowerCase().includes('not found')) {
        dispatch({ type: 'REMOVE_POST', postId })
        setFeedPostIds(prev => prev.filter(id => id !== postId))
        setToast({ message: 'Публикация удалена', type: 'success' })
      } else {
        const message = error instanceof Error ? error.message : 'Не удалось удалить публикацию'
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
    setUploadProgress(type === PostType.Photo ? 'Загрузка фото...' : 'Загрузка видео...')

    try {
      const newPost = await postsApi.createMediaPost({ file, type })
      
      setToast({ message: 'Публикация загружена!', type: 'success' })
      
      // Add to store + prepend to feed
      const ids = upsertPosts([newPost])
      setFeedPostIds(prev => [...ids, ...prev])
      
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Ошибка загрузки'
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
            onClick={() => router.push('/user/profile')}
          >
            Поделитесь своим прогрессом...
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
            <span className="text-sm font-medium text-gray-300">Фото</span>
          </button>
          <button 
            onClick={() => videoInputRef.current?.click()}
            disabled={isUploading}
            className="flex-1 flex items-center justify-center gap-2 py-2 px-3 rounded hover:bg-white/5 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Video className="w-5 h-5 text-green-500" strokeWidth={1.5} />
            <span className="text-sm font-medium text-gray-300">Видео</span>
          </button>
          <button 
            onClick={() => setShowAchievementModal(true)}
            disabled={isUploading}
            className="flex-1 flex items-center justify-center gap-2 py-2 px-3 rounded hover:bg-white/5 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Award className="w-5 h-5 text-amber-500" strokeWidth={1.5} />
            <span className="text-sm font-medium text-gray-300">Достижение</span>
          </button>
        </div>
      </div>

      {/* Separator */}
      <div className="flex items-center gap-3 px-2">
        <div className="flex-1 h-px bg-white/10" />
        <span className="text-xs text-gray-500 font-medium">Лента</span>
        <div className="flex-1 h-px bg-white/10" />
      </div>

      {/* Feed Posts or Empty State */}
      {feedPostIds.length > 0 ? (
        <div className="space-y-3">
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
        <div className="bg-[#1A1A1A] rounded-lg border border-white/10 p-12 text-center">
          <div className="w-16 h-16 rounded-full bg-white/5 flex items-center justify-center mx-auto mb-4">
            <Flame className="w-8 h-8 text-gray-400" />
          </div>
          <h3 className="text-lg font-semibold text-white mb-2">Пока нет публикаций</h3>
          <p className="text-sm text-gray-400">Поделитесь своим прогрессом, чтобы вдохновить других!</p>
        </div>
      )}

      {/* Modals */}
      {showAchievementModal && (
        <ComingSoonModal 
          onClose={() => setShowAchievementModal(false)}
          title="Скоро!"
          message="Делитесь достижениями с друзьями. Эта функция будет доступна в следующем обновлении!"
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
