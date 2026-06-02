// ─── Core Entity Types ────────────────────────────────────────

export type ProjectStatus = 'planning' | 'active' | 'review' | 'completed' | 'archived'

export interface MoodboardNode {
  id: string
  type: 'image' | 'text' | 'color'
  x: number
  y: number
  width: number
  height: number
  content: string // URL for image, text for text, hex code for color
  zIndex: number
}

export interface Project {
  id: string
  name: string
  description?: string
  status: ProjectStatus
  color: string
  icon?: string       // Lucide icon name
  coverImage?: string // base64, max 2MB
  startDate?: string  // ISO date
  dueDate?: string
  tags: string[]
  moodboardNodes?: MoodboardNode[]
  createdAt: string
  updatedAt: string
}

export type TaskStatus = 'backlog' | 'todo' | 'in_progress' | 'review' | 'done'
export type TaskPriority = 'low' | 'medium' | 'high' | 'critical'

export interface TaskReminder {
  id: string
  triggerAt: string // ISO date string of when to trigger
  notified: boolean
}

export interface Task {
  id: string
  projectId: string
  title: string
  description?: string
  status: TaskStatus
  priority: TaskPriority
  dueDate?: string
  reminders?: TaskReminder[]
  timeSpent?: number // Time spent in seconds
  order: number
  tags: string[]
  createdAt: string
  updatedAt: string
}

export type LibraryItemType = 'inspiration' | 'component' | 'prompt'

export interface LibraryItem {
  id: string
  type: LibraryItemType
  title: string
  description?: string
  content?: string    // code snippet / prompt text
  url?: string        // external link for inspiration
  imageUrl?: string   // base64 thumbnail
  projectId?: string
  tags: string[]
  isFavorite: boolean
  createdAt: string
  updatedAt: string
}

export type NoteType = 'requirement' | 'meeting' | 'feedback' | 'idea' | 'revision' | 'general' | 'journal'

export interface Note {
  id: string
  projectId?: string
  title: string
  content: string     // HTML string from Tiptap
  type: NoteType
  tags: string[]
  isPinned: boolean
  createdAt: string
  updatedAt: string
}

export interface PairedDevice {
  id: string
  name: string
  lastSyncAt: string
}

export interface Settings {
  id: 'app_settings'
  deviceId?: string // Unique ID for this device
  theme: 'dark' | 'light' | 'system'
  accentColor: string
  sidebarCollapsed: boolean
  defaultProjectView: 'gallery' | 'table' | 'board' | 'list'
  defaultTaskView: 'board' | 'list'
  recentSearches: string[]
  pairedDevices?: PairedDevice[]
  lastOpenedEntity?: {
    type: 'project' | 'task' | 'library' | 'note'
    id: string
    title: string
    url: string
  }
  appLock?: {
    enabled: boolean
    hashedPin?: string
    autoLockTimeout: number // in minutes
  }
  hasCompletedOnboarding?: boolean
  onboardingCompletedAt?: string
  lastTutorialStep?: number
  documentationViewedAt?: string
  updatedAt: string
}

// ─── Notifications ──────────────────────────────────────────────

export type NotificationType = 'task_due' | 'project_due' | 'task_reminder' | 'system'

export interface AppNotification {
  id: string
  type: NotificationType
  title: string
  message: string
  entityId?: string
  entityType?: 'task' | 'project'
  read: boolean
  createdAt: string
}

// ─── View & Filter Types ──────────────────────────────────────

export type ProjectView = 'gallery' | 'table' | 'board' | 'list'
export type TaskView = 'board' | 'list'
export type LibraryTab = 'all' | 'inspiration' | 'component' | 'prompt'

export interface ProjectFilters {
  status?: ProjectStatus
  search?: string
  tags?: string[]
  sortBy?: 'name' | 'updatedAt' | 'createdAt' | 'dueDate'
  sortDir?: 'asc' | 'desc'
}

export interface TaskFilters {
  projectId?: string
  status?: TaskStatus
  priority?: TaskPriority
  search?: string
  tags?: string[]
  sortBy?: 'order' | 'priority' | 'dueDate' | 'createdAt'
  sortDir?: 'asc' | 'desc'
}

export interface LibraryFilters {
  type?: LibraryItemType
  projectId?: string
  search?: string
  tags?: string[]
  favoritesOnly?: boolean
  sortBy?: 'updatedAt' | 'createdAt' | 'title'
  sortDir?: 'asc' | 'desc'
}

export interface NoteFilters {
  projectId?: string
  type?: NoteType
  search?: string
  tags?: string[]
  pinnedOnly?: boolean
  sortBy?: 'updatedAt' | 'createdAt' | 'title'
  sortDir?: 'asc' | 'desc'
}

// ─── Search Types ─────────────────────────────────────────────

export type SearchEntityType = 'project' | 'task' | 'library' | 'note'

export interface SearchResult {
  type: SearchEntityType
  id: string
  title: string
  subtitle?: string
  url: string
}

// ─── UI Types ─────────────────────────────────────────────────

export type ButtonVariant = 'primary' | 'secondary' | 'ghost' | 'danger' | 'outline'
export type ButtonSize = 'sm' | 'md' | 'lg'
export type BadgeVariant = 'default' | 'primary' | 'success' | 'warning' | 'danger' | 'info'

// ─── Progress ─────────────────────────────────────────────────

export interface ProjectProgress {
  total: number
  done: number
  percentage: number
  health: 'on-track' | 'at-risk' | 'overdue' | 'not-started'
}
