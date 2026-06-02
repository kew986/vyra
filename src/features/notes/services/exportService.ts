import { jsPDF } from 'jspdf'
import html2canvas from 'html2canvas'
import TurndownService from 'turndown'
import { Document, Packer, Paragraph, TextRun, HeadingLevel } from 'docx'
import { formatDate } from '@/shared/utils/date'
import type { Note } from '@/shared/types'

// Setup Turndown
const turndownService = new TurndownService({
  headingStyle: 'atx',
  bulletListMarker: '-',
  codeBlockStyle: 'fenced'
})

turndownService.addRule('taskList', {
  filter: 'li',
  replacement: function (content, node) {
    const isTask = node.hasAttribute('data-type') && node.getAttribute('data-type') === 'taskItem'
    const isChecked = node.hasAttribute('data-checked') && node.getAttribute('data-checked') === 'true'
    const prefix = isTask ? (isChecked ? '[x] ' : '[ ] ') : '- '
    return prefix + content + '\n'
  }
})

// Utility to trigger download
const downloadBlob = (blob: Blob, filename: string) => {
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  a.click()
  URL.revokeObjectURL(url)
}

const generateSlug = (title: string) => {
  return title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '')
}

const getFilename = (note: Note, ext: string) => {
  const date = new Date().toISOString().split('T')[0]
  const slug = generateSlug(note.title || 'untitled')
  return `vyra-${slug}-${date}.${ext}`
}

export const exportService = {
  async exportToTXT(note: Note, plainText: string) {
    const header = `${note.title}\nCreated: ${formatDate(note.createdAt)}\nUpdated: ${formatDate(note.updatedAt)}\n\n`
    const content = header + plainText
    const blob = new Blob([content], { type: 'text/plain;charset=utf-8' })
    downloadBlob(blob, getFilename(note, 'txt'))
  },

  async exportToMarkdown(note: Note) {
    const markdown = turndownService.turndown(note.content)
    const header = `# ${note.title}\n> Created: ${formatDate(note.createdAt)} | Updated: ${formatDate(note.updatedAt)}\n\n`
    const content = header + markdown
    const blob = new Blob([content], { type: 'text/markdown;charset=utf-8' })
    downloadBlob(blob, getFilename(note, 'md'))
  },

  async exportToPDF(note: Note, editorContainer: HTMLElement) {
    // A4 width at 96 DPI is roughly 794px.
    // We'll use an 800px container to generate a clean high-res canvas, then scale it into the PDF.
    const tempContainer = document.createElement('div')
    tempContainer.style.position = 'absolute'
    tempContainer.style.left = '-9999px'
    tempContainer.style.width = '794px'
    tempContainer.style.padding = '0' // We'll add margins in the PDF itself
    tempContainer.style.backgroundColor = '#ffffff' // Force white bg for PDF
    tempContainer.style.color = '#000000'
    
    // Add Header
    tempContainer.innerHTML = `
      <div style="margin-bottom: 24px; font-family: sans-serif;">
        <h1 style="margin: 0 0 8px 0; font-size: 24px;">${note.title}</h1>
        <p style="margin: 0; font-size: 12px; color: #666;">
          Created: ${formatDate(note.createdAt)} | Updated: ${formatDate(note.updatedAt)}
        </p>
      </div>
      <div style="font-family: sans-serif; line-height: 1.6;">
        ${note.content}
      </div>
    `
    document.body.appendChild(tempContainer)

    try {
      const canvas = await html2canvas(tempContainer, {
        scale: 2,
        useCORS: true,
        backgroundColor: '#ffffff'
      })

      const imgData = canvas.toDataURL('image/png')
      
      // Standard A4 dimensions in pt (72 dpi): 595.28 x 841.89
      const pdf = new jsPDF({
        orientation: 'portrait',
        unit: 'pt',
        format: 'a4'
      })
      
      const pdfWidth = pdf.internal.pageSize.getWidth()
      const pdfHeight = pdf.internal.pageSize.getHeight()
      
      // Notion-like margins (e.g., 72pt = 1 inch)
      const margin = 72
      
      const contentWidth = pdfWidth - (margin * 2)
      // Calculate proportional height
      const contentHeight = (canvas.height * contentWidth) / canvas.width
      
      pdf.addImage(imgData, 'PNG', margin, margin, contentWidth, contentHeight)
      pdf.save(getFilename(note, 'pdf'))
    } finally {
      document.body.removeChild(tempContainer)
    }
  },

  async exportToDOCX(note: Note) {
    // Generate simple DOCX from markdown via splitting
    const markdown = turndownService.turndown(note.content)
    const lines = markdown.split('\n')
    
    const children: any[] = [
      new Paragraph({
        text: note.title || 'Untitled Note',
        heading: HeadingLevel.HEADING_1,
      }),
      new Paragraph({
        text: `Created: ${formatDate(note.createdAt)} | Updated: ${formatDate(note.updatedAt)}`,
        style: 'Subtitle',
      }),
      new Paragraph({ text: '' }) // Spacer
    ]

    for (const line of lines) {
      if (!line.trim()) {
        children.push(new Paragraph({ text: '' }))
        continue
      }
      
      if (line.startsWith('# ')) {
        children.push(new Paragraph({ text: line.replace('# ', ''), heading: HeadingLevel.HEADING_1 }))
      } else if (line.startsWith('## ')) {
        children.push(new Paragraph({ text: line.replace('## ', ''), heading: HeadingLevel.HEADING_2 }))
      } else if (line.startsWith('### ')) {
        children.push(new Paragraph({ text: line.replace('### ', ''), heading: HeadingLevel.HEADING_3 }))
      } else if (line.startsWith('- ') || line.startsWith('* ')) {
        children.push(new Paragraph({ text: line.substring(2), bullet: { level: 0 } }))
      } else if (line.startsWith('[ ] ') || line.startsWith('[x] ')) {
        children.push(new Paragraph({ text: line, bullet: { level: 0 } }))
      } else {
        // Basic paragraph (could add bold/italic parsing here, but keeping it robust for now)
        children.push(new Paragraph({ text: line }))
      }
    }

    const doc = new Document({
      sections: [{
        properties: {
          page: {
            margin: {
              top: 1440, // 1 inch in twips
              right: 1440,
              bottom: 1440,
              left: 1440,
            },
          },
        },
        children
      }]
    })

    const blob = await Packer.toBlob(doc)
    downloadBlob(blob, getFilename(note, 'docx'))
  }
}
