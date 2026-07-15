import type { SchoolContext, ScoreKind, ScoreRecord, Student, Subject } from '../types/grade'
import { descriptiveStats } from './descriptiveStats'

export interface StudentAssessmentDetail {
  id: string
  kind: ScoreKind
  name: string
  score?: number
  weight?: number
}

export interface StudentSubjectAnalysis {
  subjectId: string
  name: string
  group?: string
  overallAverage: number
  examAverage?: number
  performanceAverage?: number
  finalScore?: number
  achievement?: string
  gradeRank?: number
  rank?: number
  enrollmentCount?: number
  tieCount?: number
  examChange?: number
  examPerformanceGap?: number
  zScore?: number
  tScore?: number
  percentile?: number
  incompletionRisk: boolean
  assessments: StudentAssessmentDetail[]
}

export interface StrengthPoint { domain: string; value: number; rawScore?: number }
export interface LongitudinalPoint { label: string; schoolYear?: number; semester?: number; average: number }
export interface ScoreSimulation {
  subject: string
  assessment: string
  currentScore: number
  requiredIncrease: number
  target: string
  note: string
}

export interface StudentDeepReportData {
  student: Student
  context: SchoolContext
  overallAverage: number
  examAverage?: number
  performanceAverage?: number
  finalAverage?: number
  evaluationCount: number
  strongest?: StudentSubjectAnalysis
  weakest?: StudentSubjectAnalysis
  subjects: StudentSubjectAnalysis[]
  insights: string[]
  warningReasons: string[]
  incompletionSubjects: string[]
  strengthProfile: StrengthPoint[]
  gradePercentile?: number
  classPercentile?: number
  longitudinal: LongitudinalPoint[]
  longitudinalChange?: number
  specialNotesDraft?: string
  simulations: ScoreSimulation[]
}

function round(value: number, digits = 2): number {
  const power = 10 ** digits
  return Math.round(value * power) / power
}

function optionalMean(records: ScoreRecord[]): number | undefined {
  const stats = descriptiveStats(records.map((record) => record.score))
  return stats.count ? stats.mean : undefined
}

function lastDefined<T>(records: ScoreRecord[], select: (record: ScoreRecord) => T | undefined): T | undefined {
  return [...records].reverse().map(select).find((value) => value !== undefined)
}

function periodValue(record: ScoreRecord): number {
  return (record.schoolYear ?? 0) * 10 + (record.semester ?? 0)
}

function latestRecords(scores: ScoreRecord[], context: SchoolContext): ScoreRecord[] {
  const tagged = scores.filter((record) => record.schoolYear || record.semester)
  if (!tagged.length) return scores
  const requested = (context.schoolYear ?? 0) * 10 + (context.semester ?? 0)
  const latest = requested || Math.max(...tagged.map(periodValue))
  return scores.filter((record) => periodValue(record) === latest)
}

function studentSubjectScore(records: ScoreRecord[]): number | undefined {
  const final = optionalMean(records.filter((record) => record.kind === 'final'))
  return final ?? optionalMean(records)
}

function percentile(value: number, values: number[]): number | undefined {
  if (!values.length) return undefined
  const below = values.filter((item) => item < value).length
  const equal = values.filter((item) => item === value).length
  return round(((below + equal / 2) / values.length) * 100, 1)
}

function inferredAchievement(score: number | undefined, explicit?: string): string | undefined {
  if (explicit) return explicit.trim().toUpperCase()
  if (score === undefined) return undefined
  if (score >= 90) return 'A'
  if (score >= 80) return 'B'
  if (score >= 70) return 'C'
  if (score >= 60) return 'D'
  if (score >= 40) return 'E'
  return '미도달'
}

function isCommonSubject(name: string): boolean {
  return /공통국어|공통수학|공통영어|통합사회|통합과학|한국사/.test(name.replace(/\s/g, ''))
}

function domainFor(name: string): string | undefined {
  if (/국어|문학|화법|독서/.test(name)) return '국어'
  if (/수학|대수|미적분|기하/.test(name)) return '수학'
  if (/영어/.test(name)) return '영어'
  if (/사회|역사|지리|윤리|정치|경제/.test(name)) return '사회'
  if (/과학|물리|화학|생명|지구/.test(name)) return '과학'
  return undefined
}

