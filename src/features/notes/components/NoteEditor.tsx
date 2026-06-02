import { useState, useEffect, useCallback, useRef } from 'react'
import { useEditor, EditorContent } from '@tiptap/react'
import StarterKit from '@tiptap/starter-kit'
import Placeholder from '@tiptap/extension-placeholder'
import TaskList from '@tiptap/extension-task-list'
import TaskItem from '@tiptap/extension-task-item'
import {
  Bold, Italic, Heading2, Heading3, List, ListOrdered,
  Code, Quote, Minus, Pin, Trash2, ArrowLeft, CheckSquare, ListChecks
} from 'lucide-react'
import { useNoteStore } from '../store/noteStore'
import { useTaskStore } from '@/features/tasks/store/taskStore'
import { Button } from '@/shared/ui/Button'
import { Select } from '@/shared/ui/Input'
import { DropdownMenu } from '@/shared/ui/DropdownMenu'
import { exportService } from '../services/exportService'
import { cn } from '@/shared/utils/cn'
import { formatDate } from '@/shared/utils/date'
import type { Note } from '@/shared/types'
import { LocalImage } from '../extensions/LocalImageExtension'
import { attachmentService } from '../services/attachmentService'
import { toast } from '@/shared/ui'

interface NoteEditorProps {
  note: Note
  projectName?: string
  onBack: () => void
  onPin: () => void
  onDelete: () => void
}

const NOTE_TYPE_OPTIONS = [
  { value: 'general', label: '📄 General' },
  { value: 'requirement', label: '📋 Requirement' },
  { value: 'meeting', label: '🤝 Meeting' },
  { value: 'feedback', label: '💬 Feedback' },
  { value: 'idea', label: '💡 Idea' },
  { value: 'revision', label: '✏️ Revision' },
]

