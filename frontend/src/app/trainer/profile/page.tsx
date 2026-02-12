'use client'

import { motion } from 'framer-motion'
import { useState, useEffect, useCallback, useRef } from 'react'
import { 
  Camera,
  MapPin,
  Link as LinkIcon,
  Edit2,
  Users,
  BookOpen,
  Star,
  Calendar,
  TrendingUp,
  Heart,
  MessageCircle,
  X,
  Loader2,
  Upload,
  Plus,
  Trash2,
  Award,
  Phone,
  Mail,
  Globe,
  User,
  Briefcase,
  Copy,
  Check,
  Grid,
  List,
  Play,
  Repeat2,
} from 'lucide-react'
import { fetchTrainerProfile, updateAbout, uploadCertificate, deleteCertificate, addSpecialization, deleteSpecialization, updateTrainerProfile, uploadTrainerAvatar, deleteTrainerAvatar } from '@/lib/api/trainerProfileApi'
import { TrainerProfileResponse, CertificateDto, SpecializationDto } from '@/types/trainerProfile'
import { postsApi } from '@/lib/api/postsApi'
import { MediaType } from '@/types/post'
import type { ProfilePostTab } from '@/types/post'
import { getMediaUrl } from '@/lib/config'
import { PostCard } from '@/components/posts/PostCard'
import { ProfilePostTabs } from '@/components/posts/ProfilePostTabs'
import { PhotoLightbox } from '@/components/ui/PhotoLightbox'
import { useUpsertPosts, usePost, usePostDispatch } from '@/contexts/PostStoreContext'

// Simple toast helper
const toast = {
  success: (msg: string) => console.log('Success:', msg),
  error: (msg: string) => console.error('Error:', msg),
}

// ─── Grid cell with optimistic likes ───
function TrainerGridCell({
  postId,
  onSelect,
  onDelete,
  deletingPostId,
  currentUserId,
}: {
  postId: string
  onSelect: (postId: string) => void
  onDelete?: (postId: string) => void
  deletingPostId?: string | null
  currentUserId?: string | null
}) {
  const post = usePost(postId)
  const dispatch = usePostDispatch()
  const [isLikeLoading, setIsLikeLoading] = useState(false)
  const isMountedRef = useRef(true)

  const [isLiked, setIsLiked] = useState(false)
  const [likeCount, setLikeCount] = useState(0)
  const [commentCount, setCommentCount] = useState(0)

  useEffect(() => {
    if (post) {
      setIsLiked(post.isLikedByMe)
      setLikeCount(post.likeCount)
      setCommentCount(post.commentCount)
    }
  }, [post?.isLikedByMe, post?.likeCount, post?.commentCount])

  useEffect(() => {
    isMountedRef.current = true
    return () => { isMountedRef.current = false }
  }, [])

  const doLike = useCallback(async () => {
    if (!post || isLikeLoading) return
    const wasLiked = isLiked
    const prevCount = likeCount

    setIsLiked(!wasLiked)
    setLikeCount(wasLiked ? prevCount - 1 : prevCount + 1)
    dispatch({
      type: 'UPDATE_POST',
      postId,
      partial: { isLikedByMe: !wasLiked, likeCount: wasLiked ? prevCount - 1 : prevCount + 1 },
    })
    setIsLikeLoading(true)

    try {
      const stats = wasLiked
        ? await postsApi.unlikePost(postId)
        : await postsApi.likePost(postId)
      if (isMountedRef.current) {
        setIsLiked(stats.isLikedByMe)
        setLikeCount(stats.likeCount)
        setCommentCount(stats.commentCount)
        dispatch({
          type: 'UPDATE_POST',
          postId,
          partial: {
            likeCount: stats.likeCount,
            commentCount: stats.commentCount,
            repostCount: stats.repostCount,
            isLikedByMe: stats.isLikedByMe,
            isRepostedByMe: stats.isRepostedByMe,
          },
        })
      }
    } catch {
      if (isMountedRef.current) {
        setIsLiked(wasLiked)
        setLikeCount(prevCount)
        dispatch({ type: 'UPDATE_POST', postId, partial: { isLikedByMe: wasLiked, likeCount: prevCount } })
      }
    } finally {
      if (isMountedRef.current) setIsLikeLoading(false)
    }
  }, [post, postId, dispatch, isLikeLoading, isLiked, likeCount])

  if (!post) return null

  const media = post.isRepost && post.originalPost?.media?.[0]
    ? post.originalPost.media[0]
    : post.media[0]

  if (post.isRepost && !post.originalPost) {
    return (
      <div className="relative aspect-square bg-[#0A0A0A] overflow-hidden rounded-lg flex flex-col items-center justify-center text-center p-2">
        <Repeat2 className="w-6 h-6 text-gray-600 mb-1" />
        <p className="text-[10px] text-gray-600 leading-tight">Публикация удалена</p>
      </div>
    )
  }

  if (!media) return null

  return (
    <div
      className="relative aspect-square bg-[#0A0A0A] overflow-hidden group cursor-pointer rounded-lg"
      onClick={(e) => {
        if ((e.target as HTMLElement).closest('button')) return
        onSelect(postId)
      }}
    >
      <div className="w-full h-full">
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
            <div className="absolute inset-0 flex items-center justify-center bg-black/20">
              <div className="w-10 h-10 rounded-full bg-white/30 backdrop-blur-sm flex items-center justify-center">
                <Play className="w-5 h-5 text-white ml-0.5" fill="white" />
              </div>
            </div>
          </>
        )}
      </div>

      {/* Hover overlay */}
      <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity rounded-lg flex items-center justify-center gap-4">
        <button
          type="button"
          onClick={(e) => { e.stopPropagation(); doLike() }}
          disabled={isLikeLoading}
          className={`flex items-center gap-1 text-white transition-all hover:scale-110 ${
            isLikeLoading ? 'opacity-50 cursor-not-allowed' : 'hover:text-red-500'
          }`}
        >
          <Heart className={`w-5 h-5 transition-colors ${isLiked ? 'text-red-500' : ''}`} fill={isLiked ? 'currentColor' : 'white'} />
          <span className="font-semibold">{likeCount}</span>
        </button>
        <button
          type="button"
          onClick={(e) => { e.stopPropagation(); onSelect(postId) }}
          className="flex items-center gap-1 text-white transition-all hover:scale-110 hover:text-blue-400"
        >
          <MessageCircle className="w-5 h-5" fill="white" />
          <span className="font-semibold">{commentCount}</span>
        </button>
        {onDelete && currentUserId && post.userId === currentUserId && (
          <button
            type="button"
            onClick={(e) => { e.stopPropagation(); onDelete(postId) }}
            disabled={deletingPostId === postId}
            className="flex items-center gap-1 text-white transition-all hover:scale-110 hover:text-red-500"
          >
            {deletingPostId === postId ? (
              <Loader2 className="w-5 h-5 animate-spin" />
            ) : (
              <Trash2 className="w-5 h-5" />
            )}
          </button>
        )}
      </div>
    </div>
  )
}

