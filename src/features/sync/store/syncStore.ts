import { create } from 'zustand'
import { syncService } from '../services/syncService'
import { useProjectStore } from '@/features/projects/store/projectStore'
import { useTaskStore } from '@/features/tasks/store/taskStore'
import { useLibraryStore } from '@/features/library/store/libraryStore'
import { useNoteStore } from '@/features/notes/store/noteStore'
import { useSettingsStore } from '@/features/settings/store/settingsStore'

export type SyncStatus = 'idle' | 'hosting' | 'connecting' | 'connected' | 'syncing' | 'success' | 'error'

interface SyncStore {
  status: SyncStatus
  hostId: string | null
  error: string | null
  logs: string[]

  addLog: (msg: string) => void
  startHosting: () => Promise<void>
  connectToHost: (id: string) => Promise<void>
  sendData: () => Promise<void>
  stop: () => void
}

export const useSyncStore = create<SyncStore>((set, get) => ({
  status: 'idle',
  hostId: null,
  error: null,
  logs: [],

  addLog: (msg: string) => set((s) => ({ logs: [...s.logs, msg] })),

  startHosting: async () => {
    set({ status: 'hosting', error: null, logs: ['Generating Host ID...'] })
    try {
      const myDeviceId = useSettingsStore.getState().settings.deviceId!
      const id = await syncService.host(
        myDeviceId,
        (clientPeerId) => {
          set({ status: 'connected' })
          get().addLog(`Device connected: ${clientPeerId}. Sending database...`)
          
          const { settings, update } = useSettingsStore.getState()
          const existing = settings.pairedDevices?.find(d => d.id === clientPeerId)
          if (!existing) {
            update({
              pairedDevices: [
                ...(settings.pairedDevices || []),
                { id: clientPeerId, name: `Device ${clientPeerId.slice(0, 8)}`, lastSyncAt: new Date().toISOString() }
              ]
            })
          } else {
            update({
              pairedDevices: settings.pairedDevices!.map(d => d.id === clientPeerId ? { ...d, lastSyncAt: new Date().toISOString() } : d)
            })
          }

          get().sendData()
        },
        async (incoming) => {
          set({ status: 'syncing' })
          get().addLog('Receiving incoming sync data...')
          await syncService.mergeIncomingData(incoming)
          get().addLog('Database merged successfully.')
          
          set({ status: 'success' })
          
          // Refresh global stores
          useProjectStore.getState().load()
          useTaskStore.getState().load()
          useLibraryStore.getState().load()
          useNoteStore.getState().load()
        },
        () => {
          get().addLog('Connection closed.')
          get().stop()
        }
      )
      set({ hostId: id, status: 'hosting' })
      get().addLog(`Hosting started. Waiting for connection on ID: ${id}`)
    } catch (err: any) {
      set({ status: 'error', error: err.message })
    }
  },

  connectToHost: async (id: string) => {
    set({ status: 'connecting', error: null, logs: [`Connecting to ${id}...`] })
    try {
      const myDeviceId = useSettingsStore.getState().settings.deviceId!
      await syncService.connect(
        id,
        myDeviceId,
        (hostPeerId) => {
          set({ status: 'connected' })
          get().addLog(`Connected to host ${hostPeerId}. Waiting for host data...`)

          const { settings, update } = useSettingsStore.getState()
          const existing = settings.pairedDevices?.find(d => d.id === hostPeerId)
          if (!existing) {
            update({
              pairedDevices: [
                ...(settings.pairedDevices || []),
                { id: hostPeerId, name: `Host ${hostPeerId.slice(0, 8)}`, lastSyncAt: new Date().toISOString() }
              ]
            })
          } else {
            update({
              pairedDevices: settings.pairedDevices!.map(d => d.id === hostPeerId ? { ...d, lastSyncAt: new Date().toISOString() } : d)
            })
          }
        },
        async (incoming) => {
          set({ status: 'syncing' })
          get().addLog('Receiving host sync data...')
          await syncService.mergeIncomingData(incoming)
          get().addLog('Database merged. Sending local data to host...')
          
          await get().sendData()
          set({ status: 'success' })
          
          // Refresh global stores
          useProjectStore.getState().load()
          useTaskStore.getState().load()
          useLibraryStore.getState().load()
          useNoteStore.getState().load()
        },
        () => {
          get().addLog('Connection closed.')
          get().stop()
        }
      )
    } catch (err: any) {
      set({ status: 'error', error: err.message })
    }
  },

  sendData: async () => {
    try {
      get().addLog('Packaging database...')
      const myDeviceId = useSettingsStore.getState().settings.deviceId
      await syncService.sendData(myDeviceId)
      get().addLog('Data sent.')
    } catch (err: any) {
      get().addLog(`Error sending data: ${err.message}`)
    }
  },

  stop: () => {
    syncService.cleanup()
    set({ status: 'idle', hostId: null, logs: [] })
  }
}))
