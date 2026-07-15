import { describe, expect, it } from 'vitest'
import { buildStudentDeepReport } from '../../src/analytics/studentDeepAnalysis'
import type { ScoreRecord } from '../../src/types/grade'

describe('학생 개별 심층 분석', () => {
  it('평가 유형별 평균, 과목 강약점, 시험 변화를 계산한다', () => {
    const base = { studentId: 's1', sourceId: 'file', sourcePriority: 100 }
    const scores: ScoreRecord[] = [
      { ...base, id: '1', subjectId: 'math', kind: 'exam', assessmentName: '1차', score: 70 },
      { ...base, id: '2', subjectId: 'math', kind: 'exam', assessmentName: '2차', score: 85 },
      { ...base, id: '3', subjectId: 'math', kind: 'performance', assessmentName: '탐구', score: 90 },
      { ...base, id: '4', subjectId: 'korean', kind: 'final', assessmentName: '학기말', score: 68, achievement: 'C', gradeRank: 6 },
    ]
    const report = buildStudentDeepReport(
      { id: 's1', name: '가온', className: '1', number: 1 },
      [{ id: 'math', name: '수학', rawName: '수학' }, { id: 'korean', name: '국어', rawName: '국어' }],
      scores,
      { schoolYear: 2026, semester: 1 },
    )

    expect(report.examAverage).toBe(77.5)
    expect(report.strongest?.name).toBe('수학')
    expect(report.weakest?.name).toBe('국어')
    expect(report.subjects.find((subject) => subject.name === '수학')?.examChange).toBe(15)
    expect(report.insights.some((insight) => insight.includes('향상'))).toBe(true)
  })
})
