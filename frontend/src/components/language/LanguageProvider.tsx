'use client'

import { createContext, useContext, useState, useCallback, useMemo, ReactNode, useEffect } from 'react'
import { NextIntlClientProvider } from 'next-intl'

import ruMessages from '../../../messages/ru.json'
import enMessages from '../../../messages/en.json'
import azMessages from '../../../messages/az.json'

export type Language = 'ru' | 'en' | 'az'

const messagesMap: Record<Language, typeof ruMessages> = {
  ru: ruMessages,
  en: enMessages,
  az: azMessages,
}

export function getLanguageLabel(lang: Language): string {
  switch (lang) {
    case 'ru': return 'Русский'
    case 'en': return 'English'
    case 'az': return 'Azərbaycan'
  }
}

export function getLanguageFlag(lang: Language): string {
  switch (lang) {
    case 'ru': return '🇷🇺'
    case 'en': return '🇬🇧'
    case 'az': return '🇦🇿'
  }
}

interface LanguageContextType {
  language: Language
  setLanguage: (lang: Language) => Promise<void>
  isLoading: boolean
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined)

interface LanguageProviderProps {
  children: ReactNode
  initialLanguage?: Language
}

export function LanguageProvider({ children, initialLanguage = 'ru' }: LanguageProviderProps) {
  const [language, setLanguageState] = useState<Language>(initialLanguage)
  const [isLoading, setIsLoading] = useState(false)

  // Sync with API on mount
  useEffect(() => {
    const syncLanguage = async () => {
      try {
        const token = localStorage.getItem('accessToken')
        if (!token) return

        const response = await fetch('http://localhost:5000/api/me/settings', {
          headers: {
            'Authorization': `Bearer ${token}`
          },
          credentials: 'include'
        })

        if (response.ok) {
          const data = await response.json()
          const apiLanguage = (data.language || 'ru') as Language
          if (['ru', 'en', 'az'].includes(apiLanguage) && apiLanguage !== language) {
            setLanguageState(apiLanguage)
          }
        }
      } catch (error) {
        console.error('Failed to sync language:', error)
      }
    }

    syncLanguage()
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  const setLanguage = useCallback(async (newLanguage: Language) => {
    setIsLoading(true)
    setLanguageState(newLanguage)

    try {
      const token = localStorage.getItem('accessToken')
      if (!token) return

      await fetch('http://localhost:5000/api/me/settings/language', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        credentials: 'include',
        body: JSON.stringify({ language: newLanguage })
      })
    } catch (error) {
      console.error('Failed to save language:', error)
    } finally {
      setIsLoading(false)
    }
  }, [])

  const contextValue = useMemo(() => ({ language, setLanguage, isLoading }), [language, setLanguage, isLoading])

  const messages = messagesMap[language]

  return (
    <LanguageContext.Provider value={contextValue}>
      <NextIntlClientProvider locale={language} messages={messages} timeZone="Asia/Baku">
        {children}
      </NextIntlClientProvider>
    </LanguageContext.Provider>
  )
}

export function useLanguage() {
  const context = useContext(LanguageContext)
  if (context === undefined) {
    throw new Error('useLanguage must be used within a LanguageProvider')
  }
  return context
}
