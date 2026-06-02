import React, { useEffect, useRef } from 'react'
import { createPortal } from 'react-dom'
import { X } from 'lucide-react'
import { cn } from '@/shared/utils/cn'
import { Button } from './Button'

interface ModalProps {
  open: boolean
  onClose: () => void
  title?: React.ReactNode
  description?: string
  size?: 'sm' | 'md' | 'lg' | 'xl'
  children: React.ReactNode
  footer?: React.ReactNode
}

const sizeClasses = {
  sm: 'max-w-sm',
  md: 'max-w-md',
  lg: 'max-w-lg',
  xl: 'max-w-2xl',
}

export function Modal({ open, onClose, title, description, size = 'md', children, footer }: ModalProps) {
  const overlayRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!open) return
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose() }
    document.addEventListener('keydown', onKey)
    document.body.style.overflow = 'hidden'
    return () => {
      document.removeEventListener('keydown', onKey)
      document.body.style.overflow = ''
    }
  }, [open, onClose])

  if (!open) return null

  return createPortal(
    <div
      ref={overlayRef}
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      onClick={e => { if (e.target === overlayRef.current) onClose() }}
    >
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/70 backdrop-blur-sm animate-fade-in" />

      {/* Dialog */}
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby={title ? 'modal-title' : undefined}
        className={cn(
          'relative w-full bg-surface border border-border rounded-2xl shadow-modal animate-scale-in',
          sizeClasses[size]
        )}
      >
        {/* Header */}
        {(title || description) && (
          <div className="flex items-start justify-between p-6 pb-0">
            <div>
              {title && <h2 id="modal-title" className="text-lg font-semibold text-text-1">{title}</h2>}
              {description && <p className="text-sm text-text-2 mt-1">{description}</p>}
            </div>
            <button
              onClick={onClose}
              aria-label="Close modal"
              className="text-text-3 hover:text-text-1 hover:bg-surface-2 p-1.5 rounded-lg transition-all ml-4 flex-shrink-0"
            >
              <X size={16} />
            </button>
          </div>
        )}
        {!title && (
          <button
            onClick={onClose}
            aria-label="Close modal"
            className="absolute right-4 top-4 text-text-3 hover:text-text-1 hover:bg-surface-2 p-1.5 rounded-lg transition-all z-10"
          >
            <X size={16} />
          </button>
        )}

        {/* Body */}
        <div className="p-6">{children}</div>

        {/* Footer */}
        {footer && (
          <div className="px-6 pb-6 flex items-center justify-end gap-3 border-t border-border pt-4">
            {footer}
          </div>
        )}
      </div>
    </div>,
    document.body
  )
}

// ─── Confirm Dialog ───────────────────────────────────────────
interface ConfirmDialogProps {
  open: boolean
  onClose: () => void
  onConfirm: () => void
  title: string
  message: string
  confirmLabel?: string
  loading?: boolean
}

export function ConfirmDialog({ open, onClose, onConfirm, title, message, confirmLabel = 'Delete', loading }: ConfirmDialogProps) {
  return (
    <Modal open={open} onClose={onClose} title={title} size="sm"
      footer={
        <>
          <Button variant="ghost" onClick={onClose} disabled={loading}>Cancel</Button>
          <Button variant="danger" onClick={onConfirm} loading={loading}>{confirmLabel}</Button>
        </>
      }
    >
      <p className="text-sm text-text-2">{message}</p>
    </Modal>
  )
}
