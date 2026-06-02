import React, { useEffect, useRef, useState } from 'react'
import { create } from 'zustand'
import { CheckCircle2, AlertTriangle, XCircle, Info, X } from 'lucide-react'
import { cn } from '@/shared/utils/cn'

export type ToastType = 'success' | 'warning' | 'error' | 'info'

export interface ToastItem {
  id: string
  message: string
  type: ToastType
  duration?: number
}

interface ToastStore {
  toasts: ToastItem[]
  addToast: (message: string, type: ToastType, duration?: number) => void
  removeToast: (id: string) => void
}

export const useToastStore = create<ToastStore>((set) => ({
  toasts: [],
  addToast: (message, type, duration = 4000) => {
    const id = Math.random().toString(36).substring(2, 9)
    set((state) => ({
      toasts: [...state.toasts, { id, message, type, duration }]
    }))
  },
  removeToast: (id) =>
    set((state) => ({
      toasts: state.toasts.filter((t) => t.id !== id)
    }))
}))

export const toast = {
  success: (message: string, duration?: number) => useToastStore.getState().addToast(message, 'success', duration),
  warning: (message: string, duration?: number) => useToastStore.getState().addToast(message, 'warning', duration),
  error: (message: string, duration?: number) => useToastStore.getState().addToast(message, 'error', duration),
  info: (message: string, duration?: number) => useToastStore.getState().addToast(message, 'info', duration),
}

export function ToastContainer() {
  const toasts = useToastStore((state) => state.toasts)
  
  return (
    <div className="fixed top-4 right-4 z-[9999] flex flex-col gap-3 max-w-sm w-full px-4 pointer-events-none sm:px-0">
      {toasts.map((item) => (
        <ToastCard key={item.id} item={item} />
      ))}
    </div>
  )
}

function ToastCard({ item }: { item: ToastItem }) {
  const removeToast = useToastStore((state) => state.removeToast)
  const [isHovered, setIsHovered] = useState(false)
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const remainingRef = useRef(item.duration || 4000)
  const startTimeRef = useRef(Date.now())

  const handleClose = () => {
    removeToast(item.id)
  }

  const startTimer = () => {
    startTimeRef.current = Date.now()
    timerRef.current = setTimeout(() => {
      handleClose()
    }, remainingRef.current)
  }

  const pauseTimer = () => {
    if (timerRef.current) {
      clearTimeout(timerRef.current)
      timerRef.current = null
      remainingRef.current -= Date.now() - startTimeRef.current
    }
  }

  useEffect(() => {
    startTimer()
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current)
    }
  }, [])

  const handleMouseEnter = () => {
    setIsHovered(true)
    pauseTimer()
  }

  const handleMouseLeave = () => {
    setIsHovered(false)
    startTimer()
  }

  const icons = {
    success: <CheckCircle2 className="w-5 h-5 text-emerald-500" />,
    warning: <AlertTriangle className="w-5 h-5 text-amber-500" />,
    error: <XCircle className="w-5 h-5 text-rose-500" />,
    info: <Info className="w-5 h-5 text-primary" />,
  }

  const themeClasses = {
    success: 'border-l-emerald-500 shadow-emerald-500/5',
    warning: 'border-l-amber-500 shadow-amber-500/5',
    error: 'border-l-rose-500 shadow-rose-500/5',
    info: 'border-l-primary shadow-primary/5',
  }

  const progressColors = {
    success: 'bg-emerald-500',
    warning: 'bg-amber-500',
    error: 'bg-rose-500',
    info: 'bg-primary',
  }

  return (
    <div
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      className={cn(
        'relative overflow-hidden pointer-events-auto w-full select-none flex flex-col',
        'backdrop-blur-md bg-surface/85 border border-border/40 border-l-[4px] rounded-xl shadow-lg',
        'transition-all duration-300 transform translate-y-0 scale-100 animate-fade-in-up',
        themeClasses[item.type]
      )}
      style={{
        boxShadow: `0 10px 30px -10px var(--color-${item.type === 'info' ? 'primary' : item.type}-subtle, rgba(0,0,0,0.1))`
      }}
    >
      <div className="flex items-start p-4 gap-3">
        <div className="flex-shrink-0 mt-0.5">{icons[item.type]}</div>
        <div className="flex-grow min-w-0">
          <p className="text-sm font-medium text-text-1 break-words">{item.message}</p>
        </div>
        <button
          onClick={handleClose}
          className="flex-shrink-0 text-text-3 hover:text-text-1 p-0.5 rounded-lg hover:bg-surface-2 transition-colors"
          aria-label="Dismiss toast"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      {/* Progress bar */}
      <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-surface-2 overflow-hidden">
        <div
          className={cn('h-full transition-all duration-[4000ms] ease-linear', progressColors[item.type])}
          style={{
            width: isHovered ? `${(remainingRef.current / (item.duration || 4000)) * 100}%` : '0%',
            animation: !isHovered ? `shrink-width ${remainingRef.current}ms linear forwards` : 'none',
          }}
        />
      </div>
    </div>
  )
}
