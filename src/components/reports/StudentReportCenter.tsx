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

  return (
    <section className="student-analysis-section">
      <div className="student-analysis-screen">
        <section className="panel student-directory">
          <div className="section-heading">
            <div><span className="eyebrow">학생 선택</span><h2>개별 심층 성적 분석</h2></div>
            <button className="button secondary" onClick={() => onPrint('all')}>전체 {reports.length}명 인쇄</button>
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
            <div className="button-row"><button className="button secondary" onClick={() => onPrint('all')}>전체 결과 인쇄</button><button className="button primary" onClick={() => onPrint('single')}>이 학생 개별 인쇄</button></div>
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
