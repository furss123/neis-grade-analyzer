import { useEffect, useMemo, useState } from 'react'
import { assessmentSummaries } from '../analytics/assessmentAnalysis'
import { achievementDistribution } from '../analytics/achievementAnalysis'
import { descriptiveStats } from '../analytics/descriptiveStats'
import { compareExams } from '../analytics/examComparison'
import { studentProfiles } from '../analytics/studentProfiles'
import { buildStudentDeepReport } from '../analytics/studentDeepAnalysis'
import { EChart } from '../components/charts/EChart'
import { buildAssessmentBarOption } from '../components/charts/assessmentBarOption'
import { StudentReportCenter, type StudentPrintScope } from '../components/reports/StudentReportCenter'
import { useGradeStore } from '../stores/useGradeStore'
import { isGradeScore } from '../normalization/normalizeScore'
import { exportWorkbook } from '../utils/exportData'
import { inferCapabilities, mergeParsedFiles } from '../utils/mergeData'

type Tab = 'overview' | 'exam' | 'change' | 'performance' | 'final' | 'achievement' | 'students'

export function AnalysisPage({ onUpload }: { onUpload: () => void }) {
  const { files, mode = 'homeroom' } = useGradeStore()
  const { data, conflicts } = useMemo(() => mergeParsedFiles(files), [files])
  const analysisData = useMemo(() => ({ ...data, scores: data.scores.filter((score) => isGradeScore(score.score)) }), [data])
  const invalidScoreCount = data.scores.length - analysisData.scores.length
  const capabilities = useMemo(() => inferCapabilities(analysisData), [analysisData])
  const [tab, setTab] = useState<Tab>('overview')
  const [subjectFilter, setSubjectFilter] = useState('all')
  const [selectedStudentId, setSelectedStudentId] = useState<string>()
  const [studentPrintScope, setStudentPrintScope] = useState<StudentPrintScope>(null)
  const filteredScores = subjectFilter === 'all' ? analysisData.scores : analysisData.scores.filter((score) => score.subjectId === subjectFilter)
  const summaries = assessmentSummaries(filteredScores)
  const profiles = studentProfiles(analysisData.students, analysisData.subjects, filteredScores)
  const scoreStats = descriptiveStats(filteredScores.map((score) => score.score))
  const studentReports = useMemo(() => analysisData.students.map((student) => buildStudentDeepReport(student, analysisData.subjects, analysisData.scores, analysisData.context, analysisData.students)), [analysisData])
  const studentRows = useMemo(() => profiles.map((row) => ({ ...row, warningCount: studentReports.find((report) => report.student.id === row.id)?.warningReasons.length ?? 0 })), [profiles, studentReports])
  const selectedStudentReport = studentReports.find((report) => report.student.id === selectedStudentId) ?? studentReports[0]

  useEffect(() => {
    if (!studentPrintScope) return
    document.body.dataset.printMode = 'student-reports'
    const finishPrinting = () => setStudentPrintScope(null)
    const timer = window.setTimeout(() => window.print(), 100)
    window.addEventListener('afterprint', finishPrinting)
    return () => {
      window.clearTimeout(timer)
      window.removeEventListener('afterprint', finishPrinting)
      delete document.body.dataset.printMode
    }
  }, [studentPrintScope])

  if (!analysisData.scores.length) {
    return <main className="empty-state"><span>⌁</span><h1>분석할 점수 데이터가 없습니다</h1><p>파일 유형과 헤더 판별 결과를 확인하거나 다른 나이스 파일을 올려 주세요.</p><button className="button primary" onClick={onUpload}>업로드로 돌아가기</button></main>
  }

  const tabs: Array<[Tab, string, boolean]> = [
    ['overview', mode === 'homeroom' ? '학급 대시보드' : '교과 대시보드', true],
    ['exam', '정기시험', capabilities.exams],
    ['change', '시험 변화', capabilities.examComparison],
    ['performance', '수행평가', capabilities.performance],
    ['final', '학기말', capabilities.finalScores],
    ['achievement', '성취도·등급', capabilities.achievement || capabilities.gradeRank],
    ['students', mode === 'homeroom' ? '학생별 분석' : '지도 대상 학생', analysisData.students.length > 0],
  ]

  const subjectNames = new Map(analysisData.subjects.map((subject) => [subject.id, subject.name]))
  const chartRows = summaries.filter((summary) => summary.count > 0 && (tab === 'overview' || summary.kind === tab || (tab === 'final' && summary.kind === 'final')))
  const { option: barOption, needsScroll: needsChartScroll } = buildAssessmentBarOption(chartRows, subjectNames)

  return (
    <main className="analysis-page">
      <section className="analysis-header">
        <div><span className="eyebrow">{analysisData.context.schoolYear ?? '—'}학년도 {analysisData.context.semester ?? '—'}학기</span><h1>{mode === 'homeroom' ? `${analysisData.context.grade ?? '—'}학년 ${analysisData.context.className ?? '—'}반 성적 분석` : `${analysisData.subjects[0]?.name ?? '교과'} 성적 분석`}</h1><p>{analysisData.students.length}명 · {analysisData.subjects.length}과목 · {analysisData.scores.length}개 평가 데이터</p></div>
        <div className="button-row no-print"><button className="button secondary" onClick={() => exportWorkbook(analysisData, true)}>익명 엑셀</button><button className="button secondary" onClick={() => exportWorkbook(analysisData)}>엑셀 저장</button><button className="button primary" onClick={() => window.print()}>PDF·인쇄</button></div>
      </section>

      {conflicts.length > 0 && <div className="conflict-banner"><strong>점수 충돌 {conflicts.length}건</strong><span>파일 우선순위에 따라 신뢰도가 높은 값을 사용했습니다. 원본 파일의 산출 기준과 마감 시점을 확인해 주세요.</span></div>}
      {invalidScoreCount > 0 && <div className="conflict-banner"><strong>비정상 점수 {invalidScoreCount}건 제외</strong><span>0~100 범위를 벗어난 값은 평균·최고·최저 및 그래프 계산에서 제외했습니다.</span></div>}

      <div className="analysis-toolbar no-print">
        <div className="tabs">{tabs.filter(([, , enabled]) => enabled).map(([value, label]) => <button className={tab === value ? 'active' : ''} onClick={() => { setTab(value); if (value === 'students') setSubjectFilter('all') }} key={value}>{label}</button>)}</div>
        {tab !== 'students' && <select value={subjectFilter} onChange={(event) => setSubjectFilter(event.target.value)}><option value="all">전체 과목</option>{data.subjects.map((subject) => <option value={subject.id} key={subject.id}>{subject.name}</option>)}</select>}
      </div>

      <section className="metric-grid">
        <Metric label="분석 학생" value={`${analysisData.students.length}명`} detail="중복 학생 통합" />
        <Metric label="전체 평균" value={`${scoreStats.mean}점`} detail={`중앙값 ${scoreStats.median}점`} />
        <Metric label="최고 · 최저" value={`${scoreStats.max} · ${scoreStats.min}`} detail={`표준편차 ${scoreStats.standardDeviation}`} />
        <Metric label="활성 분석" value={`${tabs.filter(([, , enabled]) => enabled).length}개`} detail="데이터 필드 기반" />
      </section>

      {tab === 'students' ? <StudentReportCenter reports={studentReports} rows={studentRows} selectedReport={selectedStudentReport} printScope={studentPrintScope} onSelect={setSelectedStudentId} onPrint={setStudentPrintScope} />
        : tab === 'change' ? <ExamChanges data={analysisData} />
        : tab === 'achievement' ? <AchievementChart scores={filteredScores} />
        : <section className="dashboard-grid"><article className="panel chart-panel"><div className="section-heading"><div><span className="eyebrow">평균 비교</span><h2>{tab === 'performance' ? '수행평가 영역별 평균' : tab === 'final' ? '학기말 과목별 평균' : tab === 'exam' ? '시험별 평균' : '평가별 성취 현황'}</h2></div>{needsChartScroll && <small className="chart-scroll-hint">하단 막대로 평가 항목 이동</small>}</div><EChart option={barOption} height={390} label="평가별 평균 막대그래프" /></article><SummaryList rows={chartRows} subjectNames={subjectNames} /></section>}
    </main>
  )
}

