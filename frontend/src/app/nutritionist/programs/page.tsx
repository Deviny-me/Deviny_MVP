'use client'

import { motion } from 'framer-motion'
import { useState, useEffect } from 'react'
import { useTranslations } from 'next-intl'
import { useRouter, useSearchParams } from 'next/navigation'
import { 
  Plus,
  Users,
  Search,
  Edit,
  Trash2,
  BookOpen,
  X,
  Upload,
  Loader2,
  Video,
  DollarSign,
  Apple,
  MessageSquare
} from 'lucide-react'
import { nutritionistProgramsApi } from '@/lib/api/nutritionistProgramsApi'
import { MealProgramDto, ProgramCategory } from '@/types/program'
import { getMediaUrl } from '@/lib/config'
import { useAccentColors } from '@/lib/theme/useAccentColors'

const toast = {
  success: (msg: string) => console.log('Success:', msg),
  error: (msg: string) => console.error('Error:', msg),
}

type UnifiedProgram = {
  id: string
  title: string
  description: string
  detailedDescription?: string
  price: number
  proPrice?: number
  code: string
  coverImageUrl: string
  createdAt: string
  updatedAt: string
  videoUrls?: string[]
  category: ProgramCategory
}

function toUnified(p: MealProgramDto): UnifiedProgram {
  return {
    id: p.id,
    title: p.title,
    description: p.description,
    detailedDescription: p.detailedDescription,
    price: p.price,
    proPrice: p.proPrice,
    code: p.code,
    coverImageUrl: p.coverImageUrl,
    createdAt: p.createdAt,
    updatedAt: p.updatedAt,
    videoUrls: p.videoUrls,
    category: (p.category as ProgramCategory) || 'Diet',
  }
}

