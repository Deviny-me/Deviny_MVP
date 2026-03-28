'use client'

import { motion } from 'framer-motion'
import { useState, useEffect, useCallback, useRef } from 'react'
import { useTranslations } from 'next-intl'
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
import { updateUserProfile } from '@/lib/api/userApi'
import { useLanguage } from '@/components/language/LanguageProvider'
import { getCitiesForCountry, getCountries, getCountryName, localizeCityName, localizeCountryName, resolveCountryCodeByName, translateCityName } from '@/lib/data/countries'
import { MediaType } from '@/types/post'
import type { ProfilePostTab } from '@/types/post'
import { getMediaUrl } from '@/lib/config'
import { PostCard } from '@/components/posts/PostCard'
import { ProfilePostTabs } from '@/components/posts/ProfilePostTabs'
import { PhotoLightbox } from '@/components/ui/PhotoLightbox'
import { Toast } from '@/components/ui/Toast'
import { useUpsertPosts, usePost, usePostDispatch } from '@/contexts/PostStoreContext'
import { useAuth } from '@/features/auth/AuthContext'
import { ProfileReviewsTab } from '@/components/shared/ProfileReviewsTab'
import { useRealtimeScopeRefresh } from '@/lib/signalr/useRealtimeScopeRefresh'

// ─── Grid cell with optimistic likes ───
function TrainerGridCell({
  postId,
  onSelect,
  onDelete,
  deletingPostId,
}: {
  postId: string
  onSelect: (postId: string) => void
  onDelete?: (postId: string) => void
  deletingPostId?: string | null
}) {
  const tp = useTranslations('posts')
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
      <div className="relative aspect-square bg-background overflow-hidden rounded-lg flex flex-col items-center justify-center text-center p-2">
        <Repeat2 className="w-6 h-6 text-gray-600 mb-1" />
        <p className="text-[10px] text-gray-600 leading-tight">{tp('postDeleted')}</p>
      </div>
    )
  }

  if (!media) return null

  return (
    <div
      className="relative aspect-square bg-background overflow-hidden group cursor-pointer rounded-lg"
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
                <Play className="w-5 h-5 text-foreground ml-0.5" fill="white" />
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
          className={`flex items-center gap-1 text-foreground transition-all hover:scale-110 ${
            isLikeLoading ? 'opacity-50 cursor-not-allowed' : 'hover:text-red-500'
          }`}
        >
          <Heart className={`w-5 h-5 transition-colors ${isLiked ? 'text-red-500' : ''}`} fill={isLiked ? 'currentColor' : 'white'} />
          <span className="font-semibold">{likeCount}</span>
        </button>
        <button
          type="button"
          onClick={(e) => { e.stopPropagation(); onSelect(postId) }}
          className="flex items-center gap-1 text-foreground transition-all hover:scale-110 hover:text-[#f07915]"
        >
          <MessageCircle className="w-5 h-5" fill="white" />
          <span className="font-semibold">{commentCount}</span>
        </button>
        {onDelete && (
          <button
            type="button"
            onClick={(e) => { e.stopPropagation(); onDelete(postId) }}
            disabled={deletingPostId === postId}
            className="flex items-center gap-1 text-foreground transition-all hover:scale-110 hover:text-red-500"
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
function TrainerPostDetailModal({ postId, onClose, onDelete, deletingPostId }: { postId: string; onClose: () => void; onDelete?: (postId: string) => void; deletingPostId?: string | null }) {
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
      <button onClick={onClose} className="absolute top-4 right-4 z-50 p-2 text-foreground/70 hover:text-foreground transition-colors">
        <X className="w-8 h-8" />
      </button>
      <div className="w-fit max-w-full rounded-xl transition-all duration-300" onClick={(e) => e.stopPropagation()}>
        <PostCard
          postId={postId}
          variant="modal"
          isOwnProfile
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
  const t = useTranslations('profile')
  const tp = useTranslations('posts')
  const tc = useTranslations('common')
  const tr = useTranslations('auth.register')
  const { language } = useLanguage()
  const { user } = useAuth()
  const isNutritionist = user?.role === 'nutritionist'
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
  const [activeTab, setActiveTab] = useState<'posts' | 'certificates' | 'specializations' | 'achievements' | 'reviews'>('posts')
  
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
  const [toastData, setToastData] = useState<{ message: string; type: 'success' | 'error' } | null>(null)
  
  // Edit profile form states
  const [editPrimaryTitle, setEditPrimaryTitle] = useState('')
  const [editSecondaryTitle, setEditSecondaryTitle] = useState('')
  const [editExperienceYears, setEditExperienceYears] = useState('')
  const [editLocationCountryCode, setEditLocationCountryCode] = useState('')
  const [editLocationCity, setEditLocationCity] = useState('')
  const [editPhone, setEditPhone] = useState('')
  const [editGender, setEditGender] = useState('')

  const normalizeGenderValue = (value?: string | null): 'Male' | 'Female' | 'Other' | '' => {
    if (!value) return ''
    const normalized = value.trim().toLowerCase()
    if (normalized === 'male') return 'Male'
    if (normalized === 'female') return 'Female'
    if (normalized === 'other') return 'Other'
    return ''
  }

  const locationCountries = getCountries(language)
  const locationCities = editLocationCountryCode ? getCitiesForCountry(editLocationCountryCode, language) : []
  const editLocationDisplay = [
    editLocationCity ? translateCityName(editLocationCity, language) : '',
    editLocationCountryCode ? getCountryName(editLocationCountryCode, language) : ''
  ].filter(Boolean).join(', ')

  const syncLocationEditor = useCallback((country?: string | null, city?: string | null) => {
    const countryCode = resolveCountryCodeByName(country) || ''
    setEditLocationCountryCode(countryCode)

    if (!countryCode || !city) {
      setEditLocationCity('')
      return
    }

    const matchedCity = getCitiesForCountry(countryCode, language).find(c =>
      c.value.toLowerCase() === city.toLowerCase() ||
      c.label.toLowerCase() === city.toLowerCase() ||
      translateCityName(c.value, language).toLowerCase() === city.toLowerCase()
    )

    setEditLocationCity(matchedCity?.value || '')
  }, [language])

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
      setEditPhone(data.trainer?.phone || '')
      setEditGender(normalizeGenderValue(data.trainer?.gender))
      syncLocationEditor(data.trainer?.country, data.trainer?.city)
    } catch (error) {
      console.error('Failed to load profile:', error)
      setToastData({ message: t('toasts.profileLoadError'), type: 'error' })
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

  useRealtimeScopeRefresh(['profile', 'posts'], () => {
    loadProfile()
    loadPosts(1)
  })

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

  useEffect(() => {
    if (!profile?.trainer) return
    syncLocationEditor(profile.trainer.country, profile.trainer.city)
  }, [language, profile?.trainer?.country, profile?.trainer?.city, syncLocationEditor])

  const handleSaveAbout = async () => {
    try {
      setSaving(true)
      await updateAbout(aboutText)
      setToastData({ message: t('toasts.infoUpdated'), type: 'success' })
      setShowAboutModal(false)
      loadProfile()
    } catch (error) {
      console.error('Failed to update about:', error)
      setToastData({ message: t('toasts.infoUpdateError'), type: 'error' })
    } finally {
      setSaving(false)
    }
  }

  const handleAddCertificate = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!certFile || !certTitle) {
      setToastData({ message: t('toasts.fillRequiredFields'), type: 'error' })
      return
    }

    try {
      setSaving(true)
      await uploadCertificate(certTitle, certIssuer, parseInt(certYear), certFile)
      setToastData({ message: t('toasts.certificateAdded'), type: 'success' })
      setShowCertificateModal(false)
      setCertTitle('')
      setCertIssuer('')
      setCertYear(new Date().getFullYear().toString())
      setCertFile(null)
      loadProfile()
    } catch (error) {
      console.error('Failed to add certificate:', error)
      setToastData({ message: t('toasts.certificateAddError'), type: 'error' })
    } finally {
      setSaving(false)
    }
  }

  const handleDeleteCertificate = async (id: string) => {
    if (!confirm(t('toasts.deleteCertificateConfirm'))) return
    
    try {
      setDeleting(id)
      await deleteCertificate(id)
      setToastData({ message: t('toasts.certificateDeleted'), type: 'success' })
      loadProfile()
    } catch (error) {
      console.error('Failed to delete certificate:', error)
      setToastData({ message: t('toasts.certificateDeleteError'), type: 'error' })
    } finally {
      setDeleting(null)
    }
  }

  const handleAddSpecialization = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!specName.trim()) {
      setToastData({ message: t('toasts.enterSpecializationName'), type: 'error' })
      return
    }

    try {
      setSaving(true)
      await addSpecialization(specName)
      setToastData({ message: t('toasts.specializationAdded'), type: 'success' })
      setShowSpecializationModal(false)
      setSpecName('')
      loadProfile()
    } catch (error) {
      console.error('Failed to add specialization:', error)
      setToastData({ message: t('toasts.specializationAddError'), type: 'error' })
    } finally {
      setSaving(false)
    }
  }

  const handleDeleteSpecialization = async (id: string) => {
    try {
      setDeleting(id)
      await deleteSpecialization(id)
      setToastData({ message: t('toasts.specializationDeleted'), type: 'success' })
      loadProfile()
    } catch (error) {
      console.error('Failed to delete specialization:', error)
      setToastData({ message: t('toasts.specializationDeleteError'), type: 'error' })
    } finally {
      setDeleting(null)
    }
  }

  const handleCopyLink = async () => {
    if (profile?.trainer?.profilePublicUrl) {
      try {
        await navigator.clipboard.writeText(profile.trainer.profilePublicUrl)
        setCopied(true)
        setToastData({ message: t('toasts.linkCopied'), type: 'success' })
        setTimeout(() => setCopied(false), 2000)
      } catch (error) {
        console.error('Failed to copy:', error)
      }
    }
  }

  const handleSaveLocation = async () => {
    if (!editLocationCountryCode || !editLocationCity) {
      setToastData({ message: t('toasts.fillRequiredFields'), type: 'error' })
      return
    }

    try {
      setSaving(true)
      const country = getCountryName(editLocationCountryCode, language)
      const city = translateCityName(editLocationCity, language)
      const location = [city, country].filter(Boolean).join(', ')

      await Promise.all([
        updateTrainerProfile({ location }),
        updateUserProfile({ country, city }),
      ])

      setToastData({ message: t('toasts.locationUpdated'), type: 'success' })
      setShowEditLocationModal(false)
      loadProfile()
    } catch (error) {
      console.error('Failed to update location:', error)
      setToastData({ message: t('toasts.locationUpdateError'), type: 'error' })
    } finally {
      setSaving(false)
    }
  }

  const handleSavePhone = async () => {
    try {
      setSaving(true)
      await updateUserProfile({
        phone: editPhone.trim(),
      })
      setToastData({ message: t('toasts.phoneUpdated'), type: 'success' })
      setShowEditPhoneModal(false)
      loadProfile()
    } catch (error) {
      console.error('Failed to update phone:', error)
      setToastData({ message: t('toasts.phoneUpdateError'), type: 'error' })
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
      setToastData({ message: t('toasts.experienceUpdated'), type: 'success' })
      setShowEditExperienceModal(false)
      loadProfile()
    } catch (error) {
      console.error('Failed to update experience:', error)
      setToastData({ message: t('toasts.experienceUpdateError'), type: 'error' })
    } finally {
      setSaving(false)
    }
  }

  const handleSaveGender = async () => {
    try {
      setSaving(true)
      const normalizedGender = normalizeGenderValue(editGender)
      await updateTrainerProfile({
        gender: normalizedGender || '',
      })
      setToastData({ message: t('toasts.genderUpdated'), type: 'success' })
      setShowEditGenderModal(false)
      loadProfile()
    } catch (error) {
      console.error('Failed to update gender:', error)
      setToastData({ message: t('toasts.genderUpdateError'), type: 'error' })
    } finally {
      setSaving(false)
    }
  }

  const handleAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    // Validate file
    if (!file.type.startsWith('image/')) {
      setToastData({ message: t('toasts.avatarSelectImage'), type: 'error' })
      return
    }

    if (file.size > 5 * 1024 * 1024) {
      setToastData({ message: t('toasts.avatarSizeLimit'), type: 'error' })
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
      
      setToastData({ message: t('toasts.avatarUpdated'), type: 'success' })
      await loadProfile()
    } catch (error) {
      console.error('Failed to upload avatar:', error)
      setToastData({ message: t('toasts.avatarUploadError'), type: 'error' })
    } finally {
      setUploadingAvatar(false)
    }
  }

  const handleAvatarDelete = async () => {
    if (!confirm(t('toasts.avatarDeleteConfirm'))) return
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

      setToastData({ message: t('toasts.avatarDeleted'), type: 'success' })
    } catch (error) {
      console.error('Failed to delete avatar:', error)
      setToastData({ message: t('toasts.avatarDeleteError'), type: 'error' })
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
        location: editLocationDisplay || undefined
      })
      setToastData({ message: t('toasts.profileUpdated'), type: 'success' })
      setShowEditProfileModal(false)
      loadProfile()
    } catch (error) {
      console.error('Failed to update profile:', error)
      setToastData({ message: t('toasts.profileUpdateError'), type: 'error' })
    } finally {
      setSaving(false)
    }
  }

  const handleDeletePost = async (postId: string) => {
    if (!confirm(tp('deleteConfirm'))) {
      return
    }

    try {
      setDeletingPostId(postId)
      await postsApi.deletePost(postId)
      storeDispatch({ type: 'REMOVE_POST', postId })
      setPostIds(prev => prev.filter(id => id !== postId))
      setSelectedPostId(null)
      setToastData({ message: tp('deleted'), type: 'success' })
    } catch (error) {
      console.error('[Delete] Failed to delete post:', postId, error)
      const message = error instanceof Error ? error.message : tp('deleteError')
      setToastData({ message, type: 'error' })
    } finally {
      setDeletingPostId(null)
    }
  }

  if (loading) {
    return (
      <>
        <div className="flex items-center justify-center py-24">
          <Loader2 className="w-8 h-8 text-[#f07915] animate-spin" />
        </div>
      </>
    )
  }

  if (!profile) {
    return (
      <>
        <div className="text-center py-24">
          <p className="text-muted-foreground">{t('toasts.profileLoadError')}</p>
        </div>
      </>
    )
  }

  const { trainer, about, certificates, achievements = [], specializations } = profile
  const localizedCountry = localizeCountryName(trainer.country, language)
  const localizedCity = localizeCityName(trainer.city, trainer.country, language)

  return (
    <>
      <div className="pb-6">
        {/* Profile Header */}
        <div className="bg-surface-3 rounded-xl border border-border overflow-hidden mb-4">
          {/* Cover */}
          <div className="h-48 bg-gradient-to-r from-[#f07915] to-[#d4600b] relative">
          </div>

          {/* Profile Info - Centered */}
          <div className="relative flex flex-col items-center -mt-16 pb-6 px-6">
            {/* Avatar */}
            <div className="relative z-10">
              {trainer.avatarUrl ? (
                <img
                  src={getMediaUrl(trainer.avatarUrl) || ''}
                  alt={trainer.fullName}
                  className="w-32 h-32 rounded-2xl object-cover border-4 border-[#1A1A1A] shadow-xl"
                />
              ) : (
                <div className="w-32 h-32 rounded-2xl bg-gradient-to-br from-[#f07915] to-[#d4600b] flex items-center justify-center border-4 border-[#1A1A1A] shadow-xl">
                  <span className="text-foreground text-4xl font-bold">
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
                className="absolute bottom-1 right-1 p-1.5 bg-background/80 backdrop-blur-sm rounded-full border border-border hover:bg-white/10 transition-colors cursor-pointer"
              >
                {uploadingAvatar ? (
                  <Loader2 className="w-3.5 h-3.5 text-muted-foreground animate-spin" />
                ) : (
                  <Camera className="w-3.5 h-3.5 text-muted-foreground" />
                )}
              </label>
              {trainer.avatarUrl && (
                <button
                  onClick={handleAvatarDelete}
                  disabled={deletingAvatar}
                  className="absolute bottom-1 left-1 p-1.5 bg-background/80 backdrop-blur-sm rounded-full border border-border hover:bg-red-500/20 transition-colors"
                >
                  {deletingAvatar ? (
                    <Loader2 className="w-3.5 h-3.5 text-muted-foreground animate-spin" />
                  ) : (
                    <Trash2 className="w-3.5 h-3.5 text-red-400" />
                  )}
                </button>
              )}
            </div>

            {/* Name and Rating - Centered */}
            <div className="flex items-center gap-2 mt-4">
              <h1 className="text-2xl font-bold text-foreground">{trainer.fullName}</h1>
              {trainer.ratingValue > 0 && (
                <div className="flex items-center gap-1 px-2 py-1 bg-yellow-500/10 rounded-lg">
                  <Star className="w-4 h-4 text-yellow-500 fill-yellow-500" />
                  <span className="text-sm font-semibold text-yellow-500">{trainer.ratingValue.toFixed(1)}</span>
                </div>
              )}
            </div>
            <p className="text-muted-foreground text-center mt-1">{trainer.primaryTitle || (isNutritionist ? t('personalNutritionist') : t('personalTrainer'))}</p>
            {trainer.secondaryTitle && (
              <p className="text-sm text-faint-foreground text-center">{trainer.secondaryTitle}</p>
            )}

            {/* Stats Row */}
            <div className="mt-5 w-full grid grid-cols-4 divide-x divide-border rounded-xl bg-white/[0.03] border border-border-subtle py-4">
              <div className="flex flex-col items-center gap-1">
                <p className="text-xl font-bold text-foreground">{trainer.programsCount}</p>
                <p className="text-[11px] text-faint-foreground">{t('programs')}</p>
              </div>
              <div className="flex flex-col items-center gap-1">
                <p className="text-xl font-bold text-foreground">{trainer.studentsCount}</p>
                <p className="text-[11px] text-faint-foreground">{t('students')}</p>
              </div>
              <div className="flex flex-col items-center gap-1">
                <p className="text-xl font-bold text-foreground">{trainer.ratingValue.toFixed(1)}</p>
                <p className="text-[11px] text-faint-foreground">{trainer.reviewsCount} {t('reviews')}</p>
              </div>
              <div className="flex flex-col items-center gap-1">
                <p className="text-xl font-bold text-foreground">{trainer.achievementsCount}</p>
                <p className="text-[11px] text-faint-foreground">{t('achievements')}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Contact & Location Info */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-4">
          {/* Location */}
          {(trainer.location || trainer.city || trainer.country) && (
            <div className="relative bg-white/5 rounded-xl border border-border p-3 group">
              <button
                onClick={() => setShowEditLocationModal(true)}
                className="absolute top-2 right-2 p-1 text-faint-foreground hover:text-[#f07915] opacity-0 group-hover:opacity-100 transition-opacity"
              >
                <Edit2 className="w-3 h-3" />
              </button>
              <div className="flex items-center gap-2 text-muted-foreground mb-1">
                <MapPin className="w-4 h-4" />
                <span className="text-xs">{t('location')}</span>
              </div>
              <p className="text-foreground text-sm font-medium truncate">
                {trainer.location || [localizedCity, localizedCountry].filter(Boolean).join(', ') || t('notSpecified')}
              </p>
            </div>
          )}
          
          {/* Phone */}
          {trainer.phone && (
            <div className="relative bg-white/5 rounded-xl border border-border p-3 group">
              <button
                onClick={() => setShowEditPhoneModal(true)}
                className="absolute top-2 right-2 p-1 text-faint-foreground hover:text-[#f07915] opacity-0 group-hover:opacity-100 transition-opacity"
              >
                <Edit2 className="w-3 h-3" />
              </button>
              <div className="flex items-center gap-2 text-muted-foreground mb-1">
                <Phone className="w-4 h-4" />
                <span className="text-xs">{t('phoneLabel')}</span>
              </div>
              <p className="text-foreground text-sm font-medium">{trainer.phone}</p>
            </div>
          )}
          
          {/* Experience */}
          {trainer.experienceYears !== null && trainer.experienceYears !== undefined && (
            <div className="relative bg-white/5 rounded-xl border border-border p-3 group">
              <button
                onClick={() => setShowEditExperienceModal(true)}
                className="absolute top-2 right-2 p-1 text-faint-foreground hover:text-[#f07915] opacity-0 group-hover:opacity-100 transition-opacity"
              >
                <Edit2 className="w-3 h-3" />
              </button>
              <div className="flex items-center gap-2 text-muted-foreground mb-1">
                <Briefcase className="w-4 h-4" />
                <span className="text-xs">{t('experience')}</span>
              </div>
              <p className="text-foreground text-sm font-medium">{trainer.experienceYears} {trainer.experienceYears === 1 ? t('yearSingular') : trainer.experienceYears < 5 ? t('yearFew') : t('yearMany')}</p>
            </div>
          )}

          {/* Gender */}
          <div className="relative bg-white/5 rounded-xl border border-border p-3 group">
            <button
              onClick={() => setShowEditGenderModal(true)}
              className="absolute top-2 right-2 p-1 text-faint-foreground hover:text-[#f07915] opacity-0 group-hover:opacity-100 transition-opacity"
            >
              <Edit2 className="w-3 h-3" />
            </button>
            <div className="flex items-center gap-2 text-muted-foreground mb-1">
              <User className="w-4 h-4" />
              <span className="text-xs">{t('genderLabel')}</span>
            </div>
            <p className="text-foreground text-sm font-medium">
              {trainer.gender === 'Male' || trainer.gender === 'male'
                ? t('male')
                : trainer.gender === 'Female' || trainer.gender === 'female'
                  ? t('female')
                  : trainer.gender === 'Other' || trainer.gender === 'other'
                    ? t('other')
                    : t('notSpecified')}
            </p>
          </div>
          
        </div>

        {/* Bio Section */}
        <div className="bg-surface-3 rounded-xl border border-border p-5 mb-4">
          {about?.text ? (
            <div>
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-sm font-semibold text-muted-foreground">{t('aboutMe')}</h3>
                <button 
                  onClick={() => setShowAboutModal(true)}
                  className="text-xs text-[#f07915] hover:underline"
                >
                  {tc('change')}
                </button>
              </div>
              <p className="text-muted-foreground leading-relaxed">{about.text}</p>
            </div>
          ) : (
            <button 
              onClick={() => setShowAboutModal(true)}
              className="w-full py-3 text-faint-foreground hover:text-muted-foreground flex items-center justify-center gap-2 transition-colors"
            >
              <Plus className="w-4 h-4" />
              {t('addDescription')}
            </button>
          )}
        </div>

        {/* Specializations */}
        {specializations.length > 0 && (
          <div className="mb-6">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-sm font-medium text-muted-foreground">{t('specializations')}</h3>
              <button
                onClick={() => setShowSpecializationModal(true)}
                className="text-xs text-[#f07915] hover:underline flex items-center gap-1"
              >
                <Plus className="w-3 h-3" />
                {tc('add')}
              </button>
            </div>
            <div className="flex flex-wrap gap-2">
              {specializations.map((spec) => (
                <span
                  key={spec.id}
                  className="px-3 py-1.5 bg-gradient-to-r from-[#f07915]/10 to-[#d4600b]/10 border border-[#f07915]/20 text-muted-foreground rounded-lg text-sm flex items-center gap-2"
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
              className="w-full py-3 border-2 border-dashed border-border rounded-xl text-faint-foreground hover:text-muted-foreground hover:border-[#f07915]/30 transition-colors flex items-center justify-center gap-2"
            >
              <Plus className="w-4 h-4" />
              {t('addSpecialization')}
            </button>
          </div>
        )}

        {/* Achievements Preview */}
        {achievements.length > 0 && (
          <div className="mb-6">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-sm font-medium text-muted-foreground">{t('achievements')}</h3>
              <span className="text-xs text-faint-foreground">{achievements.length} {tc('total')}</span>
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
                      : 'bg-white/5 border border-border'
                  }`}
                >
                  <Award className={`w-4 h-4 ${
                    achievement.tone === 'gold' ? 'text-amber-400' : 
                    achievement.tone === 'silver' ? 'text-muted-foreground' : 'text-faint-foreground'
                  }`} />
                  <div>
                    <p className={`text-sm font-medium ${
                      achievement.tone === 'gold' ? 'text-amber-300' : 
                      achievement.tone === 'silver' ? 'text-muted-foreground' : 'text-muted-foreground'
                    }`}>
                      {achievement.title}
                    </p>
                    {achievement.subtitle && (
                      <p className="text-xs text-faint-foreground">{achievement.subtitle}</p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Tabs */}
        <div className="flex items-center gap-1 border-b border-border mb-6">
          {(['posts', 'reviews', 'certificates', 'specializations', 'achievements'] as const).map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`px-4 py-3 font-medium capitalize transition-all relative ${
                activeTab === tab
                  ? 'text-[#f07915]'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              {tab === 'posts' ? t('posts') : tab === 'reviews' ? t('reviews') : tab === 'certificates' ? t('certificates') : tab === 'specializations' ? t('specializations') : t('achievements')}
              {activeTab === tab && (
                <motion.div
                  layoutId="profileTab"
                  className="absolute bottom-0 left-0 right-0 h-0.5 bg-gradient-to-r from-[#f07915] to-[#d4600b]"
                />
              )}
            </button>
          ))}
        </div>

        {/* Content */}
        {activeTab === 'posts' && (
          <div className="bg-surface-3 rounded-xl border border-border overflow-hidden">
            <div className="px-4 py-3 border-b border-border flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Grid className="w-5 h-5 text-[#f07915]" />
                <h3 className="font-semibold text-foreground">{t('publications')}</h3>
                {totalPosts > 0 && <span className="text-xs text-faint-foreground">({totalPosts})</span>}
              </div>
              <div className="flex items-center gap-1 bg-background rounded-lg p-0.5">
                <button
                  onClick={() => setViewMode('grid')}
                  className={`p-1.5 rounded-md transition-colors ${viewMode === 'grid' ? 'bg-white/10 text-[#f07915]' : 'text-faint-foreground hover:text-muted-foreground'}`}
                >
                  <Grid className="w-4 h-4" />
                </button>
                <button
                  onClick={() => setViewMode('list')}
                  className={`p-1.5 rounded-md transition-colors ${viewMode === 'list' ? 'bg-white/10 text-[#f07915]' : 'text-faint-foreground hover:text-muted-foreground'}`}
                >
                  <List className="w-4 h-4" />
                </button>
              </div>
            </div>

            <ProfilePostTabs activeTab={postTab} onTabChange={handlePostTabChange} disabled={isLoadingPosts} />

            {postIds.length === 0 && !isLoadingPosts ? (
              <div className="py-12 text-center">
                <BookOpen className="w-12 h-12 text-gray-600 mx-auto mb-4" />
                <p className="text-muted-foreground">{t('noPosts')}</p>
                <p className="text-sm text-faint-foreground mt-1">{t('createFirstPost')}</p>
              </div>
            ) : viewMode === 'grid' ? (
              <div>
                <div className="grid grid-cols-3 gap-2 p-2">
                  {postIds.map((id) => (
                    <TrainerGridCell key={id} postId={id} onSelect={setSelectedPostId} onDelete={handleDeletePost} deletingPostId={deletingPostId} />
                  ))}
                </div>
                {(isLoadingPosts || postsHasMore) && (
                  <div ref={postsObserverRef} className="py-8 flex justify-center">
                    {isLoadingPosts && <Loader2 className="w-6 h-6 text-[#f07915] animate-spin" />}
                  </div>
                )}
              </div>
            ) : (
              <div className="p-3 space-y-3">
                {postIds.map((id) => (
                  <PostCard
                    key={id}
                    postId={id}
                    isOwnProfile
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
                    {isLoadingPosts && <Loader2 className="w-6 h-6 text-[#f07915] animate-spin" />}
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
              className="w-full py-4 border-2 border-dashed border-white/20 rounded-xl text-muted-foreground hover:text-foreground hover:border-[#f07915]/50 transition-colors flex items-center justify-center gap-2"
            >
              <Upload className="w-5 h-5" />
              {t('addCertificate')}
            </button>
            
            {certificates.length > 0 ? (
              <div className="grid grid-cols-2 gap-4">
                {certificates.map((cert) => (
                  <div key={cert.id} className="bg-surface-3 rounded-xl border border-border p-4">
                    <div className="flex items-start justify-between mb-2">
                      <div>
                        <h4 className="font-semibold text-foreground">{cert.title}</h4>
                        {cert.issuer && <p className="text-sm text-muted-foreground">{cert.issuer}</p>}
                        <p className="text-xs text-faint-foreground">{cert.year}</p>
                      </div>
                      <button
                        onClick={() => handleDeleteCertificate(cert.id)}
                        disabled={deleting === cert.id}
                        className="p-1 text-muted-foreground hover:text-red-400 transition-colors"
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
                        className="text-xs text-[#f07915] hover:underline"
                      >
                        {t('viewFile')}
                      </button>
                    )}
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8">
                <Award className="w-12 h-12 text-gray-600 mx-auto mb-4" />
                <p className="text-muted-foreground">{t('noCertificates')}</p>
              </div>
            )}
          </div>
        )}

        {activeTab === 'specializations' && (
          <div className="space-y-4">
            <button
              onClick={() => setShowSpecializationModal(true)}
              className="w-full py-4 border-2 border-dashed border-white/20 rounded-xl text-muted-foreground hover:text-foreground hover:border-[#f07915]/50 transition-colors flex items-center justify-center gap-2"
            >
              <Plus className="w-5 h-5" />
              {t('addSpecialization')}
            </button>
            
            {specializations.length > 0 ? (
              <div className="flex flex-wrap gap-3">
                {specializations.map((spec) => (
                  <div 
                    key={spec.id} 
                    className="px-4 py-2 bg-surface-3 rounded-xl border border-border flex items-center gap-2"
                  >
                    <span className="text-foreground">{spec.name}</span>
                    <button
                      onClick={() => handleDeleteSpecialization(spec.id)}
                      disabled={deleting === spec.id}
                      className="text-muted-foreground hover:text-red-400 transition-colors"
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
                <p className="text-muted-foreground">{t('noSpecializations')}</p>
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
                        : 'bg-surface-3 border-border'
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
                          achievement.tone === 'silver' ? 'text-muted-foreground' : 'text-faint-foreground'
                        }`} />
                      </div>
                      <div className="flex-1">
                        <h4 className={`font-semibold ${
                          achievement.tone === 'gold' ? 'text-amber-300' : 
                          achievement.tone === 'silver' ? 'text-muted-foreground' : 'text-foreground'
                        }`}>
                          {achievement.title}
                        </h4>
                        {achievement.subtitle && (
                          <p className="text-sm text-muted-foreground mt-0.5">{achievement.subtitle}</p>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-12">
                <Award className="w-12 h-12 text-gray-600 mx-auto mb-4" />
                <p className="text-muted-foreground">{t('noAchievements')}</p>
                <p className="text-sm text-faint-foreground mt-1">{t('achievementsWillAppear')}</p>
              </div>
            )}
          </div>
        )}

        {activeTab === 'reviews' && (
          <ProfileReviewsTab
            expertId={trainer.userId}
            accentText="text-[#f07915]"
            accentGradient="from-[#f07915]/10 to-[#d4600b]/10"
          />
        )}

        {/* About Modal */}
        {showAboutModal && (
          <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="bg-surface-3 rounded-2xl border border-border w-full max-w-lg"
            >
              <div className="p-6">
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-xl font-bold text-foreground">{t('aboutMe')}</h2>
                  <button onClick={() => setShowAboutModal(false)} className="text-muted-foreground hover:text-foreground">
                    <X className="w-6 h-6" />
                  </button>
                </div>
                <textarea
                  value={aboutText}
                  onChange={(e) => setAboutText(e.target.value)}
                  rows={5}
                  className="w-full px-4 py-3 bg-background border border-border rounded-lg text-foreground focus:outline-none focus:border-[#f07915] resize-none mb-4"
                  placeholder={t('aboutMePlaceholder')}
                />
                <button
                  onClick={handleSaveAbout}
                  disabled={saving}
                  className="w-full py-3 bg-gradient-to-r from-[#f07915] to-[#d4600b] text-foreground font-semibold rounded-lg hover:opacity-90 disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  {saving && <Loader2 className="w-5 h-5 animate-spin" />}
                  {tc('save')}
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
              className="bg-surface-3 rounded-2xl border border-border w-full max-w-lg"
            >
              <div className="p-6">
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-xl font-bold text-foreground">{t('addCertificate')}</h2>
                  <button onClick={() => setShowCertificateModal(false)} className="text-muted-foreground hover:text-foreground">
                    <X className="w-6 h-6" />
                  </button>
                </div>
                <form onSubmit={handleAddCertificate} className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-muted-foreground mb-2">{t('certificateName')}</label>
                    <input
                      type="text"
                      value={certTitle}
                      onChange={(e) => setCertTitle(e.target.value)}
                      className="w-full px-4 py-2.5 bg-background border border-border rounded-lg text-foreground focus:outline-none focus:border-[#f07915]"
                      placeholder={t('certificateNamePlaceholder')}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-muted-foreground mb-2">{t('organization')}</label>
                    <input
                      type="text"
                      value={certIssuer}
                      onChange={(e) => setCertIssuer(e.target.value)}
                      className="w-full px-4 py-2.5 bg-background border border-border rounded-lg text-foreground focus:outline-none focus:border-[#f07915]"
                      placeholder={t('organizationPlaceholder')}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-muted-foreground mb-2">{t('year')}</label>
                    <input
                      type="number"
                      value={certYear}
                      onChange={(e) => setCertYear(e.target.value)}
                      className="w-full px-4 py-2.5 bg-background border border-border rounded-lg text-foreground focus:outline-none focus:border-[#f07915]"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-muted-foreground mb-2">{t('file')}</label>
                    <label className="flex items-center justify-center w-full py-4 border-2 border-dashed border-white/20 rounded-lg cursor-pointer hover:border-[#f07915]/50 transition-colors">
                      <Upload className="w-5 h-5 text-muted-foreground mr-2" />
                      <span className="text-sm text-muted-foreground">
                        {certFile ? certFile.name : t('selectFile')}
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
                    className="w-full py-3 bg-gradient-to-r from-[#f07915] to-[#d4600b] text-foreground font-semibold rounded-lg hover:opacity-90 disabled:opacity-50 flex items-center justify-center gap-2"
                  >
                    {saving && <Loader2 className="w-5 h-5 animate-spin" />}
                    {tc('add')}
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
              className="bg-surface-3 rounded-2xl border border-border w-full max-w-lg"
            >
              <div className="p-6">
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-xl font-bold text-foreground">{t('addSpecialization')}</h2>
                  <button onClick={() => setShowSpecializationModal(false)} className="text-muted-foreground hover:text-foreground">
                    <X className="w-6 h-6" />
                  </button>
                </div>
                <form onSubmit={handleAddSpecialization} className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-muted-foreground mb-2">{t('specializations')}</label>
                    <select
                      value={specName}
                      onChange={(e) => setSpecName(e.target.value)}
                      className="w-full px-4 py-2.5 bg-background border border-border rounded-lg text-foreground focus:outline-none focus:border-[#f07915]"
                    >
                      <option value="">{t('selectSpecialization')}</option>
                      <option value={t('specializationOptions.strength')}>{t('specializationOptions.strength')}</option>
                      <option value={t('specializationOptions.cardio')}>{t('specializationOptions.cardio')}</option>
                      <option value={t('specializationOptions.functional')}>{t('specializationOptions.functional')}</option>
                      <option value={t('specializationOptions.crossfit')}>{t('specializationOptions.crossfit')}</option>
                      <option value={t('specializationOptions.pilates')}>{t('specializationOptions.pilates')}</option>
                      <option value={t('specializationOptions.yoga')}>{t('specializationOptions.yoga')}</option>
                      <option value={t('specializationOptions.stretching')}>{t('specializationOptions.stretching')}</option>
                      <option value={t('specializationOptions.trx')}>{t('specializationOptions.trx')}</option>
                      <option value={t('specializationOptions.boxing')}>{t('specializationOptions.boxing')}</option>
                      <option value={t('specializationOptions.martialArts')}>{t('specializationOptions.martialArts')}</option>
                      <option value={t('specializationOptions.hiit')}>{t('specializationOptions.hiit')}</option>
                      <option value={t('specializationOptions.tabata')}>{t('specializationOptions.tabata')}</option>
                      <option value={t('specializationOptions.bodybuilding')}>{t('specializationOptions.bodybuilding')}</option>
                      <option value={t('specializationOptions.powerlifting')}>{t('specializationOptions.powerlifting')}</option>
                      <option value={t('specializationOptions.weightlifting')}>{t('specializationOptions.weightlifting')}</option>
                      <option value={t('specializationOptions.rehabilitation')}>{t('specializationOptions.rehabilitation')}</option>
                      <option value={t('specializationOptions.therapeuticExercise')}>{t('specializationOptions.therapeuticExercise')}</option>
                      <option value={t('specializationOptions.prenatal')}>{t('specializationOptions.prenatal')}</option>
                      <option value={t('specializationOptions.childFitness')}>{t('specializationOptions.childFitness')}</option>
                      <option value={t('specializationOptions.seniorFitness')}>{t('specializationOptions.seniorFitness')}</option>
                      <option value={t('specializationOptions.weightLoss')}>{t('specializationOptions.weightLoss')}</option>
                      <option value={t('specializationOptions.massGain')}>{t('specializationOptions.massGain')}</option>
                      <option value={t('specializationOptions.bodyCorrection')}>{t('specializationOptions.bodyCorrection')}</option>
                      <option value={t('specializationOptions.sportPrep')}>{t('specializationOptions.sportPrep')}</option>
                      <option value={t('specializationOptions.nutrition')}>{t('specializationOptions.nutrition')}</option>
                    </select>
                  </div>
                  <button
                    type="submit"
                    disabled={saving || !specName}
                    className="w-full py-3 bg-gradient-to-r from-[#f07915] to-[#d4600b] text-foreground font-semibold rounded-lg hover:opacity-90 disabled:opacity-50 flex items-center justify-center gap-2"
                  >
                    {saving && <Loader2 className="w-5 h-5 animate-spin" />}
                    {tc('add')}
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
              className="bg-surface-3 rounded-2xl border border-border w-full max-w-lg max-h-[90vh] overflow-y-auto"
            >
              <div className="p-6">
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-xl font-bold text-foreground">{t('editProfile')}</h2>
                  <button onClick={() => setShowEditProfileModal(false)} className="text-muted-foreground hover:text-foreground">
                    <X className="w-6 h-6" />
                  </button>
                </div>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-muted-foreground mb-2">{t('primarySpecialty')}</label>
                    <input
                      type="text"
                      value={editPrimaryTitle}
                      onChange={(e) => setEditPrimaryTitle(e.target.value)}
                      className="w-full px-4 py-2.5 bg-background border border-border rounded-lg text-foreground focus:outline-none focus:border-[#f07915]"
                      placeholder={t('primarySpecialtyPlaceholder')}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-muted-foreground mb-2">{t('secondarySpecialty')}</label>
                    <input
                      type="text"
                      value={editSecondaryTitle}
                      onChange={(e) => setEditSecondaryTitle(e.target.value)}
                      className="w-full px-4 py-2.5 bg-background border border-border rounded-lg text-foreground focus:outline-none focus:border-[#f07915]"
                      placeholder={t('secondarySpecialtyPlaceholder')}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-muted-foreground mb-2">{t('experienceYears')}</label>
                    <input
                      type="number"
                      value={editExperienceYears}
                      onChange={(e) => setEditExperienceYears(e.target.value)}
                      className="w-full px-4 py-2.5 bg-background border border-border rounded-lg text-foreground focus:outline-none focus:border-[#f07915]"
                      placeholder="5"
                      min="0"
                      max="50"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-muted-foreground mb-2">{t('location')}</label>
                    <input
                      type="text"
                      value={editLocationDisplay}
                      readOnly
                      className="w-full px-4 py-2.5 bg-background border border-border rounded-lg text-foreground focus:outline-none focus:border-[#f07915]"
                      placeholder={t('locationPlaceholder')}
                    />
                  </div>
                  <div className="pt-2">
                    <button
                      onClick={handleSaveProfile}
                      disabled={saving}
                      className="w-full py-3 bg-gradient-to-r from-[#f07915] to-[#d4600b] text-foreground font-semibold rounded-lg hover:opacity-90 disabled:opacity-50 flex items-center justify-center gap-2"
                    >
                      {saving && <Loader2 className="w-5 h-5 animate-spin" />}
                      {tc('save')}
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
              className="relative w-full max-w-4xl max-h-[90vh] bg-surface-3 rounded-xl overflow-hidden"
            >
              <div className="sticky top-0 z-10 flex items-center justify-between p-4 bg-surface-3 border-b border-border">
                <h2 className="text-xl font-bold text-foreground">{t('certificate')}</h2>
                <button
                  onClick={() => setViewingCertificate(null)}
                  className="p-2 text-muted-foreground hover:text-foreground rounded-lg hover:bg-hover-overlay transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
              <div className="p-4 overflow-auto max-h-[calc(90vh-80px)]">
                <img 
                  src={viewingCertificate} 
                  alt={t('certificate')} 
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
              className="w-full max-w-md bg-surface-3 rounded-xl border border-border overflow-hidden"
            >
              <div className="flex items-center justify-between p-4 border-b border-border">
                <h2 className="text-xl font-bold text-foreground">{t('changeLocation')}</h2>
                <button
                  onClick={() => setShowEditLocationModal(false)}
                  className="p-2 text-muted-foreground hover:text-foreground rounded-lg hover:bg-hover-overlay transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
              <div className="p-4 space-y-4">
                <select
                  value={editLocationCountryCode}
                  onChange={(e) => {
                    setEditLocationCountryCode(e.target.value)
                    setEditLocationCity('')
                  }}
                  className="w-full px-4 py-2.5 bg-background border border-border rounded-lg text-foreground focus:outline-none focus:border-[#f07915]"
                >
                  <option value="">{tr('selectCountry')}</option>
                  {locationCountries.map(country => (
                    <option key={country.code} value={country.code}>{country.name}</option>
                  ))}
                </select>
                <select
                  value={editLocationCity}
                  onChange={(e) => setEditLocationCity(e.target.value)}
                  disabled={!editLocationCountryCode}
                  className="w-full px-4 py-2.5 bg-background border border-border rounded-lg text-foreground focus:outline-none focus:border-[#f07915] disabled:opacity-50"
                >
                  <option value="">{editLocationCountryCode ? tr('selectCity') : tr('selectCountry')}</option>
                  {locationCities.map(city => (
                    <option key={city.value} value={city.value}>{city.label}</option>
                  ))}
                </select>
                <button
                  onClick={handleSaveLocation}
                  disabled={saving}
                  className="w-full py-3 bg-gradient-to-r from-[#f07915] to-[#d4600b] text-foreground font-semibold rounded-lg hover:opacity-90 disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  {saving && <Loader2 className="w-5 h-5 animate-spin" />}
                  {tc('save')}
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
              className="w-full max-w-md bg-surface-3 rounded-xl border border-border overflow-hidden"
            >
              <div className="flex items-center justify-between p-4 border-b border-border">
                <h2 className="text-xl font-bold text-foreground">{t('changePhone')}</h2>
                <button
                  onClick={() => setShowEditPhoneModal(false)}
                  className="p-2 text-muted-foreground hover:text-foreground rounded-lg hover:bg-hover-overlay transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
              <div className="p-4 space-y-4">
                <input
                  type="tel"
                  value={editPhone}
                  onChange={(e) => setEditPhone(e.target.value)}
                  className="w-full px-4 py-2.5 bg-background border border-border rounded-lg text-foreground focus:outline-none focus:border-[#f07915]"
                  placeholder={t('phonePlaceholder')}
                />
                <button
                  onClick={handleSavePhone}
                  disabled={saving}
                  className="w-full py-3 bg-gradient-to-r from-[#f07915] to-[#d4600b] text-foreground font-semibold rounded-lg hover:opacity-90 disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  {saving && <Loader2 className="w-5 h-5 animate-spin" />}
                  {tc('save')}
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
              className="w-full max-w-md bg-surface-3 rounded-xl border border-border overflow-hidden"
            >
              <div className="flex items-center justify-between p-4 border-b border-border">
                <h2 className="text-xl font-bold text-foreground">{t('changeExperience')}</h2>
                <button
                  onClick={() => setShowEditExperienceModal(false)}
                  className="p-2 text-muted-foreground hover:text-foreground rounded-lg hover:bg-hover-overlay transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
              <div className="p-4 space-y-4">
                <input
                  type="number"
                  value={editExperienceYears}
                  onChange={(e) => setEditExperienceYears(e.target.value)}
                  className="w-full px-4 py-2.5 bg-background border border-border rounded-lg text-foreground focus:outline-none focus:border-[#f07915]"
                  placeholder="5"
                  min="0"
                />
                <button
                  onClick={handleSaveExperience}
                  disabled={saving}
                  className="w-full py-3 bg-gradient-to-r from-[#f07915] to-[#d4600b] text-foreground font-semibold rounded-lg hover:opacity-90 disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  {saving && <Loader2 className="w-5 h-5 animate-spin" />}
                  {tc('save')}
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
              className="w-full max-w-md bg-surface-3 rounded-xl border border-border overflow-hidden"
            >
              <div className="flex items-center justify-between p-4 border-b border-border">
                <h2 className="text-xl font-bold text-foreground">{t('changeGender')}</h2>
                <button
                  onClick={() => setShowEditGenderModal(false)}
                  className="p-2 text-muted-foreground hover:text-foreground rounded-lg hover:bg-hover-overlay transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
              <div className="p-4 space-y-4">
                <select
                  value={editGender}
                  onChange={(e) => setEditGender(e.target.value)}
                  className="w-full px-4 py-2.5 bg-background border border-border rounded-lg text-foreground focus:outline-none focus:border-[#f07915]"
                >
                  <option value="">{t('selectGender')}</option>
                  <option value="Male">{t('male')}</option>
                  <option value="Female">{t('female')}</option>
                  <option value="Other">{t('other')}</option>
                </select>
                <button
                  onClick={handleSaveGender}
                  disabled={saving}
                  className="w-full py-3 bg-gradient-to-r from-[#f07915] to-[#d4600b] text-foreground font-semibold rounded-lg hover:opacity-90 disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  {saving && <Loader2 className="w-5 h-5 animate-spin" />}
                  {tc('save')}
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </div>

      {/* Post Detail Modal */}
      {selectedPostId && (
        <TrainerPostDetailModal postId={selectedPostId} onClose={() => setSelectedPostId(null)} onDelete={handleDeletePost} deletingPostId={deletingPostId} />
      )}

      {/* Photo Lightbox */}
      {viewingPhoto && (
        <PhotoLightbox imageUrl={viewingPhoto.url} caption={viewingPhoto.caption} onClose={() => setViewingPhoto(null)} />
      )}

      {/* Toast Notifications */}
      {toastData && (
        <Toast
          message={toastData.message}
          type={toastData.type}
          onClose={() => setToastData(null)}
        />
      )}
    </>
  )
}
