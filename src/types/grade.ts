export type TeacherMode = 'homeroom' | 'subject'

export type DocumentType =
  | 'regular-exam-class'
  | 'regular-exam-subject'
  | 'all-subjects'
  | 'subject-assessment'
  | 'semester-summary'
  | 'unknown'

export type ScoreKind = 'exam' | 'performance' | 'final'

export interface SchoolContext {
  schoolName?: string
  schoolLevel?: string
  schoolYear?: number
  semester?: number
  grade?: number
  className?: string
  lectureRoom?: string
  examName?: string
  teacher?: string
}

export interface Student {
  id: string
  studentNumber?: string
  name: string
  grade?: number
  className?: string
  number?: number
}

export interface Subject {
  id: string
  rawName: string
  name: string
  group?: string
  credits?: number
}

export interface ScoreRecord {
  id: string
  studentId: string
  subjectId: string
  kind: ScoreKind
  assessmentName: string
  score?: number
  weight?: number
  achievement?: string
  gradeRank?: number
  rank?: number
  enrollmentCount?: number
  classAverage?: number
  overallAverage?: number
  tieCount?: number
  schoolYear?: number
  semester?: number
  sourceId: string
  sourcePriority: number
}

export interface StandardGradeData {
  context: SchoolContext
  students: Student[]
  subjects: Subject[]
  scores: ScoreRecord[]
}

export interface DetectionResult {
  type: DocumentType
  confidence: number
  scores: Record<DocumentType, number>
  evidence: string[]
}

export interface ParsedFile {
  id: string
  fileName: string
  sheetNames: string[]
  detection: DetectionResult
  data: StandardGradeData
  warnings: string[]
  status: 'success' | 'warning' | 'error'
  error?: string
}

export interface ScoreConflict {
  key: string
  records: ScoreRecord[]
  selectedId: string
}

export interface Capabilities {
  exams: boolean
  examComparison: boolean
  performance: boolean
  contribution: boolean
  finalScores: boolean
  achievement: boolean
  gradeRank: boolean
  percentile: boolean
  classComparison: boolean
  multiSubject: boolean
  subjectAnalysis: boolean
}
