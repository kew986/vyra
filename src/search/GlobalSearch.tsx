import { useState, useEffect, useRef, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { createPortal } from 'react-dom'
import { Search, FolderKanban, CheckSquare, Library, FileText, Clock, X, ArrowRight } from 'lucide-react'
import { cn } from '@/shared/utils/cn'
import { useProjectStore } from '@/features/projects/store/projectStore'
import { useTaskStore } from '@/features/tasks/store/taskStore'
import { useLibraryStore } from '@/features/library/store/libraryStore'
import { useNoteStore } from '@/features/notes/store/noteStore'
import { useSettingsStore } from '@/features/settings/store/settingsStore'
import { buildSearchIndexes, search } from './searchService'
import type { SearchResult } from '@/shared/types'

const ENTITY_ICONS = {
  project: FolderKanban,
  task: CheckSquare,
  library: Library,
  note: FileText,
}

const ENTITY_LABELS = {
  project: 'Project',
  task: 'Task',
  library: 'Library',
  note: 'Note',
}

interface GlobalSearchProps {
  open: boolean
  onClose: () => void
}

export function GlobalSearch({ open, onClose }: GlobalSearchProps) {
  const [query, setQuery] = useState('')
  const [results, setResults] = useState<SearchResult[]>([])
  const [activeIndex, setActiveIndex] = useState(0)
  const inputRef = useRef<HTMLInputElement>(null)
  const navigate = useNavigate()

  const projects = useProjectStore(s => s.projects)
  const tasks = useTaskStore(s => s.tasks)
  const library = useLibraryStore(s => s.items)
  const notes = useNoteStore(s => s.notes)
  const { settings, addRecentSearch, clearRecentSearches } = useSettingsStore()

  // Build search indexes when data changes
  useEffect(() => {
    buildSearchIndexes(projects, tasks, library, notes)
  }, [projects, tasks, library, notes])

  // Run search on query change
  useEffect(() => {
    if (!query.trim()) { setResults([]); return }
    const r = search(query)
    setResults(r)
    setActiveIndex(0)
  }, [query])

  // Focus input when opened
  useEffect(() => {
    if (open) {
      setTimeout(() => inputRef.current?.focus(), 50)
      setQuery('')
      setResults([])
    }
  }, [open])

  // Global ⌘K shortcut
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault()
        if (open) onClose(); else { /* parent opens it */ }
      }
      if (e.key === 'Escape' && open) onClose()
    }
    document.addEventListener('keydown', handler)
    return () => document.removeEventListener('keydown', handler)
  }, [open, onClose])

  const handleSelect = useCallback((result: SearchResult) => {
    addRecentSearch(result.title)
    navigate(result.url)
    onClose()
  }, [navigate, onClose, addRecentSearch])

  const handleKeyDown = (e: React.KeyboardEvent) => {
    const list = query.trim() ? results : []
    if (e.key === 'ArrowDown') { e.preventDefault(); setActiveIndex(i => Math.min(i + 1, list.length - 1)) }
    if (e.key === 'ArrowUp') { e.preventDefault(); setActiveIndex(i => Math.max(i - 1, 0)) }
    if (e.key === 'Enter' && list[activeIndex]) handleSelect(list[activeIndex])
  }

  if (!open) return null

  const showRecent = !query.trim() && settings.recentSearches.length > 0

  return createPortal(
    <div className="fixed inset-0 z-50 flex items-start justify-center pt-[15vh] px-4">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm animate-fade-in" onClick={onClose} />

      <div className="relative w-full max-w-xl bg-surface border border-border rounded-2xl shadow-modal animate-scale-in overflow-hidden">
        {/* Search Input */}
        <div className="flex items-center gap-3 px-4 py-3.5 border-b border-border">
          <Search size={15} className="text-text-3 flex-shrink-0" />
          <input
            ref={inputRef}
            value={query}
            onChange={e => setQuery(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Search projects, tasks, library, notes..."
            className="flex-1 bg-transparent text-text-1 text-sm placeholder:text-text-3 outline-none"
            aria-label="Global search"
            role="combobox"
            aria-expanded={results.length > 0}
          />
          {query && (
            <button onClick={() => setQuery('')} className="text-text-3 hover:text-text-1 transition-colors">
              <X size={14} />
            </button>
          )}
          <kbd className="text-xs text-text-3 border border-border rounded px-1.5 py-0.5 bg-surface-2">ESC</kbd>
        </div>

        {/* Results */}
        <div className="max-h-80 overflow-y-auto no-scrollbar">
          {showRecent && (
            <div className="p-2">
              <div className="flex items-center justify-between px-2 mb-1">
                <span className="text-xs font-medium text-text-3 uppercase tracking-wide">Recent</span>
                <button onClick={clearRecentSearches} className="text-xs text-text-3 hover:text-text-1 transition-colors">Clear</button>
              </div>
              {settings.recentSearches.map((term, i) => (
                <button
                  key={i}
                  onClick={() => setQuery(term)}
                  className="flex items-center gap-3 w-full px-3 h-9 rounded-lg text-text-2 hover:bg-surface-2 hover:text-text-1 transition-all text-sm"
                >
                  <Clock size={13} className="text-text-3" />
                  {term}
                </button>
              ))}
            </div>
          )}

          {query.trim() && results.length === 0 && (
            <div className="flex flex-col items-center py-10 text-text-3">
              <Search size={24} className="mb-2 opacity-40" />
              <p className="text-sm">No results for &ldquo;{query}&rdquo;</p>
            </div>
          )}

          {results.length > 0 && (
            <div className="p-2" role="listbox">
              {results.map((result, i) => {
                const Icon = ENTITY_ICONS[result.type]
                return (
                  <button
                    key={result.id}
                    role="option"
                    aria-selected={i === activeIndex}
                    onClick={() => handleSelect(result)}
                    onMouseEnter={() => setActiveIndex(i)}
                    className={cn(
                      'flex items-center gap-3 w-full px-3 h-10 rounded-lg text-sm transition-all group',
                      i === activeIndex ? 'bg-surface-2 text-text-1' : 'text-text-2 hover:bg-surface-2 hover:text-text-1'
                    )}
                  >
                    <div className={cn(
                      'w-6 h-6 rounded-md flex items-center justify-center flex-shrink-0',
                      i === activeIndex ? 'bg-primary/10 text-primary' : 'bg-surface-3 text-text-3'
                    )}>
                      <Icon size={12} />
                    </div>
                    <div className="flex-1 text-left min-w-0">
                      <div className="font-medium truncate">{result.title}</div>
                      {result.subtitle && (
                        <div className="text-xs text-text-3 truncate">{result.subtitle}</div>
                      )}
                    </div>
                    <div className="flex items-center gap-1.5">
                      <span className="text-xs text-text-3">{ENTITY_LABELS[result.type]}</span>
                      <ArrowRight size={12} className={cn('transition-opacity', i === activeIndex ? 'opacity-100' : 'opacity-0')} />
                    </div>
                  </button>
                )
              })}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center gap-4 px-4 py-2.5 border-t border-border bg-surface-2/50">
          <span className="flex items-center gap-1 text-xs text-text-3">
            <kbd className="bg-surface-3 border border-border rounded px-1">↑↓</kbd> Navigate
          </span>
          <span className="flex items-center gap-1 text-xs text-text-3">
            <kbd className="bg-surface-3 border border-border rounded px-1">↵</kbd> Open
          </span>
          <span className="flex items-center gap-1 text-xs text-text-3">
            <kbd className="bg-surface-3 border border-border rounded px-1">ESC</kbd> Close
          </span>
        </div>
      </div>
    </div>,
    document.body
  )
}
