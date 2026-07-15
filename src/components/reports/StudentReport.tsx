import type { StudentDeepReportData, StudentSubjectAnalysis } from '../../analytics/studentDeepAnalysis'

interface StudentReportProps {
  report: StudentDeepReportData
  variant?: 'screen' | 'print'
}

function formatScore(value: number | undefined): string {
  return value === undefined ? '—' : `${value}점`
}

function kindLabel(kind: StudentSubjectAnalysis['assessments'][number]['kind']): string {
  if (kind === 'exam') return '정기시험'
  if (kind === 'performance') return '수행평가'
  return '학기말'
}

export function StudentReport({ report, variant = 'screen' }: StudentReportProps) {
  const { student, context } = report
  const classNumber = [student.grade ?? context.grade, student.className ?? context.className, student.number]
    .map((value) => value ?? '—')
    .join(' / ')

  return (
    <article className={`student-report student-report-${variant}`} aria-label={`${student.name} 학생 심층 성적 분석 결과`}>
      <header className="student-report-header">
        <div>
          <span className="eyebrow">개별 심층 성적 분석 결과</span>
          <h2>{student.name} 학생</h2>
          <p>{context.schoolYear ?? '—'}학년도 {context.semester ?? '—'}학기 · 학년/반/번호 {classNumber}</p>
        </div>
        <div className="report-seal"><span>NEIS</span><strong>GRADE REPORT</strong></div>
      </header>

      <section className="student-report-metrics" aria-label="학생 핵심 성적 지표">
        <ReportMetric label="전체 평균" value={formatScore(report.overallAverage)} />
        <ReportMetric label="정기시험 평균" value={formatScore(report.examAverage)} />
        <ReportMetric label="수행평가 평균" value={formatScore(report.performanceAverage)} />
        <ReportMetric label="학기말 평균" value={formatScore(report.finalAverage)} />
        <ReportMetric label="분석 평가" value={`${report.evaluationCount}건`} />
      </section>

      <section className="report-insights">
        <div className="report-section-title"><span>01</span><div><small>자동 해석</small><h3>핵심 분석 의견</h3></div></div>
        {report.insights.length ? <ul>{report.insights.map((insight) => <li key={insight}>{insight}</li>)}</ul> : <p className="empty-inline">비교 가능한 평가 데이터가 부족합니다.</p>}
      </section>

      <section className="report-subjects">
        <div className="report-section-title"><span>02</span><div><small>과목별 진단</small><h3>강점·보완 및 성취 현황</h3></div></div>
        <div className="table-wrap">
          <table className="report-table">
            <thead><tr><th>과목</th><th>전체 평균</th><th>정기시험</th><th>수행평가</th><th>학기말</th><th>성취도</th><th>등급·석차</th><th>시험 변화</th></tr></thead>
            <tbody>{report.subjects.map((subject) => (
              <tr key={subject.subjectId}>
                <td><strong>{subject.name}</strong>{subject.group && <small>{subject.group}</small>}</td>
                <td>{formatScore(subject.overallAverage)}</td>
                <td>{formatScore(subject.examAverage)}</td>
                <td>{formatScore(subject.performanceAverage)}</td>
                <td>{formatScore(subject.finalScore)}</td>
                <td>{subject.achievement ?? '—'}</td>
                <td>{subject.gradeRank !== undefined ? `${subject.gradeRank}등급` : subject.rank !== undefined ? `${subject.rank}/${subject.enrollmentCount ?? '—'}` : '—'}</td>
                <td className={subject.examChange === undefined ? '' : subject.examChange >= 0 ? 'positive' : 'negative'}>{subject.examChange === undefined ? '—' : `${subject.examChange >= 0 ? '+' : ''}${subject.examChange}점`}</td>
              </tr>
            ))}</tbody>
          </table>
        </div>
      </section>

      <section className="report-assessments">
        <div className="report-section-title"><span>03</span><div><small>평가 상세</small><h3>과목별 세부 점수</h3></div></div>
        <div className="assessment-subject-grid">{report.subjects.map((subject) => (
          <div className="assessment-subject-card" key={subject.subjectId}>
            <strong>{subject.name}</strong>
            <div>{subject.assessments.map((assessment) => (
              <span key={assessment.id}><small>{kindLabel(assessment.kind)} · {assessment.name}</small><b>{formatScore(assessment.score)}</b>{assessment.weight !== undefined && <em>반영 {assessment.weight}%</em>}</span>
            ))}</div>
          </div>
        ))}</div>
      </section>

      <footer className="student-report-footer"><span>본 결과는 업로드된 나이스 성적 자료를 기준으로 자동 분석되었습니다.</span><span>개인정보 포함 문서 · 취급 주의</span></footer>
    </article>
  )
}

function ReportMetric({ label, value }: { label: string; value: string }) {
  return <div><span>{label}</span><strong>{value}</strong></div>
}
