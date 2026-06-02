import { create } from 'zustand'
import type { Settings } from '@/shared/types'
import { getDB } from '@/db/db'
import { now } from '@/shared/utils/date'

const DEFAULT_SETTINGS: Settings = {
  id: 'app_settings',
  theme: 'dark',
  accentColor: '#5B8CFF',
  sidebarCollapsed: false,
  defaultProjectView: 'gallery',
  defaultTaskView: 'board',
  recentSearches: [],
  pairedDevices: [],
  hasCompletedOnboarding: false,
  updatedAt: new Date().toISOString(),
}

interface SettingsStore {
  settings: Settings
  load: () => Promise<void>
  update: (data: Partial<Omit<Settings, 'id'>>) => Promise<void>
  addRecentSearch: (term: string) => Promise<void>
  clearRecentSearches: () => Promise<void>
  setLastOpenedEntity: (entity: NonNullable<Settings['lastOpenedEntity']>) => Promise<void>
}

async function persistSettings(settings: Settings) {
  const db = await getDB()
  await db.put('settings', settings)
}

export const useSettingsStore = create<SettingsStore>((set, get) => ({
  settings: DEFAULT_SETTINGS,

  load: async () => {
    const db = await getDB()
    const stored = await db.get('settings', 'app_settings')
    if (stored) {
      // Ensure existing users get a device ID
      if (!stored.deviceId) {
        stored.deviceId = 'VYRA-' + Math.random().toString(36).substring(2, 9).toUpperCase()
        await db.put('settings', stored)
      }
      set({ settings: stored })
    }
    else {
      const initialSettings = {
        ...DEFAULT_SETTINGS,
        deviceId: 'VYRA-' + Math.random().toString(36).substring(2, 9).toUpperCase()
      }
      await db.put('settings', initialSettings)
      set({ settings: initialSettings })
    }
  },

  update: async (data) => {
    const updated: Settings = { ...get().settings, ...data, updatedAt: now() }
    set({ settings: updated })
    await persistSettings(updated)
  },

  addRecentSearch: async (term) => {
    const s = get().settings
    const trimmed = term.trim()
    if (!trimmed) return
    const searches = [trimmed, ...s.recentSearches.filter(r => r !== trimmed)].slice(0, 8)
    const updated: Settings = { ...s, recentSearches: searches, updatedAt: now() }
    set({ settings: updated })
    await persistSettings(updated)
  },

  clearRecentSearches: async () => {
    const updated: Settings = { ...get().settings, recentSearches: [], updatedAt: now() }
    set({ settings: updated })
    await persistSettings(updated)
  },

  setLastOpenedEntity: async (entity) => {
    const updated: Settings = { ...get().settings, lastOpenedEntity: entity, updatedAt: now() }
    set({ settings: updated })
    await persistSettings(updated)
  },
}))
