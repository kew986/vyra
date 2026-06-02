import { useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import { FolderKanban, CheckSquare, Library, FileText, Plus, TrendingUp, Clock, AlertTriangle } from 'lucide-react'
import { useProjectStore } from '@/features/projects/store/projectStore'
import { useTaskStore } from '@/features/tasks/store/taskStore'
import { useLibraryStore } from '@/features/library/store/libraryStore'
import { useNoteStore } from '@/features/notes/store/noteStore'
import { useSettingsStore } from '@/features/settings/store/settingsStore'
import { Button } from '@/shared/ui/Button'
import { Card, EmptyState } from '@/shared/ui'
import { Badge } from '@/shared/ui/Badge'
import { ActivityFeed } from './components/ActivityFeed'
import { formatRelative, isOverdue } from '@/shared/utils/date'
import { calculateProgress } from '@/shared/utils/progress'
import { hexToRgba } from '@/shared/utils/color'

export default function DashboardPage() {
  const navigate = useNavigate()
  const projects = useProjectStore(s => s.projects)
  const tasks = useTaskStore(s => s.tasks)
  const library = useLibraryStore(s => s.items)
  const notes = useNoteStore(s => s.notes)
  const lastOpenedEntity = useSettingsStore(s => s.settings.lastOpenedEntity)

  const stats = useMemo(() => {
    const activeProjects = projects.filter(p => p.status === 'active').length
    const todayTasks = tasks.filter(t => t.status !== 'done' && isOverdue(t.dueDate)).length
    const doneTasks = tasks.filter(t => t.status === 'done').length
    return { activeProjects, todayTasks, doneTasks, totalLibrary: library.length }
  }, [projects, tasks, library])

  const recentProjects = useMemo(() =>
    [...projects].sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()).slice(0, 4),
    [projects]
  )

  const healthSummary = useMemo(() => {
    let healthy = 0, atRisk = 0, delayed = 0
    projects.forEach(p => {
      if (p.status === 'completed' || p.status === 'archived') return
      const pTasks = tasks.filter(t => t.projectId === p.id)
      const health = calculateProgress(pTasks).health
      if (health === 'overdue') delayed++
      else if (health === 'at-risk') atRisk++
      else healthy++
    })
    return { healthy, atRisk, delayed }
  }, [projects, tasks])
  
  return (
    <div className="p-6 lg:p-8 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-text-1">Dashboard</h1>
          <p className="text-sm text-text-2 mt-0.5">Welcome back — here's what's happening.</p>
        </div>
        <Button
          leftIcon={<Plus size={14} />}
          onClick={() => navigate('/projects')}
        >
          New Project
        </Button>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {[
          { label: 'Active Projects', value: stats.activeProjects, icon: FolderKanban, color: 'text-primary', bg: 'bg-primary/10', onClick: () => navigate('/projects') },
          { label: 'Overdue Tasks', value: stats.todayTasks, icon: AlertTriangle, color: 'text-danger', bg: 'bg-danger/10', onClick: () => navigate('/tasks') },
          { label: 'Tasks Done', value: stats.doneTasks, icon: TrendingUp, color: 'text-success', bg: 'bg-success/10', onClick: () => navigate('/tasks') },
          { label: 'Library Items', value: stats.totalLibrary, icon: Library, color: 'text-secondary', bg: 'bg-secondary/10', onClick: () => navigate('/library') },
        ].map(stat => (
          <Card key={stat.label} hoverable onClick={stat.onClick} className="p-4">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-xs text-text-3 font-medium uppercase tracking-wide mb-1">{stat.label}</p>
                <p className="text-3xl font-bold text-text-1">{stat.value}</p>
              </div>
              <div className={`w-9 h-9 rounded-xl ${stat.bg} ${stat.color} flex items-center justify-center`}>
                <stat.icon size={16} />
              </div>
            </div>
          </Card>
        ))}
      </div>

      {/* Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Recent Projects */}
        <div className="lg:col-span-2">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-sm font-semibold text-text-1">Recent Projects</h2>
            <Button variant="ghost" size="sm" onClick={() => navigate('/projects')}>View all</Button>
          </div>
          {recentProjects.length === 0 ? (
            <EmptyState
              icon={<FolderKanban size={18} />}
              title="No projects yet"
              description="Create your first project to get started."
              action={<Button size="sm" leftIcon={<Plus size={12} />} onClick={() => navigate('/projects')}>Create Project</Button>}
            />
          ) : (
            <div className="space-y-3">
              {recentProjects.map(project => {
                const projectTasks = tasks.filter(t => t.projectId === project.id)
                const progress = calculateProgress(projectTasks)
                return (
                  <Card key={project.id} hoverable onClick={() => navigate(`/projects/${project.id}`)} className="p-4">
                    <div className="flex items-center gap-3">
                      <div
                        className="w-3 h-3 rounded-full flex-shrink-0"
                        style={{ backgroundColor: project.color }}
                      />
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between mb-1.5">
                          <span className="font-medium text-text-1 text-sm truncate">{project.name}</span>
                          <span className="text-xs text-text-3 ml-2 flex-shrink-0">{formatRelative(project.updatedAt)}</span>
                        </div>
                        {projectTasks.length > 0 && (
                          <div className="flex items-center gap-2">
                            <div className="flex-1 h-1.5 rounded-full bg-surface-3 overflow-hidden">
                              <div
                                className="h-full rounded-full bg-primary transition-all"
                                style={{ width: `${progress.percentage}%` }}
                              />
                            </div>
                            <span className="text-xs text-text-3 flex-shrink-0">{progress.percentage}%</span>
                          </div>
                        )}
                      </div>
                    </div>
                  </Card>
                )
              })}
            </div>
          )}
        </div>

        {/* Right Column */}
        <div className="space-y-6">
          
          {/* Continue Where I Left Off */}
          {lastOpenedEntity && (
            <div>
              <h2 className="text-sm font-semibold text-text-1 mb-3">Jump Back In</h2>
              <Card hoverable onClick={() => navigate(lastOpenedEntity.url)} className="p-4 bg-primary/5 border-primary/20">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-primary/10 text-primary flex items-center justify-center">
                    {lastOpenedEntity.type === 'project' ? <FolderKanban size={14} /> :
                     lastOpenedEntity.type === 'task' ? <CheckSquare size={14} /> :
                     lastOpenedEntity.type === 'library' ? <Library size={14} /> :
                     <FileText size={14} />}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs text-text-3 capitalize mb-0.5">{lastOpenedEntity.type}</p>
                    <p className="text-sm font-medium text-text-1 truncate">{lastOpenedEntity.title}</p>
                  </div>
                </div>
              </Card>
            </div>
          )}

          {/* Project Health Summary */}
          <div>
            <h2 className="text-sm font-semibold text-text-1 mb-3">Project Health</h2>
            <Card className="p-4">
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 text-sm text-text-2">
                    <div className="w-2 h-2 rounded-full bg-success" /> Healthy
                  </div>
                  <span className="font-medium text-text-1">{healthSummary.healthy}</span>
                </div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 text-sm text-text-2">
                    <div className="w-2 h-2 rounded-full bg-warning" /> At Risk
                  </div>
                  <span className="font-medium text-text-1">{healthSummary.atRisk}</span>
                </div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 text-sm text-text-2">
                    <div className="w-2 h-2 rounded-full bg-danger" /> Delayed
                  </div>
                  <span className="font-medium text-text-1">{healthSummary.delayed}</span>
                </div>
              </div>
            </Card>
          </div>

          <ActivityFeed />
        </div>
      </div>
    </div>
  )
}
