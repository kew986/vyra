import { useState, useMemo, useEffect, useCallback, useRef } from 'react'
import { useSearchParams } from 'react-router-dom'
import { Plus, Search, Pin, X, FileText, Trash2 } from 'lucide-react'
import { useNoteStore } from './store/noteStore'
import { useProjectStore } from '@/features/projects/store/projectStore'
import { useSettingsStore } from '@/features/settings/store/settingsStore'
import { Button } from '@/shared/ui/Button'
import { Input } from '@/shared/ui/Input'
import { Card, EmptyState } from '@/shared/ui'
import { Badge } from '@/shared/ui/Badge'
import { NoteEditor } from './components/NoteEditor'
import { formatRelative } from '@/shared/utils/date'
import { cn } from '@/shared/utils/cn'
import type { Note } from '@/shared/types'

const NOTE_TYPE_VARIANTS: Record<Note['type'], 'primary' | 'success' | 'warning' | 'danger' | 'info' | 'default'> = {
  requirement: 'primary', meeting: 'info', feedback: 'warning',
  idea: 'success', revision: 'danger',
  general: 'default',
  journal: 'primary'
}

export default function NotesPage() {
  const { notes, selectedId, setSelected, create, togglePin, remove } = useNoteStore()
  const projects = useProjectStore(s => s.projects)
  const [searchParams, setSearchParams] = useSearchParams()
  const [search, setSearch] = useState('')

  const handleNewNote = useCallback(async () => {
    const projectId = searchParams.get('projectId') || undefined
    const note = await create({
      title: 'Untitled Note',
      content: '',
      type: 'general',
      tags: [],
      isPinned: false,
      projectId,
    })
    setSelected(note.id)
  }, [create, setSelected, searchParams])

  // Open note from URL ?id= param
  useEffect(() => {
    const id = searchParams.get('id')
    if (id) setSelected(id)
  }, [searchParams, setSelected])

  const handledNew = useRef(false)

  // Handle keyboard shortcut to create new note
  useEffect(() => {
    if (searchParams.get('new') === 'true' && !handledNew.current) {
      handledNew.current = true
      handleNewNote()
      const nextParams = new URLSearchParams(searchParams)
      nextParams.delete('new')
      // Note: We leave projectId in the URL if it was there so the new note uses it
      setSearchParams(nextParams, { replace: true })
    }
  }, [searchParams, setSearchParams, handleNewNote])


  const filtered = useMemo(() => {
    let result = [...notes]
    if (search.trim()) {
      const q = search.toLowerCase()
      result = result.filter(n => n.title.toLowerCase().includes(q))
    }
    return result.sort((a, b) => {
      if (a.isPinned !== b.isPinned) return a.isPinned ? -1 : 1
      return new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()
    })
  }, [notes, search])

  const selectedNote = notes.find(n => n.id === selectedId)

  useEffect(() => {
    if (selectedNote) {
      useSettingsStore.getState().setLastOpenedEntity({
        type: 'note',
        id: selectedNote.id,
        title: selectedNote.title,
        url: `/notes?id=${selectedNote.id}`
      })
    }
  }, [selectedNote?.id])

  return (
    <div className="flex h-[calc(100vh-56px)]">
      {/* Note List Panel */}
      <div className={cn(
        'flex flex-col border-r border-border bg-surface',
        'w-full lg:w-72 xl:w-80 flex-shrink-0',
        selectedNote ? 'hidden lg:flex' : 'flex'
      )}>
        {/* Panel Header */}
        <div className="p-4 border-b border-border">
          <div className="flex items-center justify-between mb-3">
            <h1 className="text-base font-bold text-text-1">Notes</h1>
            <Button size="sm" leftIcon={<Plus size={12} />} onClick={handleNewNote}>New</Button>
          </div>
          <Input
            placeholder="Search notes..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            leftIcon={<Search size={13} />}
            rightIcon={search ? <button onClick={() => setSearch('')}><X size={11} /></button> : undefined}
          />
        </div>

        {/* Note List */}
        <div className="flex-1 overflow-y-auto p-2 space-y-1 no-scrollbar">
          {filtered.length === 0 ? (
            <EmptyState
              icon={<FileText size={16} />}
              title={search ? 'No notes found' : 'No notes yet'}
              description={search ? undefined : 'Create your first note.'}
              action={!search ? <Button size="sm" onClick={handleNewNote}>Create Note</Button> : undefined}
            />
          ) : (
            filtered.map(note => (
              <div
                key={note.id}
                onClick={() => setSelected(note.id)}
                className={cn(
                  'w-full text-left rounded-xl px-3 py-2.5 transition-all group relative cursor-pointer',
                  selectedId === note.id ? 'bg-primary/10 border border-primary/20' : 'hover:bg-surface-2 border border-transparent'
                )}
              >
                <div className="flex items-start justify-between gap-2 mb-1">
                  <div className="flex items-center gap-1.5 min-w-0">
                    {note.isPinned && <Pin size={10} className="text-warning flex-shrink-0 fill-current" />}
                    <span className="text-sm font-medium text-text-1 truncate">{note.title}</span>
                  </div>
                  <Badge variant={NOTE_TYPE_VARIANTS[note.type]} size="sm">{note.type}</Badge>
                </div>
                <div className="flex items-center justify-between">
                  <p className="text-xs text-text-3">{formatRelative(note.updatedAt)}</p>
                  <button
                    onClick={(e) => {
                      e.stopPropagation()
                      if (confirm('Are you sure you want to delete this note?')) {
                        remove(note.id)
                      }
                    }}
                    className="p-1 rounded text-text-3 hover:text-danger hover:bg-danger/10 transition-colors opacity-100 lg:opacity-0 lg:group-hover:opacity-100"
                    title="Delete Note"
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Editor Panel */}
      <div className={cn(
        'flex-1 flex flex-col min-w-0',
        !selectedNote ? 'hidden lg:flex' : 'flex'
      )}>
        {selectedNote ? (
          <NoteEditor
            note={selectedNote}
            projectName={projects.find(p => p.id === selectedNote.projectId)?.name}
            onBack={() => setSelected(null)}
            onPin={() => togglePin(selectedNote.id)}
            onDelete={() => { remove(selectedNote.id) }}
          />
        ) : (
          <div className="flex-1 flex items-center justify-center">
            <EmptyState
              icon={<FileText size={20} />}
              title="Select a note"
              description="Choose a note from the list or create a new one."
              action={<Button leftIcon={<Plus size={12} />} onClick={handleNewNote}>New Note</Button>}
            />
          </div>
        )}
      </div>
    </div>
  )
}
