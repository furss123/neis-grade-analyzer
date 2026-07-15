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

  it('석차(동석차수) 값을 석차와 동석차수로 분리한다', () => {
    const view = workbookFromRows([
      ['2026학년도 1학기 1학년 성적'],
      ['성명', '수학', '석차(동석차수)'],
      ['가온', 88, '3(2)'],
    ])
    const parsed = parseWorkbookView(view, 'virtual', '학기말.xlsx', 'semester-summary')
    expect(parsed.data.scores[0]).toMatchObject({ rank: 3, tieCount: 2, schoolYear: 2026, semester: 1 })
  })

  it('병합 정보가 없는 전과목 일람표에서 과목과 지필·수행평가를 가로로 이어받는다', () => {
    const view = workbookFromRows([
      ['전과목 성적 일람표 (받은점수기준)'],
      ['1학년 4반'],
      ['평가방법(반영비율)', '', '공통국어1(4)', '', '', '', '', '', '', '', '', '', '공통수학1(4)'],
      ['', '', '정기시험(60.00%)', '', '수행평가(40.00%)', '', '', '', '', '', '', '', '정기시험(60.00%)', '', '수행평가(40.00%)'],
      ['명칭,영역 (반영비율) 번호,성명', '', '1차시험(30.00%)', '2차시험(30.00%)', '토론하기(20.00%)', '글쓰기(20.00%)', '합계', '원점수', '성취도', '석차등급', '석차(동석차수)', '수강자수', '1차시험(30.00%)', '2차시험(30.00%)', '주제탐구(40.00%)', '합계', '원점수', '성취도', '석차등급', '석차(동석차수)', '수강자수'],
      [1, '학생가', 80, 70, 90, 85, 79, 79, 'B', 3, '4(2)', 30, 75, 85, 92, 83, 83, 'B', 3, '3(1)', 30],
    ])
    const parsed = parseWorkbookView(view, 'virtual', '전과목.xlsx', 'all-subjects')

    expect(parsed.data.students).toHaveLength(1)
    expect(parsed.data.subjects.map((subject) => subject.name)).toEqual(['공통국어1', '공통수학1'])
    expect(parsed.data.scores).toHaveLength(9)
    expect(parsed.data.scores.filter((score) => score.kind === 'performance')).toHaveLength(3)
    expect(parsed.data.scores.find((score) => score.assessmentName === '토론하기')).toMatchObject({ subjectId: '공통국어1', weight: 20 })
    expect(parsed.data.scores.find((score) => score.subjectId === '공통국어1' && score.kind === 'final')).toMatchObject({ achievement: 'B', gradeRank: 3, rank: 4, tieCount: 2, enrollmentCount: 30 })
  })

  it('0~100 범위를 벗어난 숫자는 성적 점수로 저장하지 않는다', () => {
    const view = workbookFromRows([
      ['2026학년도 1학기 정기시험 학급별 일람표'],
      ['번호', '성명', '국어', '수학'],
      [1, '학생가', 88, 2026000428],
    ])
    const parsed = parseWorkbookView(view, 'virtual', '시험.xlsx', 'regular-exam-class')
    expect(parsed.data.scores.map((score) => score.score)).toEqual([88])
  })

  it('담임교사 서명보다 현재 열의 실제 과목명을 우선한다', () => {
    const examView = workbookFromRows([
      ['2026.07.15.'],
      ['', '', '정기시험 학급별 일람표'],
      ['2026학년도 1학기 1학년 4반'],
      ['고사 : 1차시험 담임교사 : (김효성) 인'],
      ['번호', '', '성명', '국어:공통국어1(4)', '수학:공통수학1(4)', '합계', '평균'],
      [1, '', '학생가', 88, 77, 165, 82.5],
    ])
    const exam = parseWorkbookView(examView, 'virtual-exam', '1차.xlsx', 'regular-exam-class')

    expect(exam.data.subjects.map((subject) => subject.name)).toEqual(['공통국어1', '공통수학1'])
    expect(exam.data.subjects.some((subject) => subject.name.includes('김효성'))).toBe(false)

    const summaryView = workbookFromRows([
      ['학기말 성적 종합일람표'],
      ['2026학년도 1학기 1학년 4반 담임교사 : (김효성) 인'],
      ['번호', '성명', '교과목', '공통국어1(4)', '공통수학1(4)'],
      [1, '학생가', '원점수', 88, 77],
    ])
    const summary = parseWorkbookView(summaryView, 'virtual-summary', '학기말.xlsx', 'semester-summary')
    expect(summary.data.subjects.map((subject) => subject.name)).toEqual(['공통국어1', '공통수학1'])
    expect(summary.data.context.grade).toBe(1)
  })
})
