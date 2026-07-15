import type { DocumentType, ParsedFile } from '../../types/grade'
import { useGradeStore } from '../../stores/useGradeStore'

export const TYPE_LABELS: Record<DocumentType, string> = {
  'regular-exam-class': '정기시험 학급별 일람표',
  'regular-exam-subject': '정기시험 교과목별 일람표',
  'all-subjects': '전과목 성적 일람표',
  'subject-assessment': '과목 지필·수행 성적 일람표',
  'semester-summary': '학기말 성적 종합일람표 (기존 형식)',
  unknown: '유형 확인 필요',
}

export function FileResults({ files }: { files: ParsedFile[] }) {
  const { removeFile, updateFileType, updateContext } = useGradeStore()
  if (!files.length) return null

  return (
    <section className="panel result-panel">
      <div className="section-heading"><div><span className="eyebrow">자동 판별 결과</span><h2>업로드한 파일</h2></div><span className="count-badge">{files.length}개</span></div>
      <div className="file-list">
        {files.map((file) => (
          <article className="file-card" key={file.id}>
            <div className={`status-dot ${file.status}`} />
            <div className="file-main">
              <strong>{file.fileName}</strong>
              <div className="file-meta">
                <select aria-label="파일 유형" value={file.detection.type} onChange={(event) => updateFileType(file.id, event.target.value as DocumentType)}>
                  {Object.entries(TYPE_LABELS).map(([value, label]) => <option value={value} key={value}>{label}</option>)}
                </select>
                <span>신뢰도 {Math.round(file.detection.confidence * 100)}%</span>
                <span>학생 {file.data.students.length}명</span>
                <span>과목 {file.data.subjects.length}개</span>
                <span>점수 {file.data.scores.length}건</span>
              </div>
              {(file.warnings.length > 0 || file.error) && <p className="warning-text">{file.error ?? file.warnings[0]}</p>}
              <details>
                <summary>판별 정보 확인·보정</summary>
                <div className="mapping-grid">
                  {([['schoolYear', '학년도'], ['semester', '학기'], ['grade', '학년'], ['className', '반/강의실']] as const).map(([key, label]) => (
                    <label key={key}>{label}<input value={file.data.context[key] ?? ''} onChange={(event) => updateContext(file.id, key, event.target.value)} /></label>
                  ))}
                </div>
              </details>
            </div>
            <button className="icon-button" aria-label={`${file.fileName} 삭제`} onClick={() => removeFile(file.id)}>×</button>
          </article>
        ))}
      </div>
    </section>
  )
}
