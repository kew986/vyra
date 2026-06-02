import { useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import { FolderKanban, CheckSquare, Library, FileText, Activity } from 'lucide-react'
import { useProjectStore } from '@/features/projects/store/projectStore'
import { useTaskStore } from '@/features/tasks/store/taskStore'
import { useLibraryStore } from '@/features/library/store/libraryStore'
import { useNoteStore } from '@/features/notes/store/noteStore'
import { Card, EmptyState } from '@/shared/ui'
import { formatRelative } from '@/shared/utils/date'

interface ActivityItem {
  id: string
  type: 'project' | 'task' | 'library' | 'note'
  title: string
  action: 'Created' | 'Updated'
  date: string
  url: string
}

export function ActivityFeed() {
  const navigate = useNavigate()
  const projects = useProjectStore(s => s.projects)
  const tasks = useTaskStore(s => s.tasks)
  const library = useLibraryStore(s => s.items)
  const notes = useNoteStore(s => s.notes)

  const feedItems = useMemo(() => {
    const items: ActivityItem[] = []
    
    projects.forEach(p => {
      items.push({ id: `p-u-${p.id}`, type: 'project', title: p.name, action: 'Updated', date: p.updatedAt, url: `/projects/${p.id}` })
      if (p.createdAt !== p.updatedAt) {
        items.push({ id: `p-c-${p.id}`, type: 'project', title: p.name, action: 'Created', date: p.createdAt, url: `/projects/${p.id}` })
      }
    })
    
    tasks.forEach(t => {
      items.push({ id: `t-u-${t.id}`, type: 'task', title: t.title, action: 'Updated', date: t.updatedAt, url: `/tasks` })
      if (t.createdAt !== t.updatedAt) {
        items.push({ id: `t-c-${t.id}`, type: 'task', title: t.title, action: 'Created', date: t.createdAt, url: `/tasks` })
      }
    })
    
    library.forEach(l => {
      items.push({ id: `l-u-${l.id}`, type: 'library', title: l.title, action: 'Updated', date: l.updatedAt, url: `/library` })
      if (l.createdAt !== l.updatedAt) {
        items.push({ id: `l-c-${l.id}`, type: 'library', title: l.title, action: 'Created', date: l.createdAt, url: `/library` })
      }
    })
    
    notes.forEach(n => {
      items.push({ id: `n-u-${n.id}`, type: 'note', title: n.title, action: 'Updated', date: n.updatedAt, url: `/notes?id=${n.id}` })
      if (n.createdAt !== n.updatedAt) {
        items.push({ id: `n-c-${n.id}`, type: 'note', title: n.title, action: 'Created', date: n.createdAt, url: `/notes?id=${n.id}` })
      }
    })

    return items
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
      .slice(0, 15) // Top 15 recent activities
  }, [projects, tasks, library, notes])

  const typeIcons: Record<string, { icon: React.ElementType, color: string }> = {
    project: { icon: FolderKanban, color: 'text-primary' },
    task: { icon: CheckSquare, color: 'text-success' },
    library: { icon: Library, color: 'text-warning' },
    note: { icon: FileText, color: 'text-info' },
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-sm font-semibold text-text-1">Activity Feed</h2>
      </div>
      
      {feedItems.length === 0 ? (
        <Card className="p-4 text-center">
          <Activity size={16} className="mx-auto text-text-3 mb-2" />
          <p className="text-xs text-text-2">No recent activity.</p>
        </Card>
      ) : (
        <div className="space-y-3">
          {feedItems.map(item => {
            const { icon: Icon, color } = typeIcons[item.type]
            return (
              <Card key={item.id} hoverable onClick={() => navigate(item.url)} className="p-3">
                <div className="flex gap-3 items-start">
                  <div className={`mt-0.5 p-1.5 rounded-lg bg-surface-3 ${color} flex-shrink-0`}>
                    <Icon size={12} />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-sm text-text-1 truncate">
                      <span className="font-medium text-text-2">{item.action}</span> {item.type}: {item.title}
                    </p>
                    <p className="text-xs text-text-3 mt-0.5">{formatRelative(item.date)}</p>
                  </div>
                </div>
              </Card>
            )
          })}
        </div>
      )}
    </div>
  )
}
