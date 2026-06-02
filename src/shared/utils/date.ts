/** Format an ISO string to a human-readable date */
export function formatDate(iso: string): string {
  const date = new Date(iso)
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
}

/** Format an ISO string to a relative time (e.g. "2 hours ago") */
export function formatRelative(iso: string): string {
  const now = Date.now()
  const then = new Date(iso).getTime()
  const diff = now - then
  const seconds = Math.floor(diff / 1000)
  const minutes = Math.floor(seconds / 60)
  const hours = Math.floor(minutes / 60)
  const days = Math.floor(hours / 24)

  if (seconds < 60) return 'just now'
  if (minutes < 60) return `${minutes}m ago`
  if (hours < 24) return `${hours}h ago`
  if (days < 7) return `${days}d ago`
  return formatDate(iso)
}

/** Format ISO date to YYYY-MM-DD for input[type=date] */
export function toInputDate(iso: string): string {
  return iso.slice(0, 10)
}

/** Get current ISO datetime string */
export function now(): string {
  return new Date().toISOString()
}

/** Check if a date is overdue */
export function isOverdue(dueDate?: string): boolean {
  if (!dueDate) return false
  return new Date(dueDate) < new Date()
}

/** Check if a date is due soon (within 3 days) */
export function isDueSoon(dueDate?: string): boolean {
  if (!dueDate) return false
  const due = new Date(dueDate)
  const threeDays = new Date(Date.now() + 3 * 24 * 60 * 60 * 1000)
  return due <= threeDays && due > new Date()
}

/** ─── Calendar Utilities ────────────────────────────────────── */

export function startOfMonth(date: Date): Date {
  return new Date(date.getFullYear(), date.getMonth(), 1)
}

export function endOfMonth(date: Date): Date {
  return new Date(date.getFullYear(), date.getMonth() + 1, 0, 23, 59, 59, 999)
}

export function startOfWeek(date: Date): Date {
  const d = new Date(date)
  const day = d.getDay()
  d.setDate(d.getDate() - day)
  d.setHours(0, 0, 0, 0)
  return d
}

export function endOfWeek(date: Date): Date {
  const d = new Date(date)
  const day = d.getDay()
  d.setDate(d.getDate() + (6 - day))
  d.setHours(23, 59, 59, 999)
  return d
}

export function addDays(date: Date, days: number): Date {
  const d = new Date(date)
  d.setDate(d.getDate() + days)
  return d
}

export function addMonths(date: Date, months: number): Date {
  const d = new Date(date)
  d.setMonth(d.getMonth() + months)
  return d
}

export function isSameDay(dateLeft: Date, dateRight: Date): boolean {
  return dateLeft.getFullYear() === dateRight.getFullYear() &&
         dateLeft.getMonth() === dateRight.getMonth() &&
         dateLeft.getDate() === dateRight.getDate()
}

export function isSameMonth(dateLeft: Date, dateRight: Date): boolean {
  return dateLeft.getFullYear() === dateRight.getFullYear() &&
         dateLeft.getMonth() === dateRight.getMonth()
}

export function formatMonthYear(date: Date): string {
  return date.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })
}
