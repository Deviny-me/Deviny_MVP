'use client'

import { useRouter } from 'next/navigation'
import { 
  Flame,
  Star,
  X,
  Users,
  ShoppingCart,
  Dumbbell
} from 'lucide-react'
import { useEffect, useState } from 'react'
import { PublicProgramDto } from '@/types/program'

// Program Detail Modal Component
function ProgramDetailModal({ 
  program, 
  onClose 
}: { 
  program: PublicProgramDto
  onClose: () => void 
}) {
  const router = useRouter()

  const formatPrice = (price: number) => {
    if (price === 0) return 'Free'
    return `$${price.toFixed(2)}`
  }

  // Close on escape key
  useEffect(() => {
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', handleEsc)
    return () => window.removeEventListener('keydown', handleEsc)
  }, [onClose])

  return (
    <div 
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4"
      onClick={onClose}
    >
      <div 
        className="bg-[#1A1A1A] rounded-xl border border-white/10 max-w-lg w-full max-h-[90vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header with Cover */}
        <div className="relative">
          {program.coverImageUrl ? (
            <img
              src={program.coverImageUrl}
              alt={program.title}
              className="w-full h-48 object-cover"
            />
          ) : (
            <div className="w-full h-48 bg-[#0A0A0A] flex items-center justify-center">
              <Dumbbell className="w-16 h-16 text-gray-600" />
            </div>
          )}
          <button
            onClick={onClose}
            className="absolute top-3 right-3 p-2 rounded-full bg-black/50 hover:bg-black/70 transition-colors"
          >
            <X className="w-5 h-5 text-white" />
          </button>
        </div>

        {/* Content */}
        <div className="p-5 space-y-4">
          {/* Title & Price */}
          <div className="flex items-start justify-between gap-4">
            <h2 className="text-xl font-bold text-white">{program.title}</h2>
            <span className={`text-2xl font-bold flex-shrink-0 ${
              program.price === 0 ? 'text-green-400' : 'text-[#FF6B35]'
            }`}>
              {formatPrice(program.price)}
            </span>
          </div>

          {/* Trainer */}
          <div 
            className="flex items-center gap-3 p-3 bg-[#0A0A0A] rounded-lg cursor-pointer hover:bg-[#141414] transition-colors"
            onClick={() => {
              console.log('Navigating to trainer profile:', {
                trainerSlug: program.trainerSlug,
                trainerId: program.trainerId,
                navigateTo: program.trainerSlug || program.trainerId
              })
              onClose()
              router.push(`/dashboard/user/experts/${program.trainerSlug || program.trainerId}`)
            }}
          >
            {program.trainerAvatarUrl ? (
              <img
                src={program.trainerAvatarUrl}
                alt={program.trainerName}
                className="w-10 h-10 rounded-full object-cover"
              />
            ) : (
              <div className="w-10 h-10 rounded-full bg-gradient-to-br from-[#FF6B35] to-[#FF0844] flex items-center justify-center">
                <span className="text-white font-bold">
                  {program.trainerName.charAt(0)}
                </span>
              </div>
            )}
            <div>
              <p className="text-white font-medium">{program.trainerName}</p>
              <p className="text-xs text-gray-400">View trainer profile →</p>
            </div>
          </div>

          {/* Stats */}
          <div className="flex items-center gap-6">
            <div className="flex items-center gap-2">
              <Star className="w-5 h-5 text-amber-400 fill-amber-400" />
              <span className="text-white font-medium">
                {program.averageRating > 0 ? program.averageRating.toFixed(1) : 'No ratings'}
              </span>
              <span className="text-gray-500">({program.totalReviews} reviews)</span>
            </div>
            <div className="flex items-center gap-2 text-gray-400">
              <Users className="w-5 h-5" />
              <span>{program.totalPurchases} purchases</span>
            </div>
          </div>

          {/* Description */}
          <div>
            <h3 className="text-sm font-medium text-gray-400 mb-2">About this program</h3>
            <p className="text-white leading-relaxed">{program.description}</p>
          </div>

          {/* Purchase Button */}
          <button
            className="w-full py-3 bg-gradient-to-r from-[#FF6B35] to-[#FF0844] text-white font-semibold rounded-lg hover:opacity-90 transition-opacity flex items-center justify-center gap-2"
            onClick={() => {
              // TODO: Implement purchase flow
              alert('Purchase flow coming soon!')
            }}
          >
            <ShoppingCart className="w-5 h-5" />
            {program.price === 0 ? 'Get for Free' : `Purchase for ${formatPrice(program.price)}`}
          </button>

          {/* Program Code */}
          <p className="text-center text-xs text-gray-500">
            Program code: <span className="text-gray-400 font-mono">{program.code}</span>
          </p>
        </div>
      </div>
    </div>
  )
}

export function UserRightSidebar() {
  const [selectedProgram, setSelectedProgram] = useState<PublicProgramDto | null>(null)

  return (
    <div className="w-72 flex-shrink-0 space-y-2 sticky top-[57px] h-[calc(100vh-57px)] overflow-y-auto pb-6">
      {/* Footer */}
      <div className="px-3 py-2">
        <div className="flex flex-wrap gap-x-2 gap-y-1 text-[10px] text-gray-500">
          <a href="#" className="hover:text-[#FF6B35] hover:underline">About</a>
          <span>•</span>
          <a href="#" className="hover:text-[#FF6B35] hover:underline">Help Center</a>
          <span>•</span>
          <a href="#" className="hover:text-[#FF6B35] hover:underline">Privacy</a>
          <span>•</span>
          <a href="#" className="hover:text-[#FF6B35] hover:underline">Terms</a>
        </div>
        <div className="mt-2 flex items-center gap-1.5">
          <div className="w-5 h-5 rounded bg-gradient-to-br from-[#FF6B35] to-[#FF0844] flex items-center justify-center">
            <Flame className="w-3 h-3 text-white" strokeWidth={2.5} />
          </div>
          <p className="text-[10px] text-gray-600">IGNITE Fitness © 2026</p>
        </div>
      </div>

      {/* Program Detail Modal */}
      {selectedProgram && (
        <ProgramDetailModal
          program={selectedProgram}
          onClose={() => setSelectedProgram(null)}
        />
      )}
    </div>
  )
}
