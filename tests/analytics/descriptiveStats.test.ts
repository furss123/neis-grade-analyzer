import { describe, expect, it } from 'vitest'
import { descriptiveStats } from '../../src/analytics/descriptiveStats'

describe('기술 통계', () => {
  it('빈 값은 제외하고 평균과 중앙값을 계산한다', () => {
    expect(descriptiveStats([70, 80, undefined, 90])).toMatchObject({ count: 3, mean: 80, median: 80, min: 70, max: 90 })
  })
})
