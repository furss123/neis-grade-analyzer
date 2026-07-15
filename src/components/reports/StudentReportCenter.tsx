import type { StudentDeepReportData } from '../../analytics/studentDeepAnalysis'
import { StudentTable, type StudentRow } from '../tables/StudentTable'
import { StudentReport } from './StudentReport'

export type StudentPrintScope = 'single' | 'all' | null

interface StudentReportCenterProps {
  reports: StudentDeepReportData[]
  rows: StudentRow[]
  selectedReport?: StudentDeepReportData
  printScope: StudentPrintScope
  onSelect: (studentId: string) => void
  onPrint: (scope: Exclude<StudentPrintScope, null>) => void
}

export function StudentReportCenter({ reports, rows, selectedReport, printScope, onSelect, onPrint }: StudentReportCenterProps) {
  const reportsToPrint = printScope === 'all' ? reports : selectedReport ? [selectedReport] : []
  const warnings = reports.filter((report) => report.warningReasons.length > 0).sort((a, b) => b.warningReasons.length - a.warningReasons.length)

  return (
    <section className="student-analysis-section">
      <div className="student-analysis-screen">
        <section className="panel early-warning-panel">
          <div className="section-heading"><div><span className="eyebrow">자동 플래깅</span><h2>조기경보 리스트</h2></div><span className="warning-count">{warnings.length}명 확인 필요</span></div>
          {warnings.length ? <div className="early-warning-list">{warnings.map((report) => <button type="button" key={report.student.id} onClick={() => onSelect(report.student.id)}><strong>{report.student.name}</strong><span>{report.student.className ?? '-'}반 {report.student.number ?? '-'}번</span><small>{report.warningReasons.join(' · ')}</small></button>)}</div> : <p className="empty-inline">현재 기준에 해당하는 학생이 없습니다.</p>}
          <p className="report-caption">E 2과목 이상, 직전 시험 대비 20점 이상 하락, 공통과목 성취율 40% 미만을 우선 표시합니다.</p>
        </section>
        <section className="panel student-directory">
          <div className="section-heading">
            <div><span className="eyebrow">학생 선택</span><h2>개별 심층 성적 분석</h2></div>
            <button type="button" className="button secondary" onClick={() => onPrint('all')}>전체 {reports.length}명 인쇄</button>
          </div>
          <label className="student-picker">분석 학생
            <select value={selectedReport?.student.id ?? ''} onChange={(event) => onSelect(event.target.value)}>
              {reports.map((report) => <option value={report.student.id} key={report.student.id}>{report.student.name} · {report.student.className ?? '-'}반 {report.student.number ?? '-'}번</option>)}
            </select>
          </label>
          <StudentTable rows={rows} selectedId={selectedReport?.student.id} onSelect={onSelect} />
        </section>

        {selectedReport && <section className="panel student-report-panel">
          <div className="student-report-actions">
            <div><span className="eyebrow">선택 학생 리포트</span><strong>{selectedReport.student.name} 학생의 분석 결과</strong></div>
            <div className="button-row"><button type="button" className="button secondary" onClick={() => onPrint('all')}>전체 결과 인쇄</button><button type="button" className="button primary" onClick={() => onPrint('single')}>이 학생 개별 인쇄</button></div>
          </div>
          <StudentReport report={selectedReport} />
        </section>}
      </div>

      {printScope && <div className="print-report-root" aria-hidden="true">
        {reportsToPrint.map((report) => <StudentReport report={report} variant="print" key={report.student.id} />)}
      </div>}
    </section>
  )
}
