'use client'

import { useState, useRef, useEffect, useCallback } from 'react'
import { createPortal } from 'react-dom'
import { Globe } from 'lucide-react'
import { useLanguage, Language, getLanguageLabel, getLanguageFlag } from '@/components/language/LanguageProvider'

const LANGUAGES: Language[] = ['ru', 'en', 'az']

export function LanguageSwitcher({ compact = false }: { compact?: boolean }) {
  const { language, setLanguage, isLoading } = useLanguage()
  const [isOpen, setIsOpen] = useState(false)
  const buttonRef = useRef<HTMLButtonElement>(null)
  const dropdownRef = useRef<HTMLDivElement>(null)
  const [dropdownPos, setDropdownPos] = useState({ top: 0, right: 0 })

  const updatePosition = useCallback(() => {
    if (buttonRef.current) {
      const rect = buttonRef.current.getBoundingClientRect()
      setDropdownPos({
        top: rect.bottom + 4,
        right: window.innerWidth - rect.right,
      })
    }
  }, [])

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        buttonRef.current && !buttonRef.current.contains(event.target as Node) &&
        dropdownRef.current && !dropdownRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  useEffect(() => {
    if (isOpen) updatePosition()
  }, [isOpen, updatePosition])

  const handleSelect = async (lang: Language) => {
    setIsOpen(false)
    if (lang !== language) {
      await setLanguage(lang)
    }
  }

  return (
    <>
      <button
        ref={buttonRef}
        onClick={() => setIsOpen(!isOpen)}
        disabled={isLoading}
        className="flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium
          hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors
          text-gray-700 dark:text-gray-300
          disabled:opacity-50"
        title={getLanguageLabel(language)}
      >
        <Globe className="w-4 h-4" />
        {!compact && (
          <span>{language.toUpperCase()}</span>
        )}
      </button>

      {isOpen && typeof document !== 'undefined' && createPortal(
        <div
          ref={dropdownRef}
          className="fixed bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg shadow-lg py-1 z-[9999] min-w-[160px]"
          style={{ top: dropdownPos.top, right: dropdownPos.right }}
        >
          {LANGUAGES.map((lang) => (
            <button
              key={lang}
              onClick={() => handleSelect(lang)}
              className={`w-full flex items-center gap-3 px-4 py-2 text-sm transition-colors
                ${lang === language
                  ? 'bg-amber-50 dark:bg-amber-900/20 text-amber-800 dark:text-amber-400 font-medium'
                  : 'text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800'
                }`}
            >
              <span className="text-base">{getLanguageFlag(lang)}</span>
              <span>{getLanguageLabel(lang)}</span>
            </button>
          ))}
        </div>,
        document.body
      )}
    </>
  )
}
