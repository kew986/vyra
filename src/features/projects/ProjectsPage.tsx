import { useState, useMemo, useEffect } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { Plus, LayoutGrid, List, Table2, Columns3, Search, SlidersHorizontal, X, FolderKanban } from 'lucide-react'
import { useProjectStore } from './store/projectStore'
import { useTaskStore } from '@/features/tasks/store/taskStore'
import { Button } from '@/shared/ui/Button'
import { Input } from '@/shared/ui/Input'
import { Card, EmptyState, Tabs } from '@/shared/ui'
import { Badge } from '@/shared/ui/Badge'
import { ProjectForm } from './components/ProjectForm'
import { ProjectCard } from './components/ProjectCard'
import { ProjectRow } from './components/ProjectRow'
import { ProjectBoardView } from './components/views/BoardView'
import { calculateProgress } from '@/shared/utils/progress'
import { PROJECT_ICONS } from '@/shared/utils/icons'
import { hexToRgba } from '@/shared/utils/color'
import type { Project, ProjectStatus, ProjectView } from '@/shared/types'

const STATUS_TABS = [
  { id: 'all', label: 'All' },
  { id: 'active', label: 'Active' },
  { id: 'planning', label: 'Planning' },
  { id: 'review', label: 'Review' },
  { id: 'completed', label: 'Completed' },
  { id: 'archived', label: 'Archived' },
]

const VIEW_OPTIONS = [
  { id: 'gallery', icon: LayoutGrid, label: 'Gallery' },
  { id: 'board', icon: Columns3, label: 'Board' },
  { id: 'list', icon: List, label: 'List' },
  { id: 'table', icon: Table2, label: 'Table' },
]

