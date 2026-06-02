import { useEffect, useState, useMemo } from 'react'
import { useParams, useNavigate, useSearchParams } from 'react-router-dom'
import { ArrowLeft, Edit3, Trash2, Plus, CheckSquare, Library, FileText, BarChart2, Calendar, Tag, Activity, Pin, Image as ImageIcon } from 'lucide-react'
import { useProjectStore } from './store/projectStore'
import { useSettingsStore } from '@/features/settings/store/settingsStore'
import { useTaskStore } from '@/features/tasks/store/taskStore'
import { useLibraryStore } from '@/features/library/store/libraryStore'
import { useNoteStore } from '@/features/notes/store/noteStore'
import { Button } from '@/shared/ui/Button'
import { Badge } from '@/shared/ui/Badge'
import { Tabs, EmptyState, Card, ConfirmDialog } from '@/shared/ui'
import { TaskBoardView } from '@/features/tasks/components/views/BoardView'
import { TaskListView } from '@/features/tasks/components/views/ListView'
import { TaskForm } from '@/features/tasks/components/TaskForm'
import { LibraryItemCard } from '@/features/library/components/LibraryItemCard'
import { LibraryItemForm } from '@/features/library/components/LibraryItemForm'
import { ProjectForm } from './components/ProjectForm'
import { MoodboardCanvas } from './components/MoodboardCanvas'
import { calculateProgress } from '@/shared/utils/progress'
import { formatDate, isOverdue, formatRelative } from '@/shared/utils/date'
import { hexToRgba } from '@/shared/utils/color'
import { cn } from '@/shared/utils/cn'

const TABS = [
  { id: 'overview', label: 'Overview', icon: <BarChart2 size={13} /> },
  { id: 'tasks', label: 'Tasks', icon: <CheckSquare size={13} /> },
  { id: 'library', label: 'Library', icon: <Library size={13} /> },
  { id: 'moodboard', label: 'Moodboard', icon: <ImageIcon size={13} /> },
  { id: 'notes', label: 'Notes', icon: <FileText size={13} /> },
  { id: 'activity', label: 'Activity', icon: <Activity size={13} /> },
]

const STATUS_VARIANTS: Record<string, 'success' | 'primary' | 'warning' | 'info' | 'default'> = {
  active: 'success', planning: 'info', review: 'warning', completed: 'primary', archived: 'default'
}

