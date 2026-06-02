import { create } from 'zustand'
import type { Task, TaskFilters, TaskView } from '@/shared/types'
import { taskService } from '../services/taskService'

interface TaskStore {
  tasks: Task[]
  loading: boolean
  view: TaskView
  filters: TaskFilters

  // Actions
  load: () => Promise<void>
  loadByProject: (projectId: string) => Promise<void>
  create: (data: Omit<Task, 'id' | 'createdAt' | 'updatedAt'>) => Promise<Task>
  update: (id: string, data: Partial<Task>) => Promise<void>
  remove: (id: string) => Promise<void>
  moveTask: (taskId: string, newStatus: Task['status'], newOrder: number) => Promise<void>
  setView: (view: TaskView) => void
  setFilters: (filters: Partial<TaskFilters>) => void
  clearFilters: () => void
  getByProject: (projectId: string) => Task[]
  getByStatus: (status: Task['status'], projectId?: string) => Task[]
}

export const useTaskStore = create<TaskStore>((set, get) => ({
  tasks: [],
  loading: false,
  view: 'board',
  filters: {},

  load: async () => {
    set({ loading: true })
    try {
      const tasks = await taskService.getAll()
      set({ tasks, loading: false })
    } catch {
      set({ loading: false })
    }
  },

  loadByProject: async (projectId) => {
    set({ loading: true })
    try {
      const tasks = await taskService.getByProject(projectId)
      set(s => ({
        tasks: [...s.tasks.filter(t => t.projectId !== projectId), ...tasks],
        loading: false,
      }))
    } catch {
      set({ loading: false })
    }
  },

  create: async (data) => {
    const task = await taskService.create(data)
    set(s => ({ tasks: [...s.tasks, task] }))
    return task
  },

  update: async (id, data) => {
    const updated = await taskService.update(id, data)
    set(s => ({ tasks: s.tasks.map(t => t.id === id ? updated : t) }))
  },

  remove: async (id) => {
    await taskService.delete(id)
    set(s => ({ tasks: s.tasks.filter(t => t.id !== id) }))
  },

  moveTask: async (taskId, newStatus, newOrder) => {
    await taskService.update(taskId, { status: newStatus, order: newOrder })
    set(s => ({
      tasks: s.tasks.map(t => t.id === taskId ? { ...t, status: newStatus, order: newOrder } : t),
    }))
  },

  setView: (view) => set({ view }),
  setFilters: (filters) => set(s => ({ filters: { ...s.filters, ...filters } })),
  clearFilters: () => set({ filters: {} }),
  getByProject: (projectId) => get().tasks.filter(t => t.projectId === projectId),
  getByStatus: (status, projectId) => {
    let tasks = get().tasks.filter(t => t.status === status)
    if (projectId) tasks = tasks.filter(t => t.projectId === projectId)
    return tasks.sort((a, b) => a.order - b.order)
  },
}))
