import { useState, useRef, useEffect } from 'react'
import { Bell, Check, Trash2, CalendarClock, FolderKanban, AlertCircle, Info } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { useNotificationStore } from '../store/notificationStore'
import { cn } from '@/shared/utils/cn'

export function NotificationBell() {
  const [isOpen, setIsOpen] = useState(false)
  const dropdownRef = useRef<HTMLDivElement>(null)
  const navigate = useNavigate()
  
  const notifications = useNotificationStore(s => s.notifications)
  const unreadCount = useNotificationStore(s => s.unreadCount)
  const markAsRead = useNotificationStore(s => s.markAsRead)
  const markAllAsRead = useNotificationStore(s => s.markAllAsRead)
  const clearAll = useNotificationStore(s => s.clearAll)

  // Close dropdown on outside click
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setIsOpen(false)
      }
    }
    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside)
    }
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [isOpen])

  const handleNotifClick = (notif: any) => {
    markAsRead(notif.id)
    setIsOpen(false)
    if (notif.entityType === 'project' && notif.entityId) {
      navigate(`/projects/${notif.entityId}`)
    } else if (notif.entityType === 'task') {
      navigate(`/tasks`)
    }
  }

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        aria-label="Notifications"
        className={cn(
          "relative w-9 h-9 flex items-center justify-center rounded-lg border transition-all ml-2",
          isOpen 
            ? "bg-surface-3 border-border-2 text-text-1" 
            : "bg-surface-2 border-border text-text-2 hover:text-text-1 hover:border-primary/50 hover:text-primary"
        )}
      >
        <Bell size={15} />
        {unreadCount > 0 && (
          <span className="absolute -top-1 -right-1 flex items-center justify-center min-w-[18px] h-[18px] bg-danger text-white text-[10px] font-bold rounded-full px-1 border border-surface shadow-sm">
            {unreadCount > 99 ? '99+' : unreadCount}
          </span>
        )}
      </button>

      {isOpen && (
        <div className="fixed left-4 right-4 top-16 sm:absolute sm:inset-auto sm:right-0 sm:top-full sm:mt-2 sm:w-80 max-h-[400px] bg-surface border border-border rounded-xl shadow-[0_8px_30px_rgb(0,0,0,0.4)] flex flex-col z-50 overflow-hidden animate-fade-in-up">
          {/* Header */}
          <div className="flex items-center justify-between p-3 border-b border-border bg-surface-2/50">
            <h3 className="font-semibold text-sm text-text-1">Notifications</h3>
            <div className="flex items-center gap-2">
              {unreadCount > 0 && (
                <button
                  onClick={() => markAllAsRead()}
                  className="text-xs text-primary hover:text-primary-hover font-medium flex items-center gap-1"
                  title="Mark all as read"
                >
                  <Check size={12} /> Mark all read
                </button>
              )}
              {notifications.length > 0 && (
                <button
                  onClick={() => clearAll()}
                  className="text-text-3 hover:text-danger p-1 rounded transition-colors"
                  title="Clear all history"
                >
                  <Trash2 size={13} />
                </button>
              )}
            </div>
          </div>

          {/* List */}
          <div className="flex-1 overflow-y-auto no-scrollbar">
            {notifications.length === 0 ? (
              <div className="flex flex-col items-center justify-center p-8 text-center text-text-3">
                <Bell size={24} className="mb-2 opacity-20" />
                <p className="text-sm">You're all caught up!</p>
              </div>
            ) : (
              <div className="flex flex-col">
                {notifications.map(n => {
                  let Icon = Info
                  let colorClass = 'text-primary bg-primary/10'
                  
                  if (n.type === 'task_due') {
                    Icon = AlertCircle
                    colorClass = n.title.includes('Overdue') ? 'text-danger bg-danger/10' : 'text-warning bg-warning/10'
                  } else if (n.type === 'project_due') {
                    Icon = FolderKanban
                    colorClass = n.title.includes('Overdue') ? 'text-danger bg-danger/10' : 'text-warning bg-warning/10'
                  } else if (n.type === 'task_reminder') {
                    Icon = CalendarClock
                    colorClass = 'text-accent bg-accent/10'
                  }

                  return (
                    <button
                      key={n.id}
                      onClick={() => handleNotifClick(n)}
                      className={cn(
                        "w-full text-left p-3 border-b border-border/50 flex items-start gap-3 transition-colors",
                        n.read ? "bg-transparent hover:bg-surface-2" : "bg-primary/5 hover:bg-primary/10"
                      )}
                    >
                      <div className={cn("w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 mt-0.5", colorClass)}>
                        <Icon size={14} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between gap-2 mb-0.5">
                          <p className={cn("text-sm font-semibold truncate", n.read ? "text-text-2" : "text-text-1")}>
                            {n.title}
                          </p>
                          {!n.read && <span className="w-2 h-2 rounded-full bg-primary flex-shrink-0" />}
                        </div>
                        <p className={cn("text-xs line-clamp-2", n.read ? "text-text-3" : "text-text-2")}>
                          {n.message}
                        </p>
                        <p className="text-[10px] text-text-3 mt-1.5 font-medium">
                          {new Date(n.createdAt).toLocaleDateString()} at {new Date(n.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </p>
                      </div>
                    </button>
                  )
                })}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
