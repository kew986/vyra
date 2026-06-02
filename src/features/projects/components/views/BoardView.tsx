import { useMemo, useState } from 'react'
import {
  DndContext, DragOverlay, closestCenter, PointerSensor, KeyboardSensor,
  useSensor, useSensors, useDroppable, type DragEndEvent, type DragStartEvent,
} from '@dnd-kit/core'
import {
  SortableContext, verticalListSortingStrategy, useSortable,
} from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import { useProjectStore } from '@/features/projects/store/projectStore'
import { useTaskStore } from '@/features/tasks/store/taskStore'
import { ProjectCard } from '../ProjectCard'
import { calculateProgress } from '@/shared/utils/progress'
import type { Project, ProjectStatus } from '@/shared/types'
import { cn } from '@/shared/utils/cn'

const COLUMNS: { id: ProjectStatus; label: string; color: string }[] = [
  { id: 'planning', label: 'Planning', color: 'text-info' },
  { id: 'active', label: 'Active', color: 'text-success' },
  { id: 'review', label: 'Review', color: 'text-warning' },
  { id: 'completed', label: 'Completed', color: 'text-primary' },
  { id: 'archived', label: 'Archived', color: 'text-text-3' },
]

export function ProjectBoardView() {
  const { projects, update } = useProjectStore()
  const tasks = useTaskStore(s => s.tasks)
  const [activeProject, setActiveProject] = useState<Project | null>(null)

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } }),
    useSensor(KeyboardSensor)
  )

  const projectsByStatus = useMemo(() => {
    const map: Record<ProjectStatus, Project[]> = {
      planning: [], active: [], review: [], completed: [], archived: []
    }
    // We don't have an order field for projects, so we just sort by updatedAt desc
    projects.forEach(p => map[p.status].push(p))
    Object.values(map).forEach(arr => arr.sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()))
    return map
  }, [projects])

  const handleDragStart = (e: DragStartEvent) => {
    const project = projects.find(p => p.id === e.active.id)
    setActiveProject(project ?? null)
  }

  const handleDragEnd = async (e: DragEndEvent) => {
    setActiveProject(null)
    const { active, over } = e
    if (!over || active.id === over.id) return

    const activeProject = projects.find(p => p.id === active.id)
    if (!activeProject) return

    // Check if dropped on a column (status change)
    const overStatus = COLUMNS.find(c => c.id === over.id)?.id
    
    if (overStatus && overStatus !== activeProject.status) {
      await update(activeProject.id, { status: overStatus })
      return
    }

    // If dropped on another project, just take its column status (since we don't have custom ordering for projects)
    const overProject = projects.find(p => p.id === over.id)
    if (overProject && activeProject.status !== overProject.status) {
      await update(activeProject.id, { status: overProject.status })
    }
  }

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCenter}
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
    >
      <div className="flex gap-4 overflow-x-auto pb-4 no-scrollbar snap-x snap-mandatory">
        {COLUMNS.map(col => {
          const colProjects = projectsByStatus[col.id]
          return (
            <div
              key={col.id}
              className="flex-shrink-0 w-[85vw] sm:w-72 lg:w-80 flex flex-col snap-center sm:snap-align-none"
            >
              {/* Column Header */}
              <div className="flex items-center justify-between mb-3 px-1">
                <div className="flex items-center gap-2">
                  <span className={cn('text-sm font-semibold capitalize', 
                    col.id === 'planning' ? 'text-info' :
                    col.id === 'active' ? 'text-success' :
                    col.id === 'review' ? 'text-warning' :
                    col.id === 'completed' ? 'text-primary' : 'text-text-3'
                  )}>{col.label}</span>
                  <span className="text-xs bg-surface-3 text-text-3 rounded-full w-5 h-5 flex items-center justify-center">
                    {colProjects.length}
                  </span>
                </div>
              </div>

              {/* Project List (Droppable Column) */}
              <DroppableColumn col={col} colProjects={colProjects}>
                <SortableContext
                  items={colProjects.map(p => p.id)}
                  strategy={verticalListSortingStrategy}
                >
                  {colProjects.map(project => (
                    <SortableProjectCard 
                      key={project.id} 
                      project={project} 
                      progress={calculateProgress(tasks.filter(t => t.projectId === project.id))} 
                    />
                  ))}
                </SortableContext>
              </DroppableColumn>
            </div>
          )
        })}
      </div>

      <DragOverlay>
        {activeProject && (
          <div className="rotate-2 scale-105 shadow-xl transition-all">
            <ProjectCard 
              project={activeProject} 
              progress={calculateProgress(tasks.filter(t => t.projectId === activeProject.id))}
              onClick={() => {}}
            />
          </div>
        )}
      </DragOverlay>
    </DndContext>
  )
}

interface DroppableColumnProps {
  col: { id: ProjectStatus; label: string }
  colProjects: Project[]
  children: React.ReactNode
}

function DroppableColumn({ col, colProjects, children }: DroppableColumnProps) {
  const { setNodeRef, isOver } = useDroppable({ id: col.id })

  return (
    <div className="flex flex-col flex-1 h-full">
      <div
        ref={setNodeRef}
        className={cn(
          'flex-1 rounded-xl min-h-[200px] space-y-2.5 transition-all duration-150',
          isOver
            ? 'bg-primary/5 ring-1 ring-primary/30 shadow-[inset_0_0_12px_rgba(91,140,255,0.06)]'
            : 'bg-transparent'
        )}
      >
        {children}

        {colProjects.length === 0 && !isOver && (
          <div className="flex items-center justify-center h-24 text-text-3 text-xs border border-dashed border-border/40 rounded-xl bg-surface-2/20">
            Drop projects here
          </div>
        )}
      </div>

      {/* Notion-style New Button Placeholder */}
      <button className="mt-2 w-full flex items-center gap-1.5 px-2 py-1.5 text-sm font-medium text-text-3 hover:text-text-1 hover:bg-surface-2 rounded-lg transition-colors group">
        <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-text-3 group-hover:text-text-1 transition-colors"><path d="M5 12h14"/><path d="M12 5v14"/></svg>
        New
      </button>
    </div>
  )
}

interface SortableProjectCardProps {
  project: Project
  progress: ReturnType<typeof calculateProgress>
}

function SortableProjectCard({ project, progress }: SortableProjectCardProps) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: project.id })

  return (
    <div
      ref={setNodeRef}
      style={{ transform: CSS.Transform.toString(transform), transition }}
      className={cn(isDragging && 'opacity-40')}
      {...attributes}
      {...listeners}
    >
      <ProjectCard project={project} progress={progress} onClick={() => {}} />
    </div>
  )
}
