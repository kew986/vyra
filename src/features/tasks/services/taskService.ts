import { getDB } from '@/db/db'
import type { Task } from '@/shared/types'
import { generateId } from '@/shared/utils/id'
import { now } from '@/shared/utils/date'

export const taskService = {
  async getAll(): Promise<Task[]> {
    const db = await getDB()
    return db.getAll('tasks')
  },

  async getByProject(projectId: string): Promise<Task[]> {
    const db = await getDB()
    const all = await db.getAllFromIndex('tasks', 'by-projectId', projectId)
    return all.sort((a, b) => a.order - b.order)
  },

  async getById(id: string): Promise<Task | undefined> {
    const db = await getDB()
    return db.get('tasks', id)
  },

  async create(data: Omit<Task, 'id' | 'createdAt' | 'updatedAt'>): Promise<Task> {
    const db = await getDB()
    const task: Task = {
      ...data,
      id: generateId(),
      createdAt: now(),
      updatedAt: now(),
    }
    await db.put('tasks', task)
    return task
  },

  async update(id: string, data: Partial<Omit<Task, 'id' | 'createdAt'>>): Promise<Task> {
    const db = await getDB()
    const existing = await db.get('tasks', id)
    if (!existing) throw new Error(`Task ${id} not found`)
    const updated: Task = { ...existing, ...data, id, updatedAt: now() }
    await db.put('tasks', updated)
    return updated
  },

  async delete(id: string): Promise<void> {
    const db = await getDB()
    await db.delete('tasks', id)
  },

  async deleteByProject(projectId: string): Promise<void> {
    const tasks = await this.getByProject(projectId)
    const db = await getDB()
    await Promise.all(tasks.map(t => db.delete('tasks', t.id)))
  },

  async reorder(taskId: string, newOrder: number): Promise<void> {
    const db = await getDB()
    const task = await db.get('tasks', taskId)
    if (task) await db.put('tasks', { ...task, order: newOrder, updatedAt: now() })
  },

  async getMaxOrder(projectId: string, status: Task['status']): Promise<number> {
    const tasks = await this.getByProject(projectId)
    const inStatus = tasks.filter(t => t.status === status)
    return inStatus.length === 0 ? 0 : Math.max(...inStatus.map(t => t.order)) + 1
  },
}
