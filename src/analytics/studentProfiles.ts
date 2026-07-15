import type { ScoreRecord, Student, Subject } from '../types/grade'
import { descriptiveStats } from './descriptiveStats'

export function studentProfiles(students: Student[], subjects: Subject[], scores: ScoreRecord[]) {
  const subjectMap = new Map(subjects.map((subject) => [subject.id, subject.name]))
  return students.map((student) => {
    const records = scores.filter((score) => score.studentId === student.id)
    const bySubject = new Map<string, number[]>()
    for (const record of records) {
      if (record.score === undefined) continue
      bySubject.set(record.subjectId, [...(bySubject.get(record.subjectId) ?? []), record.score])
    }
    const subjectsWithMean = [...bySubject.entries()].map(([id, values]) => ({ id, name: subjectMap.get(id) ?? id, mean: descriptiveStats(values).mean }))
    subjectsWithMean.sort((a, b) => b.mean - a.mean)
    return {
      ...student,
      mean: descriptiveStats(records.map((record) => record.score)).mean,
      strongest: subjectsWithMean[0]?.name,
      weakest: subjectsWithMean.at(-1)?.name,
      records: records.length,
    }
  })
}
