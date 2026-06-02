import { useState, useEffect } from 'react'
import { Lock, AlertCircle } from 'lucide-react'
import { useSettingsStore } from '@/features/settings/store/settingsStore'
import { Button } from '@/shared/ui/Button'
import { Input } from '@/shared/ui/Input'
import { hashPin } from '@/shared/utils/security'

interface LockScreenProps {
  onUnlock: () => void
}

export function LockScreen({ onUnlock }: LockScreenProps) {
  const { settings } = useSettingsStore()
  const [pin, setPin] = useState('')
  const [error, setError] = useState(false)

  const handleUnlock = (e: React.FormEvent) => {
    e.preventDefault()
    if (settings.appLock?.hashedPin === hashPin(pin)) {
      setError(false)
      onUnlock()
    } else {
      setError(true)
      setPin('')
    }
  }

  // Pre-fill / Debug bypass: If no PIN is set but lock is enabled, just unlock
  useEffect(() => {
    if (!settings.appLock?.hashedPin) {
      onUnlock()
    }
  }, [settings.appLock?.hashedPin, onUnlock])

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-bg">
      <div className="w-full max-w-sm p-8 bg-surface border border-border rounded-2xl shadow-modal text-center animate-fade-in">
        <img src="/logos/vyra-logo-mark.png" alt="VYRA" className="w-16 h-16 object-contain mx-auto mb-6" />
        <h1 className="text-2xl font-bold text-text-1 mb-2">App Locked</h1>
        <p className="text-sm text-text-3 mb-8">Enter your PIN to access VYRA</p>

        <form onSubmit={handleUnlock} className="space-y-4">
          <div>
            <Input
              type="password"
              inputMode="numeric"
              autoComplete="one-time-code"
              maxLength={6}
              value={pin}
              onChange={e => setPin(e.target.value)}
              placeholder="••••"
              className="text-center text-2xl tracking-[0.5em] font-mono h-14"
              autoFocus
            />
            {error && (
              <p className="text-xs text-danger mt-2 flex items-center justify-center gap-1">
                <AlertCircle size={12} /> Incorrect PIN
              </p>
            )}
          </div>
          <Button type="submit" className="w-full h-11" disabled={pin.length < 4}>
            Unlock
          </Button>
        </form>
      </div>
    </div>
  )
}