function Metric({ label, value, detail }: { label: string; value: string; detail: string }) {
  return <article className="metric"><span>{label}</span><strong>{value}</strong><small>{detail}</small></article>
}

function SummaryList({ rows, subjectNames }: { rows: ReturnType<typeof assessmentSummaries>; subjectNames: Map<string, string> }) {
  return <article className="panel ranking-panel"><div className="section-heading"><div><span className="eyebrow">요약</span><h2>평균 순위</h2></div></div><ol>{[...rows].sort((a, b) => b.mean - a.mean).slice(0, 8).map((row, index) => <li key={`${row.subjectId}-${row.assessmentName}`}><span className="rank">{String(index + 1).padStart(2, '0')}</span><div><strong>{subjectNames.get(row.subjectId) ?? row.subjectId}</strong><small>{row.assessmentName} · {row.count}명</small></div><b>{row.mean}</b></li>)}</ol></article>
}

function ExamChanges({ data }: { data: ReturnType<typeof mergeParsedFiles>['data'] }) {
  const changes = compareExams(data.scores)
  const students = new Map(data.students.map((student) => [student.id, student.name]))
  const subjects = new Map(data.subjects.map((subject) => [subject.id, subject.name]))
  return <section className="panel"><div className="section-heading"><div><span className="eyebrow">시험 간 변화</span><h2>향상·보완이 필요한 학생</h2></div></div><div className="change-grid">{[...changes].sort((a, b) => b.change - a.change).slice(0, 18).map((item) => <div className="change-card" key={`${item.studentId}-${item.subjectId}`}><div><strong>{students.get(item.studentId)}</strong><span>{subjects.get(item.subjectId)}</span></div><b className={item.change >= 0 ? 'up' : 'down'}>{item.change >= 0 ? '+' : ''}{item.change}</b><small>{item.first} → {item.latest}</small></div>)}</div></section>
}

function AchievementChart({ scores }: { scores: ReturnType<typeof mergeParsedFiles>['data']['scores'] }) {
  const distribution = achievementDistribution(scores)
  const option = { tooltip: { trigger: 'item' }, legend: { bottom: 0 }, series: [{ type: 'pie', radius: ['45%', '72%'], data: distribution, itemStyle: { borderColor: '#fff', borderWidth: 3 }, label: { formatter: '{b}  {c}명' } }] }
  return <section className="panel chart-panel"><div className="section-heading"><div><span className="eyebrow">성취도 분포</span><h2>성취 수준별 학생 수</h2></div></div>{distribution.length ? <EChart option={option} height={420} label="성취도별 학생 수 원형그래프" /> : <p className="empty-inline">성취도 필드가 있는 파일을 올려 주세요.</p>}</section>
}
