import { describe, expect, it } from 'vitest'
import type { ParsedFile, ScoreRecord } from '../../src/types/grade'
import { mergeParsedFiles } from '../../src/utils/mergeData'

function file(id: string, score: ScoreRecord): ParsedFile {
  return {
    id,
    fileName: `${id}.xlsx`,
    sheetNames: ['성적'],
    detection: { type: 'all-subjects', confidence: 1, scores: { unknown: 0 } as ParsedFile['detection']['scores'], evidence: [] },
    data: { context: {}, students: [{ id: 's1', name: '가온' }], subjects: [{ id: 'math', rawName: '수학', name: '수학' }], scores: [score] },
    warnings: [],
    status: 'success',
  }
}

describe('중복 점수 통합', () => {
  it('값이 다르면 충돌을 알리고 우선순위가 높은 출처를 사용한다', () => {
    const base = { studentId: 's1', subjectId: 'math', kind: 'exam' as const, assessmentName: '1차', sourceId: '' }
    const result = mergeParsedFiles([
      file('low', { ...base, id: 'low-score', sourceId: 'low', sourcePriority: 100, score: 80 }),
      file('high', { ...base, id: 'high-score', sourceId: 'high', sourcePriority: 300, score: 85 }),
    ])
    expect(result.data.scores[0].score).toBe(85)
    expect(result.conflicts).toHaveLength(1)
  })

  it('같은 평가라도 학기가 다르면 누적 기록으로 보존한다', () => {
    const base = { studentId: 's1', subjectId: 'math', kind: 'final' as const, assessmentName: '학기말', sourceId: '', sourcePriority: 100 }
    const result = mergeParsedFiles([
      file('first', { ...base, id: 'first-score', sourceId: 'first', score: 70, schoolYear: 2025, semester: 2 }),
      file('second', { ...base, id: 'second-score', sourceId: 'second', score: 80, schoolYear: 2026, semester: 1 }),
    ])
    expect(result.data.scores).toHaveLength(2)
    expect(result.conflicts).toHaveLength(0)
  })
})
