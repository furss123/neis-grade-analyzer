export function normalizeScore(value: unknown): number | undefined {
  if (typeof value === 'number') return Number.isFinite(value) ? value : undefined
  const text = String(value ?? '').replace(/,/g, '').trim()
  if (!text || ['-', '미응시', '결시', '해당없음'].includes(text)) return undefined
  const match = text.match(/-?\d+(?:\.\d+)?/)
  if (!match) return undefined
  const number = Number(match[0])
  return Number.isFinite(number) ? number : undefined
}

export function normalizePercent(value: unknown): number | undefined {
  const number = normalizeScore(value)
  if (number === undefined) return undefined
  return number > 0 && number <= 1 ? number * 100 : number
}
