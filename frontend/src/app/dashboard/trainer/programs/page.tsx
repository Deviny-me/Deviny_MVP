'use client'

import { MainLayout } from '@/components/trainer/layout/MainLayout'
import { motion } from 'framer-motion'
import { useState, useEffect } from 'react'
import { 
  Plus,
  Clock,
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
  DollarSign
} from 'lucide-react'
import { programsApi } from '@/lib/api/programsApi'
import { ProgramDto, CreateProgramRequest } from '@/types/program'
import { getMediaUrl } from '@/lib/config'

// Simple toast helper using alert - in production use a proper toast library
const toast = {
  success: (msg: string) => console.log('Success:', msg),
  error: (msg: string) => console.error('Error:', msg),
}

export default function ProgramsPage() {
  const [programs, setPrograms] = useState<ProgramDto[]>([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [editingProgram, setEditingProgram] = useState<ProgramDto | null>(null)
  const [saving, setSaving] = useState(false)
  const [deleting, setDeleting] = useState<string | null>(null)

  // Form state
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [price, setPrice] = useState('')
  const [coverImage, setCoverImage] = useState<File | null>(null)
  const [coverPreview, setCoverPreview] = useState<string | null>(null)
  const [trainingVideos, setTrainingVideos] = useState<File[]>([])

  useEffect(() => {
    loadPrograms()
  }, [])

  const loadPrograms = async () => {
    try {
      setLoading(true)
      const data = await programsApi.getMyPrograms()
      setPrograms(data)
    } catch (error) {
      console.error('Failed to load programs:', error)
      toast.error('Не удалось загрузить программы')
    } finally {
      setLoading(false)
    }
  }

  const resetForm = () => {
    setTitle('')
    setDescription('')
    setPrice('')
    setCoverImage(null)
    setCoverPreview(null)
    setTrainingVideos([])
    setEditingProgram(null)
  }

  const openCreateModal = () => {
    resetForm()
    setShowCreateModal(true)
  }

  const openEditModal = (program: ProgramDto) => {
    setEditingProgram(program)
    setTitle(program.title)
    setDescription(program.description)
    setPrice(program.price.toString())
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
      toast.error('Заполните все обязательные поля')
      return
    }

    if (!editingProgram && !coverImage) {
      toast.error('Добавьте обложку программы')
      return
    }

    try {
      setSaving(true)
      
      if (editingProgram) {
        await programsApi.updateProgram(editingProgram.id, {
          title,
          description,
          price: parseFloat(price),
          coverImage: coverImage || undefined,
          trainingVideos: trainingVideos.length > 0 ? trainingVideos : undefined,
        })
        toast.success('Программа обновлена')
      } else {
        const request: CreateProgramRequest = {
          title,
          description,
          price: parseFloat(price),
          coverImage: coverImage!,
          trainingVideos,
        }
        await programsApi.createProgram(request)
        toast.success('Программа создана')
      }
      
      closeModal()
      loadPrograms()
    } catch (error) {
      console.error('Failed to save program:', error)
      const message = error instanceof Error ? error.message : 'Unknown error'
      toast.error(editingProgram ? `Не удалось обновить программу: ${message}` : `Не удалось создать программу: ${message}`)
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async (programId: string) => {
    if (!confirm('Вы уверены, что хотите удалить эту программу?')) return

    try {
      setDeleting(programId)
      await programsApi.deleteProgram(programId)
      toast.success('Программа удалена')
      loadPrograms()
    } catch (error) {
      console.error('Failed to delete program:', error)
      toast.error('Не удалось удалить программу')
    } finally {
      setDeleting(null)
    }
  }

  const filteredPrograms = programs.filter(program => {
    if (searchQuery && !program.title.toLowerCase().includes(searchQuery.toLowerCase())) return false
    return true
  })

  // Calculate stats from real data
  const stats = [
    { label: 'Всего программ', value: programs.length.toString(), icon: BookOpen },
    { label: 'Всего покупок', value: programs.reduce((acc, p) => acc + p.totalPurchases, 0).toString(), icon: Users },
    { label: 'Средний рейтинг', value: programs.length > 0 ? (programs.reduce((acc, p) => acc + p.averageRating, 0) / programs.length).toFixed(1) : '0', icon: Star },
    { label: 'Всего отзывов', value: programs.reduce((acc, p) => acc + p.totalReviews, 0).toString(), icon: TrendingUp },
  ]

  return (
    <MainLayout>
      <div className="space-y-6 pb-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-white">Мои программы</h1>
            <p className="text-gray-400">Создавайте и управляйте программами тренировок</p>
          </div>
          <button 
            onClick={openCreateModal}
            className="px-4 py-2 bg-gradient-to-r from-[#FF6B35] to-[#FF0844] text-white font-semibold rounded-lg hover:opacity-90 flex items-center gap-2"
          >
            <Plus className="w-5 h-5" />
            Создать программу
          </button>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-4 gap-4">
          {stats.map((stat, index) => (
            <motion.div
              key={stat.label}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
              className="bg-[#1A1A1A] rounded-xl border border-white/10 p-4"
            >
              <stat.icon className="w-6 h-6 text-[#FF6B35] mb-2" />
              <p className="text-2xl font-bold text-white">{stat.value}</p>
              <p className="text-xs text-gray-400">{stat.label}</p>
            </motion.div>
          ))}
        </div>

        {/* Filters */}
        <div className="flex items-center gap-4">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              type="text"
              placeholder="Поиск программ..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 bg-[#0A0A0A] border border-white/10 rounded-lg text-white placeholder:text-gray-500 focus:outline-none focus:border-[#FF6B35]"
            />
          </div>
        </div>

        {/* Loading State */}
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="w-8 h-8 text-[#FF6B35] animate-spin" />
          </div>
        ) : filteredPrograms.length === 0 ? (
          <div className="text-center py-12">
            <BookOpen className="w-16 h-16 text-gray-600 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-white mb-2">Нет программ</h3>
            <p className="text-gray-400 mb-4">Создайте свою первую программу тренировок</p>
            <button 
              onClick={openCreateModal}
              className="px-4 py-2 bg-gradient-to-r from-[#FF6B35] to-[#FF0844] text-white font-semibold rounded-lg hover:opacity-90"
            >
              Создать программу
            </button>
          </div>
        ) : (
          /* Programs Grid */
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {filteredPrograms.map((program, index) => (
              <motion.div
                key={program.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
                className="bg-[#1A1A1A] rounded-xl border border-white/10 overflow-hidden group hover:border-white/20 transition-all"
              >
                <div className="relative">
                  <img
                    src={program.coverImageUrl ? getMediaUrl(program.coverImageUrl) || 'https://via.placeholder.com/400x200?text=No+Image' : 'https://via.placeholder.com/400x200?text=No+Image'}
                    alt={program.title}
                    className="w-full h-40 object-cover"
                  />
                  <div className="absolute top-3 left-3">
                    <span className="px-2 py-1 text-xs font-bold rounded bg-[#FF6B35] text-white">
                      ${program.price}
                    </span>
                  </div>
                  <div className="absolute top-3 right-3 flex gap-2">
                    <button 
                      onClick={() => openEditModal(program)}
                      className="w-8 h-8 rounded-full bg-black/50 backdrop-blur-sm flex items-center justify-center text-white hover:bg-black/70 transition-all"
                    >
                      <Edit className="w-4 h-4" />
                    </button>
                    <button 
                      onClick={() => handleDelete(program.id)}
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
                  <h3 className="font-bold text-white mb-2 group-hover:text-[#FF6B35] transition-colors">
                    {program.title}
                  </h3>
                  <p className="text-sm text-gray-400 mb-3 line-clamp-2">{program.description}</p>
                  <div className="flex items-center gap-4 text-xs text-gray-400 mb-4">
                    <div className="flex items-center gap-1">
                      <Users className="w-3.5 h-3.5" />
                      {program.totalPurchases} покупок
                    </div>
                    <div className="flex items-center gap-1">
                      <Star className="w-3.5 h-3.5 text-yellow-500" />
                      {program.averageRating.toFixed(1)} ({program.totalReviews})
                    </div>
                    {program.trainingVideoUrls?.length > 0 && (
                      <div className="flex items-center gap-1">
                        <Video className="w-3.5 h-3.5" />
                        {program.trainingVideoUrls.length} видео
                      </div>
                    )}
                  </div>
                  <div className="flex items-center justify-between pt-3 border-t border-white/10">
                    <span className="text-xs text-gray-500">
                      Код: {program.code}
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
                    {editingProgram ? 'Редактировать программу' : 'Новая программа'}
                  </h2>
                  <button onClick={closeModal} className="text-gray-400 hover:text-white">
                    <X className="w-6 h-6" />
                  </button>
                </div>

                <form onSubmit={handleSubmit} className="space-y-4">
                  {/* Cover Image */}
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">
                      Обложка программы *
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
                            onClick={() => {
                              setCoverImage(null)
                              setCoverPreview(null)
                            }}
                            className="absolute top-2 right-2 p-1 bg-black/50 rounded-full text-white hover:bg-black/70"
                          >
                            <X className="w-4 h-4" />
                          </button>
                        </div>
                      ) : (
                        <label className="flex flex-col items-center justify-center w-full h-40 border-2 border-dashed border-white/20 rounded-lg cursor-pointer hover:border-[#FF6B35]/50 transition-colors">
                          <Upload className="w-8 h-8 text-gray-400 mb-2" />
                          <span className="text-sm text-gray-400">Нажмите для загрузки</span>
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
                      Название *
                    </label>
                    <input
                      type="text"
                      value={title}
                      onChange={(e) => setTitle(e.target.value)}
                      className="w-full px-4 py-2.5 bg-[#0A0A0A] border border-white/10 rounded-lg text-white focus:outline-none focus:border-[#FF6B35]"
                      placeholder="Введите название программы"
                    />
                  </div>

                  {/* Description */}
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">
                      Описание *
                    </label>
                    <textarea
                      value={description}
                      onChange={(e) => setDescription(e.target.value)}
                      rows={3}
                      className="w-full px-4 py-2.5 bg-[#0A0A0A] border border-white/10 rounded-lg text-white focus:outline-none focus:border-[#FF6B35] resize-none"
                      placeholder="Опишите вашу программу"
                    />
                  </div>

                  {/* Price */}
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">
                      Цена ($) *
                    </label>
                    <div className="relative">
                      <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                      <input
                        type="number"
                        value={price}
                        onChange={(e) => setPrice(e.target.value)}
                        min="0"
                        step="0.01"
                        className="w-full pl-10 pr-4 py-2.5 bg-[#0A0A0A] border border-white/10 rounded-lg text-white focus:outline-none focus:border-[#FF6B35]"
                        placeholder="0.00"
                      />
                    </div>
                  </div>

                  {/* Training Videos */}
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">
                      Видео тренировок
                    </label>
                    <label className="flex items-center justify-center w-full py-3 border-2 border-dashed border-white/20 rounded-lg cursor-pointer hover:border-[#FF6B35]/50 transition-colors">
                      <Video className="w-5 h-5 text-gray-400 mr-2" />
                      <span className="text-sm text-gray-400">Добавить видео</span>
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

                  {/* Submit Button */}
                  <button
                    type="submit"
                    disabled={saving}
                    className="w-full py-3 bg-gradient-to-r from-[#FF6B35] to-[#FF0844] text-white font-semibold rounded-lg hover:opacity-90 disabled:opacity-50 flex items-center justify-center gap-2"
                  >
                    {saving && <Loader2 className="w-5 h-5 animate-spin" />}
                    {editingProgram ? 'Сохранить изменения' : 'Создать программу'}
                  </button>
                </form>
              </div>
            </motion.div>
          </div>
        )}
      </div>
    </MainLayout>
  )
}
