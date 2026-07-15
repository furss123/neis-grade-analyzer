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
  examChange?: number
  assessments: StudentAssessmentDetail[]
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
}

function optionalMean(records: ScoreRecord[]): number | undefined {
  const stats = descriptiveStats(records.map((record) => record.score))
  return stats.count ? stats.mean : undefined
}

function lastDefined<T>(records: ScoreRecord[], select: (record: ScoreRecord) => T | undefined): T | undefined {
  return [...records].reverse().map(select).find((value) => value !== undefined)
}

export function buildStudentDeepReport(
  student: Student,
  subjects: Subject[],
  scores: ScoreRecord[],
  context: SchoolContext = {},
): StudentDeepReportData {
  const records = scores.filter((record) => record.studentId === student.id)
  const subjectMap = new Map(subjects.map((subject) => [subject.id, subject]))
  const grouped = new Map<string, ScoreRecord[]>()
  for (const record of records) grouped.set(record.subjectId, [...(grouped.get(record.subjectId) ?? []), record])

  const subjectAnalyses = [...grouped.entries()].map(([subjectId, subjectRecords]) => {
    const subject = subjectMap.get(subjectId)
    const examRecords = subjectRecords.filter((record) => record.kind === 'exam')
    const performanceRecords = subjectRecords.filter((record) => record.kind === 'performance')
    const finalRecords = subjectRecords.filter((record) => record.kind === 'final')
    const distinctExams = [...new Map(examRecords.map((record) => [record.assessmentName, record])).values()]
    const examChange = distinctExams.length >= 2 && distinctExams[0].score !== undefined && distinctExams.at(-1)?.score !== undefined
      ? Math.round(((distinctExams.at(-1)?.score as number) - (distinctExams[0].score as number)) * 100) / 100
      : undefined
    return {
      subjectId,
      name: subject?.name ?? subjectId,
      group: subject?.group,
      overallAverage: descriptiveStats(subjectRecords.map((record) => record.score)).mean,
      examAverage: optionalMean(examRecords),
      performanceAverage: optionalMean(performanceRecords),
      finalScore: optionalMean(finalRecords),
      achievement: lastDefined(subjectRecords, (record) => record.achievement),
      gradeRank: lastDefined(subjectRecords, (record) => record.gradeRank),
      rank: lastDefined(subjectRecords, (record) => record.rank),
      enrollmentCount: lastDefined(subjectRecords, (record) => record.enrollmentCount),
      examChange,
      assessments: subjectRecords.map((record) => ({
        id: record.id,
        kind: record.kind,
        name: record.assessmentName,
        score: record.score,
        weight: record.weight,
      })),
    } satisfies StudentSubjectAnalysis
  }).sort((a, b) => b.overallAverage - a.overallAverage)

  const insights: string[] = []
  const strongest = subjectAnalyses[0]
  const weakest = subjectAnalyses.at(-1)
  if (strongest) insights.push(`${strongest.name} 과목이 평균 ${strongest.overallAverage}점으로 가장 높은 성취를 보입니다.`)
  if (weakest && weakest.subjectId !== strongest?.subjectId) insights.push(`${weakest.name} 과목은 평균 ${weakest.overallAverage}점으로 우선 보완이 필요합니다.`)

  const largestChange = subjectAnalyses
    .filter((subject) => subject.examChange !== undefined)
    .sort((a, b) => Math.abs(b.examChange as number) - Math.abs(a.examChange as number))[0]
  if (largestChange?.examChange !== undefined) {
    insights.push(`${largestChange.name} 시험 점수가 이전 평가보다 ${Math.abs(largestChange.examChange)}점 ${largestChange.examChange >= 0 ? '향상되었습니다.' : '하락했습니다.'}`)
  }

  const largestGap = subjectAnalyses
    .filter((subject) => subject.examAverage !== undefined && subject.performanceAverage !== undefined)
    .map((subject) => ({ subject, gap: (subject.performanceAverage as number) - (subject.examAverage as number) }))
    .sort((a, b) => Math.abs(b.gap) - Math.abs(a.gap))[0]
  if (largestGap && Math.abs(largestGap.gap) >= 5) {
    insights.push(`${largestGap.subject.name}은 수행평가가 정기시험보다 ${Math.abs(Math.round(largestGap.gap * 100) / 100)}점 ${largestGap.gap >= 0 ? '높습니다.' : '낮습니다.'}`)
  }

  return {
    student,
    context,
    overallAverage: descriptiveStats(records.map((record) => record.score)).mean,
    examAverage: optionalMean(records.filter((record) => record.kind === 'exam')),
    performanceAverage: optionalMean(records.filter((record) => record.kind === 'performance')),
    finalAverage: optionalMean(records.filter((record) => record.kind === 'final')),
    evaluationCount: records.filter((record) => record.score !== undefined).length,
    strongest,
    weakest,
    subjects: subjectAnalyses,
    insights,
  }
}
