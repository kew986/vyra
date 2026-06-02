import { useTaskStore } from '@/features/tasks/store/taskStore'

class NotificationService {
  private timer: ReturnType<typeof setInterval> | null = null

  async requestPermission(): Promise<boolean> {
    if (!('Notification' in window)) {
      console.warn('This browser does not support desktop notification')
      return false
    }

    if (Notification.permission === 'granted') {
      return true
    }

    if (Notification.permission !== 'denied') {
      const permission = await Notification.requestPermission()
      return permission === 'granted'
    }

    return false
  }

  start() {
    if (this.timer) return

    // Run check every 30 seconds
    this.timer = setInterval(() => this.checkReminders(), 30000)
    
    // Also run immediately on start
    setTimeout(() => this.checkReminders(), 2000)
  }

  stop() {
    if (this.timer) {
      clearInterval(this.timer)
      this.timer = null
    }
  }

  private async checkReminders() {
    if (Notification.permission !== 'granted') return

    const { tasks, update } = useTaskStore.getState()
    const now = new Date()

    let hasUpdates = false

    for (const task of tasks) {
      if (!task.reminders || task.reminders.length === 0) continue

      let updatedTask = false
      const updatedReminders = task.reminders.map(reminder => {
        if (!reminder.notified) {
          const triggerTime = new Date(reminder.triggerAt)
          if (now >= triggerTime) {
            // Trigger notification
            this.sendNotification(task.title, `Reminder for task: ${task.title}`)
            updatedTask = true
            return { ...reminder, notified: true }
          }
        }
        return reminder
      })

      if (updatedTask) {
        // Update the task in the store and DB to mark as notified
        await update(task.id, { reminders: updatedReminders })
        hasUpdates = true
      }
    }
    
    if (hasUpdates) {
      console.log('Reminders triggered and tasks updated.')
    }
  }

  private sendNotification(title: string, body: string) {
    try {
      const notification = new Notification(title, {
        body,
        icon: '/logos/vyra-logo-mark.png'
      })

      notification.onclick = () => {
        window.focus()
        notification.close()
      }
    } catch (err) {
      console.error('Failed to send notification', err)
    }
  }
}

export const notificationService = new NotificationService()
