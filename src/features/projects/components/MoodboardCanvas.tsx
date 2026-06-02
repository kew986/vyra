import { useState, useRef, useEffect } from 'react'
import { Plus, Image as ImageIcon, Type, Palette, Trash2, Maximize, ZoomIn, ZoomOut } from 'lucide-react'
import { useProjectStore } from '@/features/projects/store/projectStore'
import { Button } from '@/shared/ui/Button'
import { cn } from '@/shared/utils/cn'
import type { MoodboardNode } from '@/shared/types'

interface MoodboardCanvasProps {
  projectId: string
}

export function MoodboardCanvas({ projectId }: MoodboardCanvasProps) {
  const { projects, update } = useProjectStore()
  const project = projects.find(p => p.id === projectId)
  
  const containerRef = useRef<HTMLDivElement>(null)
  
  const [nodes, setNodes] = useState<MoodboardNode[]>(project?.moodboardNodes || [])
  const [scale, setScale] = useState(1)
  const [position, setPosition] = useState({ x: 0, y: 0 })
  const [isPanning, setIsPanning] = useState(false)
  const [startPan, setStartPan] = useState({ x: 0, y: 0 })
  const [draggedNode, setDraggedNode] = useState<string | null>(null)
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 })

  // Save changes to store
  useEffect(() => {
    if (project && JSON.stringify(project.moodboardNodes) !== JSON.stringify(nodes)) {
      update(projectId, { moodboardNodes: nodes })
    }
  }, [nodes, projectId, project, update])

  const handleWheel = (e: React.WheelEvent) => {
    if (e.ctrlKey || e.metaKey) {
      e.preventDefault()
      const newScale = Math.min(Math.max(0.1, scale - e.deltaY * 0.01), 3)
      setScale(newScale)
    } else {
      setPosition(prev => ({
        x: prev.x - e.deltaX,
        y: prev.y - e.deltaY
      }))
    }
  }

  const handlePointerDown = (e: React.PointerEvent) => {
    if (e.button === 1 || e.button === 2 || (e.button === 0 && e.target === containerRef.current)) {
      // Middle click, right click, or left click on background = pan
      setIsPanning(true)
      setStartPan({ x: e.clientX - position.x, y: e.clientY - position.y })
      containerRef.current?.setPointerCapture(e.pointerId)
    }
  }

  const handlePointerMove = (e: React.PointerEvent) => {
    if (isPanning) {
      setPosition({
        x: e.clientX - startPan.x,
        y: e.clientY - startPan.y
      })
    } else if (draggedNode) {
      const x = (e.clientX - dragOffset.x - position.x) / scale
      const y = (e.clientY - dragOffset.y - position.y) / scale
      
      setNodes(prev => prev.map(n => n.id === draggedNode ? { ...n, x, y } : n))
    }
  }

  const handlePointerUp = (e: React.PointerEvent) => {
    setIsPanning(false)
    setDraggedNode(null)
    containerRef.current?.releasePointerCapture(e.pointerId)
  }

  const addNode = (type: MoodboardNode['type']) => {
    const newNode: MoodboardNode = {
      id: crypto.randomUUID(),
      type,
      x: -position.x / scale + window.innerWidth / 2 / scale - 100,
      y: -position.y / scale + window.innerHeight / 2 / scale - 100,
      width: type === 'color' ? 120 : 200,
      height: type === 'color' ? 120 : 200,
      content: type === 'color' ? '#5b8cff' : type === 'text' ? 'New text note' : 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?q=80&w=400',
      zIndex: nodes.length + 1
    }
    setNodes([...nodes, newNode])
  }

  const removeNode = (id: string) => {
    setNodes(prev => prev.filter(n => n.id !== id))
  }

  const updateNode = (id: string, updates: Partial<MoodboardNode>) => {
    setNodes(prev => prev.map(n => n.id === id ? { ...n, ...updates } : n))
  }

  const bringToFront = (id: string) => {
    setNodes(prev => {
      const maxZ = Math.max(0, ...prev.map(n => n.zIndex))
      return prev.map(n => n.id === id ? { ...n, zIndex: maxZ + 1 } : n)
    })
  }

  const handleNodePointerDown = (e: React.PointerEvent, id: string) => {
    if (e.button !== 0) return
    e.stopPropagation()
    const node = nodes.find(n => n.id === id)
    if (!node) return
    
    bringToFront(id)
    setDraggedNode(id)
    setDragOffset({
      x: e.clientX - (node.x * scale + position.x),
      y: e.clientY - (node.y * scale + position.y)
    })
  }

  return (
    <div className="relative w-full h-[calc(100vh-12rem)] bg-bg border border-border rounded-xl overflow-hidden mt-4 shadow-sm">
      
      {/* Toolbar */}
      <div className="absolute top-4 left-1/2 -translate-x-1/2 z-10 flex items-center gap-1.5 p-1.5 bg-surface/90 backdrop-blur-md border border-border rounded-full shadow-lg">
        <button onClick={() => addNode('image')} className="p-2 text-text-2 hover:text-text-1 hover:bg-surface-2 rounded-full transition-colors" title="Add Image">
          <ImageIcon size={16} />
        </button>
        <button onClick={() => addNode('text')} className="p-2 text-text-2 hover:text-text-1 hover:bg-surface-2 rounded-full transition-colors" title="Add Text">
          <Type size={16} />
        </button>
        <button onClick={() => addNode('color')} className="p-2 text-text-2 hover:text-text-1 hover:bg-surface-2 rounded-full transition-colors" title="Add Color Swatch">
          <Palette size={16} />
        </button>
        <div className="w-px h-4 bg-border mx-2" />
        <button onClick={() => setScale(s => Math.min(s + 0.1, 3))} className="p-2 text-text-2 hover:text-text-1 hover:bg-surface-2 rounded-full transition-colors" title="Zoom In">
          <ZoomIn size={16} />
        </button>
        <div className="text-xs font-medium text-text-3 min-w-[3ch] text-center">{Math.round(scale * 100)}%</div>
        <button onClick={() => setScale(s => Math.max(s - 0.1, 0.1))} className="p-2 text-text-2 hover:text-text-1 hover:bg-surface-2 rounded-full transition-colors" title="Zoom Out">
          <ZoomOut size={16} />
        </button>
        <button onClick={() => { setScale(1); setPosition({ x: 0, y: 0 }) }} className="p-2 text-text-2 hover:text-text-1 hover:bg-surface-2 rounded-full transition-colors" title="Reset View">
          <Maximize size={16} />
        </button>
      </div>

      {/* Canvas */}
      <div
        ref={containerRef}
        className={cn("w-full h-full cursor-grab touch-none", isPanning && "cursor-grabbing")}
        onWheel={handleWheel}
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        onPointerLeave={handlePointerUp}
        onContextMenu={e => e.preventDefault()}
        style={{
          backgroundImage: 'radial-gradient(var(--tw-colors-border) 1px, transparent 1px)',
          backgroundSize: `${40 * scale}px ${40 * scale}px`,
          backgroundPosition: `${position.x}px ${position.y}px`
        }}
      >
        <div
          className="origin-top-left absolute top-0 left-0"
          style={{
            transform: `translate(${position.x}px, ${position.y}px) scale(${scale})`
          }}
        >
          {nodes.map(node => (
            <div
              key={node.id}
              className={cn(
                "absolute bg-surface rounded-xl shadow-md border border-border group overflow-hidden touch-none",
                draggedNode === node.id ? "shadow-xl ring-2 ring-primary/50 cursor-grabbing" : "cursor-grab hover:border-border-2 hover:shadow-lg transition-shadow"
              )}
              style={{
                left: node.x,
                top: node.y,
                width: node.width,
                height: node.height,
                zIndex: node.zIndex
              }}
              onPointerDown={e => handleNodePointerDown(e, node.id)}
            >
              {/* Delete button */}
              <button
                onClick={(e) => { e.stopPropagation(); removeNode(node.id) }}
                className="absolute top-2 right-2 p-1.5 bg-danger/10 text-danger rounded-md opacity-0 group-hover:opacity-100 transition-opacity z-10"
              >
                <Trash2 size={12} />
              </button>

              {/* Node Content */}
              {node.type === 'image' && (
                <div className="w-full h-full relative">
                  <img src={node.content} alt="" className="w-full h-full object-cover pointer-events-none" />
                  <div className="absolute bottom-0 left-0 right-0 p-2 bg-gradient-to-t from-black/60 to-transparent opacity-0 group-hover:opacity-100 transition-opacity flex">
                    <input
                      type="text"
                      className="text-xs bg-black/50 text-white px-2 py-1 rounded w-full outline-none"
                      value={node.content}
                      onChange={e => updateNode(node.id, { content: e.target.value })}
                      onClick={e => e.stopPropagation()}
                      placeholder="Image URL..."
                    />
                  </div>
                </div>
              )}
              
              {node.type === 'text' && (
                <textarea
                  className="w-full h-full p-4 resize-none bg-transparent outline-none text-text-1 text-sm font-medium"
                  value={node.content}
                  onChange={e => updateNode(node.id, { content: e.target.value })}
                  onClick={e => { e.stopPropagation(); bringToFront(node.id) }}
                  placeholder="Type here..."
                />
              )}

              {node.type === 'color' && (
                <div className="w-full h-full flex flex-col">
                  <div className="flex-1" style={{ backgroundColor: node.content }} />
                  <div className="h-10 bg-surface border-t border-border flex items-center justify-center px-2">
                    <input
                      type="text"
                      className="w-full bg-transparent text-center text-xs font-mono font-medium text-text-1 outline-none uppercase"
                      value={node.content}
                      onChange={e => updateNode(node.id, { content: e.target.value })}
                      onClick={e => e.stopPropagation()}
                      maxLength={7}
                    />
                  </div>
                </div>
              )}

              {/* Resize Handle (bottom right) */}
              <div 
                className="absolute bottom-0 right-0 w-4 h-4 cursor-nwse-resize opacity-0 group-hover:opacity-100"
                onPointerDown={e => {
                  e.stopPropagation()
                  bringToFront(node.id)
                  const startW = node.width
                  const startH = node.height
                  const startX = e.clientX
                  const startY = e.clientY
                  
                  const onMove = (ev: PointerEvent) => {
                    updateNode(node.id, {
                      width: Math.max(100, startW + (ev.clientX - startX) / scale),
                      height: Math.max(100, startH + (ev.clientY - startY) / scale)
                    })
                  }
                  
                  const onUp = () => {
                    window.removeEventListener('pointermove', onMove)
                    window.removeEventListener('pointerup', onUp)
                  }
                  
                  window.addEventListener('pointermove', onMove)
                  window.addEventListener('pointerup', onUp)
                }}
              >
                <div className="absolute bottom-1 right-1 w-2 h-2 bg-text-3 rounded-full" />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
