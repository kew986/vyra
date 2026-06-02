import { create } from 'zustand'
import type { AppNotification } from '@/shared/types'
import { getDB } from '@/db/db'
import { now } from '@/shared/utils/date'
import { nanoid } from 'nanoid'

interface NotificationStore {
  notifications: AppNotification[]
  unreadCount: number
  load: () => Promise<void>
  addNotification: (notif: Omit<AppNotification, 'id' | 'createdAt' | 'read'>) => Promise<void>
  markAsRead: (id: string) => Promise<void>
  markAllAsRead: () => Promise<void>
  clearAll: () => Promise<void>
}

export const useNotificationStore = create<NotificationStore>((set, get) => ({
  notifications: [],
  unreadCount: 0,
  
  load: async () => {
    const db = await getDB()
    const all = await db.getAllFromIndex('notifications', 'by-createdAt')
    // Reverse to show newest first
    const sorted = all.reverse()
    set({
      notifications: sorted,
      unreadCount: sorted.filter(n => !n.read).length
    })
  },

  addNotification: async (data) => {
    const notif: AppNotification = {
      ...data,
      id: nanoid(),
      createdAt: now(),
      read: false
    }
    const db = await getDB()
    await db.put('notifications', notif)
    
    set(state => {
      const newNotifs = [notif, ...state.notifications]
      return {
        notifications: newNotifs,
        unreadCount: state.unreadCount + 1
      }
    })
  },

  markAsRead: async (id) => {
    const db = await getDB()
    const notif = await db.get('notifications', id)
    if (notif && !notif.read) {
      notif.read = true
      await db.put('notifications', notif)
      set(state => ({
        notifications: state.notifications.map(n => n.id === id ? { ...n, read: true } : n),
        unreadCount: Math.max(0, state.unreadCount - 1)
      }))
    }
  },

  markAllAsRead: async () => {
    const db = await getDB()
    const tx = db.transaction('notifications', 'readwrite')
    const store = tx.objectStore('notifications')
    const all = await store.getAll()
    for (const notif of all) {
      if (!notif.read) {
        notif.read = true
        await store.put(notif)
      }
    }
    await tx.done
    set(state => ({
      notifications: state.notifications.map(n => ({ ...n, read: true })),
      unreadCount: 0
    }))
  },

  clearAll: async () => {
    const db = await getDB()
    await db.clear('notifications')
    set({ notifications: [], unreadCount: 0 })
  }
}))
