import { useState } from 'react'
import { Flag, Calendar, MoreVertical, Pencil, Trash2, Copy, Clock } from 'lucide-react'
import { useTaskStore } from '../store/taskStore'
import { Badge } from '@/shared/ui/Badge'
import { Card, ConfirmDialog } from '@/shared/ui'
import { formatDate, isOverdue, isDueSoon } from '@/shared/utils/date'
import { TaskForm } from './TaskForm'
import { cn } from '@/shared/utils/cn'
import type { Task } from '@/shared/types'

const PRIORITY_VARIANTS: Record<Task['priority'], 'danger' | 'warning' | 'primary' | 'default'> = {
  critical: 'danger', high: 'warning', medium: 'primary', low: 'default'
}

const PRIORITY_ICONS: Record<Task['priority'], string> = {
  critical: '🔴', high: '🟠', medium: '🔵', low: '⚪'
}

interface TaskCardProps {
  task: Task
  isDragging?: boolean
}

export function TaskCard({ task, isDragging }: TaskCardProps) {
  const { remove, create } = useTaskStore()
  const [showEdit, setShowEdit] = useState(false)
  const [showDelete, setShowDelete] = useState(false)
  const [showMenu, setShowMenu] = useState(false)

  const handleDuplicate = async () => {
    setShowMenu(false)
    const { id, createdAt, updatedAt, ...rest } = task
    await create({
      ...rest,
      title: `${task.title} (Copy)`,
    })
  }

  return (
    <>
      <Card
        className={cn(
          'p-3 group relative transition-all',
          isDragging ? 'shadow-modal scale-[1.02] rotate-1 border-primary/40' : 'hover:border-border-2'
        )}
      >
        {/* Priority dot */}
        <div className="flex items-start justify-between gap-2 mb-2">
          <div className="flex items-center gap-1.5 min-w-0">
            <span className="text-xs">{PRIORITY_ICONS[task.priority]}</span>
            <p className="text-sm font-medium text-text-1 leading-snug line-clamp-2">{task.title}</p>
          </div>
          <div className="relative flex-shrink-0">
            <button
              onClick={e => { e.stopPropagation(); setShowMenu(m => !m) }}
              className="opacity-0 group-hover:opacity-100 p-1 rounded-md hover:bg-surface-3 text-text-3 hover:text-text-1 transition-all"
            >
              <MoreVertical size={12} />
            </button>
            {showMenu && (
              <div
                className="absolute right-0 top-6 z-20 bg-surface-2 border border-border rounded-xl shadow-dropdown py-1 w-36 animate-scale-in"
                onMouseLeave={() => setShowMenu(false)}
              >
                <button
                  onClick={() => { setShowMenu(false); setShowEdit(true) }}
                  className="flex items-center gap-2 w-full px-3 py-2 text-xs text-text-2 hover:text-text-1 hover:bg-surface-3 transition-all"
                >
                  <Pencil size={11} /> Edit
                </button>
                <button
                  onClick={handleDuplicate}
                  className="flex items-center gap-2 w-full px-3 py-2 text-xs text-text-2 hover:text-text-1 hover:bg-surface-3 transition-all"
                >
                  <Copy size={11} /> Duplicate
                </button>
                <button
                  onClick={() => { setShowMenu(false); setShowDelete(true) }}
                  className="flex items-center gap-2 w-full px-3 py-2 text-xs text-danger hover:bg-danger/10 transition-all"
                >
                  <Trash2 size={11} /> Delete
                </button>
              </div>
            )}
          </div>
        </div>

        {task.description && (
          <p className="text-xs text-text-3 mb-2 line-clamp-2">{task.description}</p>
        )}

        <div className="flex items-center justify-between gap-2 mt-1">
          <Badge variant={PRIORITY_VARIANTS[task.priority]} size="sm">{task.priority}</Badge>
          {task.dueDate && (
            <div className={cn(
              'flex items-center gap-1 text-xs',
              isOverdue(task.dueDate) ? 'text-danger' : isDueSoon(task.dueDate) ? 'text-warning' : 'text-text-3'
            )}>
              <Calendar size={10} />
              {formatDate(task.dueDate)}
            </div>
          )}
          {task.timeSpent !== undefined && task.timeSpent > 0 && (
            <div className="flex items-center gap-1 text-xs text-text-3 font-medium bg-surface-2 px-1.5 py-0.5 rounded border border-border">
              <Clock size={10} />
              {Math.floor(task.timeSpent / 60)}m
            </div>
          )}
        </div>

        {task.tags.length > 0 && (
          <div className="flex gap-1 mt-2 flex-wrap">
            {task.tags.slice(0, 2).map(tag => (
              <span key={tag} className="text-[10px] bg-surface-3 text-text-3 rounded-full px-1.5 py-0.5">{tag}</span>
            ))}
          </div>
        )}
      </Card>

      <TaskForm open={showEdit} onClose={() => setShowEdit(false)} task={task} projectId={task.projectId} />
      <ConfirmDialog
        open={showDelete}
        onClose={() => setShowDelete(false)}
        onConfirm={() => remove(task.id)}
        title="Delete Task"
        message={`Delete "${task.title}"?`}
      />
    </>
  )
}