export function NoteEditor({ note, projectName, onBack, onPin, onDelete }: NoteEditorProps) {
  const { update } = useNoteStore()
  const { create: createTask } = useTaskStore()
  const [title, setTitle] = useState(note.title)
  const [type, setType] = useState<Note['type']>(note.type)
  const [saveState, setSaveState] = useState<'unsaved' | 'saving' | 'saved' | null>(null)
  
  const saveTimeout = useRef<ReturnType<typeof setTimeout> | undefined>(undefined)
  const editorRef = useRef<HTMLDivElement>(null)

  const editor = useEditor({
    extensions: [
      StarterKit,
      Placeholder.configure({ placeholder: 'Start writing your note...' }),
      TaskList,
      TaskItem.configure({ nested: true }),
      LocalImage,
    ],
    content: note.content,
    editorProps: {
      attributes: { class: 'tiptap-editor focus:outline-none', role: 'textbox', 'aria-multiline': 'true' },
      handlePaste: (view, event, slice) => {
        const items = event.clipboardData?.items
        if (!items) return false

        for (const item of items) {
          if (item.type.indexOf('image') === 0) {
            const file = item.getAsFile()
            if (!file) continue

            if (!attachmentService.isValidImage(file)) {
              toast.warning('Only PNG, JPG, and WEBP images are supported.')
              return true
            }

            if (!attachmentService.isSizeValid(file, 5)) {
              toast.error('Image is too large. Maximum size is 5MB.')
              return true
            }

            // Valid image found, process it
            event.preventDefault()
            
            attachmentService.saveAttachment(file, file.type).then(id => {
              // Insert the local image node
              const { schema } = view.state
              const node = schema.nodes.image.create({
                'data-attachment-id': id
              })
              const tr = view.state.tr.replaceSelectionWith(node)
              view.dispatch(tr)
            }).catch(err => {
              console.error('Failed to save image:', err)
              toast.error('Failed to save image locally.')
            })

            return true // Stop standard paste handling for this item
          }
        }
        return false // Allow default pasting for text
      }
    },
    onUpdate: ({ editor }) => {
      setSaveState('unsaved')
      // Debounced auto-save
      clearTimeout(saveTimeout.current)
      saveTimeout.current = setTimeout(async () => {
        setSaveState('saving')
        await update(note.id, { content: editor.getHTML() })
        setSaveState('saved')
        setTimeout(() => setSaveState(null), 2000)
      }, 3000) // Using 3 seconds for less aggressive background autosave
    },
  })

  const handleManualSave = useCallback(async () => {
    if (saveState === 'saved') return
    setSaveState('saving')
    if (editor) {
      await update(note.id, { content: editor.getHTML(), title })
    }
    setSaveState('saved')
    setTimeout(() => { setSaveState(null) }, 2000)
  }, [saveState, editor, update, note.id, title])

  // Update editor content when note changes
  useEffect(() => {
    if (editor && note.content !== editor.getHTML()) {
      editor.commands.setContent(note.content)
    }
    setTitle(note.title)
    setType(note.type)
  }, [note.id])

  // Auto-save title
  const handleTitleBlur = useCallback(() => {
    if (title !== note.title) {
      setSaveState('saving')
      update(note.id, { title: title || 'Untitled Note' }).then(() => {
        setSaveState('saved')
        setTimeout(() => setSaveState(null), 2000)
      })
    }
  }, [title, note, update])

  const handleTypeChange = (newType: string) => {
    setType(newType as Note['type'])
    update(note.id, { type: newType as Note['type'] })
  }

  const handleConvertToTask = async () => {
    if (!note.projectId) {
      toast.warning('Please link this note to a project before converting to a task.')
      return
    }
    // Extract plain text for description or just use the title
    const plainText = editor?.getText() || ''
    await createTask({
      title: note.title || 'Converted from Note',
      description: `Original note:\n${plainText.slice(0, 300)}${plainText.length > 300 ? '...' : ''}\n\n[Link to note](/notes?id=${note.id})`,
      status: 'todo',
      priority: 'medium',
      projectId: note.projectId,
      tags: note.tags,
      order: 0,
    })
    toast.success('Task created successfully!')
  }

  return (
    <div className="flex flex-col h-full">
      {/* Editor Toolbar */}
      <div className="flex items-center gap-1 px-4 py-2 border-b border-border bg-surface flex-shrink-0 flex-wrap">
        {/* Back (mobile) */}
        <button onClick={onBack} className="lg:hidden mr-2 text-text-2 hover:text-text-1 transition-colors">
          <ArrowLeft size={16} />
        </button>

        {/* Formatting buttons */}
        {[
          { icon: Bold, action: () => editor?.chain().focus().toggleBold().run(), active: editor?.isActive('bold'), label: 'Bold' },
          { icon: Italic, action: () => editor?.chain().focus().toggleItalic().run(), active: editor?.isActive('italic'), label: 'Italic' },
          { icon: Heading2, action: () => editor?.chain().focus().toggleHeading({ level: 2 }).run(), active: editor?.isActive('heading', { level: 2 }), label: 'H2' },
          { icon: Heading3, action: () => editor?.chain().focus().toggleHeading({ level: 3 }).run(), active: editor?.isActive('heading', { level: 3 }), label: 'H3' },
          { icon: List, action: () => editor?.chain().focus().toggleBulletList().run(), active: editor?.isActive('bulletList'), label: 'Bullet list' },
          { icon: ListOrdered, action: () => editor?.chain().focus().toggleOrderedList().run(), active: editor?.isActive('orderedList'), label: 'Numbered list' },
          { icon: ListChecks, action: () => editor?.chain().focus().toggleTaskList().run(), active: editor?.isActive('taskList'), label: 'Checklist' },
          { icon: Code, action: () => editor?.chain().focus().toggleCode().run(), active: editor?.isActive('code'), label: 'Code' },
          { icon: Quote, action: () => editor?.chain().focus().toggleBlockquote().run(), active: editor?.isActive('blockquote'), label: 'Quote' },
          { icon: Minus, action: () => editor?.chain().focus().setHorizontalRule().run(), active: false, label: 'Divider' },
        ].map(({ icon: Icon, action, active, label }) => (
          <button
            key={label}
            onClick={action}
            title={label}
            aria-label={label}
            className={cn(
              'p-1.5 rounded-md transition-all text-sm',
              active ? 'bg-surface-3 text-text-1' : 'text-text-3 hover:text-text-1 hover:bg-surface-2'
            )}
          >
            <Icon size={14} />
          </button>
        ))}

        <div className="ml-auto flex items-center gap-2">
          {/* Save Status Indicator */}
          {saveState && (
            <span className="text-xs text-text-3 px-2 flex items-center h-full animate-in fade-in">
              {saveState === 'unsaved' && 'Unsaved changes'}
              {saveState === 'saving' && 'Saving...'}
              {saveState === 'saved' && 'Saved'}
            </span>
          )}

          <DropdownMenu
            align="right"
            trigger={
              <button className="px-3 py-1.5 rounded-md bg-surface-2 hover:bg-surface-3 transition-colors text-xs font-medium text-text-2">
                Export
              </button>
            }
            items={[
              { id: 'pdf', label: 'Export as PDF', onClick: () => editorRef.current && exportService.exportToPDF(note, editorRef.current) },
              { id: 'docx', label: 'Export as DOCX', onClick: () => exportService.exportToDOCX(note) },
              { id: 'md', label: 'Export as Markdown', onClick: () => exportService.exportToMarkdown(note) },
              { id: 'txt', label: 'Export as TXT', onClick: () => exportService.exportToTXT(note, editor?.getText() || '') },
            ]}
          />

          <button
            onClick={handleManualSave}
            disabled={saveState === 'saved' || saveState === 'saving'}
            className={cn(
              "px-3 py-1.5 rounded-md text-xs font-medium transition-all",
              saveState === 'unsaved' 
                ? "bg-primary text-white hover:bg-primary/90" 
                : "bg-surface-2 text-text-3 cursor-default"
            )}
          >
            Save
          </button>
          
          {note.projectId && (
            <button
              onClick={handleConvertToTask}
              title="Convert to Task"
              className="flex items-center gap-1.5 px-2 py-1 rounded-md bg-surface-3 text-xs font-medium text-text-2 hover:text-text-1 hover:bg-surface-2 transition-all border border-border"
            >
              <CheckSquare size={13} className="text-primary" /> To Task
            </button>
          )}
          <button
            onClick={onPin}
            title={note.isPinned ? 'Unpin' : 'Pin note'}
            className={cn('p-1.5 rounded-md transition-all', note.isPinned ? 'text-warning' : 'text-text-3 hover:text-text-1')}
          >
            <Pin size={14} fill={note.isPinned ? 'currentColor' : 'none'} />
          </button>
          <button
            onClick={onDelete}
            title="Delete note"
            className="p-1.5 rounded-md text-text-3 hover:text-danger hover:bg-danger/10 transition-all"
          >
            <Trash2 size={14} />
          </button>
        </div>
      </div>

      {/* Note Meta */}
      <div className="px-6 lg:px-10 pt-6 pb-2 border-b border-border/50 bg-surface flex-shrink-0">
        {/* Title */}
        <textarea
          value={title}
          onChange={e => setTitle(e.target.value)}
          onBlur={handleTitleBlur}
          placeholder="Note title..."
          className="w-full text-2xl font-bold text-text-1 bg-transparent resize-none outline-none placeholder:text-text-3 leading-snug"
          rows={1}
          style={{ height: 'auto' }}
          onInput={e => {
            const el = e.target as HTMLTextAreaElement
            el.style.height = 'auto'
            el.style.height = `${el.scrollHeight}px`
          }}
        />
        <div className="flex items-center gap-4 mt-2">
          <Select
            value={type}
            onChange={e => handleTypeChange(e.target.value)}
            options={NOTE_TYPE_OPTIONS}
            className="w-40 h-7 text-xs py-0"
          />
          {projectName && (
            <span className="text-xs text-text-3 bg-surface-2 border border-border rounded-full px-2 py-0.5">{projectName}</span>
          )}
          <span className="text-xs text-text-3 ml-auto">{formatDate(note.updatedAt)}</span>
        </div>
      </div>

      {/* Editor Content */}
      <div className="flex-1 overflow-y-auto px-6 lg:px-10 py-6 bg-surface" ref={editorRef}>
        <EditorContent editor={editor} />
      </div>
    </div>
  )
}
