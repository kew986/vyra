import Peer, { DataConnection } from 'peerjs'
import { getDB, type Attachment } from '@/db/db'
import type { Project, Task, LibraryItem, Note, Settings } from '@/shared/types'

export type SyncPayload = {
  projects: Project[]
  tasks: Task[]
  libraryItems: LibraryItem[]
  notes: Note[]
  settings: Settings[]
  attachments: Attachment[]
  sourceDeviceId?: string
}

export const syncService = {
  peer: null as Peer | null,
  connection: null as DataConnection | null,

  // Start hosting using the device's permanent ID
  async host(
    id: string, 
    onConnection: (clientPeerId: string) => void, 
    onData: (data: SyncPayload) => void, 
    onClose: () => void
  ): Promise<string> {
    this.cleanup()
    
    return new Promise((resolve, reject) => {
      this.peer = new Peer(id)
      
      this.peer.on('open', (peerId) => {
        resolve(peerId)
      })

      this.peer.on('error', (err) => {
        // If ID is taken, just resolve with it anyway (meaning we already have a background instance running maybe, but let's reject to be safe)
        reject(err)
      })

      this.peer.on('connection', (conn) => {
        // We accept the new connection, closing the old one if it exists
        if (this.connection) {
          this.connection.close()
        }
        
        this.connection = conn
        
        conn.on('open', () => {
          onConnection(conn.peer)
        })

        conn.on('data', (data) => {
          onData(data as SyncPayload)
        })

        conn.on('close', () => {
          this.connection = null
          onClose()
        })
      })
    })
  },

  // Connect to a host using our device ID as the client ID
  async connect(
    hostId: string, 
    clientId: string,
    onConnection: (hostPeerId: string) => void, 
    onData: (data: SyncPayload) => void, 
    onClose: () => void
  ): Promise<void> {
    this.cleanup()
    
    return new Promise((resolve, reject) => {
      this.peer = new Peer(clientId) 
      
      this.peer.on('open', () => {
        if (!this.peer) return reject(new Error('Peer not initialized'))
        
        const conn = this.peer.connect(hostId, { reliable: true })
        this.connection = conn

        conn.on('open', () => {
          onConnection(conn.peer)
          resolve()
        })

        conn.on('data', (data) => {
          onData(data as SyncPayload)
        })

        conn.on('close', () => {
          this.connection = null
          onClose()
        })

        conn.on('error', (err) => {
          reject(err)
        })
      })

      this.peer.on('error', (err) => {
        reject(err)
      })
    })
  },

  async sendData(sourceDeviceId?: string) {
    if (!this.connection) throw new Error('Not connected')
    
    const db = await getDB()
    const payload: SyncPayload = {
      projects: await db.getAll('projects'),
      tasks: await db.getAll('tasks'),
      libraryItems: await db.getAll('libraryItems'),
      notes: await db.getAll('notes'),
      settings: [], // Do not sync settings to prevent deviceId conflicts
      attachments: [], // Do not sync attachments to prevent WebRTC payload limit hangs
      sourceDeviceId
    }

    if (this.connection) {
      this.connection.send(payload)
    } else {
      console.warn('Sync connection was lost before data could be sent')
    }
  },

  async mergeIncomingData(incoming: SyncPayload): Promise<boolean> {
    const db = await getDB()
    const tx = db.transaction(['projects', 'tasks', 'libraryItems', 'notes'], 'readwrite')
    let hasChanges = false
    
    // Helper to merge tables based on updatedAt/createdAt
    const mergeTable = async (storeName: any, incomingItems: any[], timeKey: 'updatedAt' | 'createdAt') => {
      if (!incomingItems || incomingItems.length === 0) return
      
      const store = tx.objectStore(storeName)
      const allLocal = await store.getAll()
      const localMap = new Map(allLocal.map(i => [i.id, i]))
      const puts: Promise<any>[] = []

      for (const item of incomingItems) {
        const local = localMap.get(item.id)
        if (!local) {
          puts.push(store.put(item))
        } else {
          // Compare dates
          const localTime = new Date(local[timeKey] || 0).getTime()
          const remoteTime = new Date(item[timeKey] || 0).getTime()
          if (remoteTime > localTime) {
            puts.push(store.put(item))
          }
        }
      }

      if (puts.length > 0) {
        hasChanges = true
        await Promise.all(puts)
      }
    }

    await mergeTable('projects', incoming.projects || [], 'updatedAt')
    await mergeTable('tasks', incoming.tasks || [], 'updatedAt')
    await mergeTable('libraryItems', incoming.libraryItems || [], 'updatedAt')
    await mergeTable('notes', incoming.notes || [], 'updatedAt')

    await tx.done
    return hasChanges
  },

  cleanup() {
    if (this.connection) {
      this.connection.close()
      this.connection = null
    }
    if (this.peer) {
      this.peer.destroy()
      this.peer = null
    }
  }
}
