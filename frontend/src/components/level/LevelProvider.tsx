'use client'

import { createContext, useContext, useState, useEffect, ReactNode, useCallback } from 'react'
import { UserLevelDto } from '@/types/level'
import { getMyLevel } from '@/lib/api/levelApi'

interface LevelContextType {
  level: UserLevelDto | null
  loading: boolean
  refreshLevel: () => Promise<void>
}

const LevelContext = createContext<LevelContextType | undefined>(undefined)

export function LevelProvider({ children }: { children: ReactNode }) {
  const [level, setLevel] = useState<UserLevelDto | null>(null)
  const [loading, setLoading] = useState(true)

  const refreshLevel = useCallback(async () => {
    try {
      const data = await getMyLevel()
      setLevel(data)
    } catch (error) {
      console.error('Failed to fetch level:', error)
    }
  }, [])

  useEffect(() => {
    const fetchLevel = async () => {
      setLoading(true)
      await refreshLevel()
      setLoading(false)
    }

    fetchLevel()
  }, [refreshLevel])

  return (
    <LevelContext.Provider value={{ level, loading, refreshLevel }}>
      {children}
    </LevelContext.Provider>
  )
}

export function useLevel() {
  const context = useContext(LevelContext)
  if (context === undefined) {
    throw new Error('useLevel must be used within a LevelProvider')
  }
  return context
}
