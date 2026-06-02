import { nanoid } from 'nanoid'
import { getDB, type Attachment } from '@/db/db'

export const attachmentService = {
  async saveAttachment(file: Blob, type: string): Promise<string> {
    const id = nanoid()
    const attachment: Attachment = {
      id,
      file,
      type,
      size: file.size,
      createdAt: new Date().toISOString()
    }
    
    const db = await getDB()
    await db.put('attachments', attachment)
    return id
  },

  async getAttachment(id: string): Promise<Attachment | undefined> {
    const db = await getDB()
    return db.get('attachments', id)
  },

  async deleteAttachment(id: string): Promise<void> {
    const db = await getDB()
    await db.delete('attachments', id)
  },
  
  isValidImage(file: File): boolean {
    const validTypes = ['image/png', 'image/jpeg', 'image/webp']
    return validTypes.includes(file.type)
  },

  isSizeValid(file: File, maxSizeMB: number = 5): boolean {
    return file.size <= maxSizeMB * 1024 * 1024
  }
}
