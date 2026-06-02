import { useMemo } from 'react'
import { useTaskStore } from '@/features/tasks/store/taskStore'
import { Badge } from '@/shared/ui/Badge'
import { Card } from '@/shared/ui'
import { formatDate, isOverdue } from '@/shared/utils/date'
import { Calendar, Clock } from 'lucide-react'
import { cn } from '@/shared/utils/cn'
import type { Task } from '@/shared/types'

interface TaskListViewProps {
  projectId?: string
}

const PRIORITY_VARIANTS: Record<Task['priority'], 'danger' | 'warning' | 'primary' | 'default'> = {
  critical: 'danger', high: 'warning', medium: 'primary', low: 'default'
}

const STATUS_VARIANTS: Record<Task['status'], 'default' | 'primary' | 'warning' | 'success' | 'info'> = {
  backlog: 'default', todo: 'info', in_progress: 'primary', review: 'warning', done: 'success'
}

export function TaskListView({ projectId }: TaskListViewProps) {
  const tasks = useTaskStore(s => s.tasks)

  const filtered = useMemo(() => {
    const list = projectId ? tasks.filter(t => t.projectId === projectId) : tasks
    return list.sort((a, b) => {
      const pOrder = { critical: 0, high: 1, medium: 2, low: 3 }
      return pOrder[a.priority] - pOrder[b.priority]
    })
  }, [tasks, projectId])

  return (
    <div className="space-y-2">
      {filtered.map(task => (
        <Card key={task.id} className="px-4 py-3 flex items-center gap-3 hover:border-border-2 transition-colors">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1">
              <span className="text-sm font-medium text-text-1 truncate">{task.title}</span>
            </div>
            {task.description && (
              <p className="text-xs text-text-2 truncate">{task.description}</p>
            )}
          </div>
          <div className="flex items-center gap-2 flex-shrink-0">
            <Badge variant={STATUS_VARIANTS[task.status]} size="sm">{task.status.replace('_', ' ')}</Badge>
            <Badge variant={PRIORITY_VARIANTS[task.priority]} size="sm">{task.priority}</Badge>
            {task.dueDate && (
              <div className={cn('flex items-center gap-1 text-xs', isOverdue(task.dueDate) ? 'text-danger' : 'text-text-3')}>
                <Calendar size={10} /> {formatDate(task.dueDate)}
              </div>
            )}
            {task.timeSpent !== undefined && task.timeSpent > 0 && (
              <div className="flex items-center gap-1 text-xs text-text-3 font-medium bg-surface-2 px-1.5 py-0.5 rounded border border-border ml-2">
                <Clock size={10} /> {Math.floor(task.timeSpent / 60)}m
              </div>
            )}
          </div>
        </Card>
      ))}
    </div>
  )
}
