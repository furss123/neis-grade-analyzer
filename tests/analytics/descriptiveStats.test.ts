import { describe, expect, it } from 'vitest'
import { descriptiveStats } from '../../src/analytics/descriptiveStats'

describe('기술 통계', () => {
  it('빈 값은 제외하고 평균과 중앙값을 계산한다', () => {
    expect(descriptiveStats([70, 80, undefined, 90])).toMatchObject({ count: 3, mean: 80, median: 80, min: 70, max: 90 })
  })

  it('점수 범위를 벗어난 학번·메타 숫자는 통계에서 제외한다', () => {
    expect(descriptiveStats([70, 80, -1, 101, 2026000428])).toMatchObject({ count: 2, mean: 75, median: 75, min: 70, max: 80 })
  })
})
