'use client'

import { useUser } from '@/components/user/UserProvider'
import { useLevel } from '@/components/level/LevelProvider'
import { 
  Camera,
  Check,
  MapPin,
  Calendar,
  Zap,
  Grid,
  List,
  Loader2,
  X,
  Play,
  Heart,
  MessageCircle,
  Repeat2,
  Trash2,
  Users,
  Award,
} from 'lucide-react'

import { useState, useEffect, useCallback, useRef } from 'react'
import Link from 'next/link'
import { postsApi } from '@/lib/api/postsApi'
import { MediaType } from '@/types/post'
import type { ProfilePostTab } from '@/types/post'
import { getMediaUrl } from '@/lib/config'
import { uploadAvatar, deleteAvatar, uploadBanner, deleteBanner } from '@/lib/api/userApi'
import { updateUserProfile } from '@/lib/api/userApi'
import { getCitiesForCountry, getCountries, getCountryName, localizeCityName, localizeCountryName, resolveCountryCodeByName, translateCityName } from '@/lib/data/countries'
import { PostCard } from '@/components/posts/PostCard'
import { ProfilePostTabs } from '@/components/posts/ProfilePostTabs'
import { PhotoLightbox } from '@/components/ui/PhotoLightbox'
import { Toast } from '@/components/ui/Toast'
import { useUpsertPosts, usePost, usePostDispatch } from '@/contexts/PostStoreContext'
import { useTranslations } from 'next-intl'
import { useLanguage } from '@/components/language/LanguageProvider'

