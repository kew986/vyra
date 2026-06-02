import { useState } from 'react'
import { useProjectStore } from '../store/projectStore'
import { Modal } from '@/shared/ui/Modal'
import { Button } from '@/shared/ui/Button'
import { Input, Textarea, Select } from '@/shared/ui/Input'
import { Image, X, Tag } from 'lucide-react'
import { PROJECT_ICONS } from '@/shared/utils/icons'
import { PROJECT_COLORS, randomProjectColor, compressImage } from '@/shared/utils/color'
import { cn } from '@/shared/utils/cn'
import type { Project } from '@/shared/types'

interface ProjectFormProps {
  open: boolean
  onClose: () => void
  project?: Project   // if provided, we're editing
}

const STATUS_OPTIONS = [
  { value: 'planning', label: '📋 Planning' },
  { value: 'active', label: '🚀 Active' },
  { value: 'review', label: '👀 Review' },
  { value: 'completed', label: '✅ Completed' },
  { value: 'archived', label: '📦 Archived' },
]

export function ProjectForm({ open, onClose, project }: ProjectFormProps) {
  const createProject = useProjectStore(s => s.create)
  const updateProject = useProjectStore(s => s.update)

  const [name, setName] = useState(project?.name ?? '')
  const [description, setDescription] = useState(project?.description ?? '')
  const [status, setStatus] = useState<Project['status']>(project?.status ?? 'planning')
  const [color, setColor] = useState(project?.color ?? randomProjectColor())
  const [dueDate, setDueDate] = useState(project?.dueDate ?? '')
  const [icon, setIcon] = useState<string | undefined>(project?.icon)
  const [tagInput, setTagInput] = useState('')
  const [tags, setTags] = useState<string[]>(project?.tags ?? [])
  const [coverImage, setCoverImage] = useState<string | undefined>(project?.coverImage)
  const [imageError, setImageError] = useState('')
  const [loading, setLoading] = useState(false)
  const [errors, setErrors] = useState<Record<string, string>>({})

  const validate = () => {
    const e: Record<string, string> = {}
    if (!name.trim()) e.name = 'Project name is required'
    setErrors(e)
    return Object.keys(e).length === 0
  }

  const handleSubmit = async () => {
    if (!validate()) return
    setLoading(true)
    try {
      const data = {
        name: name.trim(),
        description: description.trim() || undefined,
        status,
        color,
        icon,
        dueDate: dueDate || undefined,
        tags,
        coverImage,
      }
      if (project) await updateProject(project.id, data)
      else await createProject(data)
      handleClose()
    } finally {
      setLoading(false)
    }
  }

  const handleClose = () => {
    if (!project) {
      setName(''); setDescription(''); setStatus('planning')
      setColor(randomProjectColor()); setDueDate(''); setTags([])
      setCoverImage(undefined); setIcon(undefined); setTagInput(''); setErrors({})
    }
    onClose()
  }

  const addTag = () => {
    const t = tagInput.trim().toLowerCase()
    if (t && !tags.includes(t)) setTags(prev => [...prev, t])
    setTagInput('')
  }

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    setImageError('')
    if (file.size > 5 * 1024 * 1024) { setImageError('Image must be under 5MB.'); return }
    try {
      const compressed = await compressImage(file, 2048)
      setCoverImage(compressed)
    } catch (err: unknown) {
      setImageError(err instanceof Error ? err.message : 'Image compression failed.')
    }
  }

  return (
    <Modal
      open={open}
      onClose={handleClose}
      title={project ? 'Edit Project' : 'New Project'}
      size="lg"
      footer={
        <>
          <Button variant="ghost" onClick={handleClose} disabled={loading}>Cancel</Button>
          <Button onClick={handleSubmit} loading={loading}>
            {project ? 'Save Changes' : 'Create Project'}
          </Button>
        </>
      }
    >
      <div className="space-y-5">
        {/* Cover Image */}
        <div>
          <label className="text-xs font-medium text-text-2 uppercase tracking-wide block mb-2">Cover Image</label>
          <div className="relative h-28 rounded-xl overflow-hidden border border-border bg-surface-2 group">
            {coverImage ? (
              <>
                <img src={coverImage} alt="Cover" className="w-full h-full object-cover" />
                <button
                  onClick={() => setCoverImage(undefined)}
                  className="absolute top-2 right-2 bg-black/60 hover:bg-black/80 text-white rounded-lg p-1 transition-all"
                >
                  <X size={12} />
                </button>
              </>
            ) : (
              <label className="flex flex-col items-center justify-center h-full cursor-pointer group-hover:bg-surface-3 transition-all">
                <Image size={20} className="text-text-3 mb-1" />
                <span className="text-xs text-text-3">Upload cover (max 2MB)</span>
                <input type="file" accept="image/*" className="hidden" onChange={handleImageUpload} />
              </label>
            )}
          </div>
          {imageError && <p className="text-xs text-danger mt-1">{imageError}</p>}
        </div>

        <Input
          label="Project Name"
          placeholder="e.g. Mobile App Redesign"
          value={name}
          onChange={e => setName(e.target.value)}
          error={errors.name}
          autoFocus
        />

        <Textarea
          label="Description"
          placeholder="What's this project about?"
          value={description}
          onChange={e => setDescription(e.target.value)}
          className="h-20 resize-none"
        />

        <div className="grid grid-cols-2 gap-4">
          <Select
            label="Status"
            value={status}
            onChange={e => setStatus(e.target.value as Project['status'])}
            options={STATUS_OPTIONS}
          />
          <Input
            label="Due Date"
            type="date"
            value={dueDate}
            onChange={e => setDueDate(e.target.value)}
          />
        </div>

        {/* Color */}
        <div>
          <label className="text-xs font-medium text-text-2 uppercase tracking-wide block mb-2">Accent Color</label>
          <div className="flex items-center gap-2 flex-wrap">
            {PROJECT_COLORS.map(c => (
              <button
                key={c}
                onClick={() => setColor(c)}
                className={cn(
                  'w-6 h-6 rounded-full transition-all border-2',
                  color === c ? 'border-white scale-110' : 'border-transparent hover:scale-105'
                )}
                style={{ backgroundColor: c }}
                aria-label={`Color ${c}`}
              />
            ))}
          </div>
        </div>

        {/* Icon */}
        <div>
          <label className="text-xs font-medium text-text-2 uppercase tracking-wide block mb-2">Project Icon</label>
          <div className="flex items-center gap-2 flex-wrap">
            {Object.entries(PROJECT_ICONS).map(([iconName, IconComponent]) => (
              <button
                key={iconName}
                onClick={() => setIcon(iconName)}
                className={cn(
                  'w-8 h-8 rounded-lg flex items-center justify-center transition-all border',
                  icon === iconName 
                    ? 'bg-primary/10 border-primary/30 text-primary' 
                    : 'bg-surface-2 border-border text-text-3 hover:text-text-1 hover:border-border-2'
                )}
                title={iconName}
              >
                <IconComponent size={14} />
              </button>
            ))}
            {icon && (
              <button
                onClick={() => setIcon(undefined)}
                className="text-xs text-text-3 hover:text-text-1 ml-2 transition-colors"
              >
                Clear
              </button>
            )}
          </div>
        </div>

        {/* Tags */}
        <div>
          <label className="text-xs font-medium text-text-2 uppercase tracking-wide block mb-2">Tags</label>
          <div className="flex gap-2 mb-2 flex-wrap">
            {tags.map(tag => (
              <span key={tag} className="inline-flex items-center gap-1 text-xs bg-surface-2 border border-border rounded-full px-2 py-0.5 text-text-2">
                {tag}
                <button onClick={() => setTags(t => t.filter(x => x !== tag))}><X size={10} /></button>
              </span>
            ))}
          </div>
          <Input
            placeholder="Add tag and press Enter..."
            value={tagInput}
            onChange={e => setTagInput(e.target.value)}
            onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); addTag() } }}
            leftIcon={<Tag size={12} />}
          />
        </div>
      </div>
    </Modal>
  )
}
