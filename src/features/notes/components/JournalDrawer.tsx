import { useEffect, useState } from 'react'
import { X, Book } from 'lucide-react'
import { useNoteStore } from '@/features/notes/store/noteStore'
import { NoteEditor } from '@/features/notes/components/NoteEditor'
import { cn } from '@/shared/utils/cn'

interface JournalDrawerProps {
  open: boolean
  onClose: () => void
}

export function JournalDrawer({ open, onClose }: JournalDrawerProps) {
  const { notes, create } = useNoteStore()
  const [journalNoteId, setJournalNoteId] = useState<string | null>(null)

  // Get today's date formatted nicely for the title (e.g., "June 1, 2026")
  const today = new Date()
  const dateTitle = today.toLocaleDateString('en-US', {
    month: 'long',
    day: 'numeric',
    year: 'numeric'
  })

  useEffect(() => {
    if (!open) return

    // Find if there's already a journal note for today
    const existing = notes.find(n => n.type === 'journal' && n.title === dateTitle)
    
    if (existing) {
      setJournalNoteId(existing.id)
    } else {
      // Create a new one
      create({
        title: dateTitle,
        type: 'journal',
        content: '<p>What are you working on today?</p>',
        tags: ['journal'],
        isPinned: false
      }).then(newNote => {
        setJournalNoteId(newNote.id)
      })
    }
  }, [open, notes, dateTitle, create])

  const activeNote = journalNoteId ? notes.find(n => n.id === journalNoteId) : null

  return (
    <>
      {/* Backdrop */}
      {open && (
        <div 
          className="fixed inset-0 z-40 bg-black/20 backdrop-blur-sm transition-opacity" 
          onClick={onClose}
        />
      )}
      
      {/* Drawer */}
      <div
        className={cn(
          "fixed top-0 right-0 z-50 h-full w-full max-w-2xl bg-surface/95 backdrop-blur-md border-l border-border/60 shadow-2xl transition-transform duration-300 ease-in-out flex flex-col glass-border",
          open ? "translate-x-0" : "translate-x-full"
        )}
      >
        {/* Mobile swipe grab handle */}
        <div className="lg:hidden flex justify-center pt-2 flex-shrink-0">
          <div className="w-12 h-1 rounded-full bg-border/60" />
        </div>

        <div className="flex items-center justify-between px-4 py-3 border-b border-border/55 bg-transparent flex-shrink-0">
          <div className="flex items-center gap-2 text-text-1 font-semibold">
            <Book size={18} className="text-primary" />
            Daily Journal
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-text-3 hover:text-text-1 hover:bg-surface-2 rounded-lg transition-colors"
          >
            <X size={18} />
          </button>
        </div>

        <div className="flex-1 overflow-hidden relative">
          {activeNote ? (
            <NoteEditor
              note={activeNote}
              onBack={onClose}
              onPin={() => {}} // Could wire up if needed
              onDelete={onClose}
            />
          ) : (
            <div className="flex items-center justify-center h-full text-text-3">
              Loading journal...
            </div>
          )}
        </div>
      </div>
    </>
  )
}
