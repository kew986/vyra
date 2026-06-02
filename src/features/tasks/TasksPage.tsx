import { useState, useMemo, useEffect } from 'react'
import { useSearchParams } from 'react-router-dom'
import { Plus, Search, List, LayoutGrid, X } from 'lucide-react'
import { useTaskStore } from './store/taskStore'
import { useProjectStore } from '@/features/projects/store/projectStore'
import { Button } from '@/shared/ui/Button'
import { Input } from '@/shared/ui/Input'
import { EmptyState, Tabs } from '@/shared/ui'
import { TaskBoardView } from './components/views/BoardView'
import { TaskListView } from './components/views/ListView'
import { TaskForm } from './components/TaskForm'
import { CheckSquare, Filter } from 'lucide-react'
import type { TaskStatus, TaskPriority } from '@/shared/types'

const STATUS_TABS = [
  { id: 'all', label: 'All' },
  { id: 'backlog', label: 'Backlog' },
  { id: 'todo', label: 'To Do' },
  { id: 'in_progress', label: 'In Progress' },
  { id: 'review', label: 'Review' },
  { id: 'done', label: 'Done' },
]

export default function TasksPage() {
  const [searchParams, setSearchParams] = useSearchParams()
  const { tasks, view, setView } = useTaskStore()
  const projects = useProjectStore(s => s.projects)
  const [showForm, setShowForm] = useState(false)
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState<'all' | TaskStatus>('all')
  const [projectFilter, setProjectFilter] = useState<string>('')
  const [priorityFilter, setPriorityFilter] = useState<string>('')
  const [showFilters, setShowFilters] = useState(false)

  useEffect(() => {
    if (searchParams.get('new') === 'true') {
      setShowForm(true)
      const nextParams = new URLSearchParams(searchParams)
      nextParams.delete('new')
      setSearchParams(nextParams, { replace: true })
    }
  }, [searchParams, setSearchParams])


  const filtered = useMemo(() => {
    let result = [...tasks]
    if (statusFilter !== 'all') result = result.filter(t => t.status === statusFilter)
    if (projectFilter) result = result.filter(t => t.projectId === projectFilter)
    if (priorityFilter) result = result.filter(t => t.priority === priorityFilter)
    if (search.trim()) {
      const q = search.toLowerCase()
      result = result.filter(t => t.title.toLowerCase().includes(q) || t.description?.toLowerCase().includes(q))
    }
    return result
  }, [tasks, statusFilter, projectFilter, priorityFilter, search])

  const statusCounts = useMemo(() => {
    const counts: Record<string, number> = { all: tasks.length }
    STATUS_TABS.slice(1).forEach(s => { counts[s.id] = tasks.filter(t => t.status === s.id).length })
    return counts
  }, [tasks])

  // Use first project ID for new task creation
  const defaultProjectId = projects[0]?.id ?? ''

  return (
    <div className="p-6 lg:p-8 max-w-full">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-text-1">Tasks</h1>
          <p className="text-sm text-text-2 mt-0.5">{tasks.length} total tasks</p>
        </div>
        <Button leftIcon={<Plus size={14} />} onClick={() => setShowForm(true)}>
          New Task
        </Button>
      </div>

      {/* Toolbar */}
      <div className="flex flex-col gap-3 mb-6">
        <Tabs
          tabs={STATUS_TABS.map(t => ({ ...t, count: statusCounts[t.id] }))}
          activeTab={statusFilter}
          onChange={id => setStatusFilter(id as typeof statusFilter)}
        />
        <div className="flex flex-col sm:flex-row items-center gap-3 w-full">
          <div className="flex-1 min-w-0 w-full">
            <Input
              placeholder="Search tasks..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              leftIcon={<Search size={13} />}
              rightIcon={search ? <button onClick={() => setSearch('')}><X size={12} /></button> : undefined}
              className="w-full"
            />
          </div>
          
          <div className="flex flex-row items-center gap-2 w-full sm:w-auto overflow-x-auto pb-1 sm:pb-0">
            {projects.length > 0 && (
              <select
                value={projectFilter}
                onChange={e => setProjectFilter(e.target.value)}
                className="flex-shrink-0 h-9 px-3 rounded-lg bg-surface-2 border border-border text-sm text-text-1 focus:outline-none focus:border-primary"
              >
                <option value="">All Projects</option>
                {projects.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
              </select>
            )}
            <button 
              onClick={() => setShowFilters(!showFilters)}
              className={`flex-shrink-0 flex items-center justify-center gap-2 h-9 px-3 rounded-lg border text-sm transition-all whitespace-nowrap ${showFilters ? 'bg-primary/10 text-primary border-primary/30' : 'bg-surface-2 border-border text-text-2 hover:text-text-1'}`}
            >
              <Filter size={14} /> 
              <span className="hidden sm:inline">Filters</span>
            </button>
            <div className="flex-shrink-0 flex items-center gap-1 bg-surface-2 border border-border rounded-lg p-1">
              <button onClick={() => setView('board')} title="Board view"
                className={`p-1.5 rounded-md transition-all ${view === 'board' ? 'bg-surface-3 text-text-1' : 'text-text-3 hover:text-text-2'}`}>
                <LayoutGrid size={14} />
              </button>
              <button onClick={() => setView('list')} title="List view"
                className={`p-1.5 rounded-md transition-all ${view === 'list' ? 'bg-surface-3 text-text-1' : 'text-text-3 hover:text-text-2'}`}>
                <List size={14} />
              </button>
            </div>
          </div>
        </div>
        {showFilters && (
          <div className="flex items-center gap-3 p-3 bg-surface-2 border border-border rounded-xl">
            <select
              value={priorityFilter}
              onChange={e => setPriorityFilter(e.target.value)}
              className="h-8 px-2 rounded-lg bg-surface border border-border text-sm text-text-1 focus:outline-none focus:border-primary"
            >
              <option value="">All Priorities</option>
              <option value="low">Low</option>
              <option value="medium">Medium</option>
              <option value="high">High</option>
              <option value="critical">Critical</option>
            </select>
          </div>
        )}
      </div>

      {filtered.length === 0 ? (
        <EmptyState
          icon={<CheckSquare size={20} />}
          title="No tasks yet"
          description="Create your first task to start tracking your work."
          action={<Button leftIcon={<Plus size={12} />} onClick={() => setShowForm(true)}>Create Task</Button>}
        />
      ) : view === 'board' ? (
        <TaskBoardView />
      ) : (
        <TaskListView />
      )}

      {showForm && <TaskForm open={showForm} onClose={() => setShowForm(false)} projectId={defaultProjectId} />}
    </div>
  )
}
