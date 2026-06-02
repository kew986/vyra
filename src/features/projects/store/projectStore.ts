import { create } from 'zustand'
import type { Project, ProjectFilters, ProjectView } from '@/shared/types'
import { projectService } from '../services/projectService'

interface ProjectStore {
  projects: Project[]
  loading: boolean
  view: ProjectView
  filters: ProjectFilters
  selectedId: string | null

  // Actions
  load: () => Promise<void>
  create: (data: Omit<Project, 'id' | 'createdAt' | 'updatedAt'>) => Promise<Project>
  update: (id: string, data: Partial<Project>) => Promise<void>
  remove: (id: string) => Promise<void>
  setView: (view: ProjectView) => void
  setFilters: (filters: Partial<ProjectFilters>) => void
  clearFilters: () => void
  setSelected: (id: string | null) => void
  getById: (id: string) => Project | undefined
}

export const useProjectStore = create<ProjectStore>((set, get) => ({
  projects: [],
  loading: false,
  view: 'gallery',
  filters: { sortBy: 'updatedAt', sortDir: 'desc' },
  selectedId: null,

  load: async () => {
    set({ loading: true })
    try {
      const projects = await projectService.getAll()
      set({ projects, loading: false })
    } catch {
      set({ loading: false })
    }
  },

  create: async (data) => {
    const project = await projectService.create(data)
    set(s => ({ projects: [project, ...s.projects] }))
    return project
  },

  update: async (id, data) => {
    const updated = await projectService.update(id, data)
    set(s => ({ projects: s.projects.map(p => p.id === id ? updated : p) }))
  },

  remove: async (id) => {
    await projectService.delete(id)
    set(s => ({ projects: s.projects.filter(p => p.id !== id) }))
  },

  setView: (view) => set({ view }),

  setFilters: (filters) => set(s => ({ filters: { ...s.filters, ...filters } })),

  clearFilters: () => set({ filters: { sortBy: 'updatedAt', sortDir: 'desc' } }),

  setSelected: (selectedId) => set({ selectedId }),

  getById: (id) => get().projects.find(p => p.id === id),
}))
