import { useState } from 'react'
import * as XLSX from 'xlsx'
import { DropZone } from '../components/upload/DropZone'
import { FileResults } from '../components/upload/FileResults'
import { parseGradeFile } from '../parsers'
import { useGradeStore } from '../stores/useGradeStore'

const guides = {
  homeroom: [
    ['한 번의 시험', '정기시험 학급별 일람표'],
    ['시험 1·2차 비교', '정기시험 학급별 일람표 2개'],
    ['학기 전체 상세·학기말 종합', '전과목 성적 일람표 (수행평가 점수 포함)'],
  ],
  subject: [
    ['특정 시험', '정기시험 교과목별 일람표'],
    ['시험·수행 상세', '과목 지필/수행 성적 일람표'],
    ['학기말 성취도·등급', '학기말 관련 성적 자료'],
  ],
}

function downloadVirtualSample() {
  const rows = [
    ['2026학년도 1학기 1차 시험 학급별 일람표'],
    ['번호', '학번', '성명', '국어', '수학', '영어'],
    [1, 'V001', '가온', 82, 91, 77],
    [2, 'V002', '나래', 94, 86, 90],
    [3, 'V003', '다온', 71, 78, 84],
  ]
  const workbook = XLSX.utils.book_new()
  XLSX.utils.book_append_sheet(workbook, XLSX.utils.aoa_to_sheet(rows), '익명 예시')
  XLSX.writeFile(workbook, '익명_가상_나이스_성적.xlsx')
}

export function UploadPage({ onAnalyze }: { onAnalyze: () => void }) {
  const { mode = 'homeroom', files, busy, setBusy, addFiles, clear } = useGradeStore()
  const [error, setError] = useState('')

  const handleFiles = async (selected: File[]) => {
    setError('')
    setBusy(true)
    try {
      const parsed = await Promise.all(selected.map((file) => parseGradeFile(file)))
      addFiles(parsed)
    } catch {
      setError('파일을 처리하는 중 오류가 발생했습니다.')
    } finally {
      setBusy(false)
    }
  }

  return (
    <main>
      <section className="intro-grid">
        <div>
          <span className="eyebrow">브라우저 안에서 끝나는 안전한 분석</span>
          <h1>성적 파일은 그대로,<br /><em>분석은 더 선명하게.</em></h1>
          <p className="lead">파일의 열 위치나 과목 수가 달라도 내부 구조를 읽어 학생·과목·지필·수행평가 데이터를 표준화합니다.</p>
        </div>
        <div className="privacy-card"><span className="privacy-icon">⌁</span><div><strong>개인정보 보호 기본값</strong><p>업로드 파일은 서버에 저장하거나 전송하지 않습니다. 새로고침하면 브라우저 메모리에서 삭제됩니다.</p></div></div>
      </section>

      <section className="guide-strip">
        <div className="section-heading"><div><span className="eyebrow">파일 준비</span><h2>어떤 분석을 하고 싶으신가요?</h2></div><button className="text-button" onClick={downloadVirtualSample}>익명 가상 파일 받기</button></div>
        <div className="guide-grid">{guides[mode].map(([title, file]) => <div className="guide-card" key={title}><span>{title}</span><strong>{file}</strong></div>)}</div>
      </section>

      <DropZone busy={busy} onFiles={handleFiles} />
      {error && <p className="warning-text">{error}</p>}
      <FileResults files={files} />
      {files.length > 0 && <div className="sticky-actions"><button className="button ghost" onClick={clear}>모두 지우기</button><button className="button primary large" onClick={onAnalyze}>분석 시작 <span>→</span></button></div>}
    </main>
  )
}
