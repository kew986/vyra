/** Project accent color palette */
export const PROJECT_COLORS = [
  '#5B8CFF', '#7C5CFF', '#22C55E', '#F59E0B', '#EF4444',
  '#EC4899', '#14B8A6', '#F97316', '#8B5CF6', '#06B6D4',
  '#84CC16', '#6366F1', '#F43F5E', '#10B981', '#FBBF24',
]

/** Get a random project color */
export function randomProjectColor(): string {
  return PROJECT_COLORS[Math.floor(Math.random() * PROJECT_COLORS.length)]
}

/** Convert hex to rgba */
export function hexToRgba(hex: string, alpha = 1): string {
  const r = parseInt(hex.slice(1, 3), 16)
  const g = parseInt(hex.slice(3, 5), 16)
  const b = parseInt(hex.slice(5, 7), 16)
  return `rgba(${r}, ${g}, ${b}, ${alpha})`
}

/** Get readable text color (black or white) for a background hex */
export function getContrastText(hex: string): string {
  const r = parseInt(hex.slice(1, 3), 16)
  const g = parseInt(hex.slice(3, 5), 16)
  const b = parseInt(hex.slice(5, 7), 16)
  const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255
  return luminance > 0.5 ? '#0F1117' : '#FFFFFF'
}

/** Compress a base64 image to target max size */
export async function compressImage(file: File, maxSizeKB = 2048): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = (e) => {
      const img = new Image()
      img.onload = () => {
        const canvas = document.createElement('canvas')
        let { width, height } = img

        // Max dimensions 1200x800 for gallery covers
        const maxW = 1200
        const maxH = 800
        if (width > maxW || height > maxH) {
          const ratio = Math.min(maxW / width, maxH / height)
          width = Math.round(width * ratio)
          height = Math.round(height * ratio)
        }

        canvas.width = width
        canvas.height = height
        const ctx = canvas.getContext('2d')!
        ctx.drawImage(img, 0, 0, width, height)

        let quality = 0.9
        let result = canvas.toDataURL('image/jpeg', quality)

        // Reduce quality if too large
        while (result.length > maxSizeKB * 1024 * 1.37 && quality > 0.1) {
          quality -= 0.1
          result = canvas.toDataURL('image/jpeg', quality)
        }

        if (result.length > maxSizeKB * 1024 * 1.37) {
          reject(new Error(`Image too large even after compression. Please use a smaller image (max ${maxSizeKB}KB).`))
        } else {
          resolve(result)
        }
      }
      img.onerror = reject
      img.src = e.target?.result as string
    }
    reader.onerror = reject
    reader.readAsDataURL(file)
  })
}
