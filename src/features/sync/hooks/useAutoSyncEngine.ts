import { useEffect, useRef } from 'react'
import { syncService } from '../services/syncService'
import { useSettingsStore } from '@/features/settings/store/settingsStore'
import { useProjectStore } from '@/features/projects/store/projectStore'
import { useTaskStore } from '@/features/tasks/store/taskStore'
import { useLibraryStore } from '@/features/library/store/libraryStore'
import { useNoteStore } from '@/features/notes/store/noteStore'

export function useAutoSyncEngine() {
  const { settings } = useSettingsStore()
  const projects = useProjectStore(s => s.projects)
  const tasks = useTaskStore(s => s.tasks)
  const library = useLibraryStore(s => s.items)
  const notes = useNoteStore(s => s.notes)

  const isConnecting = useRef(false)
  const isIncoming = useRef(false)

  useEffect(() => {
    if (!settings.deviceId) return

    // 1. Host silently to accept incoming auto-syncs
    syncService.host(
      settings.deviceId,
      (clientPeerId) => {
        // connected
      },
      async (incoming) => {
        if (incoming.sourceDeviceId === settings.deviceId) return
        isIncoming.current = true // lock outgoing sync
        const hasChanges = await syncService.mergeIncomingData(incoming)
        if (hasChanges) {
          useProjectStore.getState().load()
          useTaskStore.getState().load()
          useLibraryStore.getState().load()
          useNoteStore.getState().load()
        }
        setTimeout(() => { isIncoming.current = false }, 2000)
      },
      () => {}
    ).catch(() => {})

    // 2. Try to connect to paired devices silently
    const connectToPaired = async () => {
      if (isConnecting.current || syncService.connection || !settings.pairedDevices?.length) return
      isConnecting.current = true
      
      for (const target of settings.pairedDevices) {
        if (syncService.connection) break
        try {
          await syncService.connect(
            target.id,
            settings.deviceId + '-client',
            () => {
               // connected
               syncService.sendData(settings.deviceId).catch(() => {})
            },
            async (incoming) => {
               if (incoming.sourceDeviceId === settings.deviceId) return
               isIncoming.current = true
               const hasChanges = await syncService.mergeIncomingData(incoming)
               if (hasChanges) {
                 useProjectStore.getState().load()
                 useTaskStore.getState().load()
                 useLibraryStore.getState().load()
                 useNoteStore.getState().load()
               }
               setTimeout(() => { isIncoming.current = false }, 2000)
            },
            () => {}
          )
        } catch (e) {
          // ignore offline
        }
      }
      isConnecting.current = false
    }

    const interval = setInterval(connectToPaired, 10000)
    connectToPaired()

    return () => {
      clearInterval(interval)
      syncService.cleanup()
    }
  }, [settings.deviceId, settings.pairedDevices])

  // Broadcast local changes to connected peers
  useEffect(() => {
    if (isIncoming.current || !syncService.connection) return
    const timer = setTimeout(() => {
      syncService.sendData(settings.deviceId).catch(() => {})
    }, 1500)
    return () => clearTimeout(timer)
  }, [projects, tasks, library, notes, settings.deviceId])
}
