import { MoreVertical, Calendar, CheckSquare } from 'lucide-react'
import type { Project, ProjectProgress } from '@/shared/types'
import { Badge } from '@/shared/ui/Badge'
import { Card } from '@/shared/ui'
import { formatDate, isOverdue } from '@/shared/utils/date'
import { hexToRgba } from '@/shared/utils/color'
import { PROJECT_ICONS } from '@/shared/utils/icons'
import { cn } from '@/shared/utils/cn'

interface ProjectCardProps {
  project: Project
  progress: ProjectProgress
  onClick: () => void
}

const STATUS_VARIANTS: Record<Project['status'], 'success' | 'primary' | 'warning' | 'info' | 'default'> = {
  active: 'success', planning: 'info', review: 'warning', completed: 'primary', archived: 'default'
}

const HEALTH_COLORS = {
  'on-track': 'text-success',
  'at-risk': 'text-warning',
  'overdue': 'text-danger',
  'not-started': 'text-text-3',
}

export function ProjectCard({ project, progress, onClick }: ProjectCardProps) {
  return (
    <Card hoverable onClick={onClick} className="overflow-hidden group">
      {/* Cover / Color strip */}
      {project.coverImage ? (
        <div className="h-32 overflow-hidden">
          <img
            src={project.coverImage}
            alt={project.name}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
          />
        </div>
      ) : (
        <div
          className="h-2"
          style={{ background: `linear-gradient(90deg, ${project.color}, ${hexToRgba(project.color, 0.3)})` }}
        />
      )}

      <div className="p-4">
        {/* Header */}
        <div className="flex items-start justify-between mb-2">
          <div className="flex items-center gap-2 min-w-0">
            {project.icon ? (() => {
              const Icon = PROJECT_ICONS[project.icon]
              return Icon ? (
                <div className="w-5 h-5 rounded flex items-center justify-center flex-shrink-0" style={{ backgroundColor: hexToRgba(project.color, 0.2), color: project.color }}>
                  <Icon size={12} />
                </div>
              ) : <div className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ backgroundColor: project.color }} />
            })() : (
              <div className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ backgroundColor: project.color }} />
            )}
            <h3 className="font-semibold text-sm text-text-1 truncate">{project.name}</h3>
          </div>
          <Badge variant={STATUS_VARIANTS[project.status]} size="sm">{project.status}</Badge>
        </div>

        {/* Description */}
        {project.description && (
          <p className="text-xs text-text-2 line-clamp-2 mb-3">{project.description}</p>
        )}

        {/* Tags */}
        {project.tags.length > 0 && (
          <div className="flex gap-1 flex-wrap mb-3">
            {project.tags.slice(0, 3).map(tag => (
              <span key={tag} className="text-xs bg-surface-3 text-text-3 rounded-full px-2 py-0.5">{tag}</span>
            ))}
            {project.tags.length > 3 && (
              <span className="text-xs text-text-3">+{project.tags.length - 3}</span>
            )}
          </div>
        )}

        {/* Progress */}
        {progress.total > 0 && (
          <div className="mb-3">
            <div className="flex items-center justify-between mb-1">
              <span className="text-xs text-text-3 flex items-center gap-1">
                <CheckSquare size={10} />
                {progress.done}/{progress.total} tasks
              </span>
              <span className={cn('text-xs font-medium', HEALTH_COLORS[progress.health])}>
                {progress.percentage}%
              </span>
            </div>
            <div className="h-1.5 rounded-full bg-surface-3 overflow-hidden">
              <div
                className="h-full rounded-full transition-all duration-300"
                style={{
                  width: `${progress.percentage}%`,
                  backgroundColor: progress.health === 'overdue' ? 'var(--color-danger)'
                    : progress.health === 'at-risk' ? 'var(--color-warning)'
                    : 'var(--color-primary)'
                }}
              />
            </div>
          </div>
        )}

        {/* Footer */}
        {project.dueDate && (
          <div className={cn('flex items-center gap-1 text-xs', isOverdue(project.dueDate) ? 'text-danger' : 'text-text-3')}>
            <Calendar size={10} />
            {isOverdue(project.dueDate) ? 'Overdue · ' : ''}{formatDate(project.dueDate)}
          </div>
        )}
      </div>
    </Card>
  )
}
