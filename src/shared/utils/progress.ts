import type { Task, ProjectProgress } from '@/shared/types'

/** Calculate project progress from its tasks */
export function calculateProgress(tasks: Task[]): ProjectProgress {
  const total = tasks.length
  const done = tasks.filter(t => t.status === 'done').length
  const percentage = total === 0 ? 0 : Math.round((done / total) * 100)

  const overdueTasks = tasks.filter(t => {
    if (!t.dueDate || t.status === 'done') return false
    return new Date(t.dueDate) < new Date()
  })

  const atRiskTasks = tasks.filter(t => {
    if (!t.dueDate || t.status === 'done') return false
    const due = new Date(t.dueDate)
    const threeDays = new Date(Date.now() + 3 * 24 * 60 * 60 * 1000)
    return due <= threeDays && due > new Date()
  })

  let health: ProjectProgress['health'] = 'not-started'
  if (total === 0) health = 'not-started'
  else if (overdueTasks.length > 0) health = 'overdue'
  else if (atRiskTasks.length > 0) health = 'at-risk'
  else if (done === total) health = 'on-track'
  else health = 'on-track'

  return { total, done, percentage, health }
}
