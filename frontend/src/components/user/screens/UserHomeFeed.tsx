'use client'

import { useRouter } from 'next/navigation'
import { 
  Image as ImageIcon,
  Video,
  Award,
  Flame,
  Loader2,
  Upload,
} from 'lucide-react'
import { useState, useRef, useEffect } from 'react'
import { useUser } from '@/components/user/UserProvider'
import { postsApi } from '@/lib/api/postsApi'
import { PostType } from '@/types/post'
import { Toast } from '@/components/ui/Toast'
import { PhotoLightbox } from '@/components/ui/PhotoLightbox'
import { PostCard } from '@/components/posts/PostCard'
import { useUpsertPosts, usePostDispatch } from '@/contexts/PostStoreContext'
import { useTranslations } from 'next-intl'
import { useRealtimeScopeRefresh } from '@/lib/signalr/useRealtimeScopeRefresh'

export function UserHomeFeed() {
  const router = useRouter()
  const { user } = useUser()
  const upsertPosts = useUpsertPosts()
  const dispatch = usePostDispatch()
  const tf = useTranslations('feed')
  const tPosts = useTranslations('posts')
  
  // File input refs
  const photoInputRef = useRef<HTMLInputElement>(null)
  const videoInputRef = useRef<HTMLInputElement>(null)
  
  // State — only keep ordered IDs; actual data lives in the store
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

  useRealtimeScopeRefresh(['posts'], () => {
    loadFeed()
  })

  const handleDeletePost = async (postId: string) => {
    if (!confirm(tPosts('deleteConfirm'))) return
    try {
      setDeletingPostId(postId)
      await postsApi.deletePost(postId)
      dispatch({ type: 'REMOVE_POST', postId })
      setFeedPostIds(prev => prev.filter(id => id !== postId))
      setToast({ message: tPosts('deleted'), type: 'success' })
    } catch (error) {
      console.error('[Delete] Failed to delete post:', postId, error)
      const message = error instanceof Error ? error.message : tPosts('deleteError')
      setToast({ message, type: 'error' })
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
    setUploadProgress(type === PostType.Photo ? tf('uploadingPhoto') : tf('uploadingVideo'))

    try {
      const newPost = await postsApi.createMediaPost({ file, type })
      
      setToast({ message: tf('postUploaded'), type: 'success' })
      
      // Add to store + prepend to feed
      const ids = upsertPosts([newPost])
      setFeedPostIds(prev => [...ids, ...prev])
      
    } catch (error) {
      const message = error instanceof Error ? error.message : tf('uploadError')
      setToast({ message, type: 'error' })
    } finally {
      setIsUploading(false)
      setUploadProgress(null)
    }
  }

  return (
    <div className="space-y-5 pb-8">
      <div>
        <h1 className="page-title">{tf('title')}</h1>
        <p className="page-subtitle">{tf('noPostsDescription')}</p>
      </div>

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
      <section className="bg-surface-2 rounded-2xl border border-border-subtle p-4 sm:p-5">
        {/* Upload Progress */}
        {isUploading && uploadProgress && (
          <div className="mb-3 flex items-center gap-2.5 px-3 py-2.5 bg-[#0c8de6]/[0.06] border border-[#0c8de6]/10 rounded-lg">
            <Loader2 className="w-4 h-4 text-[#0c8de6] animate-spin" />
            <span className="text-sm text-muted-foreground">{uploadProgress}</span>
          </div>
        )}

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
          <button 
            onClick={() => photoInputRef.current?.click()}
            disabled={isUploading}
            className="group flex min-h-[52px] items-center justify-between gap-3 rounded-xl border border-dashed border-[rgba(148,163,184,0.22)] bg-background px-3.5 py-3 text-left shadow-[0_1px_0_rgba(255,255,255,0.03)] transition-all hover:border-[#0c8de6]/35 hover:bg-[#0c8de6]/[0.05] active:scale-[0.99] disabled:cursor-not-allowed disabled:opacity-40"
          >
            <span className="flex items-center gap-2.5">
              <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-[#0c8de6]/12 transition-colors group-hover:bg-[#0c8de6]/18">
                <ImageIcon className="h-4.5 w-4.5 text-[#0c8de6] transition-transform group-hover:scale-110" strokeWidth={1.9} />
              </span>
              <span className="text-[13px] font-semibold text-foreground">{tf('photo')}</span>
            </span>
            <Upload className="h-4 w-4 text-faint-foreground transition-transform group-hover:-translate-y-0.5 group-hover:text-[#0c8de6]" />
          </button>
          <button 
            onClick={() => videoInputRef.current?.click()}
            disabled={isUploading}
            className="group flex min-h-[52px] items-center justify-between gap-3 rounded-xl border border-dashed border-[rgba(148,163,184,0.22)] bg-background px-3.5 py-3 text-left shadow-[0_1px_0_rgba(255,255,255,0.03)] transition-all hover:border-[#0c8de6]/35 hover:bg-[#0c8de6]/[0.05] active:scale-[0.99] disabled:cursor-not-allowed disabled:opacity-40"
          >
            <span className="flex items-center gap-2.5">
              <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-[#0c8de6]/12 transition-colors group-hover:bg-[#0c8de6]/18">
                <Video className="h-4.5 w-4.5 text-[#0c8de6] transition-transform group-hover:scale-110" strokeWidth={1.9} />
              </span>
              <span className="text-[13px] font-semibold text-foreground">{tf('video')}</span>
            </span>
            <Upload className="h-4 w-4 text-faint-foreground transition-transform group-hover:-translate-y-0.5 group-hover:text-[#0c8de6]" />
          </button>
          <button 
            onClick={() => router.push('/user/achievements')}
            disabled={isUploading}
            className="group flex min-h-[52px] items-center justify-between gap-3 rounded-xl border border-dashed border-[rgba(148,163,184,0.22)] bg-background px-3.5 py-3 text-left shadow-[0_1px_0_rgba(255,255,255,0.03)] transition-all hover:border-[#0c8de6]/35 hover:bg-[#0c8de6]/[0.05] active:scale-[0.99] disabled:cursor-not-allowed disabled:opacity-40"
          >
            <span className="flex items-center gap-2.5">
              <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-[#0c8de6]/12 transition-colors group-hover:bg-[#0c8de6]/18">
                <Award className="h-4.5 w-4.5 text-[#0c8de6] transition-transform group-hover:scale-110" strokeWidth={1.9} />
              </span>
              <span className="text-[13px] font-semibold text-foreground">{tf('achievement')}</span>
            </span>
            <Upload className="h-4 w-4 text-faint-foreground transition-transform group-hover:-translate-y-0.5 group-hover:text-[#0c8de6]" />
          </button>
        </div>
      </section>

      {/* Feed Posts or Empty State */}
      {feedLoading ? (
        <div className="flex items-center justify-center py-16">
          <Loader2 className="w-7 h-7 text-[#0c8de6] animate-spin" />
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
        <div className="bg-surface-2 rounded-2xl border border-border-subtle p-8 sm:p-16 text-center">
          <div className="w-14 h-14 rounded-full bg-border-subtle flex items-center justify-center mx-auto mb-4">
            <Flame className="w-7 h-7 text-gray-600" />
          </div>
          <h3 className="text-base font-semibold text-foreground mb-1.5">{tf('noPosts')}</h3>
          <p className="text-sm text-faint-foreground max-w-xs mx-auto">{tf('noPostsDescription')}</p>
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
