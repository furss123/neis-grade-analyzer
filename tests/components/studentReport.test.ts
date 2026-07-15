import { createElement } from 'react'
import { renderToStaticMarkup } from 'react-dom/server'
import { describe, expect, it } from 'vitest'
import { buildStudentDeepReport } from '../../src/analytics/studentDeepAnalysis'
import { StudentReportCenter } from '../../src/components/reports/StudentReportCenter'
import type { ScoreRecord } from '../../src/types/grade'

describe('학생 심층 리포트 UI', () => {
  it('학생 선택과 개별·전체 인쇄 기능을 표시한다', () => {
    const scores: ScoreRecord[] = [{
      id: 'score-1', studentId: 'student-1', subjectId: 'math', kind: 'final', assessmentName: '학기말',
      score: 88, achievement: 'A', gradeRank: 2, sourceId: 'virtual', sourcePriority: 100,
    }]
    const report = buildStudentDeepReport(
      { id: 'student-1', name: '가온', className: '1', number: 1 },
      [{ id: 'math', rawName: '수학', name: '수학' }],
      scores,
      { schoolYear: 2026, semester: 1, grade: 1 },
    )
    const html = renderToStaticMarkup(createElement(StudentReportCenter, {
      reports: [report],
      rows: [{ id: 'student-1', name: '가온', className: '1', number: 1, mean: 88, strongest: '수학', weakest: '수학', records: 1 }],
      selectedReport: report,
      printScope: null,
      onSelect: () => undefined,
      onPrint: () => undefined,
    }))

    expect(html).toContain('개별 심층 성적 분석')
    expect(html).toContain('이 학생 개별 인쇄')
    expect(html).toContain('전체 1명 인쇄')
    expect(html).toContain('강점·보완 및 성취 현황')
  })
})
