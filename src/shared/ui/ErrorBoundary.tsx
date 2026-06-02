import React, { Component, ErrorInfo, ReactNode } from 'react'
import { AlertOctagon, RotateCw, Trash2 } from 'lucide-react'
import { Button } from './Button'

interface Props {
  children: ReactNode
}

interface State {
  hasError: boolean
  error: Error | null
}

export class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null,
  }

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error }
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('Uncaught error:', error, errorInfo)
  }

  private handleReload = () => {
    window.location.reload()
  }

  private handleReset = () => {
    // Clear local storage and reload to fix corrupted state
    localStorage.clear()
    window.location.href = '/'
  }

  public render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-bg flex items-center justify-center p-6 text-center">
          <div className="max-w-md w-full bg-surface border border-border rounded-2xl p-8 shadow-modal animate-scale-in">
            <div className="w-12 h-12 rounded-2xl bg-danger/10 text-danger flex items-center justify-center mx-auto mb-5">
              <AlertOctagon size={24} />
            </div>
            
            <h1 className="text-xl font-bold text-text-1 mb-2">Something went wrong</h1>
            <p className="text-sm text-text-2 mb-6">
              An unexpected error occurred. This could be due to corrupted local state or a temporary glitch.
            </p>

            {this.state.error && (
              <div className="bg-surface-2 border border-border rounded-xl p-4 mb-6 text-left overflow-x-auto max-h-32 text-xs font-mono text-danger/90">
                {this.state.error.stack || this.state.error.message}
              </div>
            )}

            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              <Button
                leftIcon={<RotateCw size={14} />}
                onClick={this.handleReload}
                className="flex-1"
              >
                Reload App
              </Button>
              <Button
                variant="secondary"
                leftIcon={<Trash2 size={14} />}
                onClick={this.handleReset}
                className="flex-1"
              >
                Reset App Data
              </Button>
            </div>
          </div>
        </div>
      )
    }

    return this.props.children
  }
}