// ─── Grid cell with optimistic likes ───
function GridCell({
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
  const tPosts = useTranslations('posts')
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
      <div className="relative aspect-square bg-background overflow-hidden flex flex-col items-center justify-center text-center p-2">
        <Repeat2 className="w-6 h-6 text-gray-600 mb-1" />
        <p className="text-[10px] text-gray-600 leading-tight">{tPosts('deleted')}</p>
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
          className="flex items-center gap-1 text-foreground transition-all hover:scale-110 hover:text-blue-400"
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

// ─── Post detail modal ───
function PostDetailModal({ postId, onClose, onDelete, deletingPostId }: { postId: string; onClose: () => void; onDelete?: (postId: string) => void; deletingPostId?: string | null }) {
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

// ─── Main page ───
export default function UserProfilePage() {
  const { user, updateUser } = useUser()
  const { level } = useLevel()
  const { language } = useLanguage()
  const upsertPosts = useUpsertPosts()
  const dispatch = usePostDispatch()
  const tc = useTranslations('common')
  const tp = useTranslations('profile')
  const tPosts = useTranslations('posts')
  const tr = useTranslations('auth.register')

  const [postIds, setPostIds] = useState<string[]>([])
  const [isLoadingPosts, setIsLoadingPosts] = useState(true)
  const [page, setPage] = useState(1)
  const [hasMore, setHasMore] = useState(true)
  const [totalPosts, setTotalPosts] = useState(0)
  const [activeTab, setActiveTab] = useState<ProfilePostTab>('all')
  const [selectedPostId, setSelectedPostId] = useState<string | null>(null)
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid')
  const [playingVideoId, setPlayingVideoId] = useState<string | null>(null)
  const [viewingPhoto, setViewingPhoto] = useState<{ url: string; caption?: string } | null>(null)
  const [deletingPostId, setDeletingPostId] = useState<string | null>(null)
  const [toastData, setToastData] = useState<{ message: string; type: 'success' | 'error' } | null>(null)
  const [isEditingProfileInfo, setIsEditingProfileInfo] = useState(false)
  const [profileBioInput, setProfileBioInput] = useState('')
  const [profileCountryCodeInput, setProfileCountryCodeInput] = useState('')
  const [profileCityInput, setProfileCityInput] = useState('')
  const [savingProfileInfo, setSavingProfileInfo] = useState(false)
  const [showProfileSaved, setShowProfileSaved] = useState(false)
  const observerRef = useRef<HTMLDivElement>(null)
  const abortRef = useRef<AbortController | null>(null)
  const savedToastTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  // Calculate level progress from LevelProvider
  const currentLevel = level?.currentLevel ?? user?.level ?? 1
  const currentXp = level?.currentXp ?? user?.xp ?? 0
  const requiredXp = level?.requiredXpForNextLevel ?? user?.xpToNextLevel ?? 1000
  const levelProgress = Math.min(100, Math.max(0, requiredXp > 0 ? (currentXp / requiredXp) * 100 : 0))

  const profileChecks = [
    !!user?.avatarUrl,
    !!user?.bio,
    !!(user?.city || user?.country),
  ]
  const completionPercent = Math.round((profileChecks.filter(Boolean).length / profileChecks.length) * 100)
  const joinedDate = user?.createdAt ? new Date(user.createdAt) : null
  const userRole = String(user?.role ?? '').toLowerCase()
  const isExpertRole = userRole === 'trainer' || userRole === 'nutritionist' || userRole === '1' || userRole === '2'

  const countries = getCountries(language)
  const availableCities = profileCountryCodeInput ? getCitiesForCountry(profileCountryCodeInput, language) : []

  const resolveCountryCode = useCallback((countryName?: string | null) => {
    return resolveCountryCodeByName(countryName) || ''
  }, [])

  const localizedCountry = localizeCountryName(user?.country, language)
  const localizedCity = localizeCityName(user?.city, user?.country, language)

  useEffect(() => {
    setProfileBioInput(user?.bio || '')
    const countryCode = resolveCountryCode(user?.country)
    setProfileCountryCodeInput(countryCode)

    if (!countryCode || !user?.city) {
      setProfileCityInput('')
      return
    }

    const cityMatch = getCitiesForCountry(countryCode, language).find(c =>
      c.value.toLowerCase() === user.city!.toLowerCase() ||
      c.label.toLowerCase() === user.city!.toLowerCase() ||
      translateCityName(c.value, language).toLowerCase() === user.city!.toLowerCase()
    )
    setProfileCityInput(cityMatch?.value || '')
  }, [user?.bio, user?.country, user?.city, resolveCountryCode, language])

  useEffect(() => {
    return () => {
      if (savedToastTimerRef.current) {
        clearTimeout(savedToastTimerRef.current)
      }
    }
  }, [])

  const loadPosts = useCallback(async (pageNum: number, append: boolean = false) => {
    // Abort previous request
    if (abortRef.current) abortRef.current.abort()
    const controller = new AbortController()
    abortRef.current = controller

    try {
      setIsLoadingPosts(true)
      const response = await postsApi.getMyPosts(pageNum, 12, activeTab, controller.signal)
      if (controller.signal.aborted) return
      const ids = upsertPosts(response.posts)
      if (append) {
        setPostIds(prev => [...prev, ...ids])
      } else {
        setPostIds(ids)
      }
      setTotalPosts(response.totalCount)
      setHasMore(response.hasMore)
    } catch (error) {
      if (error instanceof DOMException && error.name === 'AbortError') return
      console.error('Failed to load posts:', error)
    } finally {
      if (!controller.signal.aborted) setIsLoadingPosts(false)
    }
  }, [activeTab, upsertPosts])

  const handleTabChange = useCallback((tab: ProfilePostTab) => {
    setActiveTab(tab)
    setPostIds([])
    setPage(1)
    setHasMore(true)
    setIsLoadingPosts(true)
  }, [])

  useEffect(() => {
    loadPosts(1)
  }, [loadPosts])

  const handleLoadMore = useCallback(() => {
    if (!isLoadingPosts && hasMore && postIds.length > 0) {
      const nextPage = page + 1
      setPage(nextPage)
      loadPosts(nextPage, true)
    }
  }, [isLoadingPosts, hasMore, page, postIds.length, loadPosts])

  const [uploadingAvatar, setUploadingAvatar] = useState(false)
  const [deletingAvatar, setDeletingAvatar] = useState(false)
  const [uploadingBanner, setUploadingBanner] = useState(false)
  const [deletingBanner, setDeletingBanner] = useState(false)

  const handleAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    if (!file.type.startsWith('image/')) {
      alert(tp('toasts.avatarSelectImage'))
      return
    }
    if (file.size > 5 * 1024 * 1024) {
      alert(tp('toasts.avatarSizeLimit'))
      return
    }

    try {
      setUploadingAvatar(true)
      const response = await uploadAvatar(file)
      if (response.avatarUrl) {
        updateUser({ avatarUrl: response.avatarUrl })
      }
    } catch (error) {
      console.error('Failed to upload avatar:', error)
      alert(tp('toasts.avatarUploadError'))
    } finally {
      setUploadingAvatar(false)
    }
  }

  const handleAvatarDelete = async () => {
    if (!confirm(tp('toasts.avatarDeleteConfirm'))) return
    try {
      setDeletingAvatar(true)
      await deleteAvatar()
      updateUser({ avatarUrl: null })
    } catch (error) {
      console.error('Failed to delete avatar:', error)
      alert(tp('toasts.avatarDeleteError'))
    } finally {
      setDeletingAvatar(false)
    }
  }

  const handleBannerUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    if (!file.type.startsWith('image/')) {
      alert(tp('toasts.avatarSelectImage'))
      return
    }
    if (file.size > 8 * 1024 * 1024) {
      alert(tp('toasts.avatarSizeLimit'))
      return
    }

    try {
      setUploadingBanner(true)
      const response = await uploadBanner(file)
      if (response.bannerUrl) {
        updateUser({ bannerUrl: response.bannerUrl })
      }
    } catch (error) {
      console.error('Failed to upload banner:', error)
      alert(tp('toasts.avatarUploadError'))
    } finally {
      setUploadingBanner(false)
    }
  }

  const handleBannerDelete = async () => {
    if (!confirm(tp('toasts.avatarDeleteConfirm'))) return
    try {
      setDeletingBanner(true)
      await deleteBanner()
      updateUser({ bannerUrl: null })
    } catch (error) {
      console.error('Failed to delete banner:', error)
      alert(tp('toasts.avatarDeleteError'))
    } finally {
      setDeletingBanner(false)
    }
  }

  const handleDeletePost = async (postId: string) => {
    if (!confirm(tPosts('deleteConfirm'))) return
    try {
      setDeletingPostId(postId)
      await postsApi.deletePost(postId)
      dispatch({ type: 'REMOVE_POST', postId })
      setPostIds(prev => prev.filter(id => id !== postId))
      setSelectedPostId(null)
      setToastData({ message: tPosts('deleted'), type: 'success' })
    } catch (error) {
      console.error('[Delete] Failed to delete post:', postId, error)
      const message = error instanceof Error ? error.message : tPosts('deleteError')
      setToastData({ message, type: 'error' })
    } finally {
      setDeletingPostId(null)
    }
  }

  const handleSaveProfileInfo = async () => {
    try {
      setSavingProfileInfo(true)
      const trimmedBio = profileBioInput.trim()
      const translatedCountry = profileCountryCodeInput ? getCountryName(profileCountryCodeInput, language) : ''
      const translatedCity = profileCityInput ? translateCityName(profileCityInput, language) : ''

      const response = await updateUserProfile({
        bio: trimmedBio,
        country: translatedCountry,
        city: translatedCity,
      })

      updateUser({
        bio: response.user?.bio ?? null,
        country: response.user?.country ?? null,
        city: response.user?.city ?? null,
      })
      setIsEditingProfileInfo(false)
      setShowProfileSaved(true)
      if (savedToastTimerRef.current) {
        clearTimeout(savedToastTimerRef.current)
      }
      savedToastTimerRef.current = setTimeout(() => setShowProfileSaved(false), 1800)
      setToastData({ message: tp('toasts.profileUpdated'), type: 'success' })
    } catch (error) {
      console.error('Failed to update profile info:', error)
      setToastData({ message: tp('toasts.profileUpdateError'), type: 'error' })
    } finally {
      setSavingProfileInfo(false)
    }
  }

  // Infinite scroll
  useEffect(() => {
    if (!hasMore || isLoadingPosts) return
    const observer = new IntersectionObserver(
      (entries) => { if (entries[0].isIntersecting) handleLoadMore() },
      { threshold: 0.1 }
    )
    if (observerRef.current) observer.observe(observerRef.current)
    return () => observer.disconnect()
  }, [hasMore, isLoadingPosts, handleLoadMore])

  return (
    <>
      <div className="pb-6">
        {/* Profile Header */}
        <div className="bg-surface-3 rounded-xl border border-border overflow-hidden mb-4">
          <div className="relative h-48 bg-gradient-to-r from-[#0c8de6] to-[#0070c4] overflow-hidden">
            {user?.bannerUrl && (
              <img
                src={getMediaUrl(user.bannerUrl) || ''}
                alt="Profile banner"
                className="absolute inset-0 w-full h-full object-cover"
              />
            )}
            <div className="absolute top-3 right-3 flex items-center gap-1.5">
              <input
                type="file"
                id="user-banner-upload"
                accept="image/*"
                onChange={handleBannerUpload}
                className="hidden"
              />
              <label
                htmlFor="user-banner-upload"
                className="p-1.5 bg-black/45 rounded-full border border-white/20 hover:bg-black/60 transition-colors cursor-pointer"
                title={tp('editProfile')}
              >
                {uploadingBanner ? (
                  <Loader2 className="w-3.5 h-3.5 text-foreground animate-spin" />
                ) : (
                  <Camera className="w-3.5 h-3.5 text-foreground" />
                )}
              </label>
              {user?.bannerUrl && (
                <button
                  type="button"
                  onClick={handleBannerDelete}
                  disabled={deletingBanner}
                  className="p-1.5 bg-black/45 rounded-full border border-white/20 hover:bg-red-500/40 transition-colors"
                  title={tc('delete')}
                >
                  {deletingBanner ? (
                    <Loader2 className="w-3.5 h-3.5 text-foreground animate-spin" />
                  ) : (
                    <Trash2 className="w-3.5 h-3.5 text-red-200" />
                  )}
                </button>
              )}
            </div>
          </div>

          <div className="relative flex flex-col items-center -mt-16 pb-6 px-6">
            <div className="relative z-10">
              {/* Level badge above avatar */}
              <div className="absolute -top-3 left-1/2 -translate-x-1/2 z-20 px-2.5 py-0.5 bg-gradient-to-r from-[#0c8de6] to-[#0070c4] rounded-full border border-white/20 shadow-lg shadow-[#0c8de6]/20">
                <span className="text-[11px] font-bold text-white whitespace-nowrap">Lv. {currentLevel}</span>
              </div>
              {user?.avatarUrl ? (
                <img
                  src={getMediaUrl(user.avatarUrl) || ''}
                  alt={user?.fullName || 'User'}
                  className="w-32 h-32 rounded-2xl object-cover border-4 border-white dark:border-[#1A1A1A] shadow-xl"
                />
              ) : (
                <div className="w-32 h-32 rounded-2xl bg-gradient-to-br from-[#0c8de6] to-[#0070c4] flex items-center justify-center border-4 border-white dark:border-[#1A1A1A] shadow-xl">
                  <span className="text-white text-4xl font-bold">
                    {user?.fullName?.charAt(0) || 'U'}
                  </span>
                </div>
              )}
              <input
                type="file"
                id="user-avatar-upload"
                accept="image/*"
                onChange={handleAvatarUpload}
                className="hidden"
              />
              <label
                htmlFor="user-avatar-upload"
                className="absolute bottom-1 right-1 p-1.5 bg-background/80 backdrop-blur-sm rounded-full border border-border hover:bg-white/10 transition-colors cursor-pointer"
              >
                {uploadingAvatar ? (
                  <Loader2 className="w-3.5 h-3.5 text-muted-foreground animate-spin" />
                ) : (
                  <Camera className="w-3.5 h-3.5 text-muted-foreground" />
                )}
              </label>
              {user?.avatarUrl && (
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

            <h1 className="text-2xl font-bold text-foreground mt-4 text-center">{user?.fullName || 'User'}</h1>

            <div className="mt-2 flex items-center flex-wrap justify-center gap-4 text-xs text-muted-foreground">
              <div className="inline-flex items-center gap-1.5">
                <Zap className="w-3.5 h-3.5 text-[#0c8de6]" />
                <span>{tp('xp')}: {currentXp.toLocaleString()}</span>
              </div>
              {joinedDate && (
                <div className="inline-flex items-center gap-1.5">
                  <Calendar className="w-3.5 h-3.5 text-faint-foreground" />
                  <span>{tp('joined')}: {joinedDate.toLocaleDateString()}</span>
                </div>
              )}
            </div>

            <div className="mt-3 w-full max-w-xs">
              <div className="flex justify-between text-[11px] text-muted-foreground mb-1">
                <span>Lv. {currentLevel}</span>
                <span>{currentXp} / {requiredXp} XP</span>
              </div>
              <div className="h-2 rounded-full bg-white/10 overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-[#0c8de6] to-[#0070c4] rounded-full transition-all"
                  style={{ width: `${levelProgress}%` }}
                />
              </div>
            </div>

            <div className="mt-6 w-full grid grid-cols-4 divide-x divide-border rounded-xl bg-white/[0.03] border border-border-subtle py-4">
              <Link href="/user/journey" className="flex flex-col items-center gap-1 hover:opacity-80 transition-opacity">
                <p className="text-xl font-bold text-foreground">{(user?.workoutsCompleted || 0).toLocaleString()}</p>
                <p className="text-[11px] text-faint-foreground">{tp('workouts')}</p>
              </Link>
              <Link href="/user/friends" className="flex flex-col items-center gap-1 hover:opacity-80 transition-opacity">
                <p className="text-xl font-bold text-foreground">{(user?.followersCount || 0).toLocaleString()}</p>
                <p className="text-[11px] text-faint-foreground">{tp('followers')}</p>
              </Link>
              <Link href="/user/friends" className="flex flex-col items-center gap-1 hover:opacity-80 transition-opacity">
                <p className="text-xl font-bold text-foreground">{(user?.followingCount || 0).toLocaleString()}</p>
                <p className="text-[11px] text-faint-foreground">{tp('following')}</p>
              </Link>
              <Link href="/user/achievements" className="flex flex-col items-center gap-1 hover:opacity-80 transition-opacity">
                <p className="text-xl font-bold text-foreground">{(user?.achievementsCount || 0).toLocaleString()}</p>
                <p className="text-[11px] text-faint-foreground">{tp('achievements')}</p>
              </Link>
            </div>

            <div className="mt-6 w-full bg-surface-1 dark:bg-white/[0.02] rounded-xl border border-border-subtle p-5">
              <div className="flex items-center justify-between gap-3 mb-3">
                <h3 className="text-sm font-semibold text-muted-foreground">{tp('aboutMe')}</h3>
                {!isEditingProfileInfo ? (
                  <button
                    type="button"
                    onClick={() => setIsEditingProfileInfo(true)}
                    className="text-xs text-[#93C5FD] hover:text-foreground transition-colors"
                  >
                    {tp('editProfile')}
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={() => {
                      setIsEditingProfileInfo(false)
                      setProfileBioInput(user?.bio || '')
                      const resetCode = resolveCountryCode(user?.country)
                      setProfileCountryCodeInput(resetCode)
                      const resetCity = user?.city
                        ? getCitiesForCountry(resetCode, language).find(c =>
                            c.value.toLowerCase() === user.city!.toLowerCase() ||
                            c.label.toLowerCase() === user.city!.toLowerCase() ||
                            translateCityName(c.value, language).toLowerCase() === user.city!.toLowerCase()
                          )?.value || ''
                        : ''
                      setProfileCityInput(resetCity)
                    }}
                    className="text-xs text-muted-foreground hover:text-foreground transition-colors"
                  >
                    {tc('cancel')}
                  </button>
                )}
              </div>

              {isEditingProfileInfo ? (
                <div className="space-y-3">
                  <textarea
                    value={profileBioInput}
                    onChange={(e) => setProfileBioInput(e.target.value)}
                    rows={3}
                    maxLength={1000}
                    placeholder={tp('aboutMePlaceholder')}
                    className="w-full px-3 py-2.5 text-sm bg-background border border-border rounded-xl text-foreground placeholder-gray-500 focus:outline-none focus:border-[#0c8de6]/60 resize-none"
                  />
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    <select
                      value={profileCountryCodeInput}
                      onChange={(e) => {
                        setProfileCountryCodeInput(e.target.value)
                        setProfileCityInput('')
                      }}
                      className="w-full px-3 py-2.5 text-sm bg-background border border-border rounded-xl text-foreground focus:outline-none focus:border-[#0c8de6]/60"
                    >
                      <option value="">{tr('selectCountry')}</option>
                      {countries.map((country) => (
                        <option key={country.code} value={country.code}>
                          {country.name}
                        </option>
                      ))}
                    </select>
                    <select
                      value={profileCityInput}
                      onChange={(e) => setProfileCityInput(e.target.value)}
                      disabled={!profileCountryCodeInput}
                      className="w-full px-3 py-2.5 text-sm bg-background border border-border rounded-xl text-foreground focus:outline-none focus:border-[#0c8de6]/60 disabled:opacity-50"
                    >
                      <option value="">{profileCountryCodeInput ? tr('selectCity') : tr('selectCountry')}</option>
                      {availableCities.map((city) => (
                        <option key={city.value} value={city.value}>
                          {city.label}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div className="flex justify-end">
                    {showProfileSaved && (
                      <span className="mr-2 inline-flex items-center gap-1 text-emerald-400 text-xs animate-pulse">
                        <Check className="w-3.5 h-3.5" />
                        {tp('toasts.profileUpdated')}
                      </span>
                    )}
                    <button
                      type="button"
                      onClick={handleSaveProfileInfo}
                      disabled={savingProfileInfo}
                      className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-gradient-to-r from-[#0c8de6] to-[#0070c4] text-white text-xs font-semibold hover:opacity-90 disabled:opacity-50"
                    >
                      {savingProfileInfo && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                      {tc('save')}
                    </button>
                  </div>
                </div>
              ) : (
                <>
                  <p className="text-sm text-muted-foreground leading-relaxed">{user?.bio || tp('addDescription')}</p>
                  <div className="flex items-center gap-1.5 mt-3 text-xs text-muted-foreground">
                    <MapPin className="w-3.5 h-3.5" />
                    <span>
                      {[localizedCity, localizedCountry].filter(Boolean).join(', ') || tp('notSpecified')}
                    </span>
                  </div>
                </>
              )}
            </div>

            {completionPercent < 100 && (
              <div className="mt-4 rounded-xl border border-[#0c8de6]/20 bg-[#0c8de6]/[0.06] p-4">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="text-sm font-semibold text-foreground">{tp('fillProfile')}</p>
                    <p className="text-xs text-muted-foreground mt-1">
                      {isExpertRole ? tp('fillProfileDescription') : tp('fillProfileDescriptionUser')}
                    </p>
                  </div>
                  <span className="text-xs font-semibold text-[#93C5FD]">{completionPercent}%</span>
                </div>
                <div className="mt-2 h-1.5 rounded-full bg-white/10 overflow-hidden">
                  <div className="h-full bg-gradient-to-r from-[#0c8de6] to-[#0070c4]" style={{ width: `${completionPercent}%` }} />
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Posts Section */}
        <div className="bg-surface-3 rounded-xl border border-border overflow-hidden">
          <div className="px-4 py-3 border-b border-border flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Grid className="w-5 h-5 text-[#0c8de6]" />
              <h3 className="font-semibold text-foreground">{tPosts('postsTab')}</h3>
              {totalPosts > 0 && <span className="text-xs text-faint-foreground">({totalPosts})</span>}
            </div>
            <div className="flex items-center gap-1 bg-background rounded-lg p-0.5">
              <button
                onClick={() => setViewMode('grid')}
                className={`p-1.5 rounded-md transition-colors ${viewMode === 'grid' ? 'bg-white/10 text-[#0c8de6]' : 'text-faint-foreground hover:text-muted-foreground'}`}
              >
                <Grid className="w-4 h-4" />
              </button>
              <button
                onClick={() => setViewMode('list')}
                className={`p-1.5 rounded-md transition-colors ${viewMode === 'list' ? 'bg-white/10 text-[#0c8de6]' : 'text-faint-foreground hover:text-muted-foreground'}`}
              >
                <List className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Post type tabs */}
          <ProfilePostTabs activeTab={activeTab} onTabChange={handleTabChange} disabled={isLoadingPosts} />

          {postIds.length === 0 && !isLoadingPosts ? (
            <div className="py-12 text-center">
              <Camera className="w-12 h-12 text-gray-600 mx-auto mb-4" />
              <p className="text-muted-foreground">{tPosts('noPublications')}</p>
              <p className="text-sm text-faint-foreground mt-1">{tp('uploadPhotoOrVideo')}</p>
            </div>
          ) : viewMode === 'grid' ? (
            <div>
              <div className="grid grid-cols-3 gap-2 p-2">
                {postIds.map((id) => (
                  <GridCell key={id} postId={id} onSelect={setSelectedPostId} onDelete={handleDeletePost} deletingPostId={deletingPostId} />
                ))}
              </div>
              {(isLoadingPosts || hasMore) && (
                <div ref={observerRef} className="py-8 flex justify-center">
                  {isLoadingPosts && <Loader2 className="w-6 h-6 text-[#0c8de6] animate-spin" />}
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
              {(isLoadingPosts || hasMore) && (
                <div ref={observerRef} className="py-8 flex justify-center">
                  {isLoadingPosts && <Loader2 className="w-6 h-6 text-[#0c8de6] animate-spin" />}
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Post Detail Modal */}
      {selectedPostId && (
        <PostDetailModal postId={selectedPostId} onClose={() => setSelectedPostId(null)} onDelete={handleDeletePost} deletingPostId={deletingPostId} />
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