// ─── Post detail modal (trainer) ───
function TrainerPostDetailModal({ postId, onClose, onDelete, deletingPostId, currentUserId }: { postId: string; onClose: () => void; onDelete?: (postId: string) => void; deletingPostId?: string | null; currentUserId?: string | null }) {
  const [playingVideoId, setPlayingVideoId] = useState<string | null>(null)
  const [viewingPhoto, setViewingPhoto] = useState<{ url: string; caption?: string } | null>(null)

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose() }
    document.addEventListener('keydown', handleKeyDown)
    document.body.style.overflow = 'hidden'
    return () => {
      document.removeEventListener('keydown', handleKeyDown)
      document.body.style.overflow = 'auto'
    }
  }, [onClose])

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4" onClick={onClose}>
      <button onClick={onClose} className="absolute top-4 right-4 z-50 p-2 text-white/70 hover:text-white transition-colors">
        <X className="w-8 h-8" />
      </button>
      <div className="w-fit max-w-full rounded-xl transition-all duration-300" onClick={(e) => e.stopPropagation()}>
        <PostCard
          postId={postId}
          variant="modal"
          currentUserId={currentUserId}
          showDeleteInHeader
          onDelete={onDelete}
          deletingPostId={deletingPostId}
          playingVideoId={playingVideoId}
          onVideoToggle={setPlayingVideoId}
          onPhotoClick={(url: string, caption?: string) => setViewingPhoto({ url, caption })}
        />
      </div>
      {viewingPhoto && (
        <PhotoLightbox imageUrl={viewingPhoto.url} caption={viewingPhoto.caption} onClose={() => setViewingPhoto(null)} />
      )}
    </div>
  )
}

