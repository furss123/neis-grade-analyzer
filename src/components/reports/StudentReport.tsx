import type { StudentDeepReportData, StudentSubjectAnalysis } from '../../analytics/studentDeepAnalysis'
import { StrengthRadar } from '../charts/StrengthRadar'

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
        <ReportMetric label="학년 백분위" value={report.gradePercentile === undefined ? '—' : `상위 ${Math.max(0, 100 - report.gradePercentile).toFixed(1)}%`} />
        <ReportMetric label="학급 백분위" value={report.classPercentile === undefined ? '—' : `상위 ${Math.max(0, 100 - report.classPercentile).toFixed(1)}%`} />
      </section>

      {report.warningReasons.length > 0 && <section className="report-warning" aria-label="조기경보">
        <strong>조기경보 · 상담 우선 확인</strong>
        <ul>{report.warningReasons.map((reason) => <li key={reason}>{reason}</li>)}</ul>
        {report.incompletionSubjects.length > 0 && <p>미이수 확정이 아닌 성취율 기준 위험입니다. 공통과목 이수는 출석률과 최소 성취수준 보장지도 결과도 함께 확인해야 합니다.</p>}
      </section>}

      <section className="report-insights">
        <div className="report-section-title"><span>01</span><div><small>자동 해석</small><h3>핵심 분석 의견</h3></div></div>
        {report.insights.length ? <ul>{report.insights.map((insight) => <li key={insight}>{insight}</li>)}</ul> : <p className="empty-inline">비교 가능한 평가 데이터가 부족합니다.</p>}
      </section>

      <section className="report-subjects">
        <div className="report-section-title"><span>02</span><div><small>과목별 진단</small><h3>강점·보완 및 성취 현황</h3></div></div>
        <div className="table-wrap">
          <table className="report-table">
            <thead><tr><th>과목</th><th>학기말</th><th>Z / T</th><th>백분위</th><th>지필↔수행</th><th>성취도</th><th>등급·석차(동석차)</th><th>시험 변화</th></tr></thead>
            <tbody>{report.subjects.map((subject) => (
              <tr key={subject.subjectId}>
                <td><strong>{subject.name}</strong>{subject.group && <small>{subject.group}</small>}</td>
                <td>{formatScore(subject.finalScore)}</td>
                <td>{subject.zScore === undefined ? '—' : `${subject.zScore} / ${subject.tScore}`}</td>
                <td>{subject.percentile === undefined ? '—' : `${subject.percentile}%`}</td>
                <td className={Math.abs(subject.examPerformanceGap ?? 0) >= 10 ? 'gap-alert' : ''}>{subject.examPerformanceGap === undefined ? '—' : `${subject.examPerformanceGap >= 0 ? '+' : ''}${subject.examPerformanceGap}점`}</td>
                <td className={subject.incompletionRisk ? 'risk-cell' : ''}>{subject.achievement ?? '—'}{subject.incompletionRisk && <small>40% 미만 위험</small>}</td>
                <td>{subject.gradeRank !== undefined ? `${subject.gradeRank}등급 · ` : ''}{subject.rank !== undefined ? `${subject.rank}/${subject.enrollmentCount ?? '—'}` : subject.gradeRank === undefined ? '—' : ''}{subject.tieCount ? ` (공동 ${subject.tieCount}명)` : ''}</td>
                <td className={subject.examChange === undefined ? '' : subject.examChange >= 0 ? 'positive' : 'negative'}>{subject.examChange === undefined ? '—' : `${subject.examChange >= 0 ? '+' : ''}${subject.examChange}점`}</td>
              </tr>
            ))}</tbody>
          </table>
        </div>
      </section>

      <section className="report-profile-grid">
        <div>
          <div className="report-section-title"><span>03</span><div><small>상대 강약</small><h3>국·수·영·사·과 프로파일</h3></div></div>
          <StrengthRadar points={report.strengthProfile} />
          <p className="report-caption">학생 본인의 5개 교과 상대 강약을 표준화한 값입니다. 과목이 없으면 0으로 표시됩니다.</p>
        </div>
        <div>
          <div className="report-section-title"><span>04</span><div><small>누적 분석</small><h3>학기·학년 성장 추이</h3></div></div>
          {report.longitudinal.length > 1 ? <div className="trend-list">{report.longitudinal.map((point) => <div key={point.label}><span>{point.label}</span><i style={{ width: `${point.average}%` }} /><b>{point.average}점</b></div>)}<strong className={report.longitudinalChange! >= 0 ? 'positive' : 'negative'}>누적 변화 {report.longitudinalChange! >= 0 ? '+' : ''}{report.longitudinalChange}점</strong></div> : <p className="empty-inline">학년도·학기가 다른 파일을 함께 올리면 성장 추이가 표시됩니다.</p>}
        </div>
      </section>

      <section className="report-notes">
        <div className="report-section-title"><span>05</span><div><small>수행평가 기반</small><h3>세특 참고 초안</h3></div></div>
        <p>{report.specialNotesDraft ?? '수행평가 항목명과 점수가 있는 파일을 올리면 초안을 생성합니다.'}</p>
        <small>교사가 관찰 사실과 학생의 실제 활동을 확인·수정한 뒤 참고용으로만 사용하세요.</small>
      </section>

      <section className="report-simulation">
        <div className="report-section-title"><span>06</span><div><small>학기말 종합 분석</small><h3>수행평가 점수 변화 시뮬레이션</h3></div></div>
        {report.simulations.length ? <div className="simulation-grid">{report.simulations.map((item, index) => <div key={`${item.subject}-${item.target}-${index}`}><strong>{item.subject} · {item.assessment}</strong><b>{item.currentScore}점 → <em>+{item.requiredIncrease}점</em></b><span>{item.target}</span><small>{item.note}</small></div>)}</div> : <p className="empty-inline">수행평가 반영비율과 학기말 점수가 함께 있어야 변화 가능성을 추정할 수 있습니다.</p>}
        <p className="report-caption">업로드 자료와 반영비율을 이용한 단순 추정입니다. 실제 석차·등급·성취도는 학교 산출 규정, 분할점수, 결시 처리 및 전체 학생 점수 변화에 따라 달라질 수 있습니다.</p>
      </section>

      <section className="report-assessments">
        <div className="report-section-title"><span>07</span><div><small>평가 상세</small><h3>과목별 세부 점수</h3></div></div>
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
