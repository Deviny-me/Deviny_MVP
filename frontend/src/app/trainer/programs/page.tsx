'use client'

import { motion } from 'framer-motion'
import { useState, useEffect } from 'react'
import { useTranslations } from 'next-intl'
import { useRouter, useSearchParams } from 'next/navigation'
import { 
  Plus,
  Users,
  Star,
  Search,
  Edit,
  Trash2,
  BookOpen,
  TrendingUp,
  X,
  Upload,
  Loader2,
  Video,
  DollarSign,
  Dumbbell,
  Apple,
  MessageSquare,
  Eye,
  EyeOff
} from 'lucide-react'
import { programsApi } from '@/lib/api/programsApi'
import { mealProgramsApi } from '@/lib/api/mealProgramsApi'
import { ProgramDto, MealProgramDto, ProgramType, ProgramCategory } from '@/types/program'
import { getMediaUrl } from '@/lib/config'
import { useAuth } from '@/features/auth/AuthContext'

const toast = {
  success: (msg: string) => console.log('Success:', msg),
  error: (msg: string) => console.error('Error:', msg),
}

// Unified shape for displaying programs in both tabs
type UnifiedProgram = {
  id: string
  title: string
  description: string
  detailedDescription?: string
  price: number
  proPrice?: number
  category: ProgramCategory
  code: string
  coverImageUrl: string
  createdAt: string
  updatedAt: string
  type: ProgramType
  isPublic: boolean
  // Training-specific
  averageRating?: number
  totalReviews?: number
  totalPurchases?: number
  trainingVideoUrls?: string[]
}

function toUnifiedFromTraining(p: ProgramDto): UnifiedProgram {
  return {
    id: p.id,
    title: p.title,
    description: p.description,
    detailedDescription: p.detailedDescription,
    price: p.price,
    proPrice: p.proPrice,
    category: (p.category as ProgramCategory) || 'Training',
    code: p.code,
    coverImageUrl: p.coverImageUrl,
    createdAt: p.createdAt,
    updatedAt: p.updatedAt,
    type: 'training',
    isPublic: p.isPublic ?? true,
    averageRating: p.averageRating,
    totalReviews: p.totalReviews,
    totalPurchases: p.totalPurchases,
    trainingVideoUrls: p.trainingVideoUrls,
  }
}

function toUnifiedFromMeal(p: MealProgramDto): UnifiedProgram {
  return {
    id: p.id,
    title: p.title,
    description: p.description,
    detailedDescription: p.detailedDescription,
    price: p.price,
    proPrice: p.proPrice,
    category: (p.category as ProgramCategory) || 'Diet',
    code: p.code,
    coverImageUrl: p.coverImageUrl,
    createdAt: p.createdAt,
    updatedAt: p.updatedAt,
    type: 'meal',
    isPublic: p.isPublic ?? true,
    averageRating: 0,
    totalReviews: 0,
    totalPurchases: 0,
    trainingVideoUrls: p.videoUrls,
  }
}

