import { useState, useCallback, useEffect } from 'react'
import { WifiOff, Download } from 'lucide-react'
import { Outlet } from 'react-router-dom'
import { Sidebar } from './Sidebar'
import { TopBar, MobileTopBar } from './TopBar'
import { MobileNav } from './MobileNav'
import { GlobalSearch } from '@/search/GlobalSearch'
import { cn } from '@/shared/utils/cn'
import { useSettingsStore } from '@/features/settings/store/settingsStore'
import { useKeyboardShortcuts } from '@/shared/hooks/useKeyboardShortcuts'
import { KeyboardShortcutsModal } from '@/shared/ui'
import { notificationService } from '@/features/calendar/services/notificationService'
import { JournalDrawer } from '@/features/notes/components/JournalDrawer'

export function AppShell() {
  const [searchOpen, setSearchOpen] = useState(false)
  const [shortcutsOpen, setShortcutsOpen] = useState(false)
  const [isOffline, setIsOffline] = useState(!navigator.onLine)
  const [installPrompt, setInstallPrompt] = useState<any>(null)
  const [journalOpen, setJournalOpen] = useState(false)
  const collapsed = useSettingsStore(s => s.settings.sidebarCollapsed)

  const openSearch = useCallback(() => setSearchOpen(true), [])
  const closeSearch = useCallback(() => setSearchOpen(false), [])
  const toggleShortcuts = useCallback(() => setShortcutsOpen(o => !o), [])
  const toggleJournal = useCallback(() => setJournalOpen(o => !o), [])

  // Initialize keyboard shortcuts
  useKeyboardShortcuts({
    onToggleGuide: toggleShortcuts,
    onSearchOpen: openSearch,
  })

  useEffect(() => {
    const handleOnline = () => setIsOffline(false)
    const handleOffline = () => setIsOffline(true)
    const handleInstallPrompt = (e: any) => {
      e.preventDefault()
      setInstallPrompt(e)
    }

    window.addEventListener('online', handleOnline)
    window.addEventListener('offline', handleOffline)
    window.addEventListener('beforeinstallprompt', handleInstallPrompt)

    // Start notification service
    notificationService.requestPermission()
    notificationService.start()

    return () => {
      window.removeEventListener('online', handleOnline)
      window.removeEventListener('offline', handleOffline)
      window.removeEventListener('beforeinstallprompt', handleInstallPrompt)
      notificationService.stop()
    }
  }, [])

  const handleInstallClick = async () => {
    if (!installPrompt) return
    installPrompt.prompt()
    const { outcome } = await installPrompt.userChoice
    if (outcome === 'accepted') setInstallPrompt(null)
  }

  return (
    <div className="min-h-screen bg-bg">
      <Sidebar />
      <TopBar onSearchOpen={openSearch} onJournalOpen={toggleJournal} />
      <MobileTopBar onSearchOpen={openSearch} onJournalOpen={toggleJournal} />

      {/* Main content */}
      <main
        className={cn(
          'transition-all duration-200',
          // Desktop: offset for sidebar and topbar
          collapsed ? 'lg:pl-16' : 'lg:pl-60',
          'pt-14',        // topbar height
          'pb-0 lg:pb-0',
          // Mobile: offset for bottom nav
          'pb-16 lg:pb-0'
        )}
      >
        <div className="min-h-[calc(100vh-56px)] animate-fade-in-up">
          <Outlet />
        </div>
      </main>

      <MobileNav />
      <GlobalSearch open={searchOpen} onClose={closeSearch} />
      <KeyboardShortcutsModal open={shortcutsOpen} onClose={() => setShortcutsOpen(false)} />
      <JournalDrawer open={journalOpen} onClose={() => setJournalOpen(false)} />

      {/* Offline Indicator */}
      {isOffline && (
        <div className="fixed bottom-20 lg:bottom-6 right-6 z-50 bg-danger text-white px-4 py-2 rounded-full shadow-lg flex items-center gap-2 text-sm font-medium animate-slide-up">
          <WifiOff size={16} /> Offline Mode
        </div>
      )}

      {/* PWA Install Prompt */}
      {installPrompt && !isOffline && (
        <button
          onClick={handleInstallClick}
          className="fixed bottom-20 lg:bottom-6 left-6 z-50 bg-primary text-white px-4 py-2 rounded-full shadow-lg flex items-center gap-2 text-sm font-medium animate-slide-up hover:bg-primary-hover transition-colors"
        >
          <Download size={16} /> Install App
        </button>
      )}
    </div>
  )
}

