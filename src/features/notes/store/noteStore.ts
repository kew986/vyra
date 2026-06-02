import { create } from 'zustand'
import type { Note, NoteFilters } from '@/shared/types'
import { noteService } from '../services/noteService'

interface NoteStore {
  notes: Note[]
  loading: boolean
  selectedId: string | null
  filters: NoteFilters

  load: () => Promise<void>
  create: (data: Omit<Note, 'id' | 'createdAt' | 'updatedAt'>) => Promise<Note>
  update: (id: string, data: Partial<Note>) => Promise<void>
  togglePin: (id: string) => Promise<void>
  remove: (id: string) => Promise<void>
  setSelected: (id: string | null) => void
  setFilters: (filters: Partial<NoteFilters>) => void
  clearFilters: () => void
  getById: (id: string) => Note | undefined
}

export const useNoteStore = create<NoteStore>((set, get) => ({
  notes: [],
  loading: false,
  selectedId: null,
  filters: { sortBy: 'updatedAt', sortDir: 'desc' },

  load: async () => {
    set({ loading: true })
    try {
      const notes = await noteService.getAll()
      set({ notes, loading: false })
    } catch {
      set({ loading: false })
    }
  },

  create: async (data) => {
    const note = await noteService.create(data)
    set(s => ({ notes: [note, ...s.notes], selectedId: note.id }))
    return note
  },

  update: async (id, data) => {
    const updated = await noteService.update(id, data)
    set(s => ({ notes: s.notes.map(n => n.id === id ? updated : n) }))
  },

  togglePin: async (id) => {
    const updated = await noteService.togglePin(id)
    set(s => ({ notes: s.notes.map(n => n.id === id ? updated : n) }))
  },

  remove: async (id) => {
    await noteService.delete(id)
    set(s => ({
      notes: s.notes.filter(n => n.id !== id),
      selectedId: s.selectedId === id ? null : s.selectedId,
    }))
  },

  setSelected: (selectedId) => set({ selectedId }),
  setFilters: (filters) => set(s => ({ filters: { ...s.filters, ...filters } })),
  clearFilters: () => set({ filters: { sortBy: 'updatedAt', sortDir: 'desc' } }),
  getById: (id) => get().notes.find(n => n.id === id),
}))
