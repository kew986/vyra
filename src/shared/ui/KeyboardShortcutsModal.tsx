import React from 'react'
import { Modal } from './Modal'
import { Keyboard, Command } from 'lucide-react'

interface ShortcutItemProps {
  keys: string[]
  description: string
}

function ShortcutItem({ keys, description }: ShortcutItemProps) {
  return (
    <div className="flex items-center justify-between py-2 border-b border-border/50 last:border-b-0">
      <span className="text-sm text-text-2">{description}</span>
      <div className="flex items-center gap-1">
        {keys.map((k, index) => (
          <React.Fragment key={k}>
            {index > 0 && <span className="text-xs text-text-3 font-medium px-0.5">then</span>}
            <kbd className="inline-flex items-center justify-center h-6 min-w-6 px-1.5 text-[11px] font-mono font-bold text-text-1 bg-surface-3 border border-border-2 rounded shadow-sm">
              {k === 'cmd' ? <Command size={10} className="mr-0.5" /> : k}
            </kbd>
          </React.Fragment>
        ))}
      </div>
    </div>
  )
}

interface KeyboardShortcutsModalProps {
  open: boolean
  onClose: () => void
}

export function KeyboardShortcutsModal({ open, onClose }: KeyboardShortcutsModalProps) {
  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Keyboard Shortcuts"
      description="Navigate and trigger quick actions instantly from anywhere."
      size="lg"
    >
      <div className="space-y-6">
        {/* Navigation Section */}
        <div>
          <h3 className="text-xs font-semibold text-primary uppercase tracking-wider mb-2 flex items-center gap-1.5">
            <span className="w-1.5 h-1.5 rounded-full bg-primary" />
            Navigation
          </h3>
          <div className="bg-surface-2/40 border border-border rounded-xl p-3 space-y-0.5">
            <ShortcutItem keys={['g', 'd']} description="Go to Dashboard" />
            <ShortcutItem keys={['g', 'p']} description="Go to Projects" />
            <ShortcutItem keys={['g', 't']} description="Go to Tasks" />
            <ShortcutItem keys={['g', 'l']} description="Go to Library" />
            <ShortcutItem keys={['g', 'n']} description="Go to Notes" />
            <ShortcutItem keys={['g', 's']} description="Go to Settings" />
          </div>
        </div>

        {/* Actions Section */}
        <div>
          <h3 className="text-xs font-semibold text-secondary uppercase tracking-wider mb-2 flex items-center gap-1.5">
            <span className="w-1.5 h-1.5 rounded-full bg-secondary" />
            Actions
          </h3>
          <div className="bg-surface-2/40 border border-border rounded-xl p-3 space-y-0.5">
            <ShortcutItem keys={['n', 'p']} description="Create New Project" />
            <ShortcutItem keys={['n', 't']} description="Create New Task" />
            <ShortcutItem keys={['n', 'l']} description="Create New Library Item" />
            <ShortcutItem keys={['n', 'n']} description="Create New Note" />
            <ShortcutItem keys={['cmd', 'k']} description="Open Command Palette" />
            <ShortcutItem keys={['?']} description="Toggle Shortcuts Guide" />
          </div>
        </div>

        {/* Tip */}
        <div className="flex items-center gap-2 text-xs text-text-3 bg-surface-2/30 border border-border/50 rounded-lg p-2.5">
          <Keyboard size={13} className="text-text-2 flex-shrink-0" />
          <span>Press any double-key combination in sequence, e.g., press <kbd className="font-mono text-text-2">g</kbd> then <kbd className="font-mono text-text-2">p</kbd> to open Projects.</span>
        </div>
      </div>
    </Modal>
  )
}
