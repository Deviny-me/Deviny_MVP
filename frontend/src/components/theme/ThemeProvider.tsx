'use client'

import { createContext, useContext, useState, useCallback, useMemo, ReactNode, useEffect } from 'react'
import { buildUrl } from '@/lib/config'

type Theme = 'light' | 'dark'

interface ThemeContextType {
  theme: Theme
  setTheme: (theme: Theme) => Promise<void>
  toggleTheme: () => Promise<void>
  isLoading: boolean
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined)

interface ThemeProviderProps {
  children: ReactNode
  initialTheme?: Theme
}

export function ThemeProvider({ children, initialTheme = 'light' }: ThemeProviderProps) {
  const [theme, setThemeState] = useState<Theme>(initialTheme)
  const [isLoading, setIsLoading] = useState(false)

  // Apply theme class to document
  const applyThemeClass = useCallback((newTheme: Theme) => {
    if (typeof document !== 'undefined') {
      const root = document.documentElement
      if (newTheme === 'dark') {
        root.classList.add('dark')
      } else {
        root.classList.remove('dark')
      }
    }
  }, [])

  // Apply initial theme on mount
  useEffect(() => {
    applyThemeClass(initialTheme)
  }, [initialTheme, applyThemeClass])

  // Sync theme with API on mount
  useEffect(() => {
    const syncTheme = async () => {
      try {
        const token = localStorage.getItem('accessToken')
        if (!token) return

        const response = await fetch(buildUrl('/me/settings'), {
          headers: {
            'Authorization': `Bearer ${token}`
          },
          credentials: 'include'
        })

        if (response.ok) {
          const data = await response.json()
          const apiTheme = data.theme as Theme
          if (apiTheme !== theme) {
            setThemeState(apiTheme)
            applyThemeClass(apiTheme)
          }
        }
      } catch (error) {
        console.error('Failed to sync theme:', error)
      }
    }

    syncTheme()
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  // Set theme and save to API
  const setTheme = useCallback(async (newTheme: Theme) => {
    setIsLoading(true)
    
    // Immediately apply theme for instant feedback
    setThemeState(newTheme)
    applyThemeClass(newTheme)

    try {
      const token = localStorage.getItem('accessToken')
      if (!token) return

      await fetch(buildUrl('/me/settings/theme'), {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        credentials: 'include',
        body: JSON.stringify({ theme: newTheme })
      })
    } catch (error) {
      console.error('Failed to save theme:', error)
    } finally {
      setIsLoading(false)
    }
  }, [applyThemeClass])

  const toggleTheme = useCallback(async () => {
    const newTheme = theme === 'light' ? 'dark' : 'light'
    await setTheme(newTheme)
  }, [theme, setTheme])

  const value = useMemo(() => ({ theme, setTheme, toggleTheme, isLoading }), [theme, setTheme, toggleTheme, isLoading])

  return (
    <ThemeContext.Provider value={value}>
      {children}
    </ThemeContext.Provider>
  )
}

export function useTheme() {
  const context = useContext(ThemeContext)
  if (context === undefined) {
    throw new Error('useTheme must be used within a ThemeProvider')
  }
  return context
}

// Helper function to get theme label
export function getThemeLabel(theme: 'light' | 'dark'): string {
  return theme === 'dark' ? 'Тёмная' : 'Светлая'
}
