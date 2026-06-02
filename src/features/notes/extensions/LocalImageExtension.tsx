import { mergeAttributes, NodeViewProps } from '@tiptap/core'
import Image from '@tiptap/extension-image'
import { ReactNodeViewRenderer, NodeViewWrapper } from '@tiptap/react'
import { useState, useEffect } from 'react'
import { attachmentService } from '../services/attachmentService'

function LocalImageComponent(props: NodeViewProps) {
  const [src, setSrc] = useState<string>('')
  const [loading, setLoading] = useState(true)
  const attachmentId = props.node.attrs['data-attachment-id']

  useEffect(() => {
    let objectUrl = ''
    if (attachmentId) {
      attachmentService.getAttachment(attachmentId).then(attachment => {
        if (attachment) {
          objectUrl = URL.createObjectURL(attachment.file)
          setSrc(objectUrl)
        }
        setLoading(false)
      }).catch(() => {
        setLoading(false)
      })
    } else if (props.node.attrs.src) {
      // Fallback for regular external images if any
      setSrc(props.node.attrs.src)
      setLoading(false)
    }

    return () => {
      if (objectUrl) URL.revokeObjectURL(objectUrl)
    }
  }, [attachmentId, props.node.attrs.src])

  return (
    <NodeViewWrapper className="relative inline-block my-4 max-w-full group">
      {loading ? (
        <div className="w-full h-32 bg-surface-2 rounded flex items-center justify-center animate-pulse">
          <span className="text-xs text-text-3">Loading image...</span>
        </div>
      ) : src ? (
        <img 
          src={src} 
          alt={props.node.attrs.alt || ''} 
          title={props.node.attrs.title || ''}
          className="rounded shadow-sm max-w-full h-auto cursor-pointer border border-transparent hover:border-primary/50 transition-colors"
          onClick={() => {
            // Optional: trigger full-screen preview here later
          }}
        />
      ) : (
        <div className="w-full h-32 bg-danger/10 rounded flex items-center justify-center border border-danger/20 text-danger text-xs">
          Image not found
        </div>
      )}
    </NodeViewWrapper>
  )
}

export const LocalImage = Image.extend({
  addAttributes() {
    return {
      ...this.parent?.(),
      'data-attachment-id': {
        default: null,
      },
    }
  },

  addNodeView() {
    return ReactNodeViewRenderer(LocalImageComponent)
  },
})
