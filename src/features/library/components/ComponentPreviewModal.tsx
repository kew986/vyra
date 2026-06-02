import { useState } from 'react'
import { Modal } from '@/shared/ui/Modal'
import { Button } from '@/shared/ui/Button'
import { Code2, MonitorPlay } from 'lucide-react'
import { cn } from '@/shared/utils/cn'
import type { LibraryItem } from '@/shared/types'

interface ComponentPreviewModalProps {
  open: boolean
  onClose: () => void
  item: LibraryItem
}

export function ComponentPreviewModal({ open, onClose, item }: ComponentPreviewModalProps) {
  const [view, setView] = useState<'preview' | 'code'>('preview')

  if (!item || item.type !== 'component') return null

  // Ensure there is some basic HTML wrapper so styles apply nicely if they just provided an element
  const srcDoc = `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1">
        <style>
          body { 
            margin: 0; 
            padding: 16px; 
            font-family: system-ui, -apple-system, sans-serif;
            display: flex;
            align-items: center;
            justify-content: center;
            min-height: 100vh;
            background-color: transparent;
            color: #111;
          }
          /* Users can override this with their own <style> tags in the content */
        </style>
      </head>
      <body>
        ${item.content || ''}
      </body>
    </html>
  `

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={
        <div className="flex items-center gap-2">
          <span className="text-warning bg-warning/10 p-1.5 rounded-lg"><Code2 size={16} /></span>
          {item.title}
        </div>
      }
      size="xl"
      footer={
        <div className="flex justify-between w-full">
          <div className="flex bg-surface-2 p-1 rounded-lg border border-border">
            <button 
              onClick={() => setView('preview')}
              className={cn('flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-md transition-colors', view === 'preview' ? 'bg-surface text-text-1 shadow-sm' : 'text-text-3 hover:text-text-2')}
            >
              <MonitorPlay size={14} /> Preview
            </button>
            <button 
              onClick={() => setView('code')}
              className={cn('flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-md transition-colors', view === 'code' ? 'bg-surface text-text-1 shadow-sm' : 'text-text-3 hover:text-text-2')}
            >
              <Code2 size={14} /> Source Code
            </button>
          </div>
          <Button variant="secondary" onClick={onClose}>Close</Button>
        </div>
      }
    >
      <div className="h-[60vh] bg-surface-2 border border-border rounded-xl overflow-hidden relative">
        {view === 'preview' ? (
          <iframe
            title="Component Preview"
            srcDoc={srcDoc}
            sandbox="allow-scripts allow-same-origin"
            className="w-full h-full border-none bg-white" // Usually components preview best on white/light background
          />
        ) : (
          <div className="h-full overflow-auto p-4 bg-[#1e1e1e] text-[#d4d4d4] font-mono text-xs leading-relaxed">
            <pre><code>{item.content}</code></pre>
          </div>
        )}
      </div>
    </Modal>
  )
}
