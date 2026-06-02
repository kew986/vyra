import { useState, useEffect } from 'react'
import { useTaskStore } from '../store/taskStore'
import { useProjectStore } from '@/features/projects/store/projectStore'
import { useSettingsStore } from '@/features/settings/store/settingsStore'
import { Modal } from '@/shared/ui/Modal'
import { Button } from '@/shared/ui/Button'
import { Input, Textarea, Select } from '@/shared/ui/Input'
import { Tag, X, Bell, Trash2, Clock } from 'lucide-react'
import type { Task, TaskReminder } from '@/shared/types'

// Helper to generate a unique ID
const generateId = () => Math.random().toString(36).substring(2, 9)

interface TaskFormProps {
  open: boolean
  onClose: () => void
  projectId: string
  task?: Task
  initialDueDate?: string
}

const STATUS_OPTIONS = [
  { value: 'backlog', label: 'Backlog' },
  { value: 'todo', label: 'To Do' },
  { value: 'in_progress', label: 'In Progress' },
  { value: 'review', label: 'Review' },
  { value: 'done', label: 'Done' },
]

const PRIORITY_OPTIONS = [
  { value: 'low', label: '⚪ Low' },
  { value: 'medium', label: '🔵 Medium' },
  { value: 'high', label: '🟠 High' },
  { value: 'critical', label: '🔴 Critical' },
]