export default function NutritionistProgramsPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const accent = useAccentColors()
  const t = useTranslations('programs')
  const tp = useTranslations('profile')
  const tc = useTranslations('common')

  // Data
  const [mealPrograms, setMealPrograms] = useState<MealProgramDto[]>([])
  const [loading, setLoading] = useState(false)

  // Tabs & category
  const [activeTab, setActiveTab] = useState<ProgramCategory>('Diet')
  const [formCategory, setFormCategory] = useState<ProgramCategory>('Diet')

  // Search
  const [searchQuery, setSearchQuery] = useState('')

  // Modal state
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [editingProgram, setEditingProgram] = useState<UnifiedProgram | null>(null)
  const [selectedProgram, setSelectedProgram] = useState<UnifiedProgram | null>(null)
  const [saving, setSaving] = useState(false)
  const [deleting, setDeleting] = useState<string | null>(null)

  // Form state
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [detailedDescription, setDetailedDescription] = useState('')
  const [price, setPrice] = useState('')
  const [proPrice, setProPrice] = useState('')
  const [coverImage, setCoverImage] = useState<File | null>(null)
  const [coverPreview, setCoverPreview] = useState<string | null>(null)
  const [videos, setVideos] = useState<File[]>([])

  useEffect(() => {
    loadMealPrograms()
  }, [])

  // Deep link: ?program=<id>
  useEffect(() => {
    const programId = searchParams.get('program')
    if (!programId) return
    router.replace('/nutritionist/programs', { scroll: false })

    const own = mealPrograms.find(p => p.id === programId)
    if (own) {
      setSelectedProgram(toUnified(own))
    }
  }, [searchParams, mealPrograms])

  const loadMealPrograms = async () => {
    try {
      setLoading(true)
      const data = await nutritionistProgramsApi.getMyPrograms()
      setMealPrograms(data)
    } catch (error) {
      console.error('Failed to load meal programs:', error)
      toast.error(t('toasts.loadError'))
    } finally {
      setLoading(false)
    }
  }

  const allPrograms = mealPrograms.map(toUnified)

  const filteredPrograms = allPrograms.filter(p => {
    if (p.category !== activeTab) return false
    if (!searchQuery) return true
    return p.title.toLowerCase().includes(searchQuery.toLowerCase())
  })

  const dietCount = allPrograms.filter(p => p.category === 'Diet').length
  const consultationCount = allPrograms.filter(p => p.category === 'Consultation').length

  // Form helpers
  const resetForm = () => {
    setTitle('')
    setDescription('')
    setDetailedDescription('')
    setPrice('')
    setProPrice('')
    setCoverImage(null)
    setCoverPreview(null)
    setVideos([])
    setEditingProgram(null)
    setFormCategory('Diet')
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
    setVideos(prev => [...prev, ...files])
  }

  const removeVideo = (index: number) => {
    setVideos(prev => prev.filter((_, i) => i !== index))
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

      if (editingProgram) {
        await nutritionistProgramsApi.updateProgram(editingProgram.id, {
          title,
          description,
          detailedDescription: detailedDescription || undefined,
          price: parseFloat(price),
          proPrice: proPrice ? parseFloat(proPrice) : undefined,
          coverImage: coverImage || undefined,
          videos: videos.length > 0 ? videos : undefined,
          category: formCategory,
        })
        toast.success(t('toasts.updated'))
      } else {
        await nutritionistProgramsApi.createProgram({
          title,
          description,
          detailedDescription: detailedDescription || undefined,
          price: parseFloat(price),
          proPrice: proPrice ? parseFloat(proPrice) : undefined,
          coverImage: coverImage!,
          videos,
          category: formCategory,
        })
        toast.success(t('toasts.created'))
      }

      closeModal()
      loadMealPrograms()
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
      await nutritionistProgramsApi.deleteProgram(program.id)
      loadMealPrograms()
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

        {/* Stats */}
        <div className="grid grid-cols-4 gap-4">
          {[
            { cat: 'Diet' as ProgramCategory, count: dietCount, icon: Apple, label: t('totalMealPrograms'), color: 'text-green-400' },
            { cat: 'Consultation' as ProgramCategory, count: consultationCount, icon: MessageSquare, label: t('totalConsultations'), color: 'text-violet-400' },
          ].map(({ cat, count, icon: Icon, label, color }) => (
            <motion.div
              key={cat}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-[#1A1A1A] rounded-xl border border-white/10 p-4"
            >
              <Icon className={`w-6 h-6 ${color} mb-2`} />
              <p className="text-2xl font-bold text-white">{count}</p>
              <p className="text-xs text-gray-400">{label}</p>
            </motion.div>
          ))}
        </div>

        {/* Tabs */}
        <div className="flex gap-2">
          {([
            { cat: 'Diet' as ProgramCategory, icon: Apple, label: t('tabMeal'), count: dietCount, color: 'green' },
            { cat: 'Consultation' as ProgramCategory, icon: MessageSquare, label: t('tabConsultation'), count: consultationCount, color: 'violet' },
          ] as const).map(({ cat, icon: Icon, label, count, color }) => (
            <button
              key={cat}
              onClick={() => setActiveTab(cat)}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                activeTab === cat
                  ? `bg-${color}-500/20 text-${color}-400 border border-${color}-500/30`
                  : 'bg-[#1A1A1A] text-gray-400 border border-white/10 hover:border-white/20'
              }`}
            >
              <Icon className="w-4 h-4" />
              {label}
              <span className={`ml-1 px-1.5 py-0.5 rounded text-xs ${
                activeTab === cat ? `bg-${color}-500/30` : 'bg-white/10'
              }`}>
                {count}
              </span>
            </button>
          ))}
        </div>

        {/* Search */}
        <div className="flex items-center gap-4">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              type="text"
              placeholder={t('searchPlaceholder')}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className={`w-full pl-10 pr-4 py-2.5 bg-[#0A0A0A] border border-white/10 rounded-lg text-white placeholder:text-gray-500 focus:outline-none ${accent.focusBorder}`}
            />
          </div>
        </div>

        {/* Programs List */}
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className={`w-8 h-8 ${accent.text} animate-spin`} />
          </div>
        ) : filteredPrograms.length === 0 ? (
          <div className="text-center py-12">
            {activeTab === 'Diet' ? (
              <Apple className="w-16 h-16 text-gray-600 mx-auto mb-4" />
            ) : (
              <MessageSquare className="w-16 h-16 text-gray-600 mx-auto mb-4" />
            )}
            <h3 className="text-xl font-semibold text-white mb-2">
              {activeTab === 'Diet' ? t('noMealPrograms') : t('noConsultations')}
            </h3>
            <p className="text-gray-400 mb-4">
              {activeTab === 'Diet' ? t('createFirstMeal') : t('createFirstConsultation')}
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
                      program.category === 'Diet' ? 'bg-green-600' : 'bg-violet-600'
                    }`}>
                      {program.category === 'Diet' ? (
                        <><Apple className="w-3 h-3" />{t('tabMeal')}</>
                      ) : (
                        <><MessageSquare className="w-3 h-3" />{t('tabConsultation')}</>
                      )}
                    </span>
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
                    {program.videoUrls && program.videoUrls.length > 0 && (
                      <div className="flex items-center gap-1">
                        <Video className="w-3.5 h-3.5" />
                        {program.videoUrls.length} {tc('videos')}
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
                    selectedProgram.category === 'Diet' ? 'bg-green-600' : 'bg-violet-600'
                  }`}>
                    {selectedProgram.category === 'Diet' ? t('typeMeal') : t('typeConsultation')}
                  </span>
                </div>
              </div>

              <div className="p-5 space-y-4">
                <h2 className="text-xl font-bold text-white">{selectedProgram.title}</h2>

                {selectedProgram.videoUrls && selectedProgram.videoUrls.length > 0 && (
                  <div className="flex items-center gap-6">
                    <div className="flex items-center gap-2 text-gray-400">
                      <Video className="w-5 h-5" />
                      <span>{selectedProgram.videoUrls.length} {tc('videos')}</span>
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

                {selectedProgram.videoUrls && selectedProgram.videoUrls.length > 0 && (
                  <div>
                    <h3 className="text-sm font-medium text-gray-400 mb-2">{t('trainingVideos')}</h3>
                    <div className="space-y-2">
                      {selectedProgram.videoUrls.map((url, i) => (
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
                      ? (formCategory === 'Diet' ? t('editMealProgram') : t('editConsultation'))
                      : (formCategory === 'Diet' ? t('newMealProgram') : t('newConsultation'))
                    }
                  </h2>
                  <button onClick={closeModal} className="text-gray-400 hover:text-white">
                    <X className="w-6 h-6" />
                  </button>
                </div>

                <form onSubmit={handleSubmit} className="space-y-4">
                  {/* Category Selector */}
                  {!editingProgram && (
                    <div>
                      <label className="block text-sm font-medium text-gray-300 mb-2">
                        {t('categoryLabel')}
                      </label>
                      <div className="grid grid-cols-2 gap-2">
                        {([
                          { cat: 'Diet' as ProgramCategory, icon: Apple, label: t('tabMeal'), color: 'green' },
                          { cat: 'Consultation' as ProgramCategory, icon: MessageSquare, label: t('tabConsultation'), color: 'violet' },
                        ]).map(({ cat, icon: Icon, label, color }) => (
                          <button
                            key={cat}
                            type="button"
                            onClick={() => setFormCategory(cat)}
                            className={`flex items-center justify-center gap-2 py-2.5 rounded-lg text-sm font-medium transition-all border ${
                              formCategory === cat
                                ? `bg-${color}-500/20 text-${color}-400 border-${color}-500/50`
                                : 'bg-[#0A0A0A] text-gray-400 border-white/10 hover:border-white/20'
                            }`}
                          >
                            <Icon className="w-4 h-4" />
                            {label}
                          </button>
                        ))}
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
                      className={`w-full px-4 py-2.5 bg-[#0A0A0A] border border-white/10 rounded-lg text-white focus:outline-none ${accent.focusBorder}`}
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
                      className={`w-full px-4 py-2.5 bg-[#0A0A0A] border border-white/10 rounded-lg text-white focus:outline-none ${accent.focusBorder} resize-none`}
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
                      className={`w-full px-4 py-2.5 bg-[#0A0A0A] border border-white/10 rounded-lg text-white focus:outline-none ${accent.focusBorder} resize-none`}
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
                        className={`w-full pl-10 pr-4 py-2.5 bg-[#0A0A0A] border border-white/10 rounded-lg text-white focus:outline-none ${accent.focusBorder}`}
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
                        className={`w-full pl-10 pr-4 py-2.5 bg-[#0A0A0A] border border-white/10 rounded-lg text-white focus:outline-none ${accent.focusBorder}`}
                        placeholder={t('proPricePlaceholder')}
                      />
                    </div>
                    <p className="mt-1 text-xs text-gray-500">{t('proPriceHint')}</p>
                  </div>

                  {/* Videos (hidden for Consultation) */}
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
                    {videos.length > 0 && (
                      <div className="mt-2 space-y-2">
                        {videos.map((video, index) => (
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