function cohortScores(scores: ScoreRecord[], subjectId: string): Array<{ studentId: string; value: number }> {
  const grouped = new Map<string, ScoreRecord[]>()
  for (const record of scores.filter((item) => item.subjectId === subjectId)) grouped.set(record.studentId, [...(grouped.get(record.studentId) ?? []), record])
  return [...grouped.entries()].flatMap(([studentId, records]) => {
    const value = studentSubjectScore(records)
    return value === undefined ? [] : [{ studentId, value }]
  })
}

function buildSpecialNotes(subjects: StudentSubjectAnalysis[]): string | undefined {
  const performances = subjects.flatMap((subject) => subject.assessments
    .filter((assessment) => assessment.kind === 'performance' && assessment.score !== undefined)
    .map((assessment) => ({ subject: subject.name, ...assessment, score: assessment.score as number })))
  if (!performances.length) return undefined
  const sorted = [...performances].sort((a, b) => b.score - a.score)
  const high = sorted[0]
  const low = sorted.at(-1) as typeof high
  const first = `${high.subject} '${high.name}' 활동에서 높은 성취를 보이며 관련 개념을 과제 수행에 충실히 적용함.`
  if (low.id === high.id) return first
  return `${first} ${low.subject} '${low.name}' 활동에서는 보완 과정을 통해 탐구의 완성도와 표현력을 높여 가는 모습이 기대됨.`
}

function buildSimulations(subjects: StudentSubjectAnalysis[], allLatestScores: ScoreRecord[]): ScoreSimulation[] {
  const result: ScoreSimulation[] = []
  for (const subject of subjects) {
    if (subject.finalScore === undefined) continue
    const performance = subject.assessments
      .filter((item) => item.kind === 'performance' && item.score !== undefined && item.weight !== undefined && item.weight > 0)
      .sort((a, b) => (b.weight ?? 0) - (a.weight ?? 0))[0]
    if (!performance || performance.score === undefined || performance.weight === undefined) continue
    const rawIncreaseFor = (finalIncrease: number) => Math.ceil((finalIncrease / (performance.weight as number / 100)) * 10) / 10
    const add = (finalIncrease: number, target: string, note: string) => {
      const requiredIncrease = rawIncreaseFor(finalIncrease)
      if (requiredIncrease > 0 && performance.score! + requiredIncrease <= 100) result.push({
        subject: subject.name,
        assessment: performance.name,
        currentScore: performance.score!,
        requiredIncrease,
        target,
        note,
      })
    }

    const nextAchievement = [40, 60, 70, 80, 90].find((boundary) => boundary > subject.finalScore! + 0.001)
    if (nextAchievement !== undefined) add(nextAchievement - subject.finalScore, `성취도 ${inferredAchievement(nextAchievement)}`, `학기말 환산점수 ${nextAchievement}점 기준`)

    const cohort = cohortScores(allLatestScores, subject.subjectId).map((item) => item.value).sort((a, b) => b - a)
    const nextScore = [...new Set(cohort)].filter((value) => value > subject.finalScore! + 0.001).sort((a, b) => a - b)[0]
    if (nextScore !== undefined) add(nextScore - subject.finalScore + 0.01, '석차 1단계 상승 가능', `현재 바로 위 점수 ${nextScore}점 기준`)

    if (subject.gradeRank !== undefined && subject.gradeRank > 1) {
      const betterGradeScores = allLatestScores
        .filter((item) => item.subjectId === subject.subjectId && item.gradeRank === subject.gradeRank! - 1 && item.kind === 'final' && item.score !== undefined)
        .map((item) => item.score as number)
      if (betterGradeScores.length) add(Math.min(...betterGradeScores) - subject.finalScore + 0.01, `${subject.gradeRank - 1}등급 가능`, '업로드 자료의 상위 등급 최저점 기준')
    }
  }
  return result.sort((a, b) => a.requiredIncrease - b.requiredIncrease).slice(0, 8)
}

