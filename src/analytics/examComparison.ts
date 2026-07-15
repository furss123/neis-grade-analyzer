import type { ScoreRecord } from '../types/grade'

export interface ExamChange {
  studentId: string
  subjectId: string
  first: number
  latest: number
  change: number
}

export function compareExams(scores: ScoreRecord[]): ExamChange[] {
  const groups = new Map<string, ScoreRecord[]>()
  for (const score of scores.filter((item) => item.kind === 'exam' && item.score !== undefined)) {
    const key = `${score.studentId}|${score.subjectId}`
    groups.set(key, [...(groups.get(key) ?? []), score])
  }
  return [...groups.entries()].flatMap(([key, records]) => {
    const unique = [...new Map(records.map((record) => [record.assessmentName, record])).values()]
    if (unique.length < 2) return []
    const [studentId, subjectId] = key.split('|')
    const first = unique[0].score as number
    const latest = unique[unique.length - 1].score as number
    return [{ studentId, subjectId, first, latest, change: Math.round((latest - first) * 100) / 100 }]
  })
}
