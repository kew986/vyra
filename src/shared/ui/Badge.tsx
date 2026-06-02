import React from 'react'
import { cn } from '@/shared/utils/cn'
import type { BadgeVariant } from '@/shared/types'

interface BadgeProps {
  variant?: BadgeVariant
  size?: 'sm' | 'md'
  dot?: boolean
  children: React.ReactNode
  className?: string
}

const variantClasses: Record<BadgeVariant, string> = {
  default:  'bg-surface-3 text-text-2 border border-border',
  primary:  'bg-primary/10 text-primary border border-primary/20',
  success:  'bg-success/10 text-success border border-success/20',
  warning:  'bg-warning/10 text-warning border border-warning/20',
  danger:   'bg-danger/10 text-danger border border-danger/20',
  info:     'bg-secondary/10 text-secondary border border-secondary/20',
}

const dotClasses: Record<BadgeVariant, string> = {
  default:  'bg-text-3',
  primary:  'bg-primary',
  success:  'bg-success',
  warning:  'bg-warning',
  danger:   'bg-danger',
  info:     'bg-secondary',
}

export function Badge({ variant = 'default', size = 'sm', dot, children, className }: BadgeProps) {
  return (
    <span className={cn(
      'inline-flex items-center gap-1.5 font-medium rounded-full',
      size === 'sm' ? 'text-xs px-2 py-0.5' : 'text-sm px-2.5 py-1',
      variantClasses[variant],
      className
    )}>
      {dot && <span className={cn('w-1.5 h-1.5 rounded-full', dotClasses[variant])} />}
      {children}
    </span>
  )
}
