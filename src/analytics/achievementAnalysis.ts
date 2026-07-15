import type { ScoreRecord } from '../types/grade'

export function achievementDistribution(scores: ScoreRecord[]): Array<{ name: string; value: number }> {
  const counts = new Map<string, number>()
  for (const score of scores) {
    if (score.achievement) counts.set(score.achievement, (counts.get(score.achievement) ?? 0) + 1)
  }
  return [...counts.entries()].map(([name, value]) => ({ name, value })).sort((a, b) => a.name.localeCompare(b.name, 'ko'))
}
