import { getDB } from '@/db/db'
import type { Project } from '@/shared/types'
import { generateId } from '@/shared/utils/id'
import { now } from '@/shared/utils/date'

export const projectService = {
  async getAll(): Promise<Project[]> {
    const db = await getDB()
    const all = await db.getAll('projects')
    return all.sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime())
  },

  async getById(id: string): Promise<Project | undefined> {
    const db = await getDB()
    return db.get('projects', id)
  },

  async create(data: Omit<Project, 'id' | 'createdAt' | 'updatedAt'>): Promise<Project> {
    const db = await getDB()
    const project: Project = {
      ...data,
      id: generateId(),
      createdAt: now(),
      updatedAt: now(),
    }
    await db.put('projects', project)
    return project
  },

  async update(id: string, data: Partial<Omit<Project, 'id' | 'createdAt'>>): Promise<Project> {
    const db = await getDB()
    const existing = await db.get('projects', id)
    if (!existing) throw new Error(`Project ${id} not found`)
    const updated: Project = { ...existing, ...data, id, updatedAt: now() }
    await db.put('projects', updated)
    return updated
  },

  async delete(id: string): Promise<void> {
    const db = await getDB()
    await db.delete('projects', id)
  },
}