export default function ProgramsPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const { user: currentUser } = useAuth()
  const t = useTranslations('programs')
  const tp = useTranslations('profile')
  const tc = useTranslations('common')

  // Trainer accent colors
  const accent = {
    gradient: 'from-[#FF6B35] to-[#FF0844]',
    text: 'text-[#FF6B35]',
    border: 'focus:border-[#FF6B35]',
    hoverBorder: 'hover:border-[#FF6B35]/50',
    bg: 'bg-[#FF6B35]',
    hoverText: 'group-hover:text-[#FF6B35]',
  }

  // Active tab — now based on category
  const [activeTab, setActiveTab] = useState<ProgramCategory>('Training')

  // Data
  const [trainingPrograms, setTrainingPrograms] = useState<ProgramDto[]>([])
  const [mealPrograms, setMealPrograms] = useState<MealProgramDto[]>([])
  const [loadingTraining, setLoadingTraining] = useState(false)
  const [loadingMeal, setLoadingMeal] = useState(false)

  // Search
  const [searchQuery, setSearchQuery] = useState('')

  // Modal state
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [editingProgram, setEditingProgram] = useState<UnifiedProgram | null>(null)
  const [selectedProgram, setSelectedProgram] = useState<UnifiedProgram | null>(null)
  const [saving, setSaving] = useState(false)
  const [deleting, setDeleting] = useState<string | null>(null)

  // Form state
  const [formCategory, setFormCategory] = useState<ProgramCategory>('Training')
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [detailedDescription, setDetailedDescription] = useState('')
  const [price, setPrice] = useState('')
  const [proPrice, setProPrice] = useState('')
  const [coverImage, setCoverImage] = useState<File | null>(null)
  const [coverPreview, setCoverPreview] = useState<string | null>(null)
  const [trainingVideos, setTrainingVideos] = useState<File[]>([])
  const [isPublic, setIsPublic] = useState(true)

  // Load data when currentUser is ready
  useEffect(() => {
    if (!currentUser) return
    setActiveTab('Training')
    loadTrainingPrograms()
    loadMealPrograms()
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentUser])

  // Deep link: ?program=<id>
  useEffect(() => {
    const programId = searchParams.get('program')
    if (!programId) return
    const programsPath = '/trainer/programs'
    router.replace(programsPath, { scroll: false })

    const own = trainingPrograms.find(p => p.id === programId)
    if (own) {
      setSelectedProgram(toUnifiedFromTraining(own))
      return
    }
    const ownMeal = mealPrograms.find(p => p.id === programId)
    if (ownMeal) {
      setSelectedProgram(toUnifiedFromMeal(ownMeal))
      return
    }

    programsApi.getProgramById(programId).then(pub => {
      if (pub) {
        setSelectedProgram({
          id: pub.id,
          title: pub.title,
          description: pub.description,
          price: pub.price,
          code: pub.code,
          coverImageUrl: pub.coverImageUrl,
          createdAt: pub.createdAt,
          updatedAt: '',
          type: 'training',
          category: (pub.category as ProgramCategory) || 'Training',
          averageRating: pub.averageRating,
          totalReviews: pub.totalReviews,
          totalPurchases: pub.totalPurchases,
          isPublic: true,
        })
      }
    })
  }, [searchParams, trainingPrograms, mealPrograms])

  const loadTrainingPrograms = async () => {
    try {
      setLoadingTraining(true)
      const data = await programsApi.getMyPrograms()
      setTrainingPrograms(data)
    } catch (error) {
      console.error('Failed to load training programs:', error)
      toast.error(t('toasts.loadError'))
    } finally {
      setLoadingTraining(false)
    }
  }

  const loadMealPrograms = async () => {
    try {
      setLoadingMeal(true)
      const data = await mealProgramsApi.getMyMealPrograms()
      setMealPrograms(data)
    } catch (error) {
      console.error('Failed to load meal programs:', error)
      toast.error(t('toasts.loadError'))
    } finally {
      setLoadingMeal(false)
    }
  }

  // All unified programs
  const allTrainingUnified = trainingPrograms.map(toUnifiedFromTraining)
  const allMealUnified = mealPrograms.map(toUnifiedFromMeal)
  const allPrograms = [...allTrainingUnified, ...allMealUnified]

  // Current list based on active tab (filter by category)
  const currentPrograms: UnifiedProgram[] = allPrograms.filter(p => p.category === activeTab)

  const filteredPrograms = currentPrograms.filter(p => {
    if (!searchQuery) return true
    return p.title.toLowerCase().includes(searchQuery.toLowerCase())
  })

  const isLoading = loadingTraining || loadingMeal

  // Stats
  const trainingStats = {
    total: trainingPrograms.length,
    purchases: trainingPrograms.reduce((acc, p) => acc + p.totalPurchases, 0),
    avgRating: trainingPrograms.length > 0
      ? (trainingPrograms.reduce((a, p) => a + p.averageRating, 0) / trainingPrograms.length).toFixed(1)
      : '0',
    reviews: trainingPrograms.reduce((a, p) => a + p.totalReviews, 0),
  }

  const dietPrograms = allMealUnified.filter(p => p.category === 'Diet')
  const dietStats = {
    total: dietPrograms.length,
    purchases: dietPrograms.reduce((acc, p) => acc + (p.totalPurchases ?? 0), 0),
    avgRating: dietPrograms.length > 0
      ? (dietPrograms.reduce((a, p) => a + (p.averageRating ?? 0), 0) / dietPrograms.length).toFixed(1)
      : '0',
    reviews: dietPrograms.reduce((a, p) => a + (p.totalReviews ?? 0), 0),
  }

  const consultationPrograms = allMealUnified.filter(p => p.category === 'Consultation')
  const consultationStats = {
    total: consultationPrograms.length,
    purchases: consultationPrograms.reduce((acc, p) => acc + (p.totalPurchases ?? 0), 0),
    avgRating: consultationPrograms.length > 0
      ? (consultationPrograms.reduce((a, p) => a + (p.averageRating ?? 0), 0) / consultationPrograms.length).toFixed(1)
      : '0',
    reviews: consultationPrograms.reduce((a, p) => a + (p.totalReviews ?? 0), 0),
  }

  // Form helpers
  const resetForm = () => {
    setTitle('')
    setDescription('')
    setDetailedDescription('')
    setPrice('')
    setProPrice('')
    setCoverImage(null)
    setCoverPreview(null)
    setTrainingVideos([])
    setIsPublic(true)
    setEditingProgram(null)
    setFormCategory(activeTab)
  }

  const openCreateModal = () => {
    resetForm()
    setFormCategory(activeTab)
    setShowCreateModal(true)
  }

  const openEditModal = (program: UnifiedProgram) => {
    setEditingProgram(program)
    setFormCategory(program.category)
    setTitle(program.title)
    setDescription(program.description)
    setDetailedDescription(program.detailedDescription || '')
    setPrice(program.price.toString())
    setProPrice(program.proPrice != null ? program.proPrice.toString() : '')
    setIsPublic(program.isPublic ?? true)
    setCoverPreview(program.coverImageUrl ? getMediaUrl(program.coverImageUrl) : null)
    setShowCreateModal(true)
  }

  const closeModal = () => {
    setShowCreateModal(false)
    resetForm()
  }

  const handleCoverImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      setCoverImage(file)
      setCoverPreview(URL.createObjectURL(file))
    }
  }

  const handleVideosChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || [])
    setTrainingVideos(prev => [...prev, ...files])
  }

  const removeVideo = (index: number) => {
    setTrainingVideos(prev => prev.filter((_, i) => i !== index))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!title || !description || !price) {
      toast.error(t('toasts.fillRequired'))
      return
    }

    if (!editingProgram && !coverImage) {
      toast.error(t('toasts.addCover'))
      return
    }

    try {
      setSaving(true)

      // Training & Consultation use TrainingProgram API; Diet uses MealProgram API
      if (formCategory === 'Training' || formCategory === 'Consultation') {
        if (editingProgram) {
          await programsApi.updateProgram(editingProgram.id, {
            title,
            description,
            detailedDescription: detailedDescription || undefined,
            price: parseFloat(price),
            proPrice: proPrice ? parseFloat(proPrice) : undefined,
            category: formCategory,
            isPublic,
            coverImage: coverImage || undefined,
            trainingVideos: trainingVideos.length > 0 ? trainingVideos : undefined,
          })
          toast.success(t('toasts.updated'))
        } else {
          await programsApi.createProgram({
            title,
            description,
            detailedDescription: detailedDescription || undefined,
            price: parseFloat(price),
            proPrice: proPrice ? parseFloat(proPrice) : undefined,
            category: formCategory,
            isPublic,
            coverImage: coverImage!,
            trainingVideos,
          })
          toast.success(t('toasts.created'))
        }
        loadTrainingPrograms()
      } else {
        // Diet
        if (editingProgram) {
          await mealProgramsApi.updateMealProgram(editingProgram.id, {
            title,
            description,
            detailedDescription: detailedDescription || undefined,
            price: parseFloat(price),
            proPrice: proPrice ? parseFloat(proPrice) : undefined,
            category: formCategory,
            isPublic,
            coverImage: coverImage || undefined,
            videos: trainingVideos.length > 0 ? trainingVideos : undefined,
          })
          toast.success(t('toasts.updated'))
        } else {
          await mealProgramsApi.createMealProgram({
            title,
            description,
            detailedDescription: detailedDescription || undefined,
            price: parseFloat(price),
            proPrice: proPrice ? parseFloat(proPrice) : undefined,
            category: formCategory,
            isPublic,
            coverImage: coverImage!,
            videos: trainingVideos,
          })
          toast.success(t('toasts.created'))
        }
        loadMealPrograms()
      }

      closeModal()
    } catch (error) {
      console.error('Failed to save program:', error)
      const message = error instanceof Error ? error.message : 'Unknown error'
      toast.error(editingProgram ? `${t('toasts.updateError')}: ${message}` : `${t('toasts.createError')}: ${message}`)
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async (program: UnifiedProgram) => {
    if (!confirm(t('toasts.deleteConfirm'))) return

    try {
      setDeleting(program.id)
      if (program.type === 'training') {
        await programsApi.deleteProgram(program.id)
        loadTrainingPrograms()
      } else {
        await mealProgramsApi.deleteMealProgram(program.id)
        loadMealPrograms()
      }
      toast.success(t('toasts.deleted'))
    } catch (error) {
      console.error('Failed to delete program:', error)
      toast.error(t('toasts.deleteError'))
    } finally {
      setDeleting(null)
    }
  }

  return (
    <>
      <div className="space-y-6 pb-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-white">{t('title')}</h1>
            <p className="text-gray-400">{t('description')}</p>
          </div>
          <button 
            onClick={openCreateModal}
            className={`px-4 py-2 bg-gradient-to-r ${accent.gradient} text-white font-semibold rounded-lg hover:opacity-90 flex items-center gap-2`}
          >
            <Plus className="w-5 h-5" />
            {t('createProgram')}
          </button>
        </div>

        {/* Tabs */}
        <div className="flex items-center gap-1 bg-[#0A0A0A] rounded-xl p-1 w-fit border border-white/10">
          <button
              onClick={() => setActiveTab('Training')}
              className={`flex items-center gap-2 px-5 py-2.5 rounded-lg text-sm font-medium transition-all ${
                activeTab === 'Training'
                  ? `bg-gradient-to-r ${accent.gradient} text-white shadow-lg`
                  : 'text-gray-400 hover:text-white'
              }`}
            >
              <Dumbbell className="w-4 h-4" />
              {t('tabTraining')}
              <span className={`px-1.5 py-0.5 rounded-full text-xs ${
                activeTab === 'Training' ? 'bg-white/20' : 'bg-white/10'
              }`}>
                {allPrograms.filter(p => p.category === 'Training').length}
              </span>
            </button>
          <button
            onClick={() => setActiveTab('Diet')}
            className={`flex items-center gap-2 px-5 py-2.5 rounded-lg text-sm font-medium transition-all ${
              activeTab === 'Diet'
                ? `bg-gradient-to-r ${accent.gradient} text-white shadow-lg`
                : 'text-gray-400 hover:text-white'
            }`}
          >
            <Apple className="w-4 h-4" />
            {t('tabMeal')}
            <span className={`px-1.5 py-0.5 rounded-full text-xs ${
              activeTab === 'Diet' ? 'bg-white/20' : 'bg-white/10'
            }`}>
              {allPrograms.filter(p => p.category === 'Diet').length}
            </span>
          </button>
          <button
            onClick={() => setActiveTab('Consultation')}
            className={`flex items-center gap-2 px-5 py-2.5 rounded-lg text-sm font-medium transition-all ${
              activeTab === 'Consultation'
                ? `bg-gradient-to-r ${accent.gradient} text-white shadow-lg`
                : 'text-gray-400 hover:text-white'
            }`}
          >
            <MessageSquare className="w-4 h-4" />
            {t('tabConsultation')}
            <span className={`px-1.5 py-0.5 rounded-full text-xs ${
              activeTab === 'Consultation' ? 'bg-white/20' : 'bg-white/10'
            }`}>
              {allPrograms.filter(p => p.category === 'Consultation').length}
            </span>
          </button>
        </div>

        {/* Stats */}
        {activeTab === 'Training' && (
          <div className="grid grid-cols-4 gap-4">
            {[
              { label: t('totalTrainingPrograms'), value: trainingStats.total.toString(), icon: BookOpen },
              { label: t('totalPurchases'), value: trainingStats.purchases.toString(), icon: Users },
              { label: t('averageRating'), value: trainingStats.avgRating, icon: Star },
              { label: t('totalReviews'), value: trainingStats.reviews.toString(), icon: TrendingUp },
            ].map((stat, index) => (
              <motion.div
                key={stat.label}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
                className="bg-[#1A1A1A] rounded-xl border border-white/10 p-4"
              >
                <stat.icon className={`w-6 h-6 ${accent.text} mb-2`} />
                <p className="text-2xl font-bold text-white">{stat.value}</p>
                <p className="text-xs text-gray-400">{stat.label}</p>
              </motion.div>
            ))}
          </div>
        )}
        {activeTab === 'Diet' && (
          <div className="grid grid-cols-4 gap-4">
            {[
              { label: t('totalMealPrograms'), value: dietStats.total.toString(), icon: Apple },
              { label: t('totalPurchases'), value: dietStats.purchases.toString(), icon: Users },
              { label: t('averageRating'), value: dietStats.avgRating, icon: Star },
              { label: t('totalReviews'), value: dietStats.reviews.toString(), icon: TrendingUp },
            ].map((stat, index) => (
              <motion.div
                key={stat.label}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
                className="bg-[#1A1A1A] rounded-xl border border-white/10 p-4"
              >
                <stat.icon className={`w-6 h-6 ${accent.text} mb-2`} />
                <p className="text-2xl font-bold text-white">{stat.value}</p>
                <p className="text-xs text-gray-400">{stat.label}</p>
              </motion.div>
            ))}
          </div>
        )}
        {activeTab === 'Consultation' && (
          <div className="grid grid-cols-4 gap-4">
            {[
              { label: t('totalConsultations'), value: consultationStats.total.toString(), icon: MessageSquare },
              { label: t('totalPurchases'), value: consultationStats.purchases.toString(), icon: Users },
              { label: t('averageRating'), value: consultationStats.avgRating, icon: Star },
              { label: t('totalReviews'), value: consultationStats.reviews.toString(), icon: TrendingUp },
            ].map((stat, index) => (
              <motion.div
                key={stat.label}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
                className="bg-[#1A1A1A] rounded-xl border border-white/10 p-4"
              >
                <stat.icon className={`w-6 h-6 ${accent.text} mb-2`} />
                <p className="text-2xl font-bold text-white">{stat.value}</p>
                <p className="text-xs text-gray-400">{stat.label}</p>
              </motion.div>
            ))}
          </div>
        )}

        {/* Search */}
        <div className="flex items-center gap-4">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              type="text"
              placeholder={t('searchPlaceholder')}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className={`w-full pl-10 pr-4 py-2.5 bg-[#0A0A0A] border border-white/10 rounded-lg text-white placeholder:text-gray-500 focus:outline-none ${accent.border}`}
            />
          </div>
        </div>

        {/* Programs List */}
        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className={`w-8 h-8 ${accent.text} animate-spin`} />
          </div>
        ) : filteredPrograms.length === 0 ? (
          <div className="text-center py-12">
            {activeTab === 'Training' ? (
              <Dumbbell className="w-16 h-16 text-gray-600 mx-auto mb-4" />
            ) : activeTab === 'Diet' ? (
              <Apple className="w-16 h-16 text-gray-600 mx-auto mb-4" />
            ) : (
              <MessageSquare className="w-16 h-16 text-gray-600 mx-auto mb-4" />
            )}
            <h3 className="text-xl font-semibold text-white mb-2">
              {activeTab === 'Training' ? t('noTrainingPrograms') : activeTab === 'Diet' ? t('noMealPrograms') : t('noConsultations')}
            </h3>
            <p className="text-gray-400 mb-4">
              {activeTab === 'Training' ? t('createFirstTraining') : activeTab === 'Diet' ? t('createFirstMeal') : t('createFirstConsultation')}
            </p>
            <button 
              onClick={openCreateModal}
              className={`px-4 py-2 bg-gradient-to-r ${accent.gradient} text-white font-semibold rounded-lg hover:opacity-90`}
            >
              {t('createProgram')}
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {filteredPrograms.map((program, index) => (
              <motion.div
                key={program.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
                className="bg-[#1A1A1A] rounded-xl border border-white/10 overflow-hidden group hover:border-white/20 transition-all cursor-pointer"
                onClick={() => setSelectedProgram(program)}
              >
                <div className="relative">
                  <img
                    src={program.coverImageUrl ? getMediaUrl(program.coverImageUrl) || 'https://via.placeholder.com/400x200?text=No+Image' : 'https://via.placeholder.com/400x200?text=No+Image'}
                    alt={program.title}
                    className="w-full h-40 object-cover"
                  />
                  <div className="absolute top-3 left-3 flex gap-2">
                    <span className={`px-2 py-1 text-xs font-bold rounded ${accent.bg} text-white`}>
                      ${program.price}
                    </span>
                    <span className={`px-2 py-1 text-xs font-bold rounded text-white flex items-center gap-1 ${
                      program.category === 'Training' ? 'bg-blue-600' : program.category === 'Diet' ? 'bg-green-600' : 'bg-violet-600'
                    }`}>
                      {program.category === 'Training' ? (
                        <><Dumbbell className="w-3 h-3" />{t('tabTraining')}</>
                      ) : program.category === 'Diet' ? (
                        <><Apple className="w-3 h-3" />{t('tabMeal')}</>
                      ) : (
                        <><MessageSquare className="w-3 h-3" />{t('tabConsultation')}</>
                      )}
                    </span>
                    {!program.isPublic && (
                      <span className="px-2 py-1 text-xs font-bold rounded bg-yellow-600 text-white flex items-center gap-1">
                        <EyeOff className="w-3 h-3" />{t('private')}
                      </span>
                    )}
                  </div>
                  <div className="absolute top-3 right-3 flex gap-2">
                    <button 
                      onClick={(e) => { e.stopPropagation(); openEditModal(program) }}
                      className="w-8 h-8 rounded-full bg-black/50 backdrop-blur-sm flex items-center justify-center text-white hover:bg-black/70 transition-all"
                    >
                      <Edit className="w-4 h-4" />
                    </button>
                    <button 
                      onClick={(e) => { e.stopPropagation(); handleDelete(program) }}
                      disabled={deleting === program.id}
                      className="w-8 h-8 rounded-full bg-black/50 backdrop-blur-sm flex items-center justify-center text-red-400 hover:bg-black/70 transition-all disabled:opacity-50"
                    >
                      {deleting === program.id ? (
                        <Loader2 className="w-4 h-4 animate-spin" />
                      ) : (
                        <Trash2 className="w-4 h-4" />
                      )}
                    </button>
                  </div>
                </div>
                <div className="p-4">
                  <h3 className={`font-bold text-white mb-2 ${accent.hoverText} transition-colors`}>
                    {program.title}
                  </h3>
                  <p className="text-sm text-gray-400 mb-3 line-clamp-2">{program.description}</p>
                  <div className="flex items-center gap-4 text-xs text-gray-400 mb-4">
                    <div className="flex items-center gap-1">
                      <Users className="w-3.5 h-3.5" />
                      {program.totalPurchases ?? 0} {tc('purchases')}
                    </div>
                    <div className="flex items-center gap-1">
                      <Star className="w-3.5 h-3.5 text-yellow-500" />
                      {(program.averageRating ?? 0).toFixed(1)} ({program.totalReviews ?? 0})
                    </div>
                    {program.trainingVideoUrls && program.trainingVideoUrls.length > 0 && (
                      <div className="flex items-center gap-1">
                        <Video className="w-3.5 h-3.5" />
                        {program.trainingVideoUrls.length} {tc('videos')}
                      </div>
                    )}
                  </div>
                  <div className="flex items-center justify-between pt-3 border-t border-white/10">
                    <span className="text-xs text-gray-500">
                      {t('programCode')}: {program.code}
                    </span>
                    <span className="text-xs text-gray-500">
                      {new Date(program.createdAt).toLocaleDateString('ru-RU')}
                    </span>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        )}

        {/* Program Detail Modal */}
        {selectedProgram && !showCreateModal && (
          <div 
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4"
            onClick={() => setSelectedProgram(null)}
          >
            <motion.div 
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="bg-[#1A1A1A] rounded-xl border border-white/10 max-w-lg w-full max-h-[90vh] overflow-y-auto"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="relative">
                {selectedProgram.coverImageUrl ? (
                  <img
                    src={getMediaUrl(selectedProgram.coverImageUrl) || ''}
                    alt={selectedProgram.title}
                    className="w-full h-48 object-cover"
                  />
                ) : (
                  <div className="w-full h-48 bg-[#0A0A0A] flex items-center justify-center">
                    <BookOpen className="w-16 h-16 text-gray-600" />
                  </div>
                )}
                <button
                  onClick={() => setSelectedProgram(null)}
                  className="absolute top-3 right-3 p-2 rounded-full bg-black/50 hover:bg-black/70 transition-colors"
                >
                  <X className="w-5 h-5 text-white" />
                </button>
                <div className="absolute top-3 left-3 flex gap-2">
                  <span className={`px-2 py-1 text-xs font-bold rounded ${accent.bg} text-white`}>
                    ${selectedProgram.price}
                  </span>
                  {selectedProgram.proPrice != null && (
                    <span className="px-2 py-1 text-xs font-bold rounded bg-purple-600 text-white">
                      PRO ${selectedProgram.proPrice}
                    </span>
                  )}
                  <span className={`px-2 py-1 text-xs font-bold rounded text-white ${
                    selectedProgram.category === 'Training' ? 'bg-blue-600' : selectedProgram.category === 'Diet' ? 'bg-green-600' : 'bg-violet-600'
                  }`}>
                    {selectedProgram.category === 'Training' ? t('typeTraining') : selectedProgram.category === 'Diet' ? t('typeMeal') : t('typeConsultation')}
                  </span>
                </div>
              </div>

              <div className="p-5 space-y-4">
                <h2 className="text-xl font-bold text-white">{selectedProgram.title}</h2>

                <div className="flex items-center gap-6">
                  <div className="flex items-center gap-2">
                    <Star className="w-5 h-5 text-amber-400 fill-amber-400" />
                    <span className="text-white font-medium">
                      {(selectedProgram.averageRating ?? 0) > 0
                        ? (selectedProgram.averageRating ?? 0).toFixed(1)
                        : tp('noRating')}
                    </span>
                    <span className="text-gray-500">({selectedProgram.totalReviews ?? 0})</span>
                  </div>
                  <div className="flex items-center gap-2 text-gray-400">
                    <Users className="w-5 h-5" />
                    <span>{selectedProgram.totalPurchases ?? 0} {tc('purchases')}</span>
                  </div>
                  {selectedProgram.trainingVideoUrls && selectedProgram.trainingVideoUrls.length > 0 && (
                    <div className="flex items-center gap-2 text-gray-400">
                      <Video className="w-5 h-5" />
                      <span>{selectedProgram.trainingVideoUrls.length} {tc('videos')}</span>
                    </div>
                  )}
                </div>

                {selectedProgram.category === 'Diet' && selectedProgram.trainingVideoUrls && selectedProgram.trainingVideoUrls.length > 0 && (
                  <div className="flex items-center gap-6">
                    <div className="flex items-center gap-2 text-gray-400">
                      <Video className="w-5 h-5" />
                      <span>{selectedProgram.trainingVideoUrls.length} {tc('videos')}</span>
                    </div>
                  </div>
                )}

                <div>
                  <h3 className="text-sm font-medium text-gray-400 mb-2">{tp('description')}</h3>
                  <p className="text-white leading-relaxed">{selectedProgram.description}</p>
                </div>

                {selectedProgram.detailedDescription && (
                  <div>
                    <h3 className="text-sm font-medium text-gray-400 mb-2">{t('detailedDescriptionLabel')}</h3>
                    <p className="text-white leading-relaxed whitespace-pre-wrap">{selectedProgram.detailedDescription}</p>
                  </div>
                )}

                {selectedProgram.trainingVideoUrls && selectedProgram.trainingVideoUrls.length > 0 && (
                  <div>
                    <h3 className="text-sm font-medium text-gray-400 mb-2">{t('trainingVideos')}</h3>
                    <div className="space-y-2">
                      {selectedProgram.trainingVideoUrls.map((url, i) => (
                        <video
                          key={i}
                          src={getMediaUrl(url) || ''}
                          controls
                          className="w-full rounded-lg"
                        />
                      ))}
                    </div>
                  </div>
                )}

                <div className="flex gap-3 pt-2">
                  <button
                    onClick={() => {
                      const prog = selectedProgram
                      setSelectedProgram(null)
                      openEditModal(prog)
                    }}
                    className={`flex-1 py-3 bg-gradient-to-r ${accent.gradient} text-white font-semibold rounded-lg hover:opacity-90 transition-opacity flex items-center justify-center gap-2`}
                  >
                    <Edit className="w-5 h-5" />
                    {tc('edit')}
                  </button>
                  <button
                    onClick={() => {
                      const prog = selectedProgram
                      setSelectedProgram(null)
                      handleDelete(prog)
                    }}
                    className="py-3 px-4 border border-red-500/30 text-red-400 font-semibold rounded-lg hover:bg-red-500/10 transition-colors flex items-center justify-center"
                  >
                    <Trash2 className="w-5 h-5" />
                  </button>
                </div>

                <p className="text-center text-xs text-gray-500">
                  {t('programCode')}: <span className="text-gray-400 font-mono">{selectedProgram.code}</span>
                </p>
              </div>
            </motion.div>
          </div>
        )}

        {/* Create/Edit Modal */}
        {showCreateModal && (
          <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="bg-[#1A1A1A] rounded-2xl border border-white/10 w-full max-w-lg max-h-[90vh] overflow-y-auto"
            >
              <div className="p-6">
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-xl font-bold text-white">
                    {editingProgram 
                      ? (formCategory === 'Training' ? t('editTrainingProgram') : formCategory === 'Diet' ? t('editMealProgram') : t('editConsultation'))
                      : (formCategory === 'Training' ? t('newTrainingProgram') : formCategory === 'Diet' ? t('newMealProgram') : t('newConsultation'))
                    }
                  </h2>
                  <button onClick={closeModal} className="text-gray-400 hover:text-white">
                    <X className="w-6 h-6" />
                  </button>
                </div>

                <form onSubmit={handleSubmit} className="space-y-4">
                  {/* Program Category Selector — only for new programs */}
                  {!editingProgram && (
                    <div>
                      <label className="block text-sm font-medium text-gray-300 mb-2">
                        {t('programType')}
                      </label>
                      <div className="flex gap-3">
                        <button
                            type="button"
                            onClick={() => setFormCategory('Training')}
                            className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-lg border-2 text-sm font-medium transition-all ${
                              formCategory === 'Training'
                                ? 'border-blue-500 bg-blue-500/10 text-blue-400'
                                : 'border-white/10 text-gray-400 hover:border-white/20'
                            }`}
                          >
                            <Dumbbell className="w-5 h-5" />
                            {t('typeTraining')}
                          </button>
                        <button
                          type="button"
                          onClick={() => setFormCategory('Diet')}
                          className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-lg border-2 text-sm font-medium transition-all ${
                            formCategory === 'Diet'
                              ? 'border-green-500 bg-green-500/10 text-green-400'
                              : 'border-white/10 text-gray-400 hover:border-white/20'
                          }`}
                        >
                          <Apple className="w-5 h-5" />
                          {t('typeMeal')}
                        </button>
                        <button
                          type="button"
                          onClick={() => setFormCategory('Consultation')}
                          className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-lg border-2 text-sm font-medium transition-all ${
                            formCategory === 'Consultation'
                              ? 'border-violet-500 bg-violet-500/10 text-violet-400'
                              : 'border-white/10 text-gray-400 hover:border-white/20'
                          }`}
                        >
                          <MessageSquare className="w-5 h-5" />
                          {t('typeConsultation')}
                        </button>
                      </div>
                    </div>
                  )}

                  {/* Cover Image */}
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">
                      {t('coverImage')}
                    </label>
                    <div className="relative">
                      {coverPreview ? (
                        <div className="relative">
                          <img
                            src={coverPreview}
                            alt="Cover preview"
                            className="w-full h-40 object-cover rounded-lg"
                          />
                          <button
                            type="button"
                            onClick={() => { setCoverImage(null); setCoverPreview(null) }}
                            className="absolute top-2 right-2 p-1 bg-black/50 rounded-full text-white hover:bg-black/70"
                          >
                            <X className="w-4 h-4" />
                          </button>
                        </div>
                      ) : (
                        <label className={`flex flex-col items-center justify-center w-full h-40 border-2 border-dashed border-white/20 rounded-lg cursor-pointer ${accent.hoverBorder} transition-colors`}>
                          <Upload className="w-8 h-8 text-gray-400 mb-2" />
                          <span className="text-sm text-gray-400">{t('clickToUpload')}</span>
                          <input
                            type="file"
                            accept="image/*"
                            onChange={handleCoverImageChange}
                            className="hidden"
                          />
                        </label>
                      )}
                    </div>
                  </div>

                  {/* Title */}
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">
                      {t('nameLabel')}
                    </label>
                    <input
                      type="text"
                      value={title}
                      onChange={(e) => setTitle(e.target.value)}
                      className={`w-full px-4 py-2.5 bg-[#0A0A0A] border border-white/10 rounded-lg text-white focus:outline-none ${accent.border}`}
                      placeholder={t('namePlaceholder')}
                    />
                  </div>

                  {/* Description */}
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">
                      {t('descriptionLabel')}
                    </label>
                    <textarea
                      value={description}
                      onChange={(e) => setDescription(e.target.value)}
                      rows={3}
                      className={`w-full px-4 py-2.5 bg-[#0A0A0A] border border-white/10 rounded-lg text-white focus:outline-none ${accent.border} resize-none`}
                      placeholder={t('descriptionPlaceholder')}
                    />
                  </div>

                  {/* Detailed Description (for buyers) */}
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">
                      {t('detailedDescriptionLabel')}
                    </label>
                    <textarea
                      value={detailedDescription}
                      onChange={(e) => setDetailedDescription(e.target.value)}
                      rows={5}
                      className={`w-full px-4 py-2.5 bg-[#0A0A0A] border border-white/10 rounded-lg text-white focus:outline-none ${accent.border} resize-none`}
                      placeholder={t('detailedDescriptionPlaceholder')}
                    />
                  </div>

                  {/* Price */}
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">
                      {t('priceLabel')}
                    </label>
                    <div className="relative">
                      <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                      <input
                        type="number"
                        value={price}
                        onChange={(e) => setPrice(e.target.value)}
                        min="0"
                        step="0.01"
                        className={`w-full pl-10 pr-4 py-2.5 bg-[#0A0A0A] border border-white/10 rounded-lg text-white focus:outline-none ${accent.border}`}
                        placeholder="0.00"
                      />
                    </div>
                  </div>

                  {/* Pro Price (optional) */}
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">
                      {t('proPriceLabel')}
                    </label>
                    <div className="relative">
                      <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                      <input
                        type="number"
                        value={proPrice}
                        onChange={(e) => setProPrice(e.target.value)}
                        min="0"
                        step="0.01"
                        className={`w-full pl-10 pr-4 py-2.5 bg-[#0A0A0A] border border-white/10 rounded-lg text-white focus:outline-none ${accent.border}`}
                        placeholder={t('proPricePlaceholder')}
                      />
                    </div>
                    <p className="mt-1 text-xs text-gray-500">{t('proPriceHint')}</p>
                  </div>

                  {/* Visibility Toggle */}
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">
                      {t('visibility')}
                    </label>
                    <button
                      type="button"
                      onClick={() => setIsPublic(!isPublic)}
                      className={`w-full flex items-center justify-between px-4 py-3 rounded-lg border-2 transition-all ${
                        isPublic
                          ? 'border-green-500/50 bg-green-500/10'
                          : 'border-yellow-500/50 bg-yellow-500/10'
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        {isPublic ? (
                          <Eye className="w-5 h-5 text-green-400" />
                        ) : (
                          <EyeOff className="w-5 h-5 text-yellow-400" />
                        )}
                        <div className="text-left">
                          <p className={`text-sm font-medium ${isPublic ? 'text-green-400' : 'text-yellow-400'}`}>
                            {isPublic ? t('visibilityPublic') : t('visibilityPrivate')}
                          </p>
                          <p className="text-xs text-gray-500">
                            {isPublic ? t('visibilityPublicHint') : t('visibilityPrivateHint')}
                          </p>
                        </div>
                      </div>
                      <div className={`w-11 h-6 rounded-full relative transition-colors ${isPublic ? 'bg-green-500' : 'bg-gray-600'}`}>
                        <div className={`absolute top-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform ${isPublic ? 'translate-x-5' : 'translate-x-0.5'}`} />
                      </div>
                    </button>
                  </div>

                  {/* Training Videos — hide for consultations */}
                  {formCategory !== 'Consultation' && (
                    <div>
                      <label className="block text-sm font-medium text-gray-300 mb-2">
                        {t('trainingVideos')}
                      </label>
                      <label className={`flex items-center justify-center w-full py-3 border-2 border-dashed border-white/20 rounded-lg cursor-pointer ${accent.hoverBorder} transition-colors`}>
                        <Video className="w-5 h-5 text-gray-400 mr-2" />
                        <span className="text-sm text-gray-400">{t('addVideo')}</span>
                        <input
                          type="file"
                          accept="video/*"
                          multiple
                          onChange={handleVideosChange}
                          className="hidden"
                        />
                      </label>
                      {trainingVideos.length > 0 && (
                        <div className="mt-2 space-y-2">
                          {trainingVideos.map((video, index) => (
                            <div key={index} className="flex items-center justify-between p-2 bg-[#0A0A0A] rounded-lg">
                              <span className="text-sm text-gray-300 truncate">{video.name}</span>
                              <button
                                type="button"
                                onClick={() => removeVideo(index)}
                                className="text-red-400 hover:text-red-300"
                              >
                                <X className="w-4 h-4" />
                              </button>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  )}

                  {/* Submit */}
                  <button
                    type="submit"
                    disabled={saving}
                    className={`w-full py-3 bg-gradient-to-r ${accent.gradient} text-white font-semibold rounded-lg hover:opacity-90 disabled:opacity-50 flex items-center justify-center gap-2`}
                  >
                    {saving && <Loader2 className="w-5 h-5 animate-spin" />}
                    {editingProgram ? t('saveChanges') : t('createProgram')}
                  </button>
                </form>
              </div>
            </motion.div>
          </div>
        )}
      </div>
    </>
  )
}
