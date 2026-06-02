import { useState, useEffect } from 'react'
import { useLibraryStore } from '../store/libraryStore'
import { useProjectStore } from '@/features/projects/store/projectStore'
import { useSettingsStore } from '@/features/settings/store/settingsStore'
import { Modal } from '@/shared/ui/Modal'
import { Button } from '@/shared/ui/Button'
import { Input, Textarea, Select } from '@/shared/ui/Input'
import { Tag, X } from 'lucide-react'
import type { LibraryItem } from '@/shared/types'

interface LibraryItemFormProps {
  open: boolean
  onClose: () => void
  item?: LibraryItem
  projectId?: string
}

const TYPE_OPTIONS = [
  { value: 'inspiration', label: '✨ Inspiration' },
  { value: 'component', label: '⚙️ Component' },
  { value: 'prompt', label: '💬 Prompt' },
]

export function LibraryItemForm({ open, onClose, item, projectId: propsProjectId }: LibraryItemFormProps) {
  const { create, update } = useLibraryStore()
  const projects = useProjectStore(s => s.projects)

  const [type, setType] = useState<LibraryItem['type']>(item?.type ?? 'inspiration')

  // Track last opened when editing an existing item
  useEffect(() => {
    if (open && item) {
      useSettingsStore.getState().setLastOpenedEntity({
        type: 'library',
        id: item.id,
        title: item.title,
        url: `/library`
      })
    }
  }, [open, item?.id])

  const [title, setTitle] = useState(item?.title ?? '')
  const [description, setDescription] = useState(item?.description ?? '')
  const [content, setContent] = useState(item?.content ?? '')
  const [url, setUrl] = useState(item?.url ?? '')
  const [projectId, setProjectId] = useState(item?.projectId ?? propsProjectId ?? '')
  const [tagInput, setTagInput] = useState('')
  const [tags, setTags] = useState<string[]>(item?.tags ?? [])
  const [loading, setLoading] = useState(false)
  const [errors, setErrors] = useState<Record<string, string>>({})

  const projectOptions = [
    { value: '', label: '— No project —' },
    ...projects.map(p => ({ value: p.id, label: p.name })),
  ]

  const validate = () => {
    const e: Record<string, string> = {}
    if (!title.trim()) e.title = 'Title is required'
    setErrors(e)
    return Object.keys(e).length === 0
  }

  const handleSubmit = async () => {
    if (!validate()) return
    setLoading(true)
    try {
      const data = {
        type,
        title: title.trim(),
        description: description.trim() || undefined,
        content: content.trim() || undefined,
        url: url.trim() || undefined,
        projectId: projectId || undefined,
        tags,
        isFavorite: item?.isFavorite ?? false,
      }
      if (item) await update(item.id, data)
      else await create(data)
      handleClose()
    } finally {
      setLoading(false)
    }
  }

  const handleClose = () => {
    if (!item) {
      setType('inspiration'); setTitle(''); setDescription('')
      setContent(''); setUrl(''); setProjectId(''); setTags([]); setTagInput('')
      setErrors({})
    }
    onClose()
  }

  const addTag = () => {
    const t = tagInput.trim().toLowerCase()
    if (t && !tags.includes(t)) setTags(prev => [...prev, t])
    setTagInput('')
  }

  return (
    <Modal
      open={open}
      onClose={handleClose}
      title={item ? 'Edit Library Item' : 'Add to Library'}
      size="lg"
      footer={
        <>
          <Button variant="ghost" onClick={handleClose} disabled={loading}>Cancel</Button>
          <Button onClick={handleSubmit} loading={loading}>{item ? 'Save' : 'Add to Library'}</Button>
        </>
      }
    >
      <div className="space-y-4">
        <Select label="Type" value={type} onChange={e => setType(e.target.value as LibraryItem['type'])} options={TYPE_OPTIONS} />
        <Input label="Title" placeholder="Give it a descriptive title" value={title} onChange={e => setTitle(e.target.value)} error={errors.title} autoFocus />
        <Textarea label="Description" placeholder="Brief description..." value={description} onChange={e => setDescription(e.target.value)} className="h-16 resize-none" />

        {type === 'inspiration' && (
          <Input label="URL" type="url" placeholder="https://..." value={url} onChange={e => setUrl(e.target.value)} />
        )}

        {(type === 'component' || type === 'prompt') && (
          <Textarea
            label={type === 'component' ? 'Code' : 'Prompt'}
            placeholder={type === 'component' ? 'Paste your component code...' : 'Write your AI prompt...'}
            value={content}
            onChange={e => setContent(e.target.value)}
            className="h-36 resize-y font-mono text-xs"
          />
        )}

        <Select
          label="Link to Project (optional)"
          value={projectId}
          onChange={e => setProjectId(e.target.value)}
          options={projectOptions}
        />

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