export function buildStudentDeepReport(
  student: Student,
  subjects: Subject[],
  scores: ScoreRecord[],
  context: SchoolContext = {},
  students: Student[] = [student],
): StudentDeepReportData {
  const currentScores = latestRecords(scores, context)
  const records = currentScores.filter((record) => record.studentId === student.id)
  const subjectMap = new Map(subjects.map((subject) => [subject.id, subject]))
  const grouped = new Map<string, ScoreRecord[]>()
  for (const record of records) grouped.set(record.subjectId, [...(grouped.get(record.subjectId) ?? []), record])

  const subjectAnalyses = [...grouped.entries()].map(([subjectId, subjectRecords]) => {
    const subject = subjectMap.get(subjectId)
    const name = subject?.name ?? subjectId
    const examRecords = subjectRecords.filter((record) => record.kind === 'exam')
    const performanceRecords = subjectRecords.filter((record) => record.kind === 'performance')
    const finalRecords = subjectRecords.filter((record) => record.kind === 'final')
    const distinctExams = [...new Map(examRecords.map((record) => [record.assessmentName, record])).values()]
    const examChange = distinctExams.length >= 2 && distinctExams[0].score !== undefined && distinctExams.at(-1)?.score !== undefined
      ? round((distinctExams.at(-1)?.score as number) - (distinctExams[0].score as number))
      : undefined
    const examAverage = optionalMean(examRecords)
    const performanceAverage = optionalMean(performanceRecords)
    const finalScore = optionalMean(finalRecords)
    const value = finalScore ?? optionalMean(subjectRecords)
    const cohort = cohortScores(currentScores, subjectId)
    const cohortValues = cohort.map((item) => item.value)
    const stats = descriptiveStats(cohortValues)
    const zScore = value !== undefined && stats.standardDeviation > 0 ? round((value - stats.mean) / stats.standardDeviation) : undefined
    const rank = lastDefined(subjectRecords, (record) => record.rank)
    const inferredTieCount = rank === undefined ? undefined : currentScores.filter((record) => record.subjectId === subjectId && record.rank === rank && record.kind === 'final').length
    const achievement = inferredAchievement(finalScore, lastDefined(subjectRecords, (record) => record.achievement))
    return {
      subjectId,
      name,
      group: subject?.group,
      overallAverage: optionalMean(subjectRecords) ?? 0,
      examAverage,
      performanceAverage,
      finalScore,
      achievement,
      gradeRank: lastDefined(subjectRecords, (record) => record.gradeRank),
      rank,
      enrollmentCount: lastDefined(subjectRecords, (record) => record.enrollmentCount) ?? cohort.length,
      tieCount: lastDefined(subjectRecords, (record) => record.tieCount) ?? (inferredTieCount && inferredTieCount > 1 ? inferredTieCount : undefined),
      examChange,
      examPerformanceGap: examAverage !== undefined && performanceAverage !== undefined ? round(performanceAverage - examAverage) : undefined,
      zScore,
      tScore: zScore === undefined ? undefined : round(50 + 10 * zScore, 1),
      percentile: value === undefined ? undefined : percentile(value, cohortValues),
      incompletionRisk: Boolean(isCommonSubject(name) && finalScore !== undefined && finalScore < 40 && (context.schoolYear ?? 2025) >= 2025),
      assessments: subjectRecords.map((record) => ({ id: record.id, kind: record.kind, name: record.assessmentName, score: record.score, weight: record.weight })),
    } satisfies StudentSubjectAnalysis
  }).sort((a, b) => b.overallAverage - a.overallAverage)

  const insights: string[] = []
  const strongest = subjectAnalyses[0]
  const weakest = subjectAnalyses.at(-1)
  if (strongest) insights.push(`${strongest.name} 과목이 평균 ${strongest.overallAverage}점으로 가장 높은 성취를 보입니다.`)
  if (weakest && weakest.subjectId !== strongest?.subjectId) insights.push(`${weakest.name} 과목은 평균 ${weakest.overallAverage}점으로 우선 보완이 필요합니다.`)
  const largestChange = subjectAnalyses.filter((item) => item.examChange !== undefined).sort((a, b) => Math.abs(b.examChange!) - Math.abs(a.examChange!))[0]
  if (largestChange?.examChange !== undefined) insights.push(`${largestChange.name} 시험 점수가 이전 평가보다 ${Math.abs(largestChange.examChange)}점 ${largestChange.examChange >= 0 ? '향상되었습니다.' : '하락했습니다.'}`)
  const largestGap = subjectAnalyses.filter((item) => item.examPerformanceGap !== undefined).sort((a, b) => Math.abs(b.examPerformanceGap!) - Math.abs(a.examPerformanceGap!))[0]
  if (largestGap && Math.abs(largestGap.examPerformanceGap!) >= 10) insights.push(`${largestGap.name}은 수행평가가 정기시험보다 ${Math.abs(largestGap.examPerformanceGap!)}점 ${largestGap.examPerformanceGap! >= 0 ? '높아 지필 보완이 필요합니다.' : '낮아 수행 과정 점검이 필요합니다.'}`)

  const incompletionSubjects = subjectAnalyses.filter((item) => item.incompletionRisk).map((item) => item.name)
  const eSubjects = subjectAnalyses.filter((item) => item.achievement === 'E').map((item) => item.name)
  const sharpDrops = subjectAnalyses.filter((item) => (item.examChange ?? 0) <= -20)
  const warningReasons: string[] = []
  if (incompletionSubjects.length) warningReasons.push(`공통과목 40% 미만: ${incompletionSubjects.join(', ')}`)
  if (eSubjects.length >= 2) warningReasons.push(`E 성취도 ${eSubjects.length}과목: ${eSubjects.join(', ')}`)
  if (sharpDrops.length) warningReasons.push(`직전 대비 20점 이상 하락: ${sharpDrops.map((item) => item.name).join(', ')}`)

  const domainGroups = new Map<string, number[]>()
  for (const subject of subjectAnalyses) {
    const domain = domainFor(subject.name)
    const value = subject.finalScore ?? subject.overallAverage
    if (domain) domainGroups.set(domain, [...(domainGroups.get(domain) ?? []), value])
  }
  const domainRaw = ['국어', '수학', '영어', '사회', '과학'].map((domain) => {
    const values = domainGroups.get(domain) ?? []
    return { domain, rawScore: values.length ? descriptiveStats(values).mean : undefined }
  })
  const availableDomainValues = domainRaw.flatMap((item) => item.rawScore === undefined ? [] : [item.rawScore])
  const domainStats = descriptiveStats(availableDomainValues)
  const strengthProfile = domainRaw.map((item) => ({
    domain: item.domain,
    rawScore: item.rawScore,
    value: item.rawScore === undefined ? 0 : domainStats.standardDeviation > 0 ? Math.max(0, Math.min(100, round(50 + 10 * ((item.rawScore - domainStats.mean) / domainStats.standardDeviation), 1))) : 50,
  }))

  const aggregateByStudent = new Map<string, number[]>()
  for (const { studentId, value } of subjects.flatMap((subject) => cohortScores(currentScores, subject.id))) aggregateByStudent.set(studentId, [...(aggregateByStudent.get(studentId) ?? []), value])
  const aggregates = [...aggregateByStudent.entries()].map(([studentId, values]) => ({ studentId, value: descriptiveStats(values).mean }))
  const studentAggregate = aggregates.find((item) => item.studentId === student.id)?.value
  const gradePercentile = studentAggregate === undefined ? undefined : percentile(studentAggregate, aggregates.map((item) => item.value))
  const classStudentIds = new Set(students.filter((item) => item.className === student.className).map((item) => item.id))
  const classAggregates = aggregates.filter((item) => classStudentIds.has(item.studentId))
  const classPercentile = studentAggregate === undefined || classAggregates.length < 2 ? undefined : percentile(studentAggregate, classAggregates.map((item) => item.value))

  const longitudinalGroups = new Map<string, ScoreRecord[]>()
  for (const record of scores.filter((item) => item.studentId === student.id)) {
    const label = record.schoolYear || record.semester ? `${record.schoolYear ?? '—'}-${record.semester ?? '—'}` : '현재 업로드'
    longitudinalGroups.set(label, [...(longitudinalGroups.get(label) ?? []), record])
  }
  const longitudinal = [...longitudinalGroups.entries()].map(([label, periodRecords]) => ({
    label,
    schoolYear: periodRecords[0]?.schoolYear,
    semester: periodRecords[0]?.semester,
    average: optionalMean(periodRecords) ?? 0,
  })).sort((a, b) => ((a.schoolYear ?? 0) * 10 + (a.semester ?? 0)) - ((b.schoolYear ?? 0) * 10 + (b.semester ?? 0)))
  const longitudinalChange = longitudinal.length >= 2 ? round(longitudinal.at(-1)!.average - longitudinal[0].average) : undefined

  return {
    student,
    context,
    overallAverage: optionalMean(records) ?? 0,
    examAverage: optionalMean(records.filter((record) => record.kind === 'exam')),
    performanceAverage: optionalMean(records.filter((record) => record.kind === 'performance')),
    finalAverage: optionalMean(records.filter((record) => record.kind === 'final')),
    evaluationCount: records.filter((record) => record.score !== undefined).length,
    strongest,
    weakest,
    subjects: subjectAnalyses,
    insights,
    warningReasons,
    incompletionSubjects,
    strengthProfile,
    gradePercentile,
    classPercentile,
    longitudinal,
    longitudinalChange,
    specialNotesDraft: buildSpecialNotes(subjectAnalyses),
    simulations: buildSimulations(subjectAnalyses, currentScores),
  }
}
