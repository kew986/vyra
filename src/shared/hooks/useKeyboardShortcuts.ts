import { useEffect, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'

interface KeyboardShortcutsOptions {
  onToggleGuide: () => void
  onSearchOpen: () => void
}

export function useKeyboardShortcuts({ onToggleGuide, onSearchOpen }: KeyboardShortcutsOptions) {
  const navigate = useNavigate()
  const lastKeyRef = useRef<{ key: string; time: number } | null>(null)

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // 1. Ignore if typing in form fields or rich text editors
      const target = e.target as HTMLElement | null
      if (target) {
        const isInput = target.tagName === 'INPUT' || 
                        target.tagName === 'TEXTAREA' || 
                        target.tagName === 'SELECT' || 
                        target.isContentEditable ||
                        target.closest('.ProseMirror') ||
                        target.closest('[contenteditable="true"]')
        
        if (isInput) return
      }

      const key = e.key.toLowerCase()
      const now = Date.now()

      // 2. Help Modal Shortcut
      if (e.key === '?' || (e.shiftKey && e.key === '/')) {
        e.preventDefault()
        onToggleGuide()
        lastKeyRef.current = null
        return
      }

      // 3. Command Palette Shortcut (⌘K / Ctrl+K)
      if ((e.metaKey || e.ctrlKey) && key === 'k') {
        e.preventDefault()
        onSearchOpen()
        lastKeyRef.current = null
        return
      }

      // 4. Sequential Shortcuts
      const last = lastKeyRef.current
      lastKeyRef.current = { key, time: now }

      if (last && now - last.time < 1200) {
        const sequence = `${last.key}${key}`

        switch (sequence) {
          // Navigation
          case 'gd':
            e.preventDefault()
            navigate('/')
            lastKeyRef.current = null
            return
          case 'gp':
            e.preventDefault()
            navigate('/projects')
            lastKeyRef.current = null
            return
          case 'gt':
            e.preventDefault()
            navigate('/tasks')
            lastKeyRef.current = null
            return
          case 'gl':
            e.preventDefault()
            navigate('/library')
            lastKeyRef.current = null
            return
          case 'gn':
            e.preventDefault()
            navigate('/notes')
            lastKeyRef.current = null
            return
          case 'gs':
            e.preventDefault()
            navigate('/settings')
            lastKeyRef.current = null
            return

          // Actions
          case 'np':
            e.preventDefault()
            navigate('/projects?new=true')
            lastKeyRef.current = null
            return
          case 'nt':
            e.preventDefault()
            navigate('/tasks?new=true')
            lastKeyRef.current = null
            return
          case 'nl':
            e.preventDefault()
            navigate('/library?new=true')
            lastKeyRef.current = null
            return
          case 'nn':
            e.preventDefault()
            navigate('/notes?new=true')
            lastKeyRef.current = null
            return
        }
      }
    }

    document.addEventListener('keydown', handleKeyDown)
    return () => document.removeEventListener('keydown', handleKeyDown)
  }, [navigate, onToggleGuide, onSearchOpen])
}
