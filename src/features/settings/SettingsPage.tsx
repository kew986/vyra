import { useState, useEffect, useRef } from 'react'
import { Download, Upload, Trash2, Moon, Sun, Monitor, Palette, Info, HardDrive, Lock, Shield, Smartphone } from 'lucide-react'
import { useSettingsStore } from './store/settingsStore'
import { HelpDocumentation } from './components/HelpDocumentation'
import { useProjectStore } from '@/features/projects/store/projectStore'
import { useTaskStore } from '@/features/tasks/store/taskStore'
import { useLibraryStore } from '@/features/library/store/libraryStore'
import { useNoteStore } from '@/features/notes/store/noteStore'
import { Button } from '@/shared/ui/Button'
import { Card, Toggle, toast } from '@/shared/ui'
import { Input } from '@/shared/ui/Input'
import { ConfirmDialog } from '@/shared/ui/Modal'
import { cn } from '@/shared/utils/cn'
import { PROJECT_COLORS } from '@/shared/utils/color'
import { hashPin } from '@/shared/utils/security'
import { encryptData, decryptData } from '@/shared/utils/encryption'
import { clearAllStores, importBackupData } from '@/db/db'
import { SyncModal } from '@/features/sync/components/SyncModal'

export default function SettingsPage() {
  const { settings, update } = useSettingsStore()
  const projects = useProjectStore(s => s.projects)
  const tasks = useTaskStore(s => s.tasks)
  const library = useLibraryStore(s => s.items)
  const notes = useNoteStore(s => s.notes)
  
  const loadProjects = useProjectStore(s => s.load)
  const loadTasks = useTaskStore(s => s.load)
  const loadLibrary = useLibraryStore(s => s.load)
  const loadNotes = useNoteStore(s => s.load)
  const loadSettings = useSettingsStore(s => s.load)

  const [showClearConfirm, setShowClearConfirm] = useState(false)
  const [storageSize, setStorageSize] = useState<{ usage: number; quota: number } | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const [pinInput, setPinInput] = useState('')
  const [pinConfirm, setPinConfirm] = useState('')
  const [showPinSetup, setShowPinSetup] = useState(false)
  const [showSyncModal, setShowSyncModal] = useState(false)

  // Query actual browser local storage estimate
  useEffect(() => {
    if (navigator.storage && navigator.storage.estimate) {
      navigator.storage.estimate().then(estimate => {
        setStorageSize({
          usage: estimate.usage || 0,
          quota: estimate.quota || 0,
        })
      })
    }
  }, [projects, tasks, library, notes])

  const handleExport = async () => {
    const password = window.prompt('Enter a password to encrypt your backup (leave blank for unencrypted):')
    if (password === null) return // cancelled

    const data = { projects, tasks, library, notes, settings, exportedAt: new Date().toISOString() }
    const jsonStr = JSON.stringify(data)
    
    let finalContent = jsonStr
    let fileName = `vyra-backup-${new Date().toISOString().slice(0, 10)}.json`
    
    if (password) {
      try {
        finalContent = await encryptData(jsonStr, password)
        // Wrap in JSON to signify it's encrypted
        finalContent = JSON.stringify({ encrypted: true, data: finalContent })
        fileName = `vyra-backup-encrypted-${new Date().toISOString().slice(0, 10)}.json`
      } catch (err) {
        toast.error('Failed to encrypt backup.')
        return
      }
    }

    const blob = new Blob([finalContent], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = fileName
    a.click()
    URL.revokeObjectURL(url)
  }

  const handleImport = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    const reader = new FileReader()
    reader.onload = async (event) => {
      try {
        const text = event.target?.result as string
        let parsed = JSON.parse(text)

        if (parsed && parsed.encrypted && parsed.data) {
          const password = window.prompt('This backup is encrypted. Enter password:')
          if (password === null) return
          try {
            const decryptedStr = await decryptData(parsed.data, password)
            parsed = JSON.parse(decryptedStr)
          } catch (err) {
            toast.error('Incorrect password or corrupt backup file.')
            return
          }
        }

        if (!parsed || typeof parsed !== 'object' || !parsed.projects) {
          toast.error('Invalid backup file format.')
          return
        }

        await importBackupData({
          projects: parsed.projects,
          tasks: parsed.tasks,
          libraryItems: parsed.library || parsed.libraryItems,
          notes: parsed.notes,
          settings: parsed.settings,
        })

        // Reload all stores
        await Promise.all([
          loadSettings(),
          loadProjects(),
          loadTasks(),
          loadLibrary(),
          loadNotes(),
        ])

        toast.success('Backup data successfully imported into VYRA!')
      } catch (err) {
        console.error(err)
        toast.error('Failed to parse and import backup file.')
      }
    }
    reader.readAsText(file)
  }

  const handleClearAll = async () => {
    try {
      await clearAllStores()
      await Promise.all([
        loadSettings(),
        loadProjects(),
        loadTasks(),
        loadLibrary(),
        loadNotes(),
      ])
      toast.success('All local database stores cleared successfully.')
    } catch (err) {
      console.error(err)
      toast.error('Failed to clear database stores.')
    } finally {
      setShowClearConfirm(false)
    }
  }

  const THEME_OPTIONS = [
    { id: 'dark', label: 'Dark', icon: Moon },
    { id: 'system', label: 'System', icon: Monitor },
    { id: 'light', label: 'Light', icon: Sun },
  ]

  // Convert bytes to human readable format
  const formatBytes = (bytes: number) => {
    if (bytes === 0) return '0 B'
    const k = 1024
    const sizes = ['B', 'KB', 'MB', 'GB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
  }

  const storagePercentage = storageSize ? Math.min(100, (storageSize.usage / storageSize.quota) * 100) : 0
  const isStorageHigh = storagePercentage > 80

  const handleToggleLock = (enabled: boolean) => {
    if (enabled) {
      setShowPinSetup(true)
    } else {
      update({ appLock: { enabled: false, autoLockTimeout: 5 } })
    }
  }

  const handleSavePin = () => {
    if (pinInput !== pinConfirm || pinInput.length < 4) {
      toast.warning('PIN must be at least 4 digits and match.')
      return
    }
    update({
      appLock: {
        enabled: true,
        hashedPin: hashPin(pinInput),
        autoLockTimeout: settings.appLock?.autoLockTimeout || 5,
      }
    })
    setShowPinSetup(false)
    setPinInput('')
    setPinConfirm('')
  }

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-2xl mx-auto">
      <h1 className="text-2xl font-bold text-text-1 mb-6 sm:mb-8">Settings</h1>

      <div className="space-y-6">
        {/* Appearance */}
        <Card className="p-4 sm:p-5">
          <h2 className="text-sm font-semibold text-text-1 mb-4">Appearance</h2>

          <div className="space-y-5">
            <div>
              <label className="text-xs font-medium text-text-2 uppercase tracking-wide block mb-3">Theme</label>
              <div className="flex gap-2">
                {THEME_OPTIONS.map(({ id, label, icon: Icon }) => (
                  <button
                    key={id}
                    onClick={() => update({ theme: id as typeof settings.theme })}
                    className={cn(
                      'flex-1 flex flex-col items-center gap-2 py-3 rounded-xl border transition-all text-sm',
                      settings.theme === id
                        ? 'border-primary bg-primary/10 text-primary'
                        : 'border-border bg-surface-2 text-text-2 hover:border-border-2 hover:text-text-1'
                    )}
                  >
                    <Icon size={16} />
                    {label}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="text-xs font-medium text-text-2 uppercase tracking-wide block mb-3">Accent Color</label>
              <div className="flex gap-2 flex-wrap">
                {PROJECT_COLORS.slice(0, 10).map(color => (
                  <button
                    key={color}
                    onClick={() => update({ accentColor: color })}
                    className={cn('w-7 h-7 rounded-full transition-all border-2',
                      settings.accentColor === color ? 'border-white scale-110' : 'border-transparent hover:scale-105'
                    )}
                    style={{ backgroundColor: color }}
                    aria-label={`Accent color ${color}`}
                  />
                ))}
              </div>
            </div>

            <Toggle
              checked={settings.sidebarCollapsed}
              onChange={val => update({ sidebarCollapsed: val })}
              label="Collapse sidebar by default"
            />
          </div>
        </Card>

        {/* Security */}
        <Card className="p-4 sm:p-5">
          <h2 className="text-sm font-semibold text-text-1 mb-4 flex items-center gap-2">
            <Shield size={16} /> Security
          </h2>
          
          <div className="space-y-4">
            <Toggle
              checked={!!settings.appLock?.enabled}
              onChange={handleToggleLock}
              label="Enable App Lock"
            />

            {showPinSetup && (
              <div className="bg-surface-2 p-4 rounded-xl border border-border space-y-3 mt-3">
                <label className="text-xs font-medium text-text-2 uppercase tracking-wide block">Set up PIN</label>
                <div className="flex gap-2">
                  <Input 
                    type="password" 
                    inputMode="numeric"
                    maxLength={6}
                    placeholder="Enter PIN (min 4)" 
                    value={pinInput} 
                    onChange={e => setPinInput(e.target.value)} 
                  />
                  <Input 
                    type="password" 
                    inputMode="numeric"
                    maxLength={6}
                    placeholder="Confirm PIN" 
                    value={pinConfirm} 
                    onChange={e => setPinConfirm(e.target.value)} 
                  />
                  <Button onClick={handleSavePin}>Save</Button>
                </div>
              </div>
            )}

            {settings.appLock?.enabled && (
              <div className="pt-2">
                <label className="text-xs font-medium text-text-2 uppercase tracking-wide block mb-2">Auto-lock timeout (minutes)</label>
                <select
                  value={settings.appLock.autoLockTimeout}
                  onChange={e => update({ appLock: { ...settings.appLock, enabled: true, autoLockTimeout: Number(e.target.value) } })}
                  className="w-full h-10 px-3 rounded-lg bg-surface-2 border border-border text-sm text-text-1 focus:outline-none focus:border-primary"
                >
                  <option value={1}>1 minute</option>
                  <option value={5}>5 minutes</option>
                  <option value={15}>15 minutes</option>
                  <option value={30}>30 minutes</option>
                  <option value={60}>1 hour</option>
                </select>
              </div>
            )}
          </div>
        </Card>

        {/* Data & Storage */}
        <Card className="p-4 sm:p-5">
          <h2 className="text-sm font-semibold text-text-1 mb-1">Data & Storage</h2>
          <p className="text-xs text-text-3 mb-4">All data is stored locally in your browser's IndexedDB.</p>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-5">
            {[
              { label: 'Projects', value: projects.length },
              { label: 'Tasks', value: tasks.length },
              { label: 'Library', value: library.length },
              { label: 'Notes', value: notes.length },
            ].map(stat => (
              <div key={stat.label} className="bg-surface-2 rounded-xl p-3 text-center border border-border">
                <div className="text-2xl font-bold text-text-1">{stat.value}</div>
                <div className="text-xs text-text-3 mt-0.5">{stat.label}</div>
              </div>
            ))}
          </div>

          {/* Browser Storage Estimate */}
          {storageSize && (
            <div className="mb-6 p-4 bg-surface-2/50 border border-border rounded-xl">
              <div className="flex items-center justify-between text-xs font-medium text-text-2 mb-2">
                <span className="flex items-center gap-1.5"><HardDrive size={13} /> Estimated Disk Usage</span>
                <span>{formatBytes(storageSize.usage)} of {formatBytes(storageSize.quota)}</span>
              </div>
              <div className="h-2 rounded-full bg-surface-3 overflow-hidden">
                <div
                  className={cn(
                    'h-full rounded-full transition-all duration-300',
                    isStorageHigh ? 'bg-danger' : 'bg-primary'
                  )}
                  style={{ width: `${storagePercentage}%` }}
                />
              </div>
              {isStorageHigh && (
                <p className="text-[11px] text-danger mt-1.5">
                  Warning: Local storage usage is high. Consider exporting and clearing unused projects or component assets.
                </p>
              )}
            </div>
          )}

          <div className="flex flex-col sm:flex-row gap-3">
            <Button variant="secondary" leftIcon={<Download size={13} />} onClick={handleExport} className="flex-1">
              Export Data
            </Button>
            <Button variant="secondary" leftIcon={<Upload size={13} />} onClick={() => fileInputRef.current?.click()} className="flex-1">
              Import Data
            </Button>
            <input type="file" ref={fileInputRef} accept=".json" className="hidden" onChange={handleImport} />
            <Button variant="danger" leftIcon={<Trash2 size={13} />} onClick={() => setShowClearConfirm(true)} className="flex-1">
              Clear All Data
            </Button>
          </div>
        </Card>

        {/* Device Sync */}
        <Card className="p-4 sm:p-5">
          <h2 className="text-sm font-semibold text-text-1 mb-1 flex items-center gap-2">
            <Smartphone size={16} /> Device Sync
          </h2>
          <p className="text-xs text-text-3 mb-4">Securely sync data between your laptop and mobile device over Wi-Fi without a cloud database.</p>
          
          <Button variant="outline" className="w-full mb-4" onClick={() => setShowSyncModal(true)}>
            Sync Devices via WebRTC
          </Button>

          {/* Connected Devices */}
          {settings.pairedDevices && settings.pairedDevices.length > 0 && (
            <div className="mt-4 bg-surface-2 p-4 rounded-xl border border-border">
              <h3 className="text-xs font-medium text-text-2 uppercase tracking-wide mb-3">Paired Devices</h3>
              <div className="space-y-2">
                {settings.pairedDevices.map(device => (
                  <div key={device.id} className="flex items-center justify-between bg-surface p-3 rounded-lg border border-border/50">
                    <div>
                      <p className="text-sm font-medium text-text-1">{device.name}</p>
                      <p className="text-[11px] text-text-3 mt-0.5">Last synced: {new Date(device.lastSyncAt).toLocaleString()}</p>
                    </div>
                    <button
                      onClick={() => update({ pairedDevices: settings.pairedDevices!.filter(d => d.id !== device.id) })}
                      className="text-text-3 hover:text-danger p-2 rounded-md transition-colors bg-surface-2 hover:bg-danger/10"
                      title="Remove device"
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}
        </Card>

        {/* Help & Documentation */}
        <Card className="p-5">
          <HelpDocumentation />
        </Card>

        {/* About */}
        <Card className="p-5">
          <h2 className="text-sm font-semibold text-text-1 mb-3 flex items-center gap-2">
            <Info size={14} /> About VYRA
          </h2>
          <div className="space-y-1 text-xs text-text-2">
            <p>Version 1.0.0 — MVP</p>
            <p>Visual Workflow & Resource Architecture.</p>
            <p className="text-text-3 mt-2">Local-first workspace for UI/UX Designers and Frontend Developers. All data stored privately in your browser.</p>
          </div>
        </Card>
      </div>

      <ConfirmDialog
        open={showClearConfirm}
        onClose={() => setShowClearConfirm(false)}
        onConfirm={handleClearAll}
        title="Clear All Data"
        message="This will permanently delete all your projects, tasks, library items, and notes. This cannot be undone."
        confirmLabel="Clear Everything"
      />
      
      {showSyncModal && (
        <SyncModal onClose={() => setShowSyncModal(false)} />
      )}
    </div>
  )
}
