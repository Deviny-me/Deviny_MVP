'use client'

import { useState, useRef, useEffect, useCallback } from 'react'
import { useRouter, usePathname } from 'next/navigation'
import { Search, X, Loader2, User, Dumbbell, UtensilsCrossed } from 'lucide-react'
import { searchGlobal } from '@/lib/api/searchApi'
import { GlobalSearchResponse, UserSearchItem, ProgramSearchItem } from '@/types/search'
import { getMediaUrl } from '@/lib/config'
import { useTranslations } from 'next-intl'
import { useAccentColors, getRoleRingClass, getAccentColorsByRole } from '@/lib/theme/useAccentColors'

interface SearchBarProps {
  placeholder?: string
}

export function SearchBar({ placeholder = 'Поиск...' }: SearchBarProps) {
  const accent = useAccentColors()
  const router = useRouter()
  const pathname = usePathname()
  const tSearch = useTranslations('search')

  const [query, setQuery] = useState('')
  const [results, setResults] = useState<GlobalSearchResponse | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [isOpen, setIsOpen] = useState(false)

  const containerRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)
  const abortRef = useRef<AbortController | null>(null)
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  const basePath = pathname?.startsWith('/trainer') ? '/trainer' : pathname?.startsWith('/nutritionist') ? '/nutritionist' : '/user'

  // Debounced search
  const performSearch = useCallback(async (searchQuery: string) => {
    // Cancel previous request
    if (abortRef.current) {
      abortRef.current.abort()
    }

    if (searchQuery.trim().length < 2) {
      setResults(null)
      setIsLoading(false)
      return
    }

    const controller = new AbortController()
    abortRef.current = controller
    setIsLoading(true)

    try {
      const data = await searchGlobal(searchQuery.trim(), 5, controller.signal)
      setResults(data)
      setIsOpen(true)
    } catch (err: unknown) {
      if (err instanceof DOMException && err.name === 'AbortError') return
      console.error('Search error:', err)
      setResults(null)
    } finally {
      if (!controller.signal.aborted) {
        setIsLoading(false)
      }
    }
  }, [])

  const handleInputChange = (value: string) => {
    setQuery(value)

    if (debounceRef.current) {
      clearTimeout(debounceRef.current)
    }

    if (value.trim().length < 2) {
      setResults(null)
      setIsLoading(false)
      setIsOpen(false)
      return
    }

    setIsLoading(true)
    debounceRef.current = setTimeout(() => {
      performSearch(value)
    }, 350)
  }

  const closeDropdown = () => {
    setIsOpen(false)
    setResults(null)
  }

  const handleClear = () => {
    setQuery('')
    setResults(null)
    setIsOpen(false)
    setIsLoading(false)
    inputRef.current?.focus()
  }

  // Navigate to user profile
  const handleUserClick = (item: UserSearchItem) => {
    closeDropdown()
    setQuery('')
    router.push(`${basePath}/profile/${item.id}`)
  }

  // Navigate to program detail page
  const handleProgramClick = (item: ProgramSearchItem) => {
    closeDropdown()
    setQuery('')
    router.push(`${basePath}/programs?program=${item.id}`)
  }

  // Close on click outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        closeDropdown()
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  // Close on ESC
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        closeDropdown()
        inputRef.current?.blur()
      }
    }
    document.addEventListener('keydown', handleKeyDown)
    return () => document.removeEventListener('keydown', handleKeyDown)
  }, [])

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (abortRef.current) abortRef.current.abort()
      if (debounceRef.current) clearTimeout(debounceRef.current)
    }
  }, [])

  const hasResults = results && (
    results.users.length > 0 ||
    results.workoutPrograms.length > 0 ||
    results.mealPrograms.length > 0
  )

  const noResults = results && !hasResults && query.trim().length >= 2

  return (
    <div ref={containerRef} className="relative flex-1 max-w-md">
      {/* Input */}
      <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500 pointer-events-none" />
      <input
        ref={inputRef}
        type="text"
        value={query}
        onChange={(e) => handleInputChange(e.target.value)}
        onFocus={() => { if (results) setIsOpen(true) }}
        placeholder={placeholder}
        className={`w-full pl-10 pr-8 py-2 bg-white/[0.04] border border-white/[0.06] rounded-lg text-sm text-white placeholder-gray-500 focus:outline-none focus:bg-white/[0.06] ${accent.focusBorder} focus:border-opacity-50 transition-all`}
      />
      {/* Loading / Clear */}
      {(isLoading || query) && (
        <div className="absolute right-2.5 top-1/2 -translate-y-1/2">
          {isLoading ? (
            <Loader2 className="w-4 h-4 text-gray-400 animate-spin" />
          ) : query ? (
            <button onClick={handleClear} className="text-gray-400 hover:text-white transition-colors">
              <X className="w-4 h-4" />
            </button>
          ) : null}
        </div>
      )}

      {/* Dropdown */}
      {isOpen && (hasResults || noResults) && (
        <div className="absolute top-full left-0 right-0 mt-2 bg-[#141414] border border-white/[0.08] rounded-xl shadow-2xl shadow-black/40 overflow-hidden z-[60] max-h-[400px] overflow-y-auto">
          {noResults && (
            <div className="px-4 py-6 text-center text-gray-500 text-sm">
              {tSearch('noResults', { query: query.trim() })}
            </div>
          )}

          {/* Users section */}
          {results && results.users.length > 0 && (
            <div>
              <div className="px-3 py-2 text-[11px] font-semibold text-gray-500 uppercase tracking-wider bg-white/[0.02]">
                <User className="w-3.5 h-3.5 inline mr-1.5 -mt-0.5" />
                {tSearch('users')}
              </div>
              {results.users.map((item) => (
                <button
                  key={item.id}
                  onClick={() => handleUserClick(item)}
                  className="w-full flex items-center gap-3 px-3 py-2.5 hover:bg-white/[0.04] transition-colors text-left"
                >
                  {item.avatarUrl ? (
                    <img
                      src={getMediaUrl(item.avatarUrl) || ''}
                      alt={item.fullName}
                      className={`w-8 h-8 rounded-full object-cover flex-shrink-0 ${getRoleRingClass(item.role)}`}
                    />
                  ) : (
                    <div className={`w-8 h-8 rounded-full bg-gradient-to-br ${getAccentColorsByRole(item.role).gradient} flex items-center justify-center flex-shrink-0`}>
                      <span className="text-xs font-bold text-white">
                        {item.fullName.charAt(0).toUpperCase()}
                      </span>
                    </div>
                  )}
                  <div className="min-w-0 flex-1">
                    <p className="text-sm text-white font-medium truncate">{item.fullName}</p>
                    <p className="text-xs text-gray-400 truncate">
                      {item.role === 'Trainer' ? tSearch('trainer') : item.role === 'Nutritionist' ? tSearch('nutritionist') : tSearch('user')}
                    </p>
                  </div>
                </button>
              ))}
            </div>
          )}

          {/* Workout Programs section */}
          {results && results.workoutPrograms.length > 0 && (
            <div>
              <div className="px-3 py-2 text-[11px] font-semibold text-gray-500 uppercase tracking-wider bg-white/[0.02]">
                <Dumbbell className="w-3.5 h-3.5 inline mr-1.5 -mt-0.5" />
                {tSearch('trainingPrograms')}
              </div>
              {results.workoutPrograms.map((item) => (
                <button
                  key={item.id}
                  onClick={() => handleProgramClick(item)}
                  className="w-full flex items-center gap-3 px-3 py-2.5 hover:bg-white/[0.04] transition-colors text-left"
                >
                  {item.coverImagePath ? (
                    <img
                      src={getMediaUrl(item.coverImagePath) || ''}
                      alt={item.title}
                      className="w-8 h-8 rounded object-cover flex-shrink-0"
                    />
                  ) : (
                    <div className={`w-8 h-8 rounded ${accent.bgMuted20} flex items-center justify-center flex-shrink-0`}>
                      <Dumbbell className={`w-4 h-4 ${accent.text}`} />
                    </div>
                  )}
                  <div className="min-w-0 flex-1">
                    <p className="text-sm text-white font-medium truncate">{item.title}</p>
                    <p className="text-xs text-gray-400 truncate">
                      {item.code} · ${item.price} · {item.trainerName}
                    </p>
                  </div>
                </button>
              ))}
            </div>
          )}

          {/* Meal Programs section */}
          {results && results.mealPrograms.length > 0 && (
            <div>
              <div className="px-3 py-2 text-[11px] font-semibold text-gray-500 uppercase tracking-wider bg-white/[0.02]">
                <UtensilsCrossed className="w-3.5 h-3.5 inline mr-1.5 -mt-0.5" />
                {tSearch('nutritionPrograms')}
              </div>
              {results.mealPrograms.map((item) => (
                <button
                  key={item.id}
                  onClick={() => handleProgramClick(item)}
                  className="w-full flex items-center gap-3 px-3 py-2.5 hover:bg-white/[0.04] transition-colors text-left"
                >
                  {item.coverImagePath ? (
                    <img
                      src={getMediaUrl(item.coverImagePath) || ''}
                      alt={item.title}
                      className="w-8 h-8 rounded object-cover flex-shrink-0"
                    />
                  ) : (
                    <div className="w-8 h-8 rounded bg-green-500/20 flex items-center justify-center flex-shrink-0">
                      <UtensilsCrossed className="w-4 h-4 text-green-500" />
                    </div>
                  )}
                  <div className="min-w-0 flex-1">
                    <p className="text-sm text-white font-medium truncate">{item.title}</p>
                    <p className="text-xs text-gray-400 truncate">
                      {item.code} · ${item.price} · {item.trainerName}
                    </p>
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  )
}
