import { Search, Command, Book, Settings } from 'lucide-react'
import { useNavigate, useMatches, Link } from 'react-router-dom'
import { cn } from '@/shared/utils/cn'
import { useSettingsStore } from '@/features/settings/store/settingsStore'
import { QuickCreate } from '@/shared/components/QuickCreate'
import { TimerWidget } from '@/features/timer/components/TimerWidget'
import { NotificationBell } from '@/features/notifications/components/NotificationBell'

interface TopBarProps {
  onSearchOpen: () => void
  onJournalOpen: () => void
}

export function TopBar({ onSearchOpen, onJournalOpen }: TopBarProps) {
  const collapsed = useSettingsStore(s => s.settings.sidebarCollapsed)

  return (
    <header
      className={cn(
        'fixed top-0 right-0 z-20 h-14 flex items-center px-4 gap-4',
        'bg-surface/80 backdrop-blur-md border-b border-border',
        'transition-all duration-200',
        collapsed ? 'left-16' : 'left-60',
        'lg:flex hidden'
      )}
    >
      {/* Search trigger */}
      <button
        id="global-search-trigger"
        onClick={onSearchOpen}
        aria-label="Open global search (⌘K)"
        className="flex items-center gap-2 h-8 px-3 rounded-lg bg-surface-2 border border-border text-text-3 hover:text-text-1 hover:border-border-2 transition-all duration-150 text-sm w-56"
      >
        <Search size={13} />
        <span className="flex-1 text-left">Search...</span>
        <kbd className="inline-flex items-center gap-0.5 text-xs bg-surface-3 border border-border rounded px-1 py-0.5">
          <Command size={10} />K
        </kbd>
      </button>

      <TimerWidget />
      
      <button
        onClick={onJournalOpen}
        aria-label="Open Daily Journal"
        className="w-9 h-9 flex items-center justify-center rounded-lg bg-surface-2 border border-border text-text-2 hover:text-text-1 hover:border-primary/50 hover:text-primary transition-all ml-2"
        title="Daily Journal"
      >
        <Book size={15} />
      </button>
      
      <NotificationBell />
      
      <QuickCreate />
    </header>
  )
}

// Mobile TopBar
interface MobileTopBarProps {
  onSearchOpen: () => void
  onJournalOpen: () => void
}

export function MobileTopBar({ onSearchOpen, onJournalOpen }: MobileTopBarProps) {
  return (
    <header className="lg:hidden fixed top-0 left-0 right-0 z-20 h-14 flex items-center px-3 gap-2 bg-surface/90 backdrop-blur-md border-b border-border">
      <img src="/logos/vyra-logo-mark.png" alt="VYRA" className="w-7 h-7 object-contain flex-shrink-0" />
      <span className="font-bold text-sm text-text-1 flex-1 truncate">VYRA</span>
      
      <button
        onClick={onSearchOpen}
        aria-label="Search"
        className="w-9 h-9 flex items-center justify-center rounded-lg bg-surface-2 border border-border text-text-2 hover:text-text-1 transition-all"
      >
        <Search size={15} />
      </button>
      
      <Link
        to="/settings"
        aria-label="Settings"
        className="w-9 h-9 flex items-center justify-center rounded-lg bg-surface-2 border border-border text-text-2 hover:text-text-1 transition-all"
      >
        <Settings size={15} />
      </Link>
      
      <NotificationBell />
      
      <QuickCreate />
    </header>
  )
}
