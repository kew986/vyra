import React from 'react'
import { cn } from '@/shared/utils/cn'
import type { ButtonVariant, ButtonSize } from '@/shared/types'
import { Loader2 } from 'lucide-react'

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant
  size?: ButtonSize
  loading?: boolean
  leftIcon?: React.ReactNode
  rightIcon?: React.ReactNode
}

const variantClasses: Record<ButtonVariant, string> = {
  primary: 'bg-primary hover:bg-primary-hover text-white shadow-sm hover:shadow-glow-primary',
  secondary: 'bg-surface-2 hover:bg-surface-3 text-text-1 border border-border hover:border-border-2',
  ghost: 'bg-transparent hover:bg-surface-2 text-text-2 hover:text-text-1',
  danger: 'bg-danger/10 hover:bg-danger/20 text-danger border border-danger/30 hover:border-danger/50',
  outline: 'bg-transparent border border-border hover:border-border-2 text-text-2 hover:text-text-1',
}

const sizeClasses: Record<ButtonSize, string> = {
  sm: 'h-7 px-3 text-xs gap-1.5',
  md: 'h-9 px-4 text-sm gap-2',
  lg: 'h-11 px-6 text-base gap-2.5',
}

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ variant = 'primary', size = 'md', loading, leftIcon, rightIcon, children, className, disabled, ...props }, ref) => {
    return (
      <button
        ref={ref}
        className={cn(
          'inline-flex items-center justify-center font-medium rounded-lg transition-all duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:ring-offset-bg disabled:opacity-50 disabled:cursor-not-allowed select-none',
          variantClasses[variant],
          sizeClasses[size],
          className
        )}
        disabled={disabled || loading}
        {...props}
      >
        {loading ? (
          <Loader2 className="animate-spin" size={size === 'sm' ? 12 : size === 'lg' ? 18 : 14} />
        ) : leftIcon}
        {children && <span>{children}</span>}
        {!loading && rightIcon}
      </button>
    )
  }
)
Button.displayName = 'Button'
