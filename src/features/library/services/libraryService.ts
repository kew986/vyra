import { getDB } from '@/db/db'
import type { LibraryItem } from '@/shared/types'
import { generateId } from '@/shared/utils/id'
import { now } from '@/shared/utils/date'

export const libraryService = {
  async getAll(): Promise<LibraryItem[]> {
    const db = await getDB()
    const all = await db.getAll('libraryItems')
    return all.sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime())
  },

  async getById(id: string): Promise<LibraryItem | undefined> {
    const db = await getDB()
    return db.get('libraryItems', id)
  },

  async getByProject(projectId: string): Promise<LibraryItem[]> {
    const db = await getDB()
    return db.getAllFromIndex('libraryItems', 'by-projectId', projectId)
  },

  async create(data: Omit<LibraryItem, 'id' | 'createdAt' | 'updatedAt'>): Promise<LibraryItem> {
    const db = await getDB()
    const item: LibraryItem = {
      ...data,
      id: generateId(),
      createdAt: now(),
      updatedAt: now(),
    }
    await db.put('libraryItems', item)
    return item
  },

  async update(id: string, data: Partial<Omit<LibraryItem, 'id' | 'createdAt'>>): Promise<LibraryItem> {
    const db = await getDB()
    const existing = await db.get('libraryItems', id)
    if (!existing) throw new Error(`LibraryItem ${id} not found`)
    const updated: LibraryItem = { ...existing, ...data, id, updatedAt: now() }
    await db.put('libraryItems', updated)
    return updated
  },

  async toggleFavorite(id: string): Promise<LibraryItem> {
    const db = await getDB()
    const existing = await db.get('libraryItems', id)
    if (!existing) throw new Error(`LibraryItem ${id} not found`)
    const updated: LibraryItem = { ...existing, isFavorite: !existing.isFavorite, updatedAt: now() }
    await db.put('libraryItems', updated)
    return updated
  },

  async delete(id: string): Promise<void> {
    const db = await getDB()
    await db.delete('libraryItems', id)
  },
}
