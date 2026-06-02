import { useEffect } from 'react'
import { useTaskStore } from '@/features/tasks/store/taskStore'
import { useProjectStore } from '@/features/projects/store/projectStore'
import { useNotificationStore } from '../store/notificationStore'

const CHECK_INTERVAL = 60 * 1000 // 1 minute

export function useNotificationEngine() {
  const tasks = useTaskStore((s: any) => s.tasks)
  const projects = useProjectStore((s: any) => s.projects)
  const notifications = useNotificationStore((s: any) => s.notifications)
  const addNotification = useNotificationStore((s: any) => s.addNotification)
  const loadNotifications = useNotificationStore((s: any) => s.load)

  // Initial load
  useEffect(() => {
    loadNotifications()
  }, [])

  useEffect(() => {
    const check = () => {
      const currentDate = new Date()
      const todayString = currentDate.toISOString().split('T')[0]
      const currentTimeStr = currentDate.toISOString()

      // Check Tasks
      tasks.forEach((task: any) => {
        if (task.status === 'done') return

        // 1. Due Dates
        if (task.dueDate) {
          const isOverdue = task.dueDate < todayString
          const isDueToday = task.dueDate === todayString

          if (isOverdue || isDueToday) {
            // Check if we already created a notification for this recently
            // To prevent spam, if the notification is unread OR if it was created today, we skip.
            const existing = notifications.find((n: any) => 
              n.entityId === task.id && 
              n.type === 'task_due' &&
              (!n.read || n.createdAt.startsWith(todayString))
            )
            
            if (!existing) {
              addNotification({
                type: 'task_due',
                title: isOverdue ? 'Task Overdue' : 'Task Due Today',
                message: `The task "${task.title}" is ${isOverdue ? 'overdue' : 'due today'}.`,
                entityId: task.id,
                entityType: 'task'
              })
            }
          }
        }

        // 2. Reminders
        if (task.reminders && task.reminders.length > 0) {
          task.reminders.forEach((reminder: any) => {
            if (!reminder.notified && reminder.triggerAt <= currentTimeStr) {
               // Trigger it! 
               const existingReminderNotif = notifications.find((n: any) => 
                 n.entityId === task.id && n.type === 'task_reminder' && !n.read
               )
               if (!existingReminderNotif) {
                 addNotification({
                   type: 'task_reminder',
                   title: 'Task Reminder',
                   message: `Reminder: "${task.title}".`,
                   entityId: task.id,
                   entityType: 'task'
                 })
               }
            }
          })
        }
      })

      // Check Projects
      projects.forEach((project: any) => {
        if (project.status === 'completed' || project.status === 'archived') return
        if (project.dueDate) {
           const isOverdue = project.dueDate < todayString
           const isDueToday = project.dueDate === todayString

           if (isOverdue || isDueToday) {
             const existing = notifications.find((n: any) => 
                n.entityId === project.id && 
                n.type === 'project_due' &&
                (!n.read || n.createdAt.startsWith(todayString))
             )
             if (!existing) {
               addNotification({
                 type: 'project_due',
                 title: isOverdue ? 'Project Overdue' : 'Project Due Today',
                 message: `The project "${project.name}" is ${isOverdue ? 'overdue' : 'due today'}.`,
                 entityId: project.id,
                 entityType: 'project'
               })
             }
           }
        }
      })
    }

    // Delay first check slightly to let stores load
    const timeout = setTimeout(check, 3000)
    const interval = setInterval(check, CHECK_INTERVAL)
    
    return () => {
      clearTimeout(timeout)
      clearInterval(interval)
    }
  }, [tasks, projects, notifications, addNotification])
}
