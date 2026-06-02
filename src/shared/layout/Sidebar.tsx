import { NavLink, useLocation } from 'react-router-dom'
import {
  LayoutDashboard, FolderKanban, CheckSquare,
  Library, FileText, Settings, ChevronLeft,
  ChevronRight, Zap, Calendar
} from 'lucide-react'
import { cn } from '@/shared/utils/cn'
import { useSettingsStore } from '@/features/settings/store/settingsStore'

const NAV_ITEMS = [
  { to: '/', icon: LayoutDashboard, label: 'Dashboard', end: true },
  { to: '/projects', icon: FolderKanban, label: 'Projects' },
  { to: '/tasks', icon: CheckSquare, label: 'Tasks' },
  { to: '/calendar', icon: Calendar, label: 'Calendar' },
  { to: '/library', icon: Library, label: 'Library' },
  { to: '/notes', icon: FileText, label: 'Notes' },
]

export function Sidebar() {
  const collapsed = useSettingsStore(s => s.settings.sidebarCollapsed)
  const update = useSettingsStore(s => s.update)
  const location = useLocation()

  const toggle = () => update({ sidebarCollapsed: !collapsed })

  return (
    <aside
      className={cn(
        'hidden lg:flex flex-col fixed left-0 top-0 bottom-0 z-30',
        'bg-surface border-r border-border',
        'transition-all duration-200 ease-out',
        collapsed ? 'w-16' : 'w-60'
      )}
    >
      {/* Logo */}
      <div className={cn(
        'flex items-center h-14 border-b border-border flex-shrink-0',
        collapsed ? 'justify-center px-4' : 'px-5'
      )}>
        {collapsed ? (
          <img src="/logos/vyra-logo-mark.png" alt="VYRA" className="w-8 h-8 object-contain" />
        ) : (
          <img src="/logos/vyra-primary-logo.png" alt="VYRA" className="h-10 object-contain" />
        )}
      </div>

      {/* Navigation */}
      <nav className="flex-1 overflow-y-auto py-3 px-2 no-scrollbar">
        <ul className="flex flex-col gap-0.5" role="list">
          {NAV_ITEMS.map(({ to, icon: Icon, label, end }) => (
            <li key={to}>
              <NavLink
                to={to}
                end={end}
                className={({ isActive }) => cn(
                  'flex items-center rounded-lg transition-all duration-150 group relative',
                  collapsed ? 'justify-center h-10 w-10 mx-auto' : 'gap-3 px-3 h-9',
                  isActive
                    ? 'bg-primary/10 text-primary'
                    : 'text-text-2 hover:bg-surface-2 hover:text-text-1'
                )}
                title={collapsed ? label : undefined}
              >
                {({ isActive }) => (
                  <>
                    {isActive && !collapsed && (
                      <span className="absolute left-0 top-1/2 -translate-y-1/2 w-0.5 h-5 bg-primary rounded-r-full" />
                    )}
                    <Icon size={16} className="flex-shrink-0" />
                    {!collapsed && <span className="text-sm font-medium">{label}</span>}
                  </>
                )}
              </NavLink>
            </li>
          ))}
        </ul>
      </nav>

      {/* Bottom */}
      <div className="px-2 pb-3 border-t border-border pt-3 space-y-0.5">
        <NavLink
          to="/settings"
          className={({ isActive }) => cn(
            'flex items-center rounded-lg transition-all duration-150',
            collapsed ? 'justify-center h-10 w-10 mx-auto' : 'gap-3 px-3 h-9',
            isActive
              ? 'bg-primary/10 text-primary'
              : 'text-text-2 hover:bg-surface-2 hover:text-text-1'
          )}
          title={collapsed ? 'Settings' : undefined}
        >
          <Settings size={16} />
          {!collapsed && <span className="text-sm font-medium">Settings</span>}
        </NavLink>

        {/* Collapse toggle */}
        <button
          onClick={toggle}
          aria-label={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
          className={cn(
            'flex items-center rounded-lg transition-all duration-150 text-text-3 hover:text-text-1 hover:bg-surface-2 w-full',
            collapsed ? 'justify-center h-10 w-10 mx-auto' : 'gap-3 px-3 h-9'
          )}
        >
          {collapsed ? <ChevronRight size={14} /> : (
            <>
              <ChevronLeft size={14} />
              <span className="text-sm">Collapse</span>
            </>
          )}
        </button>
      </div>
    </aside>
  )
}
