import * as XLSX from 'xlsx'
import { describe, expect, it } from 'vitest'
import { detectWorkbook, workbookToView } from '../../src/parsers/detectWorkbook'
import { parseWorkbookView } from '../../src/parsers/genericParser'

function workbookFromRows(rows: unknown[][]) {
  const workbook = XLSX.utils.book_new()
  XLSX.utils.book_append_sheet(workbook, XLSX.utils.aoa_to_sheet(rows), '성적')
  return workbookToView(workbook)
}

describe('범용 통합문서 판별', () => {
  it('파일명이 아니라 셀 내용으로 학급별 정기시험을 판별한다', () => {
    const view = workbookFromRows([
      ['2026학년도 1학기 1차 정기시험 학급별 일람표'],
      ['번호', '학번', '성명', '국어', '수학', '합계', '평균'],
      [1, 'V001', '가온', 80, 90, 170, 85],
    ])
    const result = detectWorkbook(view)
    expect(result.type).toBe('regular-exam-class')
    expect(result.confidence).toBeGreaterThan(0.5)
  })

  it('고정 열 위치 없이 학생과 과목 점수를 표준화한다', () => {
    const view = workbookFromRows([
      ['2026학년도 1학기 1차 정기시험 학급별 일람표'],
      ['', '성명', '번호', '수학', '국어', '평균'],
      ['', '가온', 1, 91, 82, 86.5],
      ['', '나래', 2, 86, 94, 90],
    ])
    const parsed = parseWorkbookView(view, 'virtual', '아무이름.xlsx', 'regular-exam-class')
    expect(parsed.data.students).toHaveLength(2)
    expect(parsed.data.subjects.map((subject) => subject.name)).toEqual(expect.arrayContaining(['수학', '국어']))
    expect(parsed.data.scores).toHaveLength(4)
  })
})
