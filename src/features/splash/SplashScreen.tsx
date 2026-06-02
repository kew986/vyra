import { useEffect, useState } from 'react'

interface SplashScreenProps {
  onComplete: () => void
}

export function SplashScreen({ onComplete }: SplashScreenProps) {
  const [stage, setStage] = useState<'loading' | 'out'>('loading')

  useEffect(() => {
    // Minimum display time for premium feel
    const timer = setTimeout(() => {
      setStage('out')
      // Wait for fade out animation
      setTimeout(onComplete, 400)
    }, 1200)
    return () => clearTimeout(timer)
  }, [onComplete])

  return (
    <div
      className={`fixed inset-0 z-50 flex flex-col items-center justify-center bg-bg transition-opacity duration-400 ease-in-out ${
        stage === 'out' ? 'opacity-0 pointer-events-none' : 'opacity-100'
      }`}
    >
      <div className="flex flex-col items-center transform transition-transform duration-1000 scale-100 animate-pulse">
        <img
          src="/logos/vyra-primary-logo.png"
          alt="VYRA Logo"
          className="w-48 h-auto object-contain mb-8"
        />
        {/* Subtle loading indicator */}
        <div className="flex gap-2">
          <div className="w-1.5 h-1.5 rounded-full bg-primary/40 animate-bounce" style={{ animationDelay: '0ms' }} />
          <div className="w-1.5 h-1.5 rounded-full bg-primary/40 animate-bounce" style={{ animationDelay: '150ms' }} />
          <div className="w-1.5 h-1.5 rounded-full bg-primary/40 animate-bounce" style={{ animationDelay: '300ms' }} />
        </div>
      </div>
    </div>
  )
}
