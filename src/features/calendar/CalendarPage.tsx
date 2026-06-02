import { useState, useMemo } from 'react'
import { ChevronLeft, ChevronRight, Plus, Calendar as CalendarIcon } from 'lucide-react'
import { 
  startOfMonth, endOfMonth, startOfWeek, endOfWeek, 
  addDays, addMonths, isSameDay, isSameMonth, formatMonthYear, isOverdue 
} from '@/shared/utils/date'
import { useProjectStore } from '@/features/projects/store/projectStore'
import { useTaskStore } from '@/features/tasks/store/taskStore'
import { cn } from '@/shared/utils/cn'
import type { Task } from '@/shared/types'
import { TaskForm } from '@/features/tasks/components/TaskForm'

export default function CalendarPage() {
  const [currentDate, setCurrentDate] = useState(new Date())
  const projects = useProjectStore(s => s.projects)
  const tasks = useTaskStore(s => s.tasks)
  
  // Modal state
  const [editingTask, setEditingTask] = useState<Task | undefined>(undefined)
  const [isFormOpen, setIsFormOpen] = useState(false)
  const [selectedDateStr, setSelectedDateStr] = useState<string>('')

  // Generate calendar grid
  const days = useMemo(() => {
    const start = startOfWeek(startOfMonth(currentDate))
    const end = endOfWeek(endOfMonth(currentDate))
    const daysArray = []
    let current = start
    while (current <= end) {
      daysArray.push(new Date(current))
      current = addDays(current, 1)
    }
    return daysArray
  }, [currentDate])

  const nextMonth = () => setCurrentDate(addMonths(currentDate, 1))
  const prevMonth = () => setCurrentDate(addMonths(currentDate, -1))
  const today = () => setCurrentDate(new Date())

  const scheduledTasks = tasks.filter(t => t.dueDate)

  const getProjectColor = (projectId: string) => {
    return projects.find(p => p.id === projectId)?.color || '#3B82F6'
  }

  const handleDayClick = (date: Date) => {
    const pad = (n: number) => n.toString().padStart(2, '0')
    const dateStr = `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`
    setSelectedDateStr(dateStr)
    setEditingTask(undefined)
    setIsFormOpen(true)
  }

  const handleTaskClick = (e: React.MouseEvent, task: Task) => {
    e.stopPropagation()
    setEditingTask(task)
    setIsFormOpen(true)
  }

  return (
    <div className="flex flex-col h-[calc(100vh-56px)] p-6 lg:p-8">
      <div className="flex items-center justify-between mb-6 flex-shrink-0">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-primary/10 text-primary rounded-xl flex items-center justify-center">
            <CalendarIcon size={20} />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-text-1">Calendar</h1>
            <p className="text-sm text-text-2">Manage deadlines and schedules</p>
          </div>
        </div>

        <div className="flex items-center gap-4">
          <h2 className="text-lg font-bold text-text-1 hidden sm:block">{formatMonthYear(currentDate)}</h2>
          <div className="flex items-center gap-1">
            <button onClick={today} className="px-3 py-1.5 text-xs font-medium text-text-2 bg-surface-2 hover:bg-surface-3 rounded border border-border mr-2 transition-colors">
              Today
            </button>
            <button onClick={prevMonth} className="p-1.5 text-text-2 hover:text-text-1 hover:bg-surface-2 rounded border border-border transition-colors">
              <ChevronLeft size={16} />
            </button>
            <button onClick={nextMonth} className="p-1.5 text-text-2 hover:text-text-1 hover:bg-surface-2 rounded border border-border transition-colors">
              <ChevronRight size={16} />
            </button>
          </div>
        </div>
      </div>

      <div className="flex-1 flex flex-col min-h-0 border border-border rounded-xl overflow-hidden bg-surface shadow-sm">
        {/* Days Header */}
        <div className="grid grid-cols-7 border-b border-border bg-surface-2 flex-shrink-0">
          {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
            <div key={day} className="py-3 text-center text-xs font-semibold text-text-3 uppercase tracking-wider">
              {day}
            </div>
          ))}
        </div>

        {/* Calendar Grid */}
        <div className="flex-1 overflow-y-auto no-scrollbar">
          <div className="grid grid-cols-7 auto-rows-[minmax(140px,auto)] h-full">
            {days.map((day, i) => {
              const isCurrentMonth = isSameMonth(day, currentDate)
              const isToday = isSameDay(day, new Date())
              
              const dayTasks = scheduledTasks.filter(t => {
                if (!t.dueDate) return false
                const tDate = new Date(t.dueDate)
                return tDate.getFullYear() === day.getFullYear() && 
                       tDate.getMonth() === day.getMonth() && 
                       tDate.getDate() === day.getDate()
              })

              return (
                <div 
                  key={day.toISOString()}
                  onClick={() => handleDayClick(day)}
                  className={cn(
                    "min-h-[140px] p-2 border-r border-b border-border transition-colors cursor-pointer group hover:bg-surface-2/50 relative",
                    !isCurrentMonth && "bg-surface-2/30",
                    (i + 1) % 7 === 0 && "border-r-0"
                  )}
                >
                  <div className="flex items-center justify-between mb-2">
                    <span className={cn(
                      "text-xs font-medium w-6 h-6 flex items-center justify-center rounded-full",
                      isToday ? "bg-primary text-white" : isCurrentMonth ? "text-text-1" : "text-text-3"
                    )}>
                      {day.getDate()}
                    </span>
                    <Plus size={14} className="text-text-3 opacity-0 group-hover:opacity-100 transition-opacity" />
                  </div>
                  
                  <div className="space-y-1.5 mt-2">
                    {dayTasks.map(task => {
                      const overdue = isOverdue(task.dueDate) && task.status !== 'done'
                      return (
                        <div
                          key={task.id}
                          onClick={(e) => handleTaskClick(e, task)}
                          className={cn(
                            "text-xs px-2 py-1.5 rounded truncate border transition-all hover:brightness-110",
                            task.status === 'done' ? "opacity-50 line-through border-transparent bg-surface-3 text-text-3" :
                            overdue ? "border-danger/30 bg-danger/10 text-danger font-medium" :
                            "border-transparent bg-surface-3 text-text-2 hover:text-text-1 font-medium"
                          )}
                        >
                          <div className="flex items-center gap-2">
                            <span 
                              className="w-2 h-2 rounded-full flex-shrink-0" 
                              style={{ backgroundColor: getProjectColor(task.projectId) }}
                            />
                            <span className="truncate">{task.title}</span>
                          </div>
                        </div>
                      )
                    })}
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      </div>

      {isFormOpen && (
        <TaskForm 
          open={isFormOpen}
          onClose={() => setIsFormOpen(false)}
          projectId={editingTask?.projectId || projects[0]?.id || ''}
          task={editingTask ? { ...editingTask } : undefined}
          initialDueDate={!editingTask ? selectedDateStr : undefined}
        />
      )}
    </div>
  )
}
