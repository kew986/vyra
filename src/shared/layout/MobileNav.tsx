import { NavLink } from 'react-router-dom'
import { LayoutDashboard, FolderKanban, CheckSquare, Library, FileText } from 'lucide-react'
import { cn } from '@/shared/utils/cn'

const MOBILE_ITEMS = [
  { to: '/', icon: LayoutDashboard, label: 'Home', end: true },
  { to: '/projects', icon: FolderKanban, label: 'Projects' },
  { to: '/tasks', icon: CheckSquare, label: 'Tasks' },
  { to: '/library', icon: Library, label: 'Library' },
  { to: '/notes', icon: FileText, label: 'Notes' },
]

export function MobileNav() {
  return (
    <nav className="lg:hidden fixed bottom-0 left-0 right-0 z-30 bg-surface/90 backdrop-blur-md border-t border-border/60 safe-area-pb glass-border shadow-lg">
      <ul className="flex items-center justify-around h-16 px-2" role="list">
        {MOBILE_ITEMS.map(({ to, icon: Icon, label, end }) => (
          <li key={to} className="flex-1">
            <NavLink
              to={to}
              end={end}
              className={({ isActive }) => cn(
                'flex flex-col items-center gap-0.5 py-1 px-1 rounded-xl transition-all duration-200 w-full hover-magnetic',
                isActive ? 'text-primary' : 'text-text-3'
              )}
            >
              {({ isActive }) => (
                <>
                  <div className={cn(
                    'w-9 h-9 flex items-center justify-center rounded-xl transition-all duration-200 relative',
                    isActive ? 'bg-primary/10 text-primary scale-105' : 'text-text-3 hover:text-text-1'
                  )}>
                    <Icon size={19} />
                    {isActive && (
                      <span className="absolute bottom-0.5 w-1 h-1 rounded-full bg-primary" />
                    )}
                  </div>
                  <span className={cn(
                    "text-[10px] font-medium transition-all", 
                    isActive ? "font-semibold text-text-1" : "text-text-3"
                  )}>{label}</span>
                </>
              )}
            </NavLink>
          </li>
        ))}
      </ul>
    </nav>
  )
}
