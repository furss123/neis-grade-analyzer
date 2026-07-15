import { describe, expect, it } from 'vitest'
import { buildAssessmentBarOption } from '../../src/components/charts/assessmentBarOption'

describe('평가별 평균 그래프 옵션', () => {
  it('항목이 많으면 10개 단위 슬라이더와 줄임표 라벨을 사용한다', () => {
    const rows = Array.from({ length: 52 }, (_, index) => ({ subjectId: 'korean', assessmentName: `매우 긴 수행평가 항목 이름 ${index + 1}`, mean: 80 }))
    const { option, needsScroll } = buildAssessmentBarOption(rows, new Map([['korean', '공통국어1']]))
    const dataZoom = option.dataZoom as Array<{ end: number }>
    const formatter = (option.xAxis as { axisLabel: { formatter: (value: string) => string } }).axisLabel.formatter

    expect(needsScroll).toBe(true)
    expect(dataZoom).toHaveLength(2)
    expect(dataZoom[0].end).toBeCloseTo(19.23, 1)
    expect(formatter('공통국어1\n매우 긴 수행평가 항목 이름')).toContain('…')
  })
})
