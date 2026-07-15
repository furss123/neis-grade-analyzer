import { describe, expect, it } from 'vitest'
import { normalizeSubject } from '../../src/normalization/normalizeSubject'
import { parseClassNumber } from '../../src/normalization/normalizeStudent'

describe('범용 정규화', () => {
  it('교과군, 과목명, 이수단위를 분리한다', () => {
    expect(normalizeSubject('사회(역사/도덕포함):통합사회1(3)')).toMatchObject({
      group: '사회(역사/도덕포함)',
      name: '통합사회1',
      credits: 3,
    })
  })

  it('반/번호를 소속 정보로 분리한다', () => {
    expect(parseClassNumber('1/17')).toEqual({ className: '1', number: 17 })
  })
})
