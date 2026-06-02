import { nanoid } from 'nanoid'

/** Generate a unique ID */
export const generateId = (): string => nanoid()

/** Generate a short ID (for display) */
export const generateShortId = (): string => nanoid(8)
