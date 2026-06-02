import { create } from 'zustand'
import type { LibraryItem, LibraryFilters, LibraryTab } from '@/shared/types'
import { libraryService } from '../services/libraryService'

interface LibraryStore {
  items: LibraryItem[]
  loading: boolean
  activeTab: LibraryTab
  filters: LibraryFilters

  load: () => Promise<void>
  create: (data: Omit<LibraryItem, 'id' | 'createdAt' | 'updatedAt'>) => Promise<LibraryItem>
  update: (id: string, data: Partial<LibraryItem>) => Promise<void>
  toggleFavorite: (id: string) => Promise<void>
  remove: (id: string) => Promise<void>
  setTab: (tab: LibraryTab) => void
  setFilters: (filters: Partial<LibraryFilters>) => void
  clearFilters: () => void
}

export const useLibraryStore = create<LibraryStore>((set, get) => ({
  items: [],
  loading: false,
  activeTab: 'all',
  filters: { sortBy: 'updatedAt', sortDir: 'desc' },

  load: async () => {
    set({ loading: true })
    try {
      const items = await libraryService.getAll()
      set({ items, loading: false })
    } catch {
      set({ loading: false })
    }
  },

  create: async (data) => {
    const item = await libraryService.create(data)
    set(s => ({ items: [item, ...s.items] }))
    return item
  },

  update: async (id, data) => {
    const updated = await libraryService.update(id, data)
    set(s => ({ items: s.items.map(i => i.id === id ? updated : i) }))
  },

  toggleFavorite: async (id) => {
    const updated = await libraryService.toggleFavorite(id)
    set(s => ({ items: s.items.map(i => i.id === id ? updated : i) }))
  },

  remove: async (id) => {
    await libraryService.delete(id)
    set(s => ({ items: s.items.filter(i => i.id !== id) }))
  },

  setTab: (activeTab) => set({ activeTab }),
  setFilters: (filters) => set(s => ({ filters: { ...s.filters, ...filters } })),
  clearFilters: () => set({ filters: { sortBy: 'updatedAt', sortDir: 'desc' } }),
}))
