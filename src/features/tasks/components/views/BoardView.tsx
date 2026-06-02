import { useMemo, useState } from 'react'
import {
  DndContext, DragOverlay, closestCenter, PointerSensor, KeyboardSensor,
  useSensor, useSensors, useDroppable, type DragEndEvent, type DragStartEvent,
} from '@dnd-kit/core'
import {
  SortableContext, verticalListSortingStrategy, useSortable, arrayMove,
} from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import { useTaskStore } from '@/features/tasks/store/taskStore'
import { TaskCard } from '../TaskCard'
import type { Task, TaskStatus } from '@/shared/types'
import { cn } from '@/shared/utils/cn'

const COLUMNS: { id: TaskStatus; label: string; color: string }[] = [
  { id: 'backlog', label: 'Backlog', color: 'text-text-3' },
  { id: 'todo', label: 'To Do', color: 'text-text-2' },
  { id: 'in_progress', label: 'In Progress', color: 'text-primary' },
  { id: 'review', label: 'Review', color: 'text-warning' },
  { id: 'done', label: 'Done', color: 'text-success' },
]

interface TaskBoardViewProps {
  projectId?: string
}

export function TaskBoardView({ projectId }: TaskBoardViewProps) {
  const { tasks, moveTask, update } = useTaskStore()
  const [activeTask, setActiveTask] = useState<Task | null>(null)

  const filteredTasks = useMemo(() =>
    projectId ? tasks.filter(t => t.projectId === projectId) : tasks,
    [tasks, projectId]
  )

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } }),
    useSensor(KeyboardSensor)
  )

  const tasksByStatus = useMemo(() => {
    const map: Record<TaskStatus, Task[]> = {
      backlog: [], todo: [], in_progress: [], review: [], done: []
    }
    filteredTasks.forEach(t => map[t.status].push(t))
    Object.values(map).forEach(arr => arr.sort((a, b) => a.order - b.order))
    return map
  }, [filteredTasks])

  const handleDragStart = (e: DragStartEvent) => {
    const task = filteredTasks.find(t => t.id === e.active.id)
    setActiveTask(task ?? null)
  }

  const handleDragEnd = async (e: DragEndEvent) => {
    setActiveTask(null)
    const { active, over } = e
    if (!over || active.id === over.id) return

    const activeTask = filteredTasks.find(t => t.id === active.id)
    if (!activeTask) return

    // Check if dropped on a column (status change)
    const overStatus = COLUMNS.find(c => c.id === over.id)?.id
    if (overStatus && overStatus !== activeTask.status) {
      const newOrder = tasksByStatus[overStatus].length
      await moveTask(activeTask.id, overStatus, newOrder)
      return
    }

    // Dropped on another task — reorder within/across columns
    const overTask = filteredTasks.find(t => t.id === over.id)
    if (!overTask) return

    if (activeTask.status === overTask.status) {
      // Same column reorder
      const col = [...tasksByStatus[activeTask.status]]
      const oldIdx = col.findIndex(t => t.id === active.id)
      const newIdx = col.findIndex(t => t.id === over.id)
      const reordered = arrayMove(col, oldIdx, newIdx)
      await Promise.all(reordered.map((t, i) => update(t.id, { order: i })))
    } else {
      // Move to different column
      await moveTask(activeTask.id, overTask.status, overTask.order)
    }
  }

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCenter}
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
    >
      <div className="flex gap-3 overflow-x-auto pb-4 no-scrollbar snap-x snap-mandatory">
        {COLUMNS.map(col => {
          const colTasks = tasksByStatus[col.id]
          return (
            <div
              key={col.id}
              className="flex-shrink-0 w-[85vw] sm:w-64 lg:w-72 flex flex-col snap-center sm:snap-align-none"
            >
              {/* Column Header */}
              <div className="flex items-center justify-between mb-3 px-1">
                <div className="flex items-center gap-2">
                  <span className={cn('text-sm font-semibold', col.color)}>{col.label}</span>
                  <span className="text-xs bg-surface-3 text-text-3 rounded-full w-5 h-5 flex items-center justify-center">
                    {colTasks.length}
                  </span>
                </div>
              </div>

              {/* Task List (Droppable Column) */}
              <DroppableColumn col={col} colTasks={colTasks}>
                <SortableContext
                  items={colTasks.map(t => t.id)}
                  strategy={verticalListSortingStrategy}
                >
                  {colTasks.map(task => (
                    <SortableTaskCard key={task.id} task={task} />
                  ))}
                </SortableContext>
              </DroppableColumn>
            </div>
          )
        })}
      </div>

      <DragOverlay>
        {activeTask && <TaskCard task={activeTask} isDragging />}
      </DragOverlay>
    </DndContext>
  )
}

interface DroppableColumnProps {
  col: { id: TaskStatus; label: string; color: string }
  colTasks: Task[]
  children: React.ReactNode
}

function DroppableColumn({ col, colTasks, children }: DroppableColumnProps) {
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

        {colTasks.length === 0 && !isOver && (
          <div className="flex items-center justify-center h-24 text-text-3 text-xs border border-dashed border-border/40 rounded-xl bg-surface-2/20">
            Drop tasks here
          </div>
        )}
      </div>
      
      {/* Notion-style New Button Placeholder (opens global add modal ideally) */}
      <button className="mt-2 w-full flex items-center gap-1.5 px-2 py-1.5 text-sm font-medium text-text-3 hover:text-text-1 hover:bg-surface-2 rounded-lg transition-colors group">
        <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-text-3 group-hover:text-text-1 transition-colors"><path d="M5 12h14"/><path d="M12 5v14"/></svg>
        New
      </button>
    </div>
  )
}

function SortableTaskCard({ task }: { task: Task }) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: task.id })

  return (
    <div
      ref={setNodeRef}
      style={{ transform: CSS.Transform.toString(transform), transition }}
      className={cn(isDragging && 'opacity-40')}
      {...attributes}
      {...listeners}
    >
      <TaskCard task={task} />
    </div>
  )
}
