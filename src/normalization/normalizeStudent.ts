import type { Student } from '../types/grade'
import { normalizeText } from './normalizeHeaders'

export function parseClassNumber(value: unknown): Pick<Student, 'className' | 'number'> {
  const text = normalizeText(value)
  const match = text.match(/(\d+)\s*(?:반)?\s*[\/\-]\s*(\d+)/)
  if (match) return { className: match[1], number: Number(match[2]) }
  const number = Number(text.match(/\d+/)?.[0])
  return Number.isFinite(number) ? { number } : {}
}

export function studentId(studentNumber: string | undefined, name: string, className?: string, number?: number): string {
  return studentNumber?.trim() || `${className ?? ''}-${number ?? ''}-${normalizeText(name)}`
}
