import { create } from 'zustand'
import { persist } from 'zustand/middleware'

export type TimerMode = 'pomodoro' | 'shortBreak' | 'longBreak' | 'flow'

interface TimerState {
  activeTaskId: string | null
  mode: TimerMode
  isRunning: boolean
  remainingSeconds: number
  
  // Actions
  setActiveTask: (taskId: string | null) => void
  setMode: (mode: TimerMode) => void
  start: () => void
  pause: () => void
  reset: () => void
  tick: () => void
}

const DEFAULT_TIMES = {
  pomodoro: 25 * 60,
  shortBreak: 5 * 60,
  longBreak: 15 * 60,
  flow: 0 // Flow counts up
}

export const useTimerStore = create<TimerState>()(
  persist(
    (set, get) => ({
      activeTaskId: null,
      mode: 'pomodoro',
      isRunning: false,
      remainingSeconds: DEFAULT_TIMES.pomodoro,

      setActiveTask: (taskId) => set({ activeTaskId: taskId }),
      
      setMode: (mode) => {
        set({ mode, isRunning: false, remainingSeconds: DEFAULT_TIMES[mode] })
      },

      start: () => set({ isRunning: true }),
      pause: () => set({ isRunning: false }),
      reset: () => {
        const { mode } = get()
        set({ isRunning: false, remainingSeconds: DEFAULT_TIMES[mode] })
      },

      tick: () => {
        const { isRunning, mode, remainingSeconds } = get()
        if (!isRunning) return

        if (mode === 'flow') {
          set({ remainingSeconds: remainingSeconds + 1 })
        } else {
          if (remainingSeconds > 0) {
            set({ remainingSeconds: remainingSeconds - 1 })
          } else {
            // Timer finished
            set({ isRunning: false })
            if (Notification.permission === 'granted') {
              new Notification('Timer Finished!', {
                body: `Your ${mode} session has ended.`,
                icon: '/logos/vyra-logo-mark.png'
              })
            }
          }
        }
      }
    }),
    {
      name: 'vyra-timer-storage',
      partialize: (state) => ({ activeTaskId: state.activeTaskId, mode: state.mode, remainingSeconds: state.remainingSeconds })
    }
  )
)