export function TaskForm({ open, onClose, projectId, task, initialDueDate }: TaskFormProps) {
  const { create, update, tasks } = useTaskStore()

  const projects = useProjectStore(s => s.projects)
  const [projectIdState, setProjectIdState] = useState(task?.projectId ?? projectId)
  const [title, setTitle] = useState(task?.title ?? '')
  const [description, setDescription] = useState(task?.description ?? '')
  const [status, setStatus] = useState<Task['status']>(task?.status ?? 'todo')
  const [priority, setPriority] = useState<Task['priority']>(task?.priority ?? 'medium')
  const [dueDate, setDueDate] = useState(task?.dueDate ?? initialDueDate ?? '')
  const [reminders, setReminders] = useState<TaskReminder[]>(task?.reminders ?? [])
  const [newReminderTime, setNewReminderTime] = useState('')
  const [tagInput, setTagInput] = useState('')
  const [tags, setTags] = useState<string[]>(task?.tags ?? [])
  const [loading, setLoading] = useState(false)
  const [errors, setErrors] = useState<Record<string, string>>({})

  // Update form if task or initialDueDate changes when opened
  useEffect(() => {
    if (open) {
      if (task) {
        setProjectIdState(task.projectId)
        setTitle(task.title)
        setDescription(task.description ?? '')
        setStatus(task.status)
        setPriority(task.priority)
        setDueDate(task.dueDate ?? '')
        setTags(task.tags ?? [])
        setReminders(task.reminders ?? [])
      } else {
        setProjectIdState(projectId)
        setTitle('')
        setDescription('')
        setStatus('todo')
        setPriority('medium')
        setDueDate(initialDueDate ?? '')
        setTags([])
        setReminders([])
      }
      setErrors({})
      setNewReminderTime('')
    }
  }, [open, task, initialDueDate])

  // Track last opened when editing an existing task
  useEffect(() => {
    if (open && task) {
      useSettingsStore.getState().setLastOpenedEntity({
        type: 'task',
        id: task.id,
        title: task.title,
        url: `/tasks`
      })
    }
  }, [open, task?.id])

  const validate = () => {
    const e: Record<string, string> = {}
    if (!title.trim()) e.title = 'Task title is required'
    setErrors(e)
    return Object.keys(e).length === 0
  }

  const handleSubmit = async () => {
    if (!validate()) return
    setLoading(true)
    try {
      if (task) {
        await update(task.id, { projectId: projectIdState, title: title.trim(), description: description.trim() || undefined, status, priority, dueDate: dueDate || undefined, tags, reminders })
      } else {
        const maxOrder = tasks.filter(t => t.projectId === projectIdState && t.status === status).length
        await create({ projectId: projectIdState, title: title.trim(), description: description.trim() || undefined, status, priority, dueDate: dueDate || undefined, order: maxOrder, tags, reminders })
      }
      handleClose()
    } finally {
      setLoading(false)
    }
  }

  const handleClose = () => {
    if (!task) {
      setProjectIdState(projectId); setTitle(''); setDescription(''); setStatus('todo'); setPriority('medium')
      setDueDate(initialDueDate ?? ''); setTags([]); setTagInput(''); setErrors({})
    }
    onClose()
  }

  const addTag = () => {
    const t = tagInput.trim().toLowerCase()
    if (t && !tags.includes(t)) setTags(prev => [...prev, t])
    setTagInput('')
  }

  const addReminder = () => {
    if (!newReminderTime) return
    const d = new Date(newReminderTime)
    if (isNaN(d.getTime())) return
    setReminders(prev => [...prev, { id: generateId(), triggerAt: d.toISOString(), notified: false }])
    setNewReminderTime('')
  }

  const removeReminder = (id: string) => {
    setReminders(prev => prev.filter(r => r.id !== id))
  }

  return (
    <Modal
      open={open}
      onClose={handleClose}
      title={
        <div className="flex items-center justify-between pr-4 w-full">
          <span>{task ? 'Edit Task' : 'New Task'}</span>
          {task?.timeSpent !== undefined && (
            <span className="flex items-center gap-1.5 text-xs font-medium text-text-3 bg-surface-2 px-2 py-1 rounded-md border border-border">
              <Clock size={12} />
              {Math.floor(task.timeSpent / 60)}m {task.timeSpent % 60}s logged
            </span>
          )}
        </div>
      }
      size="md"
      footer={
        <>
          <Button variant="ghost" onClick={handleClose} disabled={loading}>Cancel</Button>
          <Button onClick={handleSubmit} loading={loading}>{task ? 'Save' : 'Create Task'}</Button>
        </>
      }
    >
      <div className="space-y-4">
        <Input
          label="Title"
          placeholder="What needs to be done?"
          value={title}
          onChange={e => setTitle(e.target.value)}
          error={errors.title}
          autoFocus
        />
        <Textarea
          label="Description"
          placeholder="Add details..."
          value={description}
          onChange={e => setDescription(e.target.value)}
          className="h-20 resize-none"
        />
        <Select label="Project" value={projectIdState} onChange={e => setProjectIdState(e.target.value)} options={[{value: '', label: 'General / No Project'}, ...projects.map(p => ({value: p.id, label: p.name}))]} />
        <div className="grid grid-cols-2 gap-3">
          <Select label="Status" value={status} onChange={e => setStatus(e.target.value as Task['status'])} options={STATUS_OPTIONS} />
          <Select label="Priority" value={priority} onChange={e => setPriority(e.target.value as Task['priority'])} options={PRIORITY_OPTIONS} />
        </div>
        <Input label="Due Date" type="date" value={dueDate} onChange={e => setDueDate(e.target.value)} />
        
        {/* Reminders */}
        <div className="bg-surface-2 p-3 rounded-xl border border-border">
          <label className="text-xs font-medium text-text-2 uppercase tracking-wide flex items-center gap-1 mb-2">
            <Bell size={12} /> Reminders
          </label>
          <div className="space-y-2 mb-3">
            {reminders.map(rem => (
              <div key={rem.id} className="flex items-center justify-between bg-surface border border-border rounded-lg p-2 text-sm text-text-1">
                <span className={rem.notified ? 'opacity-50 line-through' : ''}>
                  {new Date(rem.triggerAt).toLocaleString()}
                </span>
                <button onClick={() => removeReminder(rem.id)} className="text-text-3 hover:text-danger">
                  <Trash2 size={14} />
                </button>
              </div>
            ))}
            {reminders.length === 0 && <p className="text-xs text-text-3">No reminders set.</p>}
          </div>
          <div className="flex gap-2">
            <Input 
              type="datetime-local" 
              value={newReminderTime} 
              onChange={e => setNewReminderTime(e.target.value)} 
              className="flex-1"
            />
            <Button variant="secondary" onClick={addReminder} disabled={!newReminderTime}>Add</Button>
          </div>
        </div>

        <div>
          <label className="text-xs font-medium text-text-2 uppercase tracking-wide block mb-2">Tags</label>
          <div className="flex gap-1.5 mb-2 flex-wrap">
            {tags.map(tag => (
              <span key={tag} className="inline-flex items-center gap-1 text-xs bg-surface-2 border border-border rounded-full px-2 py-0.5 text-text-2">
                {tag}<button onClick={() => setTags(t => t.filter(x => x !== tag))}><X size={9} /></button>
              </span>
            ))}
          </div>
          <Input placeholder="Add tag..." value={tagInput} onChange={e => setTagInput(e.target.value)}
            onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); addTag() } }}
            leftIcon={<Tag size={12} />} />
        </div>
      </div>
    </Modal>
  )
}
