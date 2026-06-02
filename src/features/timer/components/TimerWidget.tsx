import { useEffect, useState } from 'react'
import { Play, Pause, Square, ChevronDown, Check, Clock } from 'lucide-react'
import { useTimerStore, TimerMode } from '../store/timerStore'
import { useTaskStore } from '@/features/tasks/store/taskStore'
import { cn } from '@/shared/utils/cn'

export function TimerWidget() {
  const { mode, isRunning, remainingSeconds, activeTaskId, start, pause, reset, setMode, tick, setActiveTask } = useTimerStore()
  const { tasks, update } = useTaskStore()
  const [dropdownOpen, setDropdownOpen] = useState(false)
  const [taskDropdownOpen, setTaskDropdownOpen] = useState(false)

  // Global Tick
  useEffect(() => {
    const interval = setInterval(() => {
      tick()
      // If timer is running and we have an active task, we should also increment its timeSpent
      // We'll just do it locally every tick for precision, but batch updates to the DB every 10 seconds or when paused
      // To keep it simple, let's update task store every 10 seconds
    }, 1000)
    return () => clearInterval(interval)
  }, [tick])

  // Periodically save timeSpent to task (every 10s if running and activeTask exists)
  useEffect(() => {
    if (!isRunning || !activeTaskId || (mode !== 'pomodoro' && mode !== 'flow')) return
    
    const interval = setInterval(() => {
      const task = tasks.find(t => t.id === activeTaskId)
      if (task) {
        update(activeTaskId, { timeSpent: (task.timeSpent || 0) + 10 })
      }
    }, 10000)
    return () => clearInterval(interval)
  }, [isRunning, activeTaskId, tasks, update, mode])

  const formatTime = (totalSeconds: number) => {
    const m = Math.floor(totalSeconds / 60)
    const s = totalSeconds % 60
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`
  }

  const activeTask = tasks.find(t => t.id === activeTaskId)

  const MODE_LABELS: Record<TimerMode, string> = {
    pomodoro: 'Focus (25m)',
    shortBreak: 'Short Break (5m)',
    longBreak: 'Long Break (15m)',
    flow: 'Flow (Stopwatch)'
  }

  return (
    <div className="flex items-center gap-2 bg-surface-2 border border-border rounded-full pl-2 pr-1 py-1 relative hover-magnetic">
      
      {/* Mode Selector */}
      <div className="relative">
        <button 
          onClick={() => { setDropdownOpen(!dropdownOpen); setTaskDropdownOpen(false) }}
          className="flex items-center gap-1.5 px-2 py-1 text-xs font-medium text-text-2 hover:text-text-1 rounded-md transition-colors"
        >
          <div className="relative flex items-center justify-center">
            <Clock size={14} className={isRunning ? 'text-primary' : ''} />
            {isRunning && (
              <span className="absolute -top-0.5 -right-0.5 w-1.5 h-1.5 rounded-full bg-accent animate-timer-pulse" />
            )}
          </div>
          {formatTime(remainingSeconds)}
          <ChevronDown size={12} />
        </button>
        
        {dropdownOpen && (
          <>
            <div className="fixed inset-0 z-40" onClick={() => setDropdownOpen(false)} />
            <div className="absolute top-full left-0 mt-2 w-48 bg-surface border border-border rounded-xl shadow-xl z-50 p-1 py-1.5">
              {(Object.keys(MODE_LABELS) as TimerMode[]).map(m => (
                <button
                  key={m}
                  onClick={() => { setMode(m); setDropdownOpen(false) }}
                  className="flex items-center justify-between w-full px-3 py-1.5 text-xs text-text-2 hover:text-text-1 hover:bg-surface-2 rounded-md"
                >
                  {MODE_LABELS[m]}
                  {mode === m && <Check size={12} className="text-primary" />}
                </button>
              ))}
            </div>
          </>
        )}
      </div>
 
      <div className="w-px h-4 bg-border mx-1" />
 
      {/* Task Selector */}
      <div className="relative flex-1 min-w-[100px] max-w-[200px]">
        <button
          onClick={() => { setTaskDropdownOpen(!taskDropdownOpen); setDropdownOpen(false) }}
          className="w-full flex items-center justify-between gap-2 px-2 py-1 text-xs text-text-2 hover:text-text-1 rounded-md transition-colors truncate"
        >
          <span className="truncate">{activeTask ? activeTask.title : 'Select Task...'}</span>
          <ChevronDown size={12} className="flex-shrink-0" />
        </button>
 
        {taskDropdownOpen && (
          <>
            <div className="fixed inset-0 z-40" onClick={() => setTaskDropdownOpen(false)} />
            <div className="absolute top-full left-1/2 -translate-x-1/2 mt-2 w-64 max-h-64 overflow-y-auto bg-surface border border-border rounded-xl shadow-xl z-50 p-1">
              <button
                onClick={() => { setActiveTask(null); setTaskDropdownOpen(false) }}
                className="w-full text-left px-3 py-2 text-xs text-text-2 hover:text-text-1 hover:bg-surface-2 rounded-md italic"
              >
                None (General Time)
              </button>
              {tasks.filter(t => t.status !== 'done').map(task => (
                <button
                  key={task.id}
                  onClick={() => { setActiveTask(task.id); setTaskDropdownOpen(false) }}
                  className="flex items-center justify-between w-full px-3 py-2 text-xs text-text-2 hover:text-text-1 hover:bg-surface-2 rounded-md text-left"
                >
                  <span className="truncate flex-1 pr-2">{task.title}</span>
                  {activeTaskId === task.id && <Check size={12} className="text-primary flex-shrink-0" />}
                </button>
              ))}
            </div>
          </>
        )}
      </div>

      {/* Controls */}
      <div className="flex items-center gap-1 bg-surface rounded-full border border-border/50 p-0.5 ml-2">
        {isRunning ? (
          <button onClick={pause} className="p-1.5 text-text-2 hover:text-warning rounded-full transition-colors bg-surface-2">
            <Pause size={12} fill="currentColor" />
          </button>
        ) : (
          <button onClick={start} className="p-1.5 text-text-2 hover:text-success rounded-full transition-colors bg-surface-2">
            <Play size={12} fill="currentColor" />
          </button>
        )}
        <button onClick={reset} className="p-1.5 text-text-3 hover:text-text-1 rounded-full transition-colors" title="Reset">
          <Square size={10} fill="currentColor" />
        </button>
      </div>
    </div>
  )
}
