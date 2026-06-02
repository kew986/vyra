import React, { useState } from 'react'
import { Search, ChevronDown, ChevronUp, RotateCcw, HelpCircle, HardDrive, BookOpen, Layers, CheckSquare, Library, FileText, Lock, Download, Smartphone } from 'lucide-react'
import { useSettingsStore } from '../store/settingsStore'
import { toast } from '@/shared/ui'
import { cn } from '@/shared/utils/cn'

interface DocTopic {
  id: string
  title: string
  category: string
  icon: React.ComponentType<{ className?: string; size?: number }>
  content: React.ReactNode
}

export function HelpDocumentation() {
  const { update } = useSettingsStore()
  const [searchQuery, setSearchQuery] = useState('')
  const [expandedId, setExpandedId] = useState<string | null>(null)

  const handleRestartTutorial = async () => {
    await update({
      hasCompletedOnboarding: false,
      lastTutorialStep: 0,
    })
    toast.success('Onboarding tutorial restarted!')
  }

  const topics: DocTopic[] = [
    {
      id: 'what-is-vyra',
      title: 'What is VYRA?',
      category: 'General',
      icon: HelpCircle,
      content: (
        <div className="space-y-2">
          <p>
            <strong>VYRA</strong> stands for <strong>Visual Workflow & Resource Architecture</strong>. It is a local-first productivity workspace designed specifically for UI/UX designers and frontend developers.
          </p>
          <p>
            Everything in VYRA runs locally in your browser. There are no cloud servers uploading your data, ensuring complete privacy, fast load times, and full offline usability.
          </p>
        </div>
      )
    },
    {
      id: 'dashboard',
      title: 'Dashboard & KPI Analytics',
      category: 'Features',
      icon: Layers,
      content: (
        <div className="space-y-2">
          <p>
            The Dashboard is your main command center. It gives you a birds-eye view of your entire workspace:
          </p>
          <ul className="list-disc pl-5 space-y-1">
            <li><strong>Active Projects:</strong> Quickly jump back into projects you are actively working on.</li>
            <li><strong>Project Health & KPI Cards:</strong> Tracks your overall task completions and automatically computes project statuses (On Track, At Risk, Overdue).</li>
            <li><strong>Today\'s Tasks:</strong> A dedicated section showing tasks due today so you stay focused on immediate goals.</li>
            <li><strong>Recent Activity:</strong> Chronological log of recent tasks, notes, or library items updated.</li>
          </ul>
        </div>
      )
    },
    {
      id: 'projects',
      title: 'Managing Projects',
      category: 'Features',
      icon: BookOpen,
      content: (
        <div className="space-y-2">
          <p>
            Projects act as files or workspaces for your creative ideas. In each Project page, you can:
          </p>
          <ul className="list-disc pl-5 space-y-1">
            <li>Change project metadata (status, priority, and due dates).</li>
            <li>Monitor task progress bars, linked components, notes, and attachments.</li>
            <li>Utilize the <strong>Moodboard Infinite Canvas</strong> tab to visually map color swatches, layout notes, and inspiration images with full zooming and panning tools.</li>
          </ul>
        </div>
      )
    },
    {
      id: 'tasks',
      title: 'Tasks & Time Tracking',
      category: 'Features',
      icon: CheckSquare,
      content: (
        <div className="space-y-2">
          <p>
            Plan, organize, and prioritize tasks with flexible layouts:
          </p>
          <ul className="list-disc pl-5 space-y-1">
            <li><strong>Multiple Views:</strong> Switch between Task List, Kanban Board, and Monthly Calendar views.</li>
            <li><strong>Time Logs:</strong> Hook up the global Pomodoro/Flow Timer (top navigation) to a specific task. While active, it logs focused duration every 10 seconds.</li>
            <li><strong>Priority Levels:</strong> Color-coded urgency flags (High, Medium, Low) help you sort out immediate action items.</li>
          </ul>
        </div>
      )
    },
    {
      id: 'library',
      title: 'Library & Component Sandbox',
      category: 'Features',
      icon: Library,
      content: (
        <div className="space-y-2">
          <p>
            The Library is a central repository for reusable digital resources:
          </p>
          <ul className="list-disc pl-5 space-y-1">
            <li><strong>Item Types:</strong> Categorize saved resources as Inspirations, UI Components, or Prompts.</li>
            <li><strong>Component Live Sandbox:</strong> Paste HTML/CSS/JS into a component asset. Hovering over the card opens a Sandboxed preview frame rendering the output in real-time.</li>
            <li><strong>Prompt Repository:</strong> Store design or AI developer prompts with easy one-click copy helper buttons.</li>
          </ul>
        </div>
      )
    },
    {
      id: 'notes',
      title: 'Rich-Text Notes & Exports',
      category: 'Features',
      icon: FileText,
      content: (
        <div className="space-y-2">
          <p>
            VYRA includes a powerful rich-text editor based on Tiptap:
          </p>
          <ul className="list-disc pl-5 space-y-1">
            <li><strong>Images:</strong> Paste images directly into the editor. They are securely saved as indexed binary data locally.</li>
            <li><strong>Task Conversion:</strong> Highlight blocks of text or lists and instantly convert them to workspace tasks.</li>
            <li><strong>Flexible Exports:</strong> Save and export notes as PDF, DOCX, Markdown (.md), or Plain Text (.txt) formats.</li>
            <li><strong>Daily Journal:</strong> Click the Journal icon in the header to open a slide-out notes drawer tied to today\'s date.</li>
          </ul>
        </div>
      )
    },
    {
      id: 'search',
      title: 'Universal Global Search',
      category: 'General',
      icon: Search,
      content: (
        <div className="space-y-2">
          <p>
            Find any piece of information across your workspace instantly:
          </p>
          <p>
            Press <strong>Ctrl + K</strong> (or <strong>Cmd + K</strong> on macOS) or click the search icon on the top navigation bar to open the Global Search overlay. It performs real-time matching across all Projects, Tasks, Library assets, and Note contents.
          </p>
        </div>
      )
    },
    {
      id: 'security',
      title: 'Security, Privacy & App Lock',
      category: 'Security',
      icon: Lock,
      content: (
        <div className="space-y-2">
          <p>
            Because VYRA values absolute user privacy, all database contents remain local to your browser. You can strengthen security with:
          </p>
          <ul className="list-disc pl-5 space-y-1">
            <li><strong>App Lock:</strong> Set a 4-to-6 digit PIN in settings. If enabled, the system locks out interactions after minutes of inactivity.</li>
            <li><strong>Local Hash Encryption:</strong> Passcode PINs are encrypted and checked locally. No credentials or data are sent to external services.</li>
          </ul>
        </div>
      )
    },
    {
      id: 'backup',
      title: 'Backup & Restore',
      category: 'Security',
      icon: Download,
      content: (
        <div className="space-y-2">
          <p>
            Protect against browser cache clearings by exporting regular database backups:
          </p>
          <ul className="list-disc pl-5 space-y-1">
            <li><strong>Export Backup:</strong> Downloads a full JSON dump of your entire database. You can optionally password-encrypt the backup.</li>
            <li><strong>Import Backup:</strong> Safely restore previous backups. The system validates the format and automatically decrypts encrypted files upon supplying the correct password.</li>
          </ul>
        </div>
      )
    },
    {
      id: 'pwa',
      title: 'Offline PWA Installation',
      category: 'General',
      icon: Smartphone,
      content: (
        <div className="space-y-2">
          <p>
            VYRA is a fully compliant Progressive Web App (PWA). You can install it on your devices for desktop and mobile offline access:
          </p>
          <ul className="list-disc pl-5 space-y-2">
            <li><strong>Google Chrome & MS Edge (Desktop):</strong> Click the install icon (square with an arrow) on the address bar, or open the menu and choose "Install VYRA".</li>
            <li><strong>iOS Safari (iPhone/iPad):</strong> Tap the Share button in Safari, scroll down, and select <strong>"Add to Home Screen"</strong>.</li>
            <li><strong>Android (Chrome):</strong> Tap the three-dot menu and select "Install App" or "Add to Home Screen".</li>
          </ul>
        </div>
      )
    }
  ]

  const filteredTopics = topics.filter(t =>
    t.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    t.category.toLowerCase().includes(searchQuery.toLowerCase())
  )

  const toggleExpand = (id: string) => {
    setExpandedId(expandedId === id ? null : id)
  }

  return (
    <div className="space-y-5">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-sm font-semibold text-text-1">Help & Documentation</h2>
          <p className="text-xs text-text-3">Learn how to make the most of your visual workflow workspace.</p>
        </div>
        <button
          onClick={handleRestartTutorial}
          className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg bg-primary/10 text-primary border border-primary/20 hover:bg-primary/20 transition-all hover-magnetic self-start"
        >
          <RotateCcw size={12} /> Restart Onboarding Tour
        </button>
      </div>

      {/* Search Input */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-text-3 w-4 h-4" />
        <input
          type="text"
          placeholder="Search help topics..."
          value={searchQuery}
          onChange={e => setSearchQuery(e.target.value)}
          className="w-full h-10 pl-9 pr-4 rounded-xl bg-surface-2 border border-border text-sm text-text-1 placeholder:text-text-3 focus:outline-none focus:border-primary transition-colors"
        />
      </div>

      {/* Accordion List */}
      <div className="space-y-2.5 max-h-[400px] overflow-y-auto pr-1 no-scrollbar">
        {filteredTopics.length > 0 ? (
          filteredTopics.map(topic => {
            const TopicIcon = topic.icon
            const isExpanded = expandedId === topic.id
            return (
              <div
                key={topic.id}
                className="border border-border/80 rounded-xl bg-surface-2/40 overflow-hidden hover:border-border transition-colors"
              >
                <button
                  onClick={() => toggleExpand(topic.id)}
                  className="w-full flex items-center justify-between p-3.5 text-left transition-colors hover:bg-surface-2/20"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-lg bg-surface-3 flex items-center justify-center text-text-2">
                      <TopicIcon size={16} />
                    </div>
                    <div>
                      <span className="text-sm font-medium text-text-1">{topic.title}</span>
                      <span className="text-[10px] uppercase font-bold text-text-3 tracking-wide block leading-none mt-1">
                        {topic.category}
                      </span>
                    </div>
                  </div>
                  {isExpanded ? (
                    <ChevronUp size={16} className="text-text-3" />
                  ) : (
                    <ChevronDown size={16} className="text-text-3" />
                  )}
                </button>

                {isExpanded && (
                  <div className="p-4 pt-0 border-t border-border/40 text-sm text-text-2 leading-relaxed bg-surface-2/10">
                    <div className="pt-3">{topic.content}</div>
                  </div>
                )}
              </div>
            )
          })
        ) : (
          <div className="text-center py-8 text-text-3 text-sm">
            No topics matched your search query.
          </div>
        )}
      </div>
    </div>
  )
}
