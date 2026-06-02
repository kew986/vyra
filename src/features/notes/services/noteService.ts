import { getDB } from '@/db/db'
import type { Note } from '@/shared/types'
import { generateId } from '@/shared/utils/id'
import { now } from '@/shared/utils/date'

export const noteService = {
  async getAll(): Promise<Note[]> {
    const db = await getDB()
    const all = await db.getAll('notes')
    return all.sort((a, b) => {
      if (a.isPinned !== b.isPinned) return a.isPinned ? -1 : 1
      return new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()
    })
  },

  async getById(id: string): Promise<Note | undefined> {
    const db = await getDB()
    return db.get('notes', id)
  },

  async getByProject(projectId: string): Promise<Note[]> {
    const db = await getDB()
    return db.getAllFromIndex('notes', 'by-projectId', projectId)
  },

  async create(data: Omit<Note, 'id' | 'createdAt' | 'updatedAt'>): Promise<Note> {
    const db = await getDB()
    const note: Note = {
      ...data,
      id: generateId(),
      createdAt: now(),
      updatedAt: now(),
    }
    await db.put('notes', note)
    return note
  },

  async update(id: string, data: Partial<Omit<Note, 'id' | 'createdAt'>>): Promise<Note> {
    const db = await getDB()
    const existing = await db.get('notes', id)
    if (!existing) throw new Error(`Note ${id} not found`)
    const updated: Note = { ...existing, ...data, id, updatedAt: now() }
    await db.put('notes', updated)
    return updated
  },

  async togglePin(id: string): Promise<Note> {
    const db = await getDB()
    const existing = await db.get('notes', id)
    if (!existing) throw new Error(`Note ${id} not found`)
    const updated: Note = { ...existing, isPinned: !existing.isPinned, updatedAt: now() }
    await db.put('notes', updated)
    return updated
  },

  async delete(id: string): Promise<void> {
    const db = await getDB()
    await db.delete('notes', id)
  },
}
