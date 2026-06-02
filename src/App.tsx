import { useEffect } from 'react'
import { BrowserRouter, Routes, Route } from 'react-router-dom'
import { AppShell } from '@/shared/layout/AppShell'
import { useProjectStore } from '@/features/projects/store/projectStore'
import { useTaskStore } from '@/features/tasks/store/taskStore'
import { useLibraryStore } from '@/features/library/store/libraryStore'
import { useNoteStore } from '@/features/notes/store/noteStore'
import { useSettingsStore } from '@/features/settings/store/settingsStore'

// Pages (lazy-loaded for performance)
import { lazy, Suspense, useState, useRef } from 'react'
import { Spinner, ToastContainer } from '@/shared/ui'
import { LockScreen } from '@/features/security/LockScreen'
import { SplashScreen } from '@/features/splash/SplashScreen'
import { OnboardingModal } from '@/shared/components/OnboardingModal'

const DashboardPage = lazy(() => import('@/features/dashboard/DashboardPage'))
const ProjectsPage = lazy(() => import('@/features/projects/ProjectsPage'))
const ProjectDetailPage = lazy(() => import('@/features/projects/ProjectDetailPage'))
const TasksPage = lazy(() => import('@/features/tasks/TasksPage'))
const CalendarPage = lazy(() => import('@/features/calendar/CalendarPage'))
const LibraryPage = lazy(() => import('@/features/library/LibraryPage'))
const NotesPage = lazy(() => import('@/features/notes/NotesPage'))
const SettingsPage = lazy(() => import('@/features/settings/SettingsPage'))

function LoadingFallback() {
  return (
    <div className="flex items-center justify-center min-h-[400px]">
      <Spinner size={24} />
    </div>
  )
}

import { useNotificationEngine } from '@/features/notifications/hooks/useNotificationEngine'
import { useAutoSyncEngine } from '@/features/sync/hooks/useAutoSyncEngine'

function DataBootstrap({ children }: { children: React.ReactNode }) {
  const loadProjects = useProjectStore(s => s.load)
  const loadTasks = useTaskStore(s => s.load)
  const loadLibrary = useLibraryStore(s => s.load)
  const loadNotes = useNoteStore(s => s.load)
  const loadSettings = useSettingsStore(s => s.load)

  // Start background engines
  useNotificationEngine()
  useAutoSyncEngine()

  useEffect(() => {
    // Load all data from IndexedDB on app mount
    Promise.all([loadSettings(), loadProjects(), loadTasks(), loadLibrary(), loadNotes()])
  }, [])

  // Keyboard shortcut: ⌘K opens search (handled inside AppShell/GlobalSearch)
  return <>{children}</>
}

export default function App() {
  const settings = useSettingsStore(s => s.settings)
  const [isLocked, setIsLocked] = useState(false)
  const [showSplash, setShowSplash] = useState(true)
  const inactivityTimer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined)

  // Apply theme to DOM
  useEffect(() => {
    const root = document.documentElement
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)')
    
    const applyTheme = () => {
      // Apply Accent Color
      if (settings.accentColor) {
        root.style.setProperty('--color-primary', settings.accentColor)
      }

      if (settings.theme === 'dark') {
        root.classList.add('dark')
      } else if (settings.theme === 'light') {
        root.classList.remove('dark')
      } else {
        if (mediaQuery.matches) {
          root.classList.add('dark')
        } else {
          root.classList.remove('dark')
        }
      }
    }

    applyTheme()
    
    const listener = () => applyTheme()
    mediaQuery.addEventListener('change', listener)
    return () => mediaQuery.removeEventListener('change', listener)
  }, [settings.theme, settings.accentColor])

  // Initialize lock state based on settings
  useEffect(() => {
    if (settings.appLock?.enabled) {
      setIsLocked(true)
    }
  }, [settings.appLock?.enabled]) // Only run when lock setting is changed (or app mounts and loads settings)

  // Inactivity tracking
  useEffect(() => {
    if (!settings.appLock?.enabled || !settings.appLock.autoLockTimeout || isLocked) return

    const resetTimer = () => {
      clearTimeout(inactivityTimer.current)
      inactivityTimer.current = setTimeout(() => {
        setIsLocked(true)
      }, settings.appLock!.autoLockTimeout * 60 * 1000)
    }

    const events = ['mousedown', 'mousemove', 'keypress', 'scroll', 'touchstart']
    events.forEach(e => document.addEventListener(e, resetTimer))
    resetTimer()

    return () => {
      events.forEach(e => document.removeEventListener(e, resetTimer))
      clearTimeout(inactivityTimer.current)
    }
  }, [settings.appLock?.enabled, settings.appLock?.autoLockTimeout, isLocked])


  return (
    <BrowserRouter>
      {showSplash && <SplashScreen onComplete={() => setShowSplash(false)} />}
      <DataBootstrap>
        {isLocked && !showSplash && <LockScreen onUnlock={() => setIsLocked(false)} />}
        {!showSplash && (
          <Routes>
          <Route element={<AppShell />}>
            <Route path="/" element={<Suspense fallback={<LoadingFallback />}><DashboardPage /></Suspense>} />
            <Route path="/projects" element={<Suspense fallback={<LoadingFallback />}><ProjectsPage /></Suspense>} />
            <Route path="/projects/:id" element={<Suspense fallback={<LoadingFallback />}><ProjectDetailPage /></Suspense>} />
            <Route path="/tasks" element={<Suspense fallback={<LoadingFallback />}><TasksPage /></Suspense>} />
            <Route path="/calendar" element={<Suspense fallback={<LoadingFallback />}><CalendarPage /></Suspense>} />
            <Route path="/library" element={<Suspense fallback={<LoadingFallback />}><LibraryPage /></Suspense>} />
            <Route path="/notes" element={<Suspense fallback={<LoadingFallback />}><NotesPage /></Suspense>} />
            <Route path="/settings" element={<Suspense fallback={<LoadingFallback />}><SettingsPage /></Suspense>} />
          </Route>
          </Routes>
        )}
        <ToastContainer />
        <OnboardingModal />
      </DataBootstrap>
    </BrowserRouter>
  )
}
