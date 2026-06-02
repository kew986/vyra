import { useState, useRef, useEffect } from 'react'
import { cn } from '@/shared/utils/cn'

export interface DropdownMenuItem {
  id: string
  label: string
  icon?: React.ReactNode
  onClick: () => void
  disabled?: boolean
  danger?: boolean
}

interface DropdownMenuProps {
  trigger: React.ReactNode
  items: DropdownMenuItem[]
  align?: 'left' | 'right'
  className?: string
}

export function DropdownMenu({ trigger, items, align = 'right', className }: DropdownMenuProps) {
  const [open, setOpen] = useState(false)
  const menuRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setOpen(false)
      }
    }
    if (open) document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [open])

  return (
    <div className={cn('relative inline-block', className)} ref={menuRef}>
      <div onClick={() => setOpen(!open)} className="cursor-pointer">
        {trigger}
      </div>

      {open && (
        <div
          className={cn(
            'absolute top-full mt-1.5 min-w-[160px] z-50 overflow-hidden',
            'bg-surface border border-border shadow-xl rounded-xl py-1.5',
            'animate-in fade-in zoom-in-95 duration-100',
            align === 'right' ? 'right-0' : 'left-0'
          )}
        >
          {items.map((item, idx) => (
            <button
              key={item.id || idx}
              onClick={() => {
                if (!item.disabled) {
                  item.onClick()
                  setOpen(false)
                }
              }}
              disabled={item.disabled}
              className={cn(
                'w-full flex items-center gap-2.5 px-3 py-1.5 text-sm text-left transition-colors',
                item.disabled ? 'opacity-50 cursor-not-allowed text-text-3' : 
                item.danger ? 'text-danger hover:bg-danger/10' : 'text-text-2 hover:text-text-1 hover:bg-surface-2'
              )}
            >
              {item.icon && <span className="flex-shrink-0 opacity-70">{item.icon}</span>}
              {item.label}
            </button>
          ))}
        </div>
      )}
    </div>
  )
}
