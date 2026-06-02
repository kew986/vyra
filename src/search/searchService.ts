import Fuse from 'fuse.js'
import type { Project, Task, LibraryItem, Note, SearchResult } from '@/shared/types'

let projectFuse: Fuse<Project>
let taskFuse: Fuse<Task>
let libraryFuse: Fuse<LibraryItem>
let noteFuse: Fuse<Note>

export function buildSearchIndexes(
  projects: Project[],
  tasks: Task[],
  library: LibraryItem[],
  notes: Note[],
) {
  projectFuse = new Fuse(projects, {
    keys: ['name', 'description', 'tags'],
    threshold: 0.3,
    includeScore: true,
  })
  taskFuse = new Fuse(tasks, {
    keys: ['title', 'description', 'tags'],
    threshold: 0.3,
    includeScore: true,
  })
  libraryFuse = new Fuse(library, {
    keys: ['title', 'description', 'content', 'tags'],
    threshold: 0.3,
    includeScore: true,
  })
  noteFuse = new Fuse(notes, {
    keys: ['title', 'tags'],
    threshold: 0.3,
    includeScore: true,
  })
}

export function search(query: string, limit = 20): SearchResult[] {
  if (!query.trim()) return []

  const results: SearchResult[] = []

  if (projectFuse) {
    projectFuse.search(query, { limit: 5 }).forEach(r => {
      results.push({
        type: 'project',
        id: r.item.id,
        title: r.item.name,
        subtitle: r.item.description,
        url: `/projects/${r.item.id}`,
      })
    })
  }

  if (taskFuse) {
    taskFuse.search(query, { limit: 5 }).forEach(r => {
      results.push({
        type: 'task',
        id: r.item.id,
        title: r.item.title,
        subtitle: r.item.description,
        url: `/projects/${r.item.projectId}?tab=tasks`,
      })
    })
  }

  if (libraryFuse) {
    libraryFuse.search(query, { limit: 5 }).forEach(r => {
      results.push({
        type: 'library',
        id: r.item.id,
        title: r.item.title,
        subtitle: r.item.description,
        url: `/library`,
      })
    })
  }

  if (noteFuse) {
    noteFuse.search(query, { limit: 5 }).forEach(r => {
      results.push({
        type: 'note',
        id: r.item.id,
        title: r.item.title,
        url: `/notes?id=${r.item.id}`,
      })
    })
  }

  return results.slice(0, limit)
}