export default function ProjectsPage() {
  const navigate = useNavigate()
  const [searchParams, setSearchParams] = useSearchParams()
  const { projects, view, setView, filters, setFilters } = useProjectStore()
  const tasks = useTaskStore(s => s.tasks)
  const [showForm, setShowForm] = useState(false)
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState<'all' | ProjectStatus>('all')

  useEffect(() => {
    if (searchParams.get('new') === 'true') {
      setShowForm(true)
      const nextParams = new URLSearchParams(searchParams)
      nextParams.delete('new')
      setSearchParams(nextParams, { replace: true })
    }
  }, [searchParams, setSearchParams])


  const filtered = useMemo(() => {
    let result = [...projects]
    if (statusFilter !== 'all') {
      result = result.filter(p => p.status === statusFilter)
    } else {
      // Hide archived from 'All' view unless searching
      if (!search.trim()) {
        result = result.filter(p => p.status !== 'archived')
      }
    }
    if (search.trim()) {
      const q = search.toLowerCase()
      result = result.filter(p =>
        p.name.toLowerCase().includes(q) ||
        p.description?.toLowerCase().includes(q) ||
        p.tags.some(t => t.toLowerCase().includes(q))
      )
    }
    return result
  }, [projects, statusFilter, search])

  const statusCounts = useMemo(() => {
    const counts: Record<string, number> = { all: projects.length }
    STATUS_TABS.slice(1).forEach(s => {
      counts[s.id] = projects.filter(p => p.status === s.id).length
    })
    return counts
  }, [projects])

  return (
    <div className="p-6 lg:p-8 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-text-1">Projects</h1>
          <p className="text-sm text-text-2 mt-0.5">{projects.length} total projects</p>
        </div>
        <Button leftIcon={<Plus size={14} />} onClick={() => setShowForm(true)}>
          New Project
        </Button>
      </div>

      {/* Toolbar */}
      <div className="flex flex-col gap-3 mb-6">
        {/* Status tabs */}
        <Tabs
          tabs={STATUS_TABS.map(t => ({ ...t, count: statusCounts[t.id] }))}
          activeTab={statusFilter}
          onChange={id => setStatusFilter(id as typeof statusFilter)}
        />

        <div className="flex flex-row items-center gap-2 w-full">
          <div className="flex-1 min-w-0">
            <Input
              placeholder="Search projects..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              leftIcon={<Search size={13} />}
              rightIcon={search ? <button onClick={() => setSearch('')}><X size={12} /></button> : undefined}
              className="w-full"
            />
          </div>
          <div className="flex-shrink-0 flex items-center gap-1 bg-surface-2 border border-border rounded-lg p-1">
            {VIEW_OPTIONS.map(opt => (
              <button
                key={opt.id}
                onClick={() => setView(opt.id as ProjectView)}
                title={opt.label}
                aria-label={opt.label}
                className={`p-1.5 rounded-md transition-all ${view === opt.id ? 'bg-surface-3 text-text-1' : 'text-text-3 hover:text-text-2'}`}
              >
                <opt.icon size={14} />
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Content */}
      {filtered.length === 0 ? (
        <EmptyState
          icon={<FolderKanban size={20} />}
          title={search ? 'No projects found' : 'No projects yet'}
          description={search ? `No results for "${search}"` : 'Create your first project to start organizing your work.'}
          action={!search ? <Button leftIcon={<Plus size={12} />} onClick={() => setShowForm(true)}>Create Project</Button> : undefined}
        />
      ) : view === 'gallery' ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {filtered.map(project => (
            <ProjectCard
              key={project.id}
              project={project}
              progress={calculateProgress(tasks.filter(t => t.projectId === project.id))}
              onClick={() => navigate(`/projects/${project.id}`)}
            />
          ))}
        </div>
      ) : view === 'list' ? (
        <div className="space-y-2">
          {filtered.map(project => (
            <ProjectRow
              key={project.id}
              project={project}
              progress={calculateProgress(tasks.filter(t => t.projectId === project.id))}
              onClick={() => navigate(`/projects/${project.id}`)}
            />
          ))}
        </div>
      ) : view === 'board' ? (
        <ProjectBoardView />
      ) : (
        /* Table View */
        <div className="bg-surface border border-border rounded-xl overflow-x-auto w-full">
          <table className="w-full text-sm min-w-[600px] whitespace-nowrap">
            <thead>
              <tr className="border-b border-border bg-surface-2/50">
                {['Name', 'Status', 'Progress', 'Tasks', 'Updated'].map(h => (
                  <th key={h} className="text-left px-4 py-3 text-xs font-medium text-text-3 uppercase tracking-wide">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filtered.map(project => {
                const progress = calculateProgress(tasks.filter(t => t.projectId === project.id))
                return (
                  <tr
                    key={project.id}
                    className="border-b border-border/50 hover:bg-surface-2/30 cursor-pointer transition-colors"
                    onClick={() => navigate(`/projects/${project.id}`)}
                  >
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2.5">
                        {project.icon ? (() => {
                          const Icon = PROJECT_ICONS[project.icon]
                          return Icon ? (
                            <div className="w-5 h-5 rounded flex items-center justify-center flex-shrink-0" style={{ backgroundColor: hexToRgba(project.color, 0.2), color: project.color }}>
                              <Icon size={12} />
                            </div>
                          ) : <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: project.color }} />
                        })() : (
                          <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: project.color }} />
                        )}
                        <span className="font-medium text-text-1">{project.name}</span>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <StatusBadge status={project.status} />
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <div className="w-20 h-1.5 rounded-full bg-surface-3">
                          <div className="h-full rounded-full bg-primary transition-all" style={{ width: `${progress.percentage}%` }} />
                        </div>
                        <span className="text-xs text-text-3">{progress.percentage}%</span>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-text-2">{progress.total}</td>
                    <td className="px-4 py-3 text-text-3 text-xs">{new Date(project.updatedAt).toLocaleDateString()}</td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      )}

      <ProjectForm open={showForm} onClose={() => setShowForm(false)} />
    </div>
  )
}

function StatusBadge({ status }: { status: ProjectStatus }) {
  const variants: Record<ProjectStatus, 'success' | 'primary' | 'warning' | 'info' | 'default'> = {
    active: 'success', planning: 'info', review: 'warning', completed: 'primary', archived: 'default'
  }
  return <Badge variant={variants[status]} dot>{status}</Badge>
}
