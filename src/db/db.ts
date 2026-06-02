import { openDB, type IDBPDatabase } from 'idb'
import type { Project, Task, LibraryItem, Note, Settings } from '@/shared/types'

const DB_NAME = 'designhub'
const DB_VERSION = 3

export interface Attachment {
  id: string
  file: Blob
  type: string
  size: number
  createdAt: string
}

export interface DesignHubDB {
  projects: {
    key: string
    value: Project
    indexes: { 'by-status': string; 'by-updatedAt': string; 'by-createdAt': string }
  }
  tasks: {
    key: string
    value: Task
    indexes: { 'by-projectId': string; 'by-status': string; 'by-priority': string; 'by-order': number }
  }
  libraryItems: {
    key: string
    value: LibraryItem
    indexes: { 'by-type': string; 'by-projectId': string; 'by-isFavorite': number; 'by-updatedAt': string }
  }
  notes: {
    key: string
    value: Note
    indexes: { 'by-projectId': string; 'by-type': string; 'by-isPinned': number; 'by-updatedAt': string }
  }
  settings: {
    key: string
    value: Settings
  }
  attachments: {
    key: string
    value: Attachment
  }
  notifications: {
    key: string
    value: any // AppNotification
    indexes: { 'by-read': number; 'by-createdAt': string }
  }
}

let dbPromise: Promise<IDBPDatabase<DesignHubDB>> | null = null

export function getDB(): Promise<IDBPDatabase<DesignHubDB>> {
  if (!dbPromise) {
    dbPromise = openDB<DesignHubDB>(DB_NAME, DB_VERSION, {
      upgrade(db) {
        // Projects
        if (!db.objectStoreNames.contains('projects')) {
          const projectStore = db.createObjectStore('projects', { keyPath: 'id' })
          projectStore.createIndex('by-status', 'status')
          projectStore.createIndex('by-updatedAt', 'updatedAt')
          projectStore.createIndex('by-createdAt', 'createdAt')
        }

        // Tasks
        if (!db.objectStoreNames.contains('tasks')) {
          const taskStore = db.createObjectStore('tasks', { keyPath: 'id' })
          taskStore.createIndex('by-projectId', 'projectId')
          taskStore.createIndex('by-status', 'status')
          taskStore.createIndex('by-priority', 'priority')
          taskStore.createIndex('by-order', 'order')
        }

        // Library Items
        if (!db.objectStoreNames.contains('libraryItems')) {
          const libStore = db.createObjectStore('libraryItems', { keyPath: 'id' })
          libStore.createIndex('by-type', 'type')
          libStore.createIndex('by-projectId', 'projectId')
          libStore.createIndex('by-isFavorite', 'isFavorite')
          libStore.createIndex('by-updatedAt', 'updatedAt')
        }

        // Notes
        if (!db.objectStoreNames.contains('notes')) {
          const noteStore = db.createObjectStore('notes', { keyPath: 'id' })
          noteStore.createIndex('by-projectId', 'projectId')
          noteStore.createIndex('by-type', 'type')
          noteStore.createIndex('by-isPinned', 'isPinned')
          noteStore.createIndex('by-updatedAt', 'updatedAt')
        }

        // Settings
        if (!db.objectStoreNames.contains('settings')) {
          db.createObjectStore('settings', { keyPath: 'id' })
        }

        // Attachments
        if (!db.objectStoreNames.contains('attachments')) {
          db.createObjectStore('attachments', { keyPath: 'id' })
        }

        // Notifications
        if (!db.objectStoreNames.contains('notifications')) {
          const notifStore = db.createObjectStore('notifications', { keyPath: 'id' })
          notifStore.createIndex('by-read', 'read')
          notifStore.createIndex('by-createdAt', 'createdAt')
        }
      },
    })
  }
  return dbPromise
}

export async function clearAllStores(): Promise<void> {
  const db = await getDB()
  const tx = db.transaction(['projects', 'tasks', 'libraryItems', 'notes', 'settings', 'attachments', 'notifications'], 'readwrite')
  await Promise.all([
    tx.objectStore('projects').clear(),
    tx.objectStore('tasks').clear(),
    tx.objectStore('libraryItems').clear(),
    tx.objectStore('notes').clear(),
    tx.objectStore('settings').clear(),
    tx.objectStore('attachments').clear(),
    tx.objectStore('notifications').clear(),
  ])
  await tx.done
}

export async function importBackupData(data: {
  projects?: Project[]
  tasks?: Task[]
  libraryItems?: LibraryItem[]
  notes?: Note[]
  settings?: Settings
}): Promise<void> {
  const db = await getDB()
  const tx = db.transaction(['projects', 'tasks', 'libraryItems', 'notes', 'settings'], 'readwrite')
  
  if (data.projects) {
    const store = tx.objectStore('projects')
    await store.clear()
    for (const p of data.projects) {
      await store.put(p)
    }
  }

  if (data.tasks) {
    const store = tx.objectStore('tasks')
    await store.clear()
    for (const t of data.tasks) {
      await store.put(t)
    }
  }

  if (data.libraryItems) {
    // Note: IndexedDB store name is 'libraryItems' but shared type uses 'library' in backup
    const store = tx.objectStore('libraryItems')
    await store.clear()
    for (const l of data.libraryItems) {
      await store.put(l)
    }
  }

  if (data.notes) {
    const store = tx.objectStore('notes')
    await store.clear()
    for (const n of data.notes) {
      await store.put(n)
    }
  }

  if (data.settings) {
    const store = tx.objectStore('settings')
    await store.clear()
    await store.put(data.settings)
  }

  await tx.done
}

