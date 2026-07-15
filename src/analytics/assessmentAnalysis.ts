import type { ScoreRecord } from '../types/grade'
import { descriptiveStats } from './descriptiveStats'

export function assessmentSummaries(scores: ScoreRecord[]) {
  const groups = new Map<string, ScoreRecord[]>()
  for (const score of scores) {
    const key = `${score.subjectId}|${score.kind}|${score.assessmentName}`
    groups.set(key, [...(groups.get(key) ?? []), score])
  }
  return [...groups.entries()].map(([key, records]) => {
    const [subjectId, kind, assessmentName] = key.split('|')
    return { subjectId, kind, assessmentName, ...descriptiveStats(records.map((record) => record.score)) }
  })
}
