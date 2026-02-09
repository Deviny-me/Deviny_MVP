'use client'

import { useEffect } from 'react'
import { CheckCircle, AlertCircle, X } from 'lucide-react'
import { cn } from '@/lib/utils/cn'

interface ToastProps {
  message: string
  type: 'success' | 'error' | 'info'
  onClose: () => void
  duration?: number
  className?: string
}

/**
 * Shared toast notification component.
 * Auto-dismisses after duration (default 4 seconds).
 */
export function Toast({ 
  message, 
  type, 
  onClose,
  duration = 4000,
  className 
}: ToastProps) {
  useEffect(() => {
    const timer = setTimeout(onClose, duration)
    return () => clearTimeout(timer)
  }, [onClose, duration])

  const bgColors = {
    success: 'bg-green-500/90',
    error: 'bg-red-500/90',
    info: 'bg-blue-500/90'
  }

  return (
    <div className={cn(
      'fixed bottom-4 right-4 z-50 flex items-center gap-2 px-4 py-3 rounded-lg shadow-lg text-white',
      bgColors[type],
      className
    )}>
      {type === 'success' ? (
        <CheckCircle className="w-5 h-5" />
      ) : type === 'error' ? (
        <AlertCircle className="w-5 h-5" />
      ) : (
        <AlertCircle className="w-5 h-5" />
      )}
      <span className="text-sm font-medium">{message}</span>
      <button onClick={onClose} className="ml-2 hover:opacity-80">
        <X className="w-4 h-4" />
      </button>
    </div>
  )
}
