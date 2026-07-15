export function normalizeText(value: unknown): string {
  return String(value ?? '')
    .normalize('NFKC')
    .replace(/[\r\n\t]+/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
}

export function compactText(value: unknown): string {
  return normalizeText(value).replace(/[\s·ㆍ]/g, '').toLowerCase()
}

export function matchesAny(value: unknown, keywords: string[]): boolean {
  const compact = compactText(value)
  return keywords.some((keyword) => compact.includes(compactText(keyword)))
}
