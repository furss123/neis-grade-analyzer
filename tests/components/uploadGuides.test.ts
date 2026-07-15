import { createElement } from 'react'
import { renderToStaticMarkup } from 'react-dom/server'
import { describe, expect, it } from 'vitest'
import { GuidePage } from '../../src/pages/GuidePage'
import { UploadPage } from '../../src/pages/UploadPage'
import { useGradeStore } from '../../src/stores/useGradeStore'

describe('담임 파일 준비 안내', () => {
  it('학기말 종합일람표 대신 수행평가가 포함된 전과목 성적 일람표를 안내한다', () => {
    useGradeStore.setState({ mode: 'homeroom', files: [], busy: false })
    const uploadHtml = renderToStaticMarkup(createElement(UploadPage, { onAnalyze: () => undefined }))
    const guideHtml = renderToStaticMarkup(createElement(GuidePage))

    expect(uploadHtml).toContain('전과목 성적 일람표 (수행평가 점수 포함)')
    expect(uploadHtml).not.toContain('학기말 성적 종합일람표')
    expect(guideHtml).toContain('담임 · 전과목 성적 일람표')
    expect(guideHtml).toContain('지필평가와 수행평가 점수가 함께 포함')
  })
})
