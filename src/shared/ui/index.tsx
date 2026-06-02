import React from 'react'
import { cn } from '@/shared/utils/cn'
export { ConfirmDialog } from './Modal'
export * from './DropdownMenu'
export { KeyboardShortcutsModal } from './KeyboardShortcutsModal'
export { ErrorBoundary } from './ErrorBoundary'
export { toast, ToastContainer } from './Toast'


interface EmptyStateProps {
  icon?: React.ReactNode
  title: string
  description?: string
  action?: React.ReactNode
  className?: string
}

export function EmptyState({ icon, title, description, action, className }: EmptyStateProps) {
  return (
    <div className={cn('flex flex-col items-center justify-center py-16 px-8 text-center', className)}>
      {icon && (
        <div className="w-12 h-12 rounded-2xl bg-surface-2 border border-border flex items-center justify-center text-text-3 mb-4">
          {icon}
        </div>
      )}
      <h3 className="text-base font-semibold text-text-1 mb-1">{title}</h3>
      {description && <p className="text-sm text-text-2 max-w-xs mb-6">{description}</p>}
      {action}
    </div>
  )
}

export function Spinner({ size = 16, className }: { size?: number; className?: string }) {
  return (
    <svg
      className={cn('animate-spin text-primary', className)}
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
    >
      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
    </svg>
  )
}

interface SkeletonProps {
  className?: string
  lines?: number
}

export function Skeleton({ className, lines = 1 }: SkeletonProps) {
  return (
    <div className="flex flex-col gap-2">
      {Array.from({ length: lines }).map((_, i) => (
        <div key={i} className={cn('skeleton rounded-md h-4', className)} />
      ))}
    </div>
  )
}

interface CardProps {
  children: React.ReactNode
  className?: string
  onClick?: () => void
  hoverable?: boolean
}

export function Card({ children, className, onClick, hoverable }: CardProps) {
  return (
    <div
      onClick={onClick}
      className={cn(
        'bg-surface border border-border rounded-xl',
        hoverable && 'card-hover cursor-pointer',
        onClick && 'cursor-pointer',
        className
      )}
    >
      {children}
    </div>
  )
}

interface TabsProps {
  tabs: { id: string; label: string; count?: number; icon?: React.ReactNode }[]
  activeTab: string
  onChange: (id: string) => void
  className?: string
}

export function Tabs({ tabs, activeTab, onChange, className }: TabsProps) {
  return (
    <div className={cn('flex items-center gap-1 overflow-x-auto no-scrollbar w-full snap-x snap-mandatory', className)} role="tablist">
      {tabs.map(tab => (
        <button
          key={tab.id}
          role="tab"
          aria-selected={activeTab === tab.id}
          onClick={() => onChange(tab.id)}
          className={cn(
            'inline-flex items-center gap-1.5 px-3 h-8 text-sm rounded-lg font-medium transition-all duration-150 whitespace-nowrap flex-shrink-0 snap-start',
            activeTab === tab.id
              ? 'bg-surface-2 text-text-1 border border-border'
              : 'text-text-2 hover:text-text-1 hover:bg-surface-2/50'
          )}
        >
          {tab.icon}
          {tab.label}
          {tab.count !== undefined && (
            <span className={cn(
              'text-xs px-1.5 py-0.5 rounded-full',
              activeTab === tab.id ? 'bg-primary/15 text-primary' : 'bg-surface-3 text-text-3'
            )}>
              {tab.count}
            </span>
          )}
        </button>
      ))}
    </div>
  )
}

interface ToggleProps {
  checked: boolean
  onChange: (checked: boolean) => void
  label?: string
  size?: 'sm' | 'md'
}

export function Toggle({ checked, onChange, label, size = 'md' }: ToggleProps) {
  return (
    <label className="flex items-center gap-2.5 cursor-pointer group">
      <div
        role="switch"
        aria-checked={checked}
        onClick={() => onChange(!checked)}
        className={cn(
          'relative inline-flex items-center rounded-full transition-colors duration-200',
          size === 'sm' ? 'w-8 h-4' : 'w-11 h-6',
          checked ? 'bg-primary' : 'bg-surface-3 border border-border'
        )}
      >
        <span className={cn(
          'inline-block rounded-full bg-white shadow-sm transition-transform duration-200',
          size === 'sm' ? 'w-3 h-3' : 'w-4 h-4',
          size === 'sm'
            ? checked ? 'translate-x-4' : 'translate-x-0.5'
            : checked ? 'translate-x-6' : 'translate-x-1'
        )} />
      </div>
      {label && <span className="text-sm text-text-2 group-hover:text-text-1 transition-colors">{label}</span>}
    </label>
  )
}
