import { useState } from 'react'
import { Star, Code2, Sparkles, Bookmark, Copy, Check, MonitorPlay } from 'lucide-react'
import { Card } from '@/shared/ui'
import { Badge } from '@/shared/ui/Badge'
import { Button } from '@/shared/ui/Button'
import { formatRelative } from '@/shared/utils/date'
import { cn } from '@/shared/utils/cn'
import type { LibraryItem } from '@/shared/types'

const TYPE_BADGES: Record<LibraryItem['type'], 'info' | 'warning' | 'success'> = {
  inspiration: 'info', component: 'warning', prompt: 'success'
}
const TYPE_ICONS: Record<LibraryItem['type'], React.ReactNode> = {
  inspiration: <Sparkles size={12} />,
  component: <Code2 size={12} />,
  prompt: <Bookmark size={12} />,
}

export interface LibraryItemCardProps {
  item: LibraryItem
  projectName?: string
  onToggleFavorite: () => void
  onEdit: () => void
  onDelete: () => void
  onPreview?: () => void
}

export function LibraryItemCard({ item, projectName, onToggleFavorite, onEdit, onDelete, onPreview }: LibraryItemCardProps) {
  const [copied, setCopied] = useState(false)

  const handleCopy = (e: React.MouseEvent) => {
    e.stopPropagation()
    if (!item.content) return
    navigator.clipboard.writeText(item.content)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <Card hoverable className="group overflow-hidden flex flex-col">
      {/* Thumbnail / type indicator */}
      {item.imageUrl ? (
        <div className="h-32 overflow-hidden">
          <img src={item.imageUrl} alt={item.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />
        </div>
      ) : (
        <div className={cn(
          'h-20 flex items-center justify-center',
          item.type === 'inspiration' ? 'bg-primary/5' :
          item.type === 'component' ? 'bg-warning/5' : 'bg-success/5'
        )}>
          {item.type === 'component' && item.content ? (
            <pre className="text-[10px] text-text-3 font-mono px-4 overflow-hidden line-clamp-3 w-full">{item.content.slice(0, 120)}</pre>
          ) : (
            <div className={cn('w-10 h-10 rounded-xl flex items-center justify-center',
              item.type === 'inspiration' ? 'bg-primary/10 text-primary' :
              item.type === 'component' ? 'bg-warning/10 text-warning' : 'bg-success/10 text-success'
            )}>
              {TYPE_ICONS[item.type]}
            </div>
          )}
        </div>
      )}

      <div className="p-3 flex-1 flex flex-col">
        <div className="flex items-start justify-between gap-2 mb-1.5">
          <h3 className="text-sm font-semibold text-text-1 line-clamp-1">{item.title}</h3>
          <button
            onClick={e => { e.stopPropagation(); onToggleFavorite() }}
            className="text-text-3 hover:text-warning transition-colors flex-shrink-0"
            aria-label={item.isFavorite ? 'Remove from favorites' : 'Add to favorites'}
          >
            <Star size={13} fill={item.isFavorite ? 'var(--color-warning)' : 'none'} className={item.isFavorite ? 'text-warning' : ''} />
          </button>
        </div>

        {item.description && <p className="text-xs text-text-2 line-clamp-2 mb-2 flex-1">{item.description}</p>}

        <div className="flex items-center justify-between mt-auto pt-2">
          <Badge variant={TYPE_BADGES[item.type]} size="sm">{item.type}</Badge>
          <span className="text-xs text-text-3">{formatRelative(item.updatedAt)}</span>
        </div>

        {item.tags.length > 0 && (
          <div className="flex gap-1 mt-2 flex-wrap">
            {item.tags.slice(0, 2).map(tag => (
              <span key={tag} className="text-[10px] bg-surface-3 text-text-3 rounded-full px-1.5 py-0.5">{tag}</span>
            ))}
          </div>
        )}

        {/* Actions */}
        <div className="flex gap-2 mt-3 opacity-0 group-hover:opacity-100 transition-opacity">
          {item.type === 'component' && onPreview ? (
            <Button variant="primary" size="sm" onClick={onPreview} className="flex-1" leftIcon={<MonitorPlay size={13} />}>Preview</Button>
          ) : (
            <Button variant="secondary" size="sm" onClick={onEdit} className="flex-1">Edit</Button>
          )}
          {(item.type === 'component' || item.type === 'prompt') && item.content && (
            <Button variant="ghost" size="sm" onClick={handleCopy} title="Copy Content">
              {copied ? <Check size={14} className="text-success" /> : <Copy size={14} />}
            </Button>
          )}
          {item.url && (
            <a href={item.url} target="_blank" rel="noopener noreferrer">
              <Button variant="ghost" size="sm">↗</Button>
            </a>
          )}
        </div>
      </div>
    </Card>
  )
}