export default function ProjectDetailPage() {
  const { id } = useParams<{ id: string }>()
  const [searchParams, setSearchParams] = useSearchParams()
  const navigate = useNavigate()

  const projects = useProjectStore(s => s.projects)
  const project = useMemo(() => projects.find(p => p.id === id), [projects, id])
  const removeProject = useProjectStore(s => s.remove)

  const allTasks = useTaskStore(s => s.tasks)
  const tasks = useMemo(() => allTasks.filter(t => t.projectId === id), [allTasks, id])

  const allLibrary = useLibraryStore(s => s.items)
  const library = useMemo(() => allLibrary.filter(i => i.projectId === id), [allLibrary, id])

  const allNotes = useNoteStore(s => s.notes)
  const notes = useMemo(() => allNotes.filter(n => n.projectId === id), [allNotes, id])

  const [activeTab, setActiveTab] = useState(searchParams.get('tab') || 'overview')
  const [showEdit, setShowEdit] = useState(false)
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)
  const [showTaskForm, setShowTaskForm] = useState(false)
  const [showLibraryForm, setShowLibraryForm] = useState(false)
  
  const { toggleFavorite, remove: removeLibraryItem } = useLibraryStore()
  const { setSelected: setNoteSelected } = useNoteStore()

  const progress = useMemo(() => calculateProgress(tasks), [tasks])

  useEffect(() => {
    setSearchParams({ tab: activeTab }, { replace: true })
  }, [activeTab])

  useEffect(() => {
    if (project) {
      useSettingsStore.getState().setLastOpenedEntity({
        type: 'project',
        id: project.id,
        title: project.name,
        url: `/projects/${project.id}`
      })
    }
  }, [project?.id])

  if (!project) {
    return (
      <div className="p-8">
        <EmptyState title="Project not found" description="This project may have been deleted." action={
          <Button variant="ghost" leftIcon={<ArrowLeft size={14} />} onClick={() => navigate('/projects')}>Back to Projects</Button>
        } />
      </div>
    )
  }

  const tabCounts = {
    overview: undefined,
    tasks: tasks.length,
    library: library.length,
    moodboard: project.moodboardNodes?.length,
    notes: notes.length,
    activity: undefined,
  }

  const handleDelete = async () => {
    await removeProject(project.id)
    navigate('/projects')
  }

  return (
    <div className="max-w-7xl mx-auto">
      {/* Cover Header */}
      <div className="relative">
        {project.coverImage ? (
          <div className="h-40 lg:h-52 overflow-hidden">
            <img src={project.coverImage} alt={project.name} className="w-full h-full object-cover" />
            <div className="absolute inset-0 bg-gradient-to-t from-bg via-bg/40 to-transparent" />
          </div>
        ) : (
          <div
            className="h-20 lg:h-28"
            style={{ background: `linear-gradient(135deg, ${project.color}40 0%, ${hexToRgba(project.color, 0.05)} 100%)` }}
          />
        )}

        {/* Back button */}
        <button
          onClick={() => navigate('/projects')}
          className="absolute top-4 left-4 flex items-center gap-1.5 text-xs text-text-2 hover:text-text-1 bg-surface/80 backdrop-blur-sm border border-border rounded-lg px-2.5 py-1.5 transition-all"
        >
          <ArrowLeft size={12} /> Projects
        </button>
      </div>

      {/* Project Header */}
      <div className="px-6 lg:px-8 pt-6 pb-0">
        <div className="flex items-start justify-between gap-4">
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-4 h-4 rounded-full flex-shrink-0 ring-2 ring-border" style={{ backgroundColor: project.color }} />
            <div>
              <h1 className="text-xl lg:text-2xl font-bold text-text-1">{project.name}</h1>
              {project.description && <p className="text-sm text-text-2 mt-0.5">{project.description}</p>}
            </div>
          </div>
          <div className="flex items-center gap-2 flex-shrink-0">
            <Badge variant={STATUS_VARIANTS[project.status]} dot>{project.status}</Badge>
            <Button variant="ghost" size="sm" leftIcon={<Edit3 size={13} />} onClick={() => setShowEdit(true)}>Edit</Button>
            <Button variant="ghost" size="sm" leftIcon={<Trash2 size={13} />} onClick={() => setShowDeleteConfirm(true)} className="text-danger hover:text-danger" />
          </div>
        </div>

        {/* Meta row */}
        <div className="flex items-center gap-4 mt-4 flex-wrap">
          {project.dueDate && (
            <div className={cn('flex items-center gap-1 text-xs', isOverdue(project.dueDate) ? 'text-danger' : 'text-text-3')}>
              <Calendar size={11} /> Due {formatDate(project.dueDate)}
            </div>
          )}
          {project.tags.length > 0 && (
            <div className="flex items-center gap-1.5 flex-wrap">
              <Tag size={10} className="text-text-3" />
              {project.tags.map(tag => (
                <span key={tag} className="text-xs bg-surface-2 border border-border text-text-2 rounded-full px-2 py-0.5">{tag}</span>
              ))}
            </div>
          )}
        </div>

        {/* Progress bar */}
        {progress.total > 0 && (
          <div className="mt-4 max-w-md">
            <div className="flex items-center justify-between mb-1.5">
              <span className="text-xs text-text-3">{progress.done} of {progress.total} tasks done</span>
              <span className={cn('text-xs font-semibold',
                progress.health === 'overdue' ? 'text-danger' :
                progress.health === 'at-risk' ? 'text-warning' : 'text-success'
              )}>{progress.percentage}%</span>
            </div>
            <div className="h-2 rounded-full bg-surface-3">
              <div className="h-full rounded-full transition-all duration-500"
                style={{
                  width: `${progress.percentage}%`,
                  backgroundColor: progress.health === 'overdue' ? 'var(--color-danger)'
                    : progress.health === 'at-risk' ? 'var(--color-warning)' : 'var(--color-primary)'
                }}
              />
            </div>
          </div>
        )}

        {/* Tabs */}
        <div className="mt-6 border-b border-border">
          <Tabs
            tabs={TABS.map(t => ({ ...t, count: tabCounts[t.id as keyof typeof tabCounts] }))}
            activeTab={activeTab}
            onChange={setActiveTab}
          />
        </div>
      </div>

      {/* Tab Content */}
      <div className="px-6 lg:px-8 py-6">
        {activeTab === 'overview' && (
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            {[
              { label: 'Total Tasks', value: progress.total, color: 'text-primary', bg: 'bg-primary/10' },
              { label: 'Completed', value: progress.done, color: 'text-success', bg: 'bg-success/10' },
              { label: 'Library Items', value: library.length, color: 'text-secondary', bg: 'bg-secondary/10' },
              { label: 'Notes', value: notes.length, color: 'text-warning', bg: 'bg-warning/10' },
            ].map(stat => (
              <Card key={stat.label} className="p-4">
                <p className="text-xs text-text-3 uppercase tracking-wide mb-1">{stat.label}</p>
                <p className={cn('text-3xl font-bold', stat.color)}>{stat.value}</p>
              </Card>
            ))}
          </div>
        )}

        {activeTab === 'tasks' && (
          <div>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-sm font-semibold text-text-1">Tasks</h2>
              <Button size="sm" leftIcon={<Plus size={12} />} onClick={() => setShowTaskForm(true)}>Add Task</Button>
            </div>
            <TaskBoardView projectId={id!} />
          </div>
        )}

        {activeTab === 'library' && (
          <div>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-sm font-semibold text-text-1">Library Items</h2>
              <Button size="sm" leftIcon={<Plus size={12} />} onClick={() => setShowLibraryForm(true)}>Add Item</Button>
            </div>
            {library.length === 0 ? (
              <EmptyState icon={<Library size={18} />} title="No library items linked"
                description="Link library items to this project for quick access."
              />
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {library.map(item => (
                  <LibraryItemCard
                    key={item.id}
                    item={item}
                    onToggleFavorite={() => toggleFavorite(item.id)}
                    onEdit={() => {}} // Could be wired to edit form
                    onDelete={() => removeLibraryItem(item.id)}
                  />
                ))}
              </div>
            )}
          </div>
        )}

        {activeTab === 'moodboard' && (
          <div>
            <div className="flex items-center justify-between">
              <h2 className="text-sm font-semibold text-text-1">Moodboard</h2>
            </div>
            <MoodboardCanvas projectId={id!} />
          </div>
        )}

        {activeTab === 'notes' && (
          <div>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-sm font-semibold text-text-1">Notes</h2>
              <Button size="sm" leftIcon={<Plus size={12} />} onClick={() => navigate(`/notes?new=true&projectId=${project.id}`)}>Add Note</Button>
            </div>
            {notes.length === 0 ? (
              <EmptyState icon={<FileText size={18} />} title="No notes yet"
                description="Add notes to capture requirements, ideas, or meeting notes."
              />
            ) : (
              <div className="space-y-2">
                {notes.map(note => (
                  <Card key={note.id} hoverable onClick={() => { setNoteSelected(note.id); navigate(`/notes?id=${note.id}`) }} className="p-4">
                    <div className="flex items-start justify-between">
                      <div className="flex items-center gap-2">
                        {note.isPinned && <Pin size={12} className="text-warning fill-current" />}
                        <span className="font-medium text-text-1">{note.title}</span>
                      </div>
                      <Badge variant="default" size="sm">{note.type}</Badge>
                    </div>
                    <div className="text-xs text-text-3 mt-2">Updated {formatRelative(note.updatedAt)}</div>
                  </Card>
                ))}
              </div>
            )}
          </div>
        )}
        
        {activeTab === 'activity' && (
          <div className="max-w-2xl">
            <h2 className="text-sm font-semibold text-text-1 mb-4">Project Activity</h2>
            <div className="space-y-4">
              {[
                { type: 'project', title: project.name, date: project.updatedAt, action: 'Updated' },
                { type: 'project', title: project.name, date: project.createdAt, action: 'Created' },
                ...tasks.map(t => ({ type: 'task', title: t.title, date: t.updatedAt, action: 'Updated' })),
                ...tasks.map(t => ({ type: 'task', title: t.title, date: t.createdAt, action: 'Created' })),
                ...library.map(l => ({ type: 'library', title: l.title, date: l.updatedAt, action: 'Updated' })),
                ...library.map(l => ({ type: 'library', title: l.title, date: l.createdAt, action: 'Created' })),
                ...notes.map(n => ({ type: 'note', title: n.title, date: n.updatedAt, action: 'Updated' })),
                ...notes.map(n => ({ type: 'note', title: n.title, date: n.createdAt, action: 'Created' })),
              ]
                .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
                .filter((item, index, self) => 
                  index === self.findIndex((t) => (
                    t.title === item.title && t.action === item.action && t.date === item.date
                  ))
                )
                .map((log, i) => (
                  <div key={i} className="flex gap-4 items-start">
                    <div className="mt-1 w-2 h-2 rounded-full bg-primary flex-shrink-0" />
                    <div>
                      <p className="text-sm text-text-1">
                        <span className="font-medium">{log.action}</span> {log.type}: {log.title}
                      </p>
                      <p className="text-xs text-text-3 mt-0.5">{formatRelative(log.date)}</p>
                    </div>
                  </div>
              ))}
            </div>
          </div>
        )}
      </div>

      <ProjectForm open={showEdit} onClose={() => setShowEdit(false)} project={project} />
      <TaskForm open={showTaskForm} onClose={() => setShowTaskForm(false)} projectId={id!} />
      <LibraryItemForm open={showLibraryForm} onClose={() => setShowLibraryForm(false)} projectId={id!} />
      <ConfirmDialog
        open={showDeleteConfirm}
        onClose={() => setShowDeleteConfirm(false)}
        onConfirm={handleDelete}
        title="Delete Project"
        message={`Are you sure you want to delete "${project.name}"? This cannot be undone.`}
      />
    </div>
  )
}