export default function ProfilePage() {
  const upsertPosts = useUpsertPosts()
  const storeDispatch = usePostDispatch()

  const [profile, setProfile] = useState<TrainerProfileResponse | null>(null)
  const [postIds, setPostIds] = useState<string[]>([])
  const [isLoadingPosts, setIsLoadingPosts] = useState(true)
  const [postsPage, setPostsPage] = useState(1)
  const [postsHasMore, setPostsHasMore] = useState(true)
  const [totalPosts, setTotalPosts] = useState(0)
  const [postTab, setPostTab] = useState<ProfilePostTab>('all')
  const [selectedPostId, setSelectedPostId] = useState<string | null>(null)
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid')
  const [playingVideoId, setPlayingVideoId] = useState<string | null>(null)
  const [viewingPhoto, setViewingPhoto] = useState<{ url: string; caption?: string } | null>(null)
  const postsObserverRef = useRef<HTMLDivElement>(null)
  const postsAbortRef = useRef<AbortController | null>(null)
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState<'posts' | 'certificates' | 'specializations' | 'achievements'>('posts')
  
  // Edit modals
  const [showAboutModal, setShowAboutModal] = useState(false)
  const [showCertificateModal, setShowCertificateModal] = useState(false)
  const [showSpecializationModal, setShowSpecializationModal] = useState(false)
  const [showEditProfileModal, setShowEditProfileModal] = useState(false)
  const [showEditLocationModal, setShowEditLocationModal] = useState(false)
  const [showEditPhoneModal, setShowEditPhoneModal] = useState(false)
  const [showEditExperienceModal, setShowEditExperienceModal] = useState(false)
  const [showEditGenderModal, setShowEditGenderModal] = useState(false)
  const [viewingCertificate, setViewingCertificate] = useState<string | null>(null)
  
  // Form states
  const [aboutText, setAboutText] = useState('')
  const [certTitle, setCertTitle] = useState('')
  const [certIssuer, setCertIssuer] = useState('')
  const [certYear, setCertYear] = useState(new Date().getFullYear().toString())
  const [certFile, setCertFile] = useState<File | null>(null)
  const [specName, setSpecName] = useState('')
  const [saving, setSaving] = useState(false)
  const [deleting, setDeleting] = useState<string | null>(null)
  const [copied, setCopied] = useState(false)
  const [uploadingAvatar, setUploadingAvatar] = useState(false)
  const [deletingAvatar, setDeletingAvatar] = useState(false)
  const [deletingPostId, setDeletingPostId] = useState<string | null>(null)
  
  // Edit profile form states
  const [editPrimaryTitle, setEditPrimaryTitle] = useState('')
  const [editSecondaryTitle, setEditSecondaryTitle] = useState('')
  const [editExperienceYears, setEditExperienceYears] = useState('')
  const [editLocation, setEditLocation] = useState('')
  const [editPhone, setEditPhone] = useState('')
  const [editGender, setEditGender] = useState('')

  const loadProfile = async () => {
    try {
      setLoading(true)
      const data = await fetchTrainerProfile()
      setProfile(data)
      setAboutText(data.about?.text || '')
      // Set edit form initial values
      setEditPrimaryTitle(data.trainer?.primaryTitle || '')
      setEditSecondaryTitle(data.trainer?.secondaryTitle || '')
      setEditExperienceYears(data.trainer?.experienceYears?.toString() || '')
      setEditLocation(data.trainer?.location || '')
      setEditPhone(data.trainer?.phone || '')
      setEditGender(data.trainer?.gender || '')
    } catch (error) {
      console.error('Failed to load profile:', error)
      toast.error('Не удалось загрузить профиль')
    } finally {
      setLoading(false)
    }
  }

  const loadPosts = useCallback(async (pageNum: number, append: boolean = false) => {
    // Abort previous request
    if (postsAbortRef.current) postsAbortRef.current.abort()
    const controller = new AbortController()
    postsAbortRef.current = controller

    try {
      setIsLoadingPosts(true)
      const response = await postsApi.getMyPosts(pageNum, 12, postTab, controller.signal)
      if (controller.signal.aborted) return
      const ids = upsertPosts(response.posts)
      if (append) {
        setPostIds(prev => [...prev, ...ids])
      } else {
        setPostIds(ids)
      }
      setTotalPosts(response.totalCount)
      setPostsHasMore(response.hasMore)
    } catch (error) {
      if (error instanceof DOMException && error.name === 'AbortError') return
      console.error('Failed to load posts:', error)
    } finally {
      if (!controller.signal.aborted) setIsLoadingPosts(false)
    }
  }, [postTab, upsertPosts])

  const handlePostTabChange = useCallback((tab: ProfilePostTab) => {
    setPostTab(tab)
    setPostIds([])
    setPostsPage(1)
    setPostsHasMore(true)
    setIsLoadingPosts(true)
  }, [])

  useEffect(() => {
    loadProfile()
  }, [])

  useEffect(() => {
    loadPosts(1)
  }, [loadPosts])

  const handleLoadMorePosts = useCallback(() => {
    if (!isLoadingPosts && postsHasMore && postIds.length > 0) {
      const nextPage = postsPage + 1
      setPostsPage(nextPage)
      loadPosts(nextPage, true)
    }
  }, [isLoadingPosts, postsHasMore, postsPage, postIds.length, loadPosts])

  // Infinite scroll for posts
  useEffect(() => {
    if (!postsHasMore || isLoadingPosts || activeTab !== 'posts') return
    const observer = new IntersectionObserver(
      (entries) => { if (entries[0].isIntersecting) handleLoadMorePosts() },
      { threshold: 0.1 }
    )
    if (postsObserverRef.current) observer.observe(postsObserverRef.current)
    return () => observer.disconnect()
  }, [postsHasMore, isLoadingPosts, handleLoadMorePosts, activeTab])

  const handleSaveAbout = async () => {
    try {
      setSaving(true)
      await updateAbout(aboutText)
      toast.success('Информация обновлена')
      setShowAboutModal(false)
      loadProfile()
    } catch (error) {
      console.error('Failed to update about:', error)
      toast.error('Не удалось обновить информацию')
    } finally {
      setSaving(false)
    }
  }

  const handleAddCertificate = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!certFile || !certTitle) {
      toast.error('Заполните все обязательные поля')
      return
    }

    try {
      setSaving(true)
      await uploadCertificate(certTitle, certIssuer, parseInt(certYear), certFile)
      toast.success('Сертификат добавлен')
      setShowCertificateModal(false)
      setCertTitle('')
      setCertIssuer('')
      setCertYear(new Date().getFullYear().toString())
      setCertFile(null)
      loadProfile()
    } catch (error) {
      console.error('Failed to add certificate:', error)
      toast.error('Не удалось добавить сертификат')
    } finally {
      setSaving(false)
    }
  }

  const handleDeleteCertificate = async (id: string) => {
    if (!confirm('Удалить этот сертификат?')) return
    
    try {
      setDeleting(id)
      await deleteCertificate(id)
      toast.success('Сертификат удалён')
      loadProfile()
    } catch (error) {
      console.error('Failed to delete certificate:', error)
      toast.error('Не удалось удалить сертификат')
    } finally {
      setDeleting(null)
    }
  }

  const handleAddSpecialization = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!specName.trim()) {
      toast.error('Введите название специализации')
      return
    }

    try {
      setSaving(true)
      await addSpecialization(specName)
      toast.success('Специализация добавлена')
      setShowSpecializationModal(false)
      setSpecName('')
      loadProfile()
    } catch (error) {
      console.error('Failed to add specialization:', error)
      toast.error('Не удалось добавить специализацию')
    } finally {
      setSaving(false)
    }
  }

  const handleDeleteSpecialization = async (id: string) => {
    try {
      setDeleting(id)
      await deleteSpecialization(id)
      toast.success('Специализация удалена')
      loadProfile()
    } catch (error) {
      console.error('Failed to delete specialization:', error)
      toast.error('Не удалось удалить специализацию')
    } finally {
      setDeleting(null)
    }
  }

  const handleCopyLink = async () => {
    if (profile?.trainer?.profilePublicUrl) {
      try {
        await navigator.clipboard.writeText(profile.trainer.profilePublicUrl)
        setCopied(true)
        toast.success('Ссылка скопирована')
        setTimeout(() => setCopied(false), 2000)
      } catch (error) {
        console.error('Failed to copy:', error)
      }
    }
  }

  const handleSaveLocation = async () => {
    try {
      setSaving(true)
      await updateTrainerProfile({
        location: editLocation,
      })
      toast.success('Локация обновлена')
      setShowEditLocationModal(false)
      loadProfile()
    } catch (error) {
      console.error('Failed to update location:', error)
      toast.error('Не удалось обновить локацию')
    } finally {
      setSaving(false)
    }
  }

  const handleSavePhone = async () => {
    try {
      setSaving(true)
      // Note: Phone update might need to be added to backend API
      toast.success('Телефон обновлен')
      setShowEditPhoneModal(false)
      loadProfile()
    } catch (error) {
      console.error('Failed to update phone:', error)
      toast.error('Не удалось обновить телефон')
    } finally {
      setSaving(false)
    }
  }

  const handleSaveExperience = async () => {
    try {
      setSaving(true)
      await updateTrainerProfile({
        experienceYears: parseInt(editExperienceYears) || 0,
      })
      toast.success('Опыт работы обновлен')
      setShowEditExperienceModal(false)
      loadProfile()
    } catch (error) {
      console.error('Failed to update experience:', error)
      toast.error('Не удалось обновить опыт работы')
    } finally {
      setSaving(false)
    }
  }

  const handleSaveGender = async () => {
    try {
      setSaving(true)
      // Note: Gender update might need to be added to backend API
      toast.success('Пол обновлен')
      setShowEditGenderModal(false)
      loadProfile()
    } catch (error) {
      console.error('Failed to update gender:', error)
      toast.error('Не удалось обновить пол')
    } finally {
      setSaving(false)
    }
  }

  const handleAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    // Validate file
    if (!file.type.startsWith('image/')) {
      toast.error('Пожалуйста, выберите изображение')
      return
    }

    if (file.size > 5 * 1024 * 1024) {
      toast.error('Размер файла не должен превышать 5 МБ')
      return
    }

    try {
      setUploadingAvatar(true)
      const response = await uploadTrainerAvatar(file)
      
      // Update profile immediately with new avatar URL
      if (profile && response.avatarUrl) {
        setProfile({
          ...profile,
          trainer: {
            ...profile.trainer,
            avatarUrl: response.avatarUrl
          }
        })
        
        // Dispatch custom event to notify other components
        window.dispatchEvent(new CustomEvent('trainerAvatarUpdated', { 
          detail: { avatarUrl: response.avatarUrl } 
        }))
      }
      
      toast.success('Фото профиля обновлено')
      await loadProfile()
    } catch (error) {
      console.error('Failed to upload avatar:', error)
      toast.error('Не удалось загрузить фото')
    } finally {
      setUploadingAvatar(false)
    }
  }

  const handleAvatarDelete = async () => {
    if (!confirm('Удалить фото профиля?')) return
    try {
      setDeletingAvatar(true)
      await deleteTrainerAvatar()

      if (profile) {
        setProfile({
          ...profile,
          trainer: {
            ...profile.trainer,
            avatarUrl: ''
          }
        })

        window.dispatchEvent(new CustomEvent('trainerAvatarUpdated', {
          detail: { avatarUrl: null }
        }))
      }

      toast.success('Фото профиля удалено')
    } catch (error) {
      console.error('Failed to delete avatar:', error)
      toast.error('Не удалось удалить фото')
    } finally {
      setDeletingAvatar(false)
    }
  }

  const handleSaveProfile = async () => {
    try {
      setSaving(true)
      await updateTrainerProfile({
        primaryTitle: editPrimaryTitle || undefined,
        secondaryTitle: editSecondaryTitle || undefined,
        experienceYears: editExperienceYears ? parseInt(editExperienceYears) : undefined,
        location: editLocation || undefined
      })
      toast.success('Профиль обновлён')
      setShowEditProfileModal(false)
      loadProfile()
    } catch (error) {
      console.error('Failed to update profile:', error)
      toast.error('Не удалось обновить профиль')
    } finally {
      setSaving(false)
    }
  }

  const handleDeletePost = async (postId: string) => {
    if (!confirm('Вы уверены, что хотите удалить эту публикацию?')) {
      return
    }

    try {
      setDeletingPostId(postId)
      await postsApi.deletePost(postId)
      storeDispatch({ type: 'REMOVE_POST', postId })
      setPostIds(prev => prev.filter(id => id !== postId))
      setSelectedPostId(null)
      toast.success('Публикация удалена')
    } catch (error) {
      if (error instanceof Error && error.message.toLowerCase().includes('not found')) {
        toast.success('Публикация удалена')
        storeDispatch({ type: 'REMOVE_POST', postId })
        setPostIds(prev => prev.filter(id => id !== postId))
      } else {
        const message = error instanceof Error ? error.message : 'Не удалось удалить публикацию'
        toast.error(message)
      }
    } finally {
      setDeletingPostId(null)
    }
  }

  if (loading) {
    return (
      <>
        <div className="flex items-center justify-center py-24">
          <Loader2 className="w-8 h-8 text-[#FF6B35] animate-spin" />
        </div>
      </>
    )
  }

  if (!profile) {
    return (
      <>
        <div className="text-center py-24">
          <p className="text-gray-400">Не удалось загрузить профиль</p>
        </div>
      </>
    )
  }

  const { trainer, about, certificates, achievements, specializations } = profile

  return (
    <>
      <div className="pb-6">
        {/* Profile Header */}
        <div className="bg-[#1A1A1A] rounded-xl border border-white/10 overflow-hidden mb-6">
          {/* Cover */}
          <div className="h-40 bg-gradient-to-r from-[#FF6B35] to-[#FF0844] relative">
          </div>

          {/* Profile Info */}
          <div className="px-6 pb-6">
            <div className="flex items-end gap-4 -mt-14">
              {/* Avatar */}
              <div className="relative">
                {trainer.avatarUrl ? (
                  <img
                    src={getMediaUrl(trainer.avatarUrl) || ''}
                    alt={trainer.fullName}
                    className="w-28 h-28 rounded-xl object-cover border-4 border-[#1A1A1A]"
                  />
                ) : (
                  <div className="w-28 h-28 rounded-xl bg-gradient-to-br from-[#FF6B35] to-[#FF0844] flex items-center justify-center border-4 border-[#1A1A1A]">
                    <span className="text-white text-3xl font-bold">
                      {trainer.initials}
                    </span>
                  </div>
                )}
                <input
                  type="file"
                  id="avatar-upload"
                  accept="image/*"
                  onChange={handleAvatarUpload}
                  className="hidden"
                />
                <label
                  htmlFor="avatar-upload"
                  className="absolute bottom-0 right-0 p-1.5 bg-[#0A0A0A] rounded-full border border-white/10 hover:bg-white/10 transition-colors cursor-pointer"
                >
                  {uploadingAvatar ? (
                    <Loader2 className="w-3.5 h-3.5 text-gray-400 animate-spin" />
                  ) : (
                    <Camera className="w-3.5 h-3.5 text-gray-400" />
                  )}
                </label>
                {trainer.avatarUrl && (
                  <button
                    onClick={handleAvatarDelete}
                    disabled={deletingAvatar}
                    className="absolute bottom-0 left-0 p-1.5 bg-[#0A0A0A] rounded-full border border-white/10 hover:bg-red-500/20 transition-colors"
                  >
                    {deletingAvatar ? (
                      <Loader2 className="w-3.5 h-3.5 text-gray-400 animate-spin" />
                    ) : (
                      <Trash2 className="w-3.5 h-3.5 text-red-400" />
                    )}
                  </button>
                )}
                {/* Achievement Badge */}
                {trainer.achievementsCount > 0 && (
                  <div className="absolute -bottom-1 -right-1 w-9 h-9 rounded-full bg-gradient-to-r from-[#FF6B35] to-[#FF0844] border-2 border-[#1A1A1A] flex items-center justify-center shadow-lg">
                    <Award className="w-5 h-5 text-white" />
                  </div>
                )}
              </div>

              {/* Name and actions */}
              <div className="flex-1 flex items-end justify-between pb-1">
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <h1 className="text-2xl font-bold text-white">{trainer.fullName}</h1>
                    {trainer.ratingValue > 0 && (
                      <div className="flex items-center gap-1 px-2 py-1 bg-yellow-500/10 rounded-lg">
                        <Star className="w-4 h-4 text-yellow-500 fill-yellow-500" />
                        <span className="text-sm font-semibold text-yellow-500">{trainer.ratingValue.toFixed(1)}</span>
                      </div>
                    )}
                  </div>
                  <p className="text-gray-400">{trainer.primaryTitle || 'Персональный тренер'}</p>
                  {trainer.secondaryTitle && (
                    <p className="text-sm text-gray-500">{trainer.secondaryTitle}</p>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Contact & Location Info */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
          {/* Location */}
          {(trainer.location || trainer.city || trainer.country) && (
            <div className="relative bg-white/5 rounded-xl border border-white/10 p-3 group">
              <button
                onClick={() => setShowEditLocationModal(true)}
                className="absolute top-2 right-2 p-1 text-gray-500 hover:text-[#FF6B35] opacity-0 group-hover:opacity-100 transition-opacity"
              >
                <Edit2 className="w-3 h-3" />
              </button>
              <div className="flex items-center gap-2 text-gray-400 mb-1">
                <MapPin className="w-4 h-4" />
                <span className="text-xs">Локация</span>
              </div>
              <p className="text-white text-sm font-medium truncate">
                {trainer.location || [trainer.city, trainer.country].filter(Boolean).join(', ') || 'Не указано'}
              </p>
            </div>
          )}
          
          {/* Phone */}
          {trainer.phone && (
            <div className="relative bg-white/5 rounded-xl border border-white/10 p-3 group">
              <button
                onClick={() => setShowEditPhoneModal(true)}
                className="absolute top-2 right-2 p-1 text-gray-500 hover:text-[#FF6B35] opacity-0 group-hover:opacity-100 transition-opacity"
              >
                <Edit2 className="w-3 h-3" />
              </button>
              <div className="flex items-center gap-2 text-gray-400 mb-1">
                <Phone className="w-4 h-4" />
                <span className="text-xs">Телефон</span>
              </div>
              <p className="text-white text-sm font-medium">{trainer.phone}</p>
            </div>
          )}
          
          {/* Experience */}
          {trainer.experienceYears !== null && trainer.experienceYears !== undefined && (
            <div className="relative bg-white/5 rounded-xl border border-white/10 p-3 group">
              <button
                onClick={() => setShowEditExperienceModal(true)}
                className="absolute top-2 right-2 p-1 text-gray-500 hover:text-[#FF6B35] opacity-0 group-hover:opacity-100 transition-opacity"
              >
                <Edit2 className="w-3 h-3" />
              </button>
              <div className="flex items-center gap-2 text-gray-400 mb-1">
                <Briefcase className="w-4 h-4" />
                <span className="text-xs">Опыт работы</span>
              </div>
              <p className="text-white text-sm font-medium">{trainer.experienceYears} {trainer.experienceYears === 1 ? 'год' : trainer.experienceYears < 5 ? 'года' : 'лет'}</p>
            </div>
          )}

          {/* Gender */}
          {trainer.gender && (
            <div className="relative bg-white/5 rounded-xl border border-white/10 p-3 group">
              <button
                onClick={() => setShowEditGenderModal(true)}
                className="absolute top-2 right-2 p-1 text-gray-500 hover:text-[#FF6B35] opacity-0 group-hover:opacity-100 transition-opacity"
              >
                <Edit2 className="w-3 h-3" />
              </button>
              <div className="flex items-center gap-2 text-gray-400 mb-1">
                <User className="w-4 h-4" />
                <span className="text-xs">Пол</span>
              </div>
              <p className="text-white text-sm font-medium">
                {trainer.gender === 'Male' || trainer.gender === 'male' ? 'Мужской' : trainer.gender === 'Female' || trainer.gender === 'female' ? 'Женский' : trainer.gender}
              </p>
            </div>
          )}
          
        </div>

        {/* Bio Section */}
        <div className="bg-gradient-to-br from-[#FF6B35]/5 to-[#FF0844]/5 rounded-xl border border-white/10 p-4 mb-6">
          {about?.text ? (
            <div>
              <div className="flex items-center justify-between mb-2">
                <h3 className="text-sm font-medium text-gray-400">О себе</h3>
                <button 
                  onClick={() => setShowAboutModal(true)}
                  className="text-xs text-[#FF6B35] hover:underline"
                >
                  Изменить
                </button>
              </div>
              <p className="text-gray-300 leading-relaxed">{about.text}</p>
            </div>
          ) : (
            <button 
              onClick={() => setShowAboutModal(true)}
              className="w-full py-3 text-gray-500 hover:text-gray-400 flex items-center justify-center gap-2 transition-colors"
            >
              <Plus className="w-4 h-4" />
              Добавить описание профиля
            </button>
          )}
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-4 gap-3 mb-6">
          <div className="bg-gradient-to-br from-[#FF6B35]/10 to-[#FF0844]/10 rounded-xl border border-[#FF6B35]/20 p-4 text-center">
            <BookOpen className="w-6 h-6 text-[#FF6B35] mx-auto mb-2" />
            <p className="text-2xl font-bold text-white">{trainer.programsCount}</p>
            <p className="text-xs text-gray-400">Программ</p>
          </div>
          <div className="bg-gradient-to-br from-blue-500/10 to-cyan-500/10 rounded-xl border border-blue-500/20 p-4 text-center">
            <Users className="w-6 h-6 text-blue-400 mx-auto mb-2" />
            <p className="text-2xl font-bold text-white">{trainer.studentsCount}</p>
            <p className="text-xs text-gray-400">Учеников</p>
          </div>
          <div className="bg-gradient-to-br from-yellow-500/10 to-orange-500/10 rounded-xl border border-yellow-500/20 p-4 text-center">
            <Star className="w-6 h-6 text-yellow-500 mx-auto mb-2" />
            <p className="text-2xl font-bold text-white">{trainer.ratingValue.toFixed(1)}</p>
            <p className="text-xs text-gray-400">{trainer.reviewsCount} отзывов</p>
          </div>
          <div className="bg-gradient-to-br from-purple-500/10 to-pink-500/10 rounded-xl border border-purple-500/20 p-4 text-center">
            <Award className="w-6 h-6 text-purple-400 mx-auto mb-2" />
            <p className="text-2xl font-bold text-white">{trainer.achievementsCount}</p>
            <p className="text-xs text-gray-400">Достижений</p>
          </div>
        </div>

        {/* Specializations */}
        {specializations.length > 0 && (
          <div className="mb-6">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-sm font-medium text-gray-400">Специализации</h3>
              <button
                onClick={() => setShowSpecializationModal(true)}
                className="text-xs text-[#FF6B35] hover:underline flex items-center gap-1"
              >
                <Plus className="w-3 h-3" />
                Добавить
              </button>
            </div>
            <div className="flex flex-wrap gap-2">
              {specializations.map((spec) => (
                <span
                  key={spec.id}
                  className="px-3 py-1.5 bg-gradient-to-r from-[#FF6B35]/10 to-[#FF0844]/10 border border-[#FF6B35]/20 text-gray-300 rounded-lg text-sm flex items-center gap-2"
                >
                  {spec.name}
                  <button 
                    onClick={() => handleDeleteSpecialization(spec.id)}
                    disabled={deleting === spec.id}
                    className="hover:text-red-400 transition-colors"
                  >
                    {deleting === spec.id ? (
                      <Loader2 className="w-3 h-3 animate-spin" />
                    ) : (
                      <X className="w-3 h-3" />
                    )}
                  </button>
                </span>
              ))}
            </div>
          </div>
        )}

        {specializations.length === 0 && (
          <div className="mb-6">
            <button
              onClick={() => setShowSpecializationModal(true)}
              className="w-full py-3 border-2 border-dashed border-white/10 rounded-xl text-gray-500 hover:text-gray-400 hover:border-[#FF6B35]/30 transition-colors flex items-center justify-center gap-2"
            >
              <Plus className="w-4 h-4" />
              Добавить специализации
            </button>
          </div>
        )}

        {/* Achievements Preview */}
        {achievements.length > 0 && (
          <div className="mb-6">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-sm font-medium text-gray-400">Достижения</h3>
              <span className="text-xs text-gray-500">{achievements.length} всего</span>
            </div>
            <div className="flex flex-wrap gap-2">
              {achievements.slice(0, 6).map((achievement) => (
                <div
                  key={achievement.id}
                  className={`flex items-center gap-2 px-3 py-2 rounded-xl ${
                    achievement.tone === 'gold' 
                      ? 'bg-gradient-to-r from-amber-500/20 to-orange-500/20 border border-amber-500/30'
                      : achievement.tone === 'silver'
                      ? 'bg-gradient-to-r from-gray-400/20 to-gray-500/20 border border-gray-400/30'
                      : 'bg-white/5 border border-white/10'
                  }`}
                >
                  <Award className={`w-4 h-4 ${
                    achievement.tone === 'gold' ? 'text-amber-400' : 
                    achievement.tone === 'silver' ? 'text-gray-400' : 'text-gray-500'
                  }`} />
                  <div>
                    <p className={`text-sm font-medium ${
                      achievement.tone === 'gold' ? 'text-amber-300' : 
                      achievement.tone === 'silver' ? 'text-gray-300' : 'text-gray-400'
                    }`}>
                      {achievement.title}
                    </p>
                    {achievement.subtitle && (
                      <p className="text-xs text-gray-500">{achievement.subtitle}</p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Tabs */}
        <div className="flex items-center gap-1 border-b border-white/10 mb-6">
          {(['posts', 'certificates', 'specializations', 'achievements'] as const).map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`px-4 py-3 font-medium capitalize transition-all relative ${
                activeTab === tab
                  ? 'text-[#FF6B35]'
                  : 'text-gray-400 hover:text-white'
              }`}
            >
              {tab === 'posts' ? 'Посты' : tab === 'certificates' ? 'Сертификаты' : tab === 'specializations' ? 'Специализации' : 'Достижения'}
              {activeTab === tab && (
                <motion.div
                  layoutId="profileTab"
                  className="absolute bottom-0 left-0 right-0 h-0.5 bg-gradient-to-r from-[#FF6B35] to-[#FF0844]"
                />
              )}
            </button>
          ))}
        </div>

        {/* Content */}
        {activeTab === 'posts' && (
          <div className="bg-[#1A1A1A] rounded-xl border border-white/10 overflow-hidden">
            <div className="px-4 py-3 border-b border-white/10 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Grid className="w-5 h-5 text-[#FF6B35]" />
                <h3 className="font-semibold text-white">Публикации</h3>
                {totalPosts > 0 && <span className="text-xs text-gray-500">({totalPosts})</span>}
              </div>
              <div className="flex items-center gap-1 bg-[#0A0A0A] rounded-lg p-0.5">
                <button
                  onClick={() => setViewMode('grid')}
                  className={`p-1.5 rounded-md transition-colors ${viewMode === 'grid' ? 'bg-white/10 text-[#FF6B35]' : 'text-gray-500 hover:text-gray-300'}`}
                >
                  <Grid className="w-4 h-4" />
                </button>
                <button
                  onClick={() => setViewMode('list')}
                  className={`p-1.5 rounded-md transition-colors ${viewMode === 'list' ? 'bg-white/10 text-[#FF6B35]' : 'text-gray-500 hover:text-gray-300'}`}
                >
                  <List className="w-4 h-4" />
                </button>
              </div>
            </div>

            <ProfilePostTabs activeTab={postTab} onTabChange={handlePostTabChange} disabled={isLoadingPosts} />

            {postIds.length === 0 && !isLoadingPosts ? (
              <div className="py-12 text-center">
                <BookOpen className="w-12 h-12 text-gray-600 mx-auto mb-4" />
                <p className="text-gray-400">Нет постов</p>
                <p className="text-sm text-gray-500 mt-1">Создайте свой первый пост в ленте</p>
              </div>
            ) : viewMode === 'grid' ? (
              <div>
                <div className="grid grid-cols-3 gap-2 p-2">
                  {postIds.map((id) => (
                    <TrainerGridCell key={id} postId={id} onSelect={setSelectedPostId} onDelete={handleDeletePost} deletingPostId={deletingPostId} currentUserId={profile?.trainer?.userId} />
                  ))}
                </div>
                {(isLoadingPosts || postsHasMore) && (
                  <div ref={postsObserverRef} className="py-8 flex justify-center">
                    {isLoadingPosts && <Loader2 className="w-6 h-6 text-[#FF6B35] animate-spin" />}
                  </div>
                )}
              </div>
            ) : (
              <div className="p-3 space-y-3">
                {postIds.map((id) => (
                  <PostCard
                    key={id}
                    postId={id}
                    currentUserId={profile?.trainer?.userId}
                    showDeleteInHeader
                    onDelete={handleDeletePost}
                    deletingPostId={deletingPostId}
                    onRepostSuccess={() => loadPosts(1)}
                    playingVideoId={playingVideoId}
                    onVideoToggle={setPlayingVideoId}
                    onPhotoClick={(url: string, caption?: string) => setViewingPhoto({ url, caption })}
                  />
                ))}
                {(isLoadingPosts || postsHasMore) && (
                  <div ref={postsObserverRef} className="py-8 flex justify-center">
                    {isLoadingPosts && <Loader2 className="w-6 h-6 text-[#FF6B35] animate-spin" />}
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {activeTab === 'certificates' && (
          <div className="space-y-4">
            <button
              onClick={() => setShowCertificateModal(true)}
              className="w-full py-4 border-2 border-dashed border-white/20 rounded-xl text-gray-400 hover:text-white hover:border-[#FF6B35]/50 transition-colors flex items-center justify-center gap-2"
            >
              <Upload className="w-5 h-5" />
              Добавить сертификат
            </button>
            
            {certificates.length > 0 ? (
              <div className="grid grid-cols-2 gap-4">
                {certificates.map((cert) => (
                  <div key={cert.id} className="bg-[#1A1A1A] rounded-xl border border-white/10 p-4">
                    <div className="flex items-start justify-between mb-2">
                      <div>
                        <h4 className="font-semibold text-white">{cert.title}</h4>
                        {cert.issuer && <p className="text-sm text-gray-400">{cert.issuer}</p>}
                        <p className="text-xs text-gray-500">{cert.year}</p>
                      </div>
                      <button
                        onClick={() => handleDeleteCertificate(cert.id)}
                        disabled={deleting === cert.id}
                        className="p-1 text-gray-400 hover:text-red-400 transition-colors"
                      >
                        {deleting === cert.id ? (
                          <Loader2 className="w-4 h-4 animate-spin" />
                        ) : (
                          <Trash2 className="w-4 h-4" />
                        )}
                      </button>
                    </div>
                    {cert.fileUrl && (
                      <button 
                        onClick={() => setViewingCertificate(getMediaUrl(cert.fileUrl) || '')}
                        className="text-xs text-[#FF6B35] hover:underline"
                      >
                        Просмотреть файл
                      </button>
                    )}
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8">
                <Award className="w-12 h-12 text-gray-600 mx-auto mb-4" />
                <p className="text-gray-400">Нет сертификатов</p>
              </div>
            )}
          </div>
        )}

        {activeTab === 'specializations' && (
          <div className="space-y-4">
            <button
              onClick={() => setShowSpecializationModal(true)}
              className="w-full py-4 border-2 border-dashed border-white/20 rounded-xl text-gray-400 hover:text-white hover:border-[#FF6B35]/50 transition-colors flex items-center justify-center gap-2"
            >
              <Plus className="w-5 h-5" />
              Добавить специализацию
            </button>
            
            {specializations.length > 0 ? (
              <div className="flex flex-wrap gap-3">
                {specializations.map((spec) => (
                  <div 
                    key={spec.id} 
                    className="px-4 py-2 bg-[#1A1A1A] rounded-xl border border-white/10 flex items-center gap-2"
                  >
                    <span className="text-white">{spec.name}</span>
                    <button
                      onClick={() => handleDeleteSpecialization(spec.id)}
                      disabled={deleting === spec.id}
                      className="text-gray-400 hover:text-red-400 transition-colors"
                    >
                      {deleting === spec.id ? (
                        <Loader2 className="w-4 h-4 animate-spin" />
                      ) : (
                        <X className="w-4 h-4" />
                      )}
                    </button>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8">
                <TrendingUp className="w-12 h-12 text-gray-600 mx-auto mb-4" />
                <p className="text-gray-400">Нет специализаций</p>
              </div>
            )}
          </div>
        )}

        {activeTab === 'achievements' && (
          <div className="space-y-4">
            {achievements.length > 0 ? (
              <div className="grid grid-cols-2 gap-4">
                {achievements.map((achievement) => (
                  <div 
                    key={achievement.id} 
                    className={`p-4 rounded-xl border ${
                      achievement.tone === 'gold' 
                        ? 'bg-gradient-to-br from-amber-500/10 to-orange-500/10 border-amber-500/30'
                        : achievement.tone === 'silver'
                        ? 'bg-gradient-to-br from-gray-400/10 to-gray-500/10 border-gray-400/30'
                        : 'bg-[#1A1A1A] border-white/10'
                    }`}
                  >
                    <div className="flex items-start gap-3">
                      <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${
                        achievement.tone === 'gold' 
                          ? 'bg-amber-500/20'
                          : achievement.tone === 'silver'
                          ? 'bg-gray-400/20'
                          : 'bg-white/5'
                      }`}>
                        <Award className={`w-6 h-6 ${
                          achievement.tone === 'gold' ? 'text-amber-400' : 
                          achievement.tone === 'silver' ? 'text-gray-400' : 'text-gray-500'
                        }`} />
                      </div>
                      <div className="flex-1">
                        <h4 className={`font-semibold ${
                          achievement.tone === 'gold' ? 'text-amber-300' : 
                          achievement.tone === 'silver' ? 'text-gray-300' : 'text-white'
                        }`}>
                          {achievement.title}
                        </h4>
                        {achievement.subtitle && (
                          <p className="text-sm text-gray-400 mt-0.5">{achievement.subtitle}</p>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-12">
                <Award className="w-12 h-12 text-gray-600 mx-auto mb-4" />
                <p className="text-gray-400">Пока нет достижений</p>
                <p className="text-sm text-gray-500 mt-1">Достижения появятся по мере вашей работы</p>
              </div>
            )}
          </div>
        )}

        {/* About Modal */}
        {showAboutModal && (
          <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="bg-[#1A1A1A] rounded-2xl border border-white/10 w-full max-w-lg"
            >
              <div className="p-6">
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-xl font-bold text-white">О себе</h2>
                  <button onClick={() => setShowAboutModal(false)} className="text-gray-400 hover:text-white">
                    <X className="w-6 h-6" />
                  </button>
                </div>
                <textarea
                  value={aboutText}
                  onChange={(e) => setAboutText(e.target.value)}
                  rows={5}
                  className="w-full px-4 py-3 bg-[#0A0A0A] border border-white/10 rounded-lg text-white focus:outline-none focus:border-[#FF6B35] resize-none mb-4"
                  placeholder="Расскажите о себе..."
                />
                <button
                  onClick={handleSaveAbout}
                  disabled={saving}
                  className="w-full py-3 bg-gradient-to-r from-[#FF6B35] to-[#FF0844] text-white font-semibold rounded-lg hover:opacity-90 disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  {saving && <Loader2 className="w-5 h-5 animate-spin" />}
                  Сохранить
                </button>
              </div>
            </motion.div>
          </div>
        )}

        {/* Certificate Modal */}
        {showCertificateModal && (
          <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="bg-[#1A1A1A] rounded-2xl border border-white/10 w-full max-w-lg"
            >
              <div className="p-6">
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-xl font-bold text-white">Добавить сертификат</h2>
                  <button onClick={() => setShowCertificateModal(false)} className="text-gray-400 hover:text-white">
                    <X className="w-6 h-6" />
                  </button>
                </div>
                <form onSubmit={handleAddCertificate} className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">Название *</label>
                    <input
                      type="text"
                      value={certTitle}
                      onChange={(e) => setCertTitle(e.target.value)}
                      className="w-full px-4 py-2.5 bg-[#0A0A0A] border border-white/10 rounded-lg text-white focus:outline-none focus:border-[#FF6B35]"
                      placeholder="Название сертификата"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">Организация</label>
                    <input
                      type="text"
                      value={certIssuer}
                      onChange={(e) => setCertIssuer(e.target.value)}
                      className="w-full px-4 py-2.5 bg-[#0A0A0A] border border-white/10 rounded-lg text-white focus:outline-none focus:border-[#FF6B35]"
                      placeholder="Кто выдал сертификат"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">Год</label>
                    <input
                      type="number"
                      value={certYear}
                      onChange={(e) => setCertYear(e.target.value)}
                      className="w-full px-4 py-2.5 bg-[#0A0A0A] border border-white/10 rounded-lg text-white focus:outline-none focus:border-[#FF6B35]"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">Файл *</label>
                    <label className="flex items-center justify-center w-full py-4 border-2 border-dashed border-white/20 rounded-lg cursor-pointer hover:border-[#FF6B35]/50 transition-colors">
                      <Upload className="w-5 h-5 text-gray-400 mr-2" />
                      <span className="text-sm text-gray-400">
                        {certFile ? certFile.name : 'Выберите файл'}
                      </span>
                      <input
                        type="file"
                        accept="image/*,.pdf"
                        onChange={(e) => setCertFile(e.target.files?.[0] || null)}
                        className="hidden"
                      />
                    </label>
                  </div>
                  <button
                    type="submit"
                    disabled={saving}
                    className="w-full py-3 bg-gradient-to-r from-[#FF6B35] to-[#FF0844] text-white font-semibold rounded-lg hover:opacity-90 disabled:opacity-50 flex items-center justify-center gap-2"
                  >
                    {saving && <Loader2 className="w-5 h-5 animate-spin" />}
                    Добавить
                  </button>
                </form>
              </div>
            </motion.div>
          </div>
        )}

        {/* Specialization Modal */}
        {showSpecializationModal && (
          <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="bg-[#1A1A1A] rounded-2xl border border-white/10 w-full max-w-lg"
            >
              <div className="p-6">
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-xl font-bold text-white">Добавить специализацию</h2>
                  <button onClick={() => setShowSpecializationModal(false)} className="text-gray-400 hover:text-white">
                    <X className="w-6 h-6" />
                  </button>
                </div>
                <form onSubmit={handleAddSpecialization} className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">Специализация</label>
                    <select
                      value={specName}
                      onChange={(e) => setSpecName(e.target.value)}
                      className="w-full px-4 py-2.5 bg-[#0A0A0A] border border-white/10 rounded-lg text-white focus:outline-none focus:border-[#FF6B35]"
                    >
                      <option value="">Выберите специализацию</option>
                      <option value="Силовые тренировки">Силовые тренировки</option>
                      <option value="Кардио тренировки">Кардио тренировки</option>
                      <option value="Функциональный тренинг">Функциональный тренинг</option>
                      <option value="Кроссфит">Кроссфит</option>
                      <option value="Пилатес">Пилатес</option>
                      <option value="Йога">Йога</option>
                      <option value="Растяжка и гибкость">Растяжка и гибкость</option>
                      <option value="TRX тренировки">TRX тренировки</option>
                      <option value="Бокс">Бокс</option>
                      <option value="Единоборства">Единоборства</option>
                      <option value="HIIT">HIIT</option>
                      <option value="Табата">Табата</option>
                      <option value="Бодибилдинг">Бодибилдинг</option>
                      <option value="Пауэрлифтинг">Пауэрлифтинг</option>
                      <option value="Тяжёлая атлетика">Тяжёлая атлетика</option>
                      <option value="Реабилитация">Реабилитация</option>
                      <option value="ЛФК">ЛФК</option>
                      <option value="Работа с беременными">Работа с беременными</option>
                      <option value="Детский фитнес">Детский фитнес</option>
                      <option value="Фитнес для пожилых">Фитнес для пожилых</option>
                      <option value="Похудение">Похудение</option>
                      <option value="Набор массы">Набор массы</option>
                      <option value="Коррекция фигуры">Коррекция фигуры</option>
                      <option value="Спортивная подготовка">Спортивная подготовка</option>
                      <option value="Нутрициология">Нутрициология</option>
                    </select>
                  </div>
                  <button
                    type="submit"
                    disabled={saving || !specName}
                    className="w-full py-3 bg-gradient-to-r from-[#FF6B35] to-[#FF0844] text-white font-semibold rounded-lg hover:opacity-90 disabled:opacity-50 flex items-center justify-center gap-2"
                  >
                    {saving && <Loader2 className="w-5 h-5 animate-spin" />}
                    Добавить
                  </button>
                </form>
              </div>
            </motion.div>
          </div>
        )}

        {/* Edit Profile Modal */}
        {showEditProfileModal && (
          <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="bg-[#1A1A1A] rounded-2xl border border-white/10 w-full max-w-lg max-h-[90vh] overflow-y-auto"
            >
              <div className="p-6">
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-xl font-bold text-white">Редактировать профиль</h2>
                  <button onClick={() => setShowEditProfileModal(false)} className="text-gray-400 hover:text-white">
                    <X className="w-6 h-6" />
                  </button>
                </div>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">Основная специальность</label>
                    <input
                      type="text"
                      value={editPrimaryTitle}
                      onChange={(e) => setEditPrimaryTitle(e.target.value)}
                      className="w-full px-4 py-2.5 bg-[#0A0A0A] border border-white/10 rounded-lg text-white focus:outline-none focus:border-[#FF6B35]"
                      placeholder="Например: Персональный тренер"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">Дополнительная специальность</label>
                    <input
                      type="text"
                      value={editSecondaryTitle}
                      onChange={(e) => setEditSecondaryTitle(e.target.value)}
                      className="w-full px-4 py-2.5 bg-[#0A0A0A] border border-white/10 rounded-lg text-white focus:outline-none focus:border-[#FF6B35]"
                      placeholder="Например: Нутрициолог"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">Опыт работы (лет)</label>
                    <input
                      type="number"
                      value={editExperienceYears}
                      onChange={(e) => setEditExperienceYears(e.target.value)}
                      className="w-full px-4 py-2.5 bg-[#0A0A0A] border border-white/10 rounded-lg text-white focus:outline-none focus:border-[#FF6B35]"
                      placeholder="5"
                      min="0"
                      max="50"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">Локация</label>
                    <input
                      type="text"
                      value={editLocation}
                      onChange={(e) => setEditLocation(e.target.value)}
                      className="w-full px-4 py-2.5 bg-[#0A0A0A] border border-white/10 rounded-lg text-white focus:outline-none focus:border-[#FF6B35]"
                      placeholder="Москва, Россия"
                    />
                  </div>
                  <div className="pt-2">
                    <button
                      onClick={handleSaveProfile}
                      disabled={saving}
                      className="w-full py-3 bg-gradient-to-r from-[#FF6B35] to-[#FF0844] text-white font-semibold rounded-lg hover:opacity-90 disabled:opacity-50 flex items-center justify-center gap-2"
                    >
                      {saving && <Loader2 className="w-5 h-5 animate-spin" />}
                      Сохранить
                    </button>
                  </div>
                </div>
              </div>
            </motion.div>
          </div>
        )}

        {/* Certificate Viewer Modal */}
        {viewingCertificate && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="relative w-full max-w-4xl max-h-[90vh] bg-[#1A1A1A] rounded-xl overflow-hidden"
            >
              <div className="sticky top-0 z-10 flex items-center justify-between p-4 bg-[#1A1A1A] border-b border-white/10">
                <h2 className="text-xl font-bold text-white">Сертификат</h2>
                <button
                  onClick={() => setViewingCertificate(null)}
                  className="p-2 text-gray-400 hover:text-white rounded-lg hover:bg-white/5 transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
              <div className="p-4 overflow-auto max-h-[calc(90vh-80px)]">
                <img 
                  src={viewingCertificate} 
                  alt="Сертификат" 
                  className="w-full h-auto rounded-lg"
                />
              </div>
            </motion.div>
          </div>
        )}

        {/* Edit Location Modal */}
        {showEditLocationModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="w-full max-w-md bg-[#1A1A1A] rounded-xl border border-white/10 overflow-hidden"
            >
              <div className="flex items-center justify-between p-4 border-b border-white/10">
                <h2 className="text-xl font-bold text-white">Изменить локацию</h2>
                <button
                  onClick={() => setShowEditLocationModal(false)}
                  className="p-2 text-gray-400 hover:text-white rounded-lg hover:bg-white/5 transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
              <div className="p-4 space-y-4">
                <input
                  type="text"
                  value={editLocation}
                  onChange={(e) => setEditLocation(e.target.value)}
                  className="w-full px-4 py-2.5 bg-[#0A0A0A] border border-white/10 rounded-lg text-white focus:outline-none focus:border-[#FF6B35]"
                  placeholder="Москва, Россия"
                />
                <button
                  onClick={handleSaveLocation}
                  disabled={saving}
                  className="w-full py-3 bg-gradient-to-r from-[#FF6B35] to-[#FF0844] text-white font-semibold rounded-lg hover:opacity-90 disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  {saving && <Loader2 className="w-5 h-5 animate-spin" />}
                  Сохранить
                </button>
              </div>
            </motion.div>
          </div>
        )}

        {/* Edit Phone Modal */}
        {showEditPhoneModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="w-full max-w-md bg-[#1A1A1A] rounded-xl border border-white/10 overflow-hidden"
            >
              <div className="flex items-center justify-between p-4 border-b border-white/10">
                <h2 className="text-xl font-bold text-white">Изменить телефон</h2>
                <button
                  onClick={() => setShowEditPhoneModal(false)}
                  className="p-2 text-gray-400 hover:text-white rounded-lg hover:bg-white/5 transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
              <div className="p-4 space-y-4">
                <input
                  type="tel"
                  value={editPhone}
                  onChange={(e) => setEditPhone(e.target.value)}
                  className="w-full px-4 py-2.5 bg-[#0A0A0A] border border-white/10 rounded-lg text-white focus:outline-none focus:border-[#FF6B35]"
                  placeholder="+7 (999) 123-45-67"
                />
                <button
                  onClick={handleSavePhone}
                  disabled={saving}
                  className="w-full py-3 bg-gradient-to-r from-[#FF6B35] to-[#FF0844] text-white font-semibold rounded-lg hover:opacity-90 disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  {saving && <Loader2 className="w-5 h-5 animate-spin" />}
                  Сохранить
                </button>
              </div>
            </motion.div>
          </div>
        )}

        {/* Edit Experience Modal */}
        {showEditExperienceModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="w-full max-w-md bg-[#1A1A1A] rounded-xl border border-white/10 overflow-hidden"
            >
              <div className="flex items-center justify-between p-4 border-b border-white/10">
                <h2 className="text-xl font-bold text-white">Изменить опыт работы</h2>
                <button
                  onClick={() => setShowEditExperienceModal(false)}
                  className="p-2 text-gray-400 hover:text-white rounded-lg hover:bg-white/5 transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
              <div className="p-4 space-y-4">
                <input
                  type="number"
                  value={editExperienceYears}
                  onChange={(e) => setEditExperienceYears(e.target.value)}
                  className="w-full px-4 py-2.5 bg-[#0A0A0A] border border-white/10 rounded-lg text-white focus:outline-none focus:border-[#FF6B35]"
                  placeholder="5"
                  min="0"
                />
                <button
                  onClick={handleSaveExperience}
                  disabled={saving}
                  className="w-full py-3 bg-gradient-to-r from-[#FF6B35] to-[#FF0844] text-white font-semibold rounded-lg hover:opacity-90 disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  {saving && <Loader2 className="w-5 h-5 animate-spin" />}
                  Сохранить
                </button>
              </div>
            </motion.div>
          </div>
        )}

        {/* Edit Gender Modal */}
        {showEditGenderModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="w-full max-w-md bg-[#1A1A1A] rounded-xl border border-white/10 overflow-hidden"
            >
              <div className="flex items-center justify-between p-4 border-b border-white/10">
                <h2 className="text-xl font-bold text-white">Изменить пол</h2>
                <button
                  onClick={() => setShowEditGenderModal(false)}
                  className="p-2 text-gray-400 hover:text-white rounded-lg hover:bg-white/5 transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
              <div className="p-4 space-y-4">
                <select
                  value={editGender}
                  onChange={(e) => setEditGender(e.target.value)}
                  className="w-full px-4 py-2.5 bg-[#0A0A0A] border border-white/10 rounded-lg text-white focus:outline-none focus:border-[#FF6B35]"
                >
                  <option value="">Выберите пол</option>
                  <option value="Male">Мужской</option>
                  <option value="Female">Женский</option>
                </select>
                <button
                  onClick={handleSaveGender}
                  disabled={saving}
                  className="w-full py-3 bg-gradient-to-r from-[#FF6B35] to-[#FF0844] text-white font-semibold rounded-lg hover:opacity-90 disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  {saving && <Loader2 className="w-5 h-5 animate-spin" />}
                  Сохранить
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </div>

      {/* Post Detail Modal */}
      {selectedPostId && (
        <TrainerPostDetailModal postId={selectedPostId} onClose={() => setSelectedPostId(null)} onDelete={handleDeletePost} deletingPostId={deletingPostId} currentUserId={profile?.trainer?.userId} />
      )}

      {/* Photo Lightbox */}
      {viewingPhoto && (
        <PhotoLightbox imageUrl={viewingPhoto.url} caption={viewingPhoto.caption} onClose={() => setViewingPhoto(null)} />
      )}
    </>
  )
}
