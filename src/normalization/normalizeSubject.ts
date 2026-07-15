import type { Subject } from '../types/grade'
import { normalizeText } from './normalizeHeaders'

const TRAILING_DOCUMENT_TITLE = /(?:과목)?\s*(?:정기시험|지필평가)\s*[\/]?\s*수행평가\s*성적\s*일람표.*$/i

export function normalizeSubject(rawValue: unknown): Omit<Subject, 'id'> {
  const rawName = normalizeText(rawValue).replace(TRAILING_DOCUMENT_TITLE, '').trim()
  const creditsMatch = rawName.match(/\((\d+(?:\.\d+)?)\)\s*$/)
  const credits = creditsMatch ? Number(creditsMatch[1]) : undefined
  const withoutCredits = rawName.replace(/\(\d+(?:\.\d+)?\)\s*$/, '').trim()
  const separator = withoutCredits.lastIndexOf(':')
  const group = separator >= 0 ? withoutCredits.slice(0, separator).trim() : undefined
  const name = (separator >= 0 ? withoutCredits.slice(separator + 1) : withoutCredits).trim()

  return { rawName: normalizeText(rawValue), name: name || '과목 미상', group, credits }
}

export function subjectId(name: string): string {
  return normalizeText(name).replace(/\s/g, '').toLowerCase()
}
