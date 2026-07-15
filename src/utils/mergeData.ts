import type { Capabilities, ParsedFile, ScoreConflict, ScoreRecord, StandardGradeData } from '../types/grade'

export function mergeParsedFiles(files: ParsedFile[]): { data: StandardGradeData; conflicts: ScoreConflict[] } {
  const students = new Map(files.flatMap((file) => file.data.students).map((student) => [student.id, student]))
  const subjects = new Map(files.flatMap((file) => file.data.subjects).map((subject) => [subject.id, subject]))
  const grouped = new Map<string, ScoreRecord[]>()
  for (const record of files.flatMap((file) => file.data.scores)) {
    const key = [record.schoolYear ?? 'unknown-year', record.semester ?? 'unknown-semester', record.studentId, record.subjectId, record.kind, record.assessmentName.replace(/\s/g, '')].join('|')
    grouped.set(key, [...(grouped.get(key) ?? []), record])
  }

  const conflicts: ScoreConflict[] = []
  const scores = [...grouped.entries()].map(([key, records]) => {
    const sorted = [...records].sort((a, b) => b.sourcePriority - a.sourcePriority)
    const distinct = new Set(sorted.map((record) => record.score))
    if (distinct.size > 1) conflicts.push({ key, records: sorted, selectedId: sorted[0].id })
    return sorted[0]
  })

  return {
    data: {
      context: [...files]
        .filter((file) => Object.keys(file.data.context).length)
        .sort((a, b) => ((b.data.context.schoolYear ?? 0) * 10 + (b.data.context.semester ?? 0)) - ((a.data.context.schoolYear ?? 0) * 10 + (a.data.context.semester ?? 0)))[0]?.data.context ?? {},
      students: [...students.values()],
      subjects: [...subjects.values()],
      scores,
    },
    conflicts,
  }
}

export function inferCapabilities(data: StandardGradeData): Capabilities {
  const exams = data.scores.filter((score) => score.kind === 'exam')
  const examKeys = new Map<string, Set<string>>()
  for (const score of exams) {
    const key = `${score.studentId}|${score.subjectId}`
    examKeys.set(key, new Set([...(examKeys.get(key) ?? []), score.assessmentName]))
  }
  const classes = new Set(data.students.map((student) => student.className).filter(Boolean))
  return {
    exams: exams.length > 0,
    examComparison: [...examKeys.values()].some((names) => names.size >= 2),
    performance: data.scores.some((score) => score.kind === 'performance'),
    contribution: data.scores.some((score) => score.weight !== undefined),
    finalScores: data.scores.some((score) => score.kind === 'final'),
    achievement: data.scores.some((score) => score.achievement),
    gradeRank: data.scores.some((score) => score.gradeRank !== undefined),
    percentile: data.scores.some((score) => score.rank !== undefined && score.enrollmentCount !== undefined),
    classComparison: classes.size > 1,
    multiSubject: data.subjects.length > 1,
    subjectAnalysis: data.subjects.length === 1 && data.students.length > 1,
  }
}
