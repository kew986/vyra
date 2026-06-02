import type { Project, ProjectProgress } from '@/shared/types'
import { Badge } from '@/shared/ui/Badge'
import { Card } from '@/shared/ui'
import { formatDate, isOverdue } from '@/shared/utils/date'
import { cn } from '@/shared/utils/cn'
import { Calendar, CheckSquare, ChevronRight } from 'lucide-react'
import { PROJECT_ICONS } from '@/shared/utils/icons'
import { hexToRgba } from '@/shared/utils/color'

interface ProjectRowProps {
  project: Project
  progress: ProjectProgress
  onClick: () => void
}

const STATUS_VARIANTS: Record<Project['status'], 'success' | 'primary' | 'warning' | 'info' | 'default'> = {
  active: 'success', planning: 'info', review: 'warning', completed: 'primary', archived: 'default'
}

export function ProjectRow({ project, progress, onClick }: ProjectRowProps) {
  return (
    <Card hoverable onClick={onClick} className="px-4 py-3 flex items-center gap-4">
      {project.icon ? (() => {
        const Icon = PROJECT_ICONS[project.icon]
        return Icon ? (
          <div className="w-6 h-6 rounded flex items-center justify-center flex-shrink-0" style={{ backgroundColor: hexToRgba(project.color, 0.2), color: project.color }}>
            <Icon size={14} />
          </div>
        ) : <div className="w-3 h-3 rounded-full flex-shrink-0" style={{ backgroundColor: project.color }} />
      })() : (
        <div className="w-3 h-3 rounded-full flex-shrink-0" style={{ backgroundColor: project.color }} />
      )}

      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-3">
          <h3 className="font-medium text-sm text-text-1 truncate">{project.name}</h3>
          <Badge variant={STATUS_VARIANTS[project.status]} size="sm">{project.status}</Badge>
        </div>
        {project.description && (
          <p className="text-xs text-text-2 truncate mt-0.5">{project.description}</p>
        )}
      </div>

      {/* Progress mini */}
      {progress.total > 0 && (
        <div className="flex items-center gap-2 flex-shrink-0 hidden sm:flex">
          <div className="w-20 h-1.5 rounded-full bg-surface-3">
            <div className="h-full rounded-full bg-primary" style={{ width: `${progress.percentage}%` }} />
          </div>
          <span className="text-xs text-text-3 w-8">{progress.percentage}%</span>
          <span className="text-xs text-text-3 flex items-center gap-0.5">
            <CheckSquare size={10} /> {progress.done}/{progress.total}
          </span>
        </div>
      )}

      {project.dueDate && (
        <div className={cn('flex items-center gap-1 text-xs flex-shrink-0 hidden md:flex', isOverdue(project.dueDate) ? 'text-danger' : 'text-text-3')}>
          <Calendar size={10} />
          {formatDate(project.dueDate)}
        </div>
      )}

      <ChevronRight size={14} className="text-text-3 flex-shrink-0" />
    </Card>
  )
}
