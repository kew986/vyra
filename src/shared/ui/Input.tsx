import React from 'react'
import { cn } from '@/shared/utils/cn'

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string
  error?: string
  hint?: string
  leftIcon?: React.ReactNode
  rightIcon?: React.ReactNode
}

export const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ label, error, hint, leftIcon, rightIcon, className, id, ...props }, ref) => {
    const inputId = id || label?.toLowerCase().replace(/\s+/g, '-')
    return (
      <div className="flex flex-col gap-1.5">
        {label && (
          <label htmlFor={inputId} className="text-xs font-medium text-text-2 uppercase tracking-wide">
            {label}
          </label>
        )}
        <div className="relative flex items-center">
          {leftIcon && (
            <span className="absolute left-3 text-text-3 pointer-events-none flex items-center">
              {leftIcon}
            </span>
          )}
          <input
            ref={ref}
            id={inputId}
            className={cn(
              'w-full h-9 rounded-lg bg-surface-2 border border-border text-text-1 text-sm placeholder:text-text-3',
              'transition-all duration-150',
              'hover:border-border-2',
              'focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary/30',
              'disabled:opacity-50 disabled:cursor-not-allowed',
              leftIcon ? 'pl-9' : 'pl-3',
              rightIcon ? 'pr-9' : 'pr-3',
              error && 'border-danger focus:border-danger focus:ring-danger/30',
              className
            )}
            {...props}
          />
          {rightIcon && (
            <span className="absolute right-3 text-text-3 flex items-center">
              {rightIcon}
            </span>
          )}
        </div>
        {error && <p className="text-xs text-danger">{error}</p>}
        {hint && !error && <p className="text-xs text-text-3">{hint}</p>}
      </div>
    )
  }
)
Input.displayName = 'Input'

interface TextareaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string
  error?: string
  hint?: string
}

export const Textarea = React.forwardRef<HTMLTextAreaElement, TextareaProps>(
  ({ label, error, hint, className, id, ...props }, ref) => {
    const inputId = id || label?.toLowerCase().replace(/\s+/g, '-')
    return (
      <div className="flex flex-col gap-1.5">
        {label && (
          <label htmlFor={inputId} className="text-xs font-medium text-text-2 uppercase tracking-wide">
            {label}
          </label>
        )}
        <textarea
          ref={ref}
          id={inputId}
          className={cn(
            'w-full rounded-lg bg-surface-2 border border-border text-text-1 text-sm placeholder:text-text-3',
            'px-3 py-2.5 min-h-[80px] resize-y',
            'transition-all duration-150',
            'hover:border-border-2',
            'focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary/30',
            'disabled:opacity-50 disabled:cursor-not-allowed',
            error && 'border-danger',
            className
          )}
          {...props}
        />
        {error && <p className="text-xs text-danger">{error}</p>}
        {hint && !error && <p className="text-xs text-text-3">{hint}</p>}
      </div>
    )
  }
)
Textarea.displayName = 'Textarea'

interface SelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
  label?: string
  error?: string
  options: { value: string; label: string }[]
}

export const Select = React.forwardRef<HTMLSelectElement, SelectProps>(
  ({ label, error, options, className, id, ...props }, ref) => {
    const inputId = id || label?.toLowerCase().replace(/\s+/g, '-')
    return (
      <div className="flex flex-col gap-1.5">
        {label && (
          <label htmlFor={inputId} className="text-xs font-medium text-text-2 uppercase tracking-wide">
            {label}
          </label>
        )}
        <select
          ref={ref}
          id={inputId}
          className={cn(
            'w-full h-9 rounded-lg bg-surface-2 border border-border text-text-1 text-sm',
            'px-3 appearance-none cursor-pointer',
            'transition-all duration-150',
            'hover:border-border-2',
            'focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary/30',
            error && 'border-danger',
            className
          )}
          {...props}
        >
          {options.map(opt => (
            <option key={opt.value} value={opt.value} className="bg-surface-2">
              {opt.label}
            </option>
          ))}
        </select>
        {error && <p className="text-xs text-danger">{error}</p>}
      </div>
    )
  }
)
Select.displayName = 'Select'
