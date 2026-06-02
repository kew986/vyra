import { useState, useMemo, useEffect } from 'react'
import { useSearchParams } from 'react-router-dom'
import { Plus, Search, Star, Bookmark, Code2, Sparkles, Library, X } from 'lucide-react'
import { useLibraryStore } from './store/libraryStore'
import { useProjectStore } from '@/features/projects/store/projectStore'
import { Button } from '@/shared/ui/Button'
import { Input } from '@/shared/ui/Input'
import { Card, EmptyState, Tabs } from '@/shared/ui'
import { Badge } from '@/shared/ui/Badge'
import { LibraryItemForm } from './components/LibraryItemForm'
import { formatRelative } from '@/shared/utils/date'
import { cn } from '@/shared/utils/cn'
import type { LibraryItem } from '@/shared/types'
import { LibraryItemCard } from './components/LibraryItemCard'
import { ComponentPreviewModal } from './components/ComponentPreviewModal'

const TYPE_TABS = [
  { id: 'all', label: 'All', icon: <Library size={13} /> },
  { id: 'inspiration', label: 'Inspiration', icon: <Sparkles size={13} /> },
  { id: 'component', label: 'Component', icon: <Code2 size={13} /> },
  { id: 'prompt', label: 'Prompt', icon: <Bookmark size={13} /> },
]

const TYPE_BADGES: Record<LibraryItem['type'], 'info' | 'warning' | 'success'> = {
  inspiration: 'info', component: 'warning', prompt: 'success'
}
const TYPE_ICONS: Record<LibraryItem['type'], React.ReactNode> = {
  inspiration: <Sparkles size={12} />,
  component: <Code2 size={12} />,
  prompt: <Bookmark size={12} />,
}

export default function LibraryPage() {
  const [searchParams, setSearchParams] = useSearchParams()
  const { items, activeTab, setTab, toggleFavorite, remove } = useLibraryStore()
  const projects = useProjectStore(s => s.projects)
  const [showForm, setShowForm] = useState(false)
  const [editItem, setEditItem] = useState<LibraryItem | undefined>()
  const [previewItem, setPreviewItem] = useState<LibraryItem | undefined>()
  const [search, setSearch] = useState('')
  const [favoritesOnly, setFavoritesOnly] = useState(false)

  useEffect(() => {
    if (searchParams.get('new') === 'true') {
      setShowForm(true)
      const nextParams = new URLSearchParams(searchParams)
      nextParams.delete('new')
      setSearchParams(nextParams, { replace: true })
    }
  }, [searchParams, setSearchParams])


  const filtered = useMemo(() => {
    let result = [...items]
    if (activeTab !== 'all') result = result.filter(i => i.type === activeTab)
    if (favoritesOnly) result = result.filter(i => i.isFavorite)
    if (search.trim()) {
      const q = search.toLowerCase()
      result = result.filter(i =>
        i.title.toLowerCase().includes(q) ||
        i.description?.toLowerCase().includes(q) ||
        i.content?.toLowerCase().includes(q) ||
        i.tags.some(t => t.toLowerCase().includes(q))
      )
    }
    return result
  }, [items, activeTab, favoritesOnly, search])

  const tabCounts = useMemo(() => {
    const c: Record<string, number> = { all: items.length }
    TYPE_TABS.slice(1).forEach(t => { c[t.id] = items.filter(i => i.type === t.id).length })
    return c
  }, [items])

  return (
    <div className="p-6 lg:p-8 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-text-1">Library</h1>
          <p className="text-sm text-text-2 mt-0.5">Your reusable knowledge repository</p>
        </div>
        <Button leftIcon={<Plus size={14} />} onClick={() => setShowForm(true)}>Add Item</Button>
      </div>

      {/* Toolbar */}
      <div className="flex flex-col gap-3 mb-6">
        <Tabs tabs={TYPE_TABS.map(t => ({ ...t, count: tabCounts[t.id] }))} activeTab={activeTab} onChange={id => setTab(id as typeof activeTab)} />
        <div className="flex flex-row items-center gap-2 w-full">
          <div className="flex-1 min-w-0">
            <Input
              placeholder="Search library..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              leftIcon={<Search size={13} />}
              rightIcon={search ? <button onClick={() => setSearch('')}><X size={12} /></button> : undefined}
              className="w-full"
            />
          </div>
          <button
            onClick={() => setFavoritesOnly(f => !f)}
            className={cn(
              'flex-shrink-0 flex items-center justify-center gap-1.5 h-9 px-3 rounded-lg text-sm border transition-all',
              favoritesOnly
                ? 'bg-warning/10 text-warning border-warning/30'
                : 'bg-surface-2 text-text-2 border-border hover:border-border-2'
            )}
          >
            <Star size={13} fill={favoritesOnly ? 'currentColor' : 'none'} />
            <span className="hidden sm:inline">Favorites</span>
          </button>
        </div>
      </div>

      {/* Grid */}
      {filtered.length === 0 ? (
        <EmptyState
          icon={<Library size={20} />}
          title={search || favoritesOnly ? 'No items found' : 'Library is empty'}
          description={search ? `No results for "${search}"` : 'Save inspirations, components, and AI prompts here.'}
          action={!search && !favoritesOnly ? <Button leftIcon={<Plus size={12} />} onClick={() => setShowForm(true)}>Add First Item</Button> : undefined}
        />
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {filtered.map(item => (
            <LibraryItemCard
              key={item.id}
              item={item}
              projectName={projects.find(p => p.id === item.projectId)?.name}
              onToggleFavorite={() => toggleFavorite(item.id)}
              onEdit={() => { setEditItem(item); setShowForm(true) }}
              onDelete={() => remove(item.id)}
              onPreview={item.type === 'component' ? () => setPreviewItem(item) : undefined}
            />
          ))}
        </div>
      )}

      <LibraryItemForm open={showForm} onClose={() => { setShowForm(false); setEditItem(undefined) }} item={editItem} />
      {previewItem && (
        <ComponentPreviewModal open={!!previewItem} onClose={() => setPreviewItem(undefined)} item={previewItem} />
      )}
    </div>
  )
}
