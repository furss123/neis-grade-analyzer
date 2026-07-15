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

  it('미이수 위험, 조기경보, 표준점수, 괴리와 동석차를 계산한다', () => {
    const base = { sourceId: 'file', sourcePriority: 100, schoolYear: 2026, semester: 1 }
    const scores: ScoreRecord[] = [
      { ...base, id: '1', studentId: 's1', subjectId: 'common-korean', kind: 'final', assessmentName: '학기말', score: 35, achievement: 'E', rank: 3, tieCount: 2 },
      { ...base, id: '2', studentId: 's1', subjectId: 'math', kind: 'final', assessmentName: '학기말', score: 55, achievement: 'E' },
      { ...base, id: '3', studentId: 's1', subjectId: 'math', kind: 'exam', assessmentName: '1차', score: 80 },
      { ...base, id: '4', studentId: 's1', subjectId: 'math', kind: 'exam', assessmentName: '2차', score: 55 },
      { ...base, id: '5', studentId: 's1', subjectId: 'math', kind: 'performance', assessmentName: '문제 해결', score: 85, weight: 40 },
      { ...base, id: '6', studentId: 's2', subjectId: 'common-korean', kind: 'final', assessmentName: '학기말', score: 65, rank: 2 },
      { ...base, id: '7', studentId: 's2', subjectId: 'math', kind: 'final', assessmentName: '학기말', score: 75 },
      { ...base, id: '8', studentId: 's3', subjectId: 'common-korean', kind: 'final', assessmentName: '학기말', score: 95, rank: 1 },
      { ...base, id: '9', studentId: 's3', subjectId: 'math', kind: 'final', assessmentName: '학기말', score: 95 },
    ]
    const report = buildStudentDeepReport(
      { id: 's1', name: '가온', className: '1' },
      [{ id: 'common-korean', name: '공통국어', rawName: '공통국어' }, { id: 'math', name: '공통수학', rawName: '공통수학' }],
      scores,
      { schoolYear: 2026, semester: 1, grade: 1 },
      [{ id: 's1', name: '가온', className: '1' }, { id: 's2', name: '나온', className: '1' }, { id: 's3', name: '다온', className: '2' }],
    )

    expect(report.incompletionSubjects).toEqual(['공통국어'])
    expect(report.warningReasons).toHaveLength(3)
    expect(report.subjects.find((item) => item.name === '공통수학')?.examPerformanceGap).toBe(17.5)
    expect(report.subjects.find((item) => item.name === '공통국어')?.zScore).toBeLessThan(0)
    expect(report.subjects.find((item) => item.name === '공통국어')?.tieCount).toBe(2)
    expect(report.gradePercentile).toBeDefined()
    expect(report.classPercentile).toBeDefined()
  })

  it('여러 학기를 분리해 종단 변화와 수행평가 변화 가능성을 추정한다', () => {
    const base = { studentId: 's1', subjectId: 'math', sourceId: 'file', sourcePriority: 100 }
    const scores: ScoreRecord[] = [
      { ...base, id: 'old', kind: 'final', assessmentName: '학기말', score: 70, schoolYear: 2025, semester: 2 },
      { ...base, id: 'new-final', kind: 'final', assessmentName: '학기말', score: 78, achievement: 'C', schoolYear: 2026, semester: 1 },
      { ...base, id: 'new-performance', kind: 'performance', assessmentName: '수학 탐구', score: 80, weight: 50, schoolYear: 2026, semester: 1 },
      { ...base, id: 'other', studentId: 's2', kind: 'final', assessmentName: '학기말', score: 81, schoolYear: 2026, semester: 1 },
    ]
    const report = buildStudentDeepReport(
      { id: 's1', name: '가온' },
      [{ id: 'math', name: '수학', rawName: '수학' }],
      scores,
      { schoolYear: 2026, semester: 1 },
    )

    expect(report.longitudinal).toHaveLength(2)
    expect(report.longitudinalChange).toBe(9)
    expect(report.specialNotesDraft).toContain('수학 탐구')
    expect(report.simulations.some((item) => item.target.includes('성취도'))).toBe(true)
    expect(report.simulations.some((item) => item.target.includes('석차'))).toBe(true)
  })
})
