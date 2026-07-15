import type { DocumentType, ParsedFile, ScoreKind, ScoreRecord, StandardGradeData, Student, Subject } from '../types/grade'
import { compactText, matchesAny, normalizeText } from '../normalization/normalizeHeaders'
import { normalizePercent, normalizeScore } from '../normalization/normalizeScore'
import { normalizeSubject, subjectId } from '../normalization/normalizeSubject'
import { parseClassNumber, studentId } from '../normalization/normalizeStudent'
import type { WorkbookView } from './detectWorkbook'

const HEADER_WORDS = ['성명', '이름', '학번', '번호', '반/번호', '원점수', '성취도', '석차등급', '석차', '동석차수', '합계', '평균', '정기시험', '수행평가']
const NON_SUBJECT = ['번호', '학번', '성명', '이름', '반/번호', '합계', '평균', '총점', '석차', '수강자수', '원점수', '성취도', '등급', '비고', '결시', '반영비율']

const PRIORITY: Record<DocumentType, Record<ScoreKind, number>> = {
  'regular-exam-class': { exam: 300, performance: 0, final: 0 },
  'regular-exam-subject': { exam: 300, performance: 0, final: 0 },
  'subject-assessment': { exam: 200, performance: 300, final: 100 },
  'all-subjects': { exam: 100, performance: 200, final: 200 },
  'semester-summary': { exam: 0, performance: 0, final: 300 },
  unknown: { exam: 50, performance: 50, final: 50 },
}

interface ColumnInfo {
  index: number
  header: string
  group: string
  kind?: ScoreKind
  attribute?: 'achievement' | 'gradeRank' | 'rank' | 'enrollmentCount' | 'weight' | 'classAverage' | 'overallAverage' | 'tieCount' | 'rankWithTie'
  subjectName?: string
  assessmentName?: string
}

function expandedRows(rows: unknown[][], merges: Array<{ s: { r: number; c: number }; e: { r: number; c: number } }>): unknown[][] {
  const copy = rows.map((row) => [...row])
  for (const merge of merges) {
    const value = copy[merge.s.r]?.[merge.s.c]
    for (let r = merge.s.r; r <= merge.e.r; r += 1) {
      copy[r] ??= []
      for (let c = merge.s.c; c <= merge.e.c; c += 1) copy[r][c] = copy[r][c] || value
    }
  }
  return copy
}

function headerScore(row: unknown[]): number {
  return row.reduce<number>((score, cell) => score + (HEADER_WORDS.some((word) => compactText(cell).includes(compactText(word))) ? 1 : 0), 0)
}

function inferContext(view: WorkbookView): StandardGradeData['context'] {
  const text = view.sheets.flatMap((sheet) => sheet.rows.slice(0, 12).flat()).map(normalizeText).join(' ')
  const schoolYear = Number(text.match(/(20\d{2})\s*학년도/)?.[1]) || undefined
  const semester = Number(text.match(/([12])\s*학기/)?.[1]) || undefined
  const grade = Number(text.match(/(\d+)\s*학년/)?.[1]) || undefined
  const className = text.match(/(\d+)\s*반/)?.[1]
  const lectureRoom = text.match(/(\d+)\s*강의실/)?.[1]
  const examName = text.match(/((?:1|2)\s*차(?:\s*지필평가|\s*시험)?|중간고사|기말고사)/)?.[1]?.replace(/\s/g, '')
  const schoolName = text.match(/([가-힣A-Za-z0-9]+(?:중학교|고등학교|학교))/)?.[1]
  const schoolLevel = schoolName?.includes('고등') ? '고등학교' : schoolName?.includes('중학') ? '중학교' : undefined
  return { schoolYear, semester, grade, className, lectureRoom, examName, schoolName, schoolLevel }
}

function singleSubjectFromTitle(view: WorkbookView): string | undefined {
  const topText = view.sheets.flatMap((sheet) => sheet.rows.slice(0, 8).flat()).map(normalizeText).filter(Boolean)
  const title = topText.find((cell) => /(?:정기시험|지필평가).*수행평가.*일람표/.test(cell))
  if (!title) return undefined
  return normalizeSubject(title).name
}

function isAttribute(header: string): ColumnInfo['attribute'] | undefined {
  if (matchesAny(header, ['석차(동석차수)', '석차 (동석차수)', '석차/동석차수'])) return 'rankWithTie'
  if (matchesAny(header, ['동석차수', '동석차 수'])) return 'tieCount'
  if (matchesAny(header, ['석차등급'])) return 'gradeRank'
  if (matchesAny(header, ['수강자수', '수강자 수'])) return 'enrollmentCount'
  if (matchesAny(header, ['성취도'])) return 'achievement'
  if (matchesAny(header, ['반영비율', '반영 비율'])) return 'weight'
  if (matchesAny(header, ['학급평균', '반평균'])) return 'classAverage'
  if (matchesAny(header, ['과목평균', '학년평균'])) return 'overallAverage'
  if (matchesAny(header, ['석차']) && !matchesAny(header, ['석차등급'])) return 'rank'
  return undefined
}

function inferKind(header: string, type: DocumentType): ScoreKind | undefined {
  if (matchesAny(header, ['수행평가', '수행', '영역'])) return 'performance'
  if (matchesAny(header, ['원점수', '학기말', '합계(원점수)'])) return 'final'
  if (matchesAny(header, ['정기시험', '지필평가', '고사', '1차', '2차', '중간', '기말'])) return 'exam'
  if (['regular-exam-class', 'regular-exam-subject'].includes(type)) return 'exam'
  return undefined
}

function isReserved(value: string): boolean {
  return !value || NON_SUBJECT.some((word) => compactText(value) === compactText(word) || compactText(value).startsWith(compactText(word)))
}

function buildColumns(rows: unknown[][], headerRow: number, type: DocumentType, singleSubject?: string): ColumnInfo[] {
  const header = rows[headerRow] ?? []
  const width = Math.max(header.length, ...rows.slice(Math.max(0, headerRow - 3), headerRow + 1).map((row) => row.length))
  const result: ColumnInfo[] = []

  for (let index = 0; index < width; index += 1) {
    const current = normalizeText(header[index])
    const ancestors = rows.slice(Math.max(0, headerRow - 3), headerRow).map((row) => normalizeText(row[index])).filter(Boolean)
    const group = [...ancestors].reverse().find((value) => !matchesAny(value, HEADER_WORDS)) ?? ''
    const combined = [...ancestors, current].filter(Boolean).join(' ')
    const attribute = isAttribute(combined)
    const kind = inferKind(combined, type)
    let subjectName = singleSubject

    if (!subjectName && group && !isReserved(group)) subjectName = normalizeSubject(group).name
    const regularSubjectColumn = ['regular-exam-class', 'regular-exam-subject'].includes(type) && !matchesAny(current, ['정기시험', '지필평가', '고사', '1차', '2차', '중간', '기말'])
    if (!subjectName && !isReserved(current) && (!kind || regularSubjectColumn) && !attribute) subjectName = normalizeSubject(current).name
    if (!subjectName && kind && group && !isReserved(group)) subjectName = normalizeSubject(group).name

    const assessmentName = current && !isReserved(current) ? current : kind === 'final' ? '학기말' : current || group
    result.push({ index, header: current, group, kind, attribute, subjectName, assessmentName })
  }
  return result
}

function validStudentName(value: unknown): boolean {
  const text = normalizeText(value)
  return text.length >= 2 && text.length <= 30 && /[가-힣A-Za-z]/.test(text) && !matchesAny(text, HEADER_WORDS)
}

export function parseWorkbookView(view: WorkbookView, fileId: string, fileName: string, type: DocumentType): ParsedFile {
  const context = inferContext(view)
  const data: StandardGradeData = { context, students: [], subjects: [], scores: [] }
  const warnings: string[] = []
  const singleSubject = singleSubjectFromTitle(view)
  const studentMap = new Map<string, Student>()
  const subjectMap = new Map<string, Subject>()

  for (const sheet of view.sheets) {
    const rows = expandedRows(sheet.rows, sheet.merges)
    const candidates = rows.map((row, index) => ({ index, score: headerScore(row) })).sort((a, b) => b.score - a.score)
    const headerRow = candidates[0]?.score >= 2 ? candidates[0].index : -1
    if (headerRow < 0) {
      warnings.push(`${sheet.name}: 학생 헤더 행을 찾지 못했습니다.`)
      continue
    }

    const columns = buildColumns(rows, headerRow, type, singleSubject)
    const nameColumn = columns.find((column) => matchesAny(column.header, ['성명', '학생명', '이름']))?.index
    const idColumn = columns.find((column) => matchesAny(column.header, ['학번']))?.index
    const classNumberColumn = columns.find((column) => matchesAny(column.header, ['반/번호']))?.index
    const numberColumn = columns.find((column) => compactText(column.header) === '번호')?.index
    if (nameColumn === undefined) {
      warnings.push(`${sheet.name}: 성명 열을 찾지 못했습니다.`)
      continue
    }

    let blankRun = 0
    for (let rowIndex = headerRow + 1; rowIndex < rows.length && blankRun < 8; rowIndex += 1) {
      const row = rows[rowIndex] ?? []
      const name = normalizeText(row[nameColumn])
      if (!validStudentName(name)) {
        blankRun += 1
        continue
      }
      blankRun = 0
      const parsedClassNumber = parseClassNumber(row[classNumberColumn ?? numberColumn ?? -1])
      const studentNumber = normalizeText(row[idColumn ?? -1]) || undefined
      const student: Student = {
        id: studentId(studentNumber, name, parsedClassNumber.className ?? context.className, parsedClassNumber.number),
        studentNumber,
        name,
        grade: context.grade,
        className: parsedClassNumber.className ?? context.className,
        number: parsedClassNumber.number,
      }
      studentMap.set(student.id, student)
      const latestBySubject = new Map<string, ScoreRecord>()
      let latestRecord: ScoreRecord | undefined

      for (const column of columns) {
        if (column.index === nameColumn || column.index === idColumn || column.index === classNumberColumn || column.index === numberColumn) continue
        const rawValue = row[column.index]
        if (rawValue === '' || rawValue === null || rawValue === undefined) continue
        if (column.attribute) {
          const attributeSubjectId = column.subjectName ? subjectId(normalizeSubject(column.subjectName).name) : undefined
          const target = attributeSubjectId ? latestBySubject.get(attributeSubjectId) : latestRecord
          if (!target) continue
          if (column.attribute === 'achievement') target.achievement = normalizeText(rawValue)
          else if (column.attribute === 'weight') target.weight = normalizePercent(rawValue)
          else if (column.attribute === 'rankWithTie') {
            const values = normalizeText(rawValue).match(/\d+(?:\.\d+)?/g)?.map(Number) ?? []
            target.rank = values[0]
            target.tieCount = values[1]
          }
          else target[column.attribute] = normalizeScore(rawValue)
          continue
        }
        if (!column.subjectName) continue
        const normalizedSubject = normalizeSubject(column.subjectName)
        const sId = subjectId(normalizedSubject.name)
        subjectMap.set(sId, { id: sId, ...normalizedSubject })

        const score = normalizeScore(rawValue)
        if (score === undefined) continue
        const kind = column.kind ?? (type === 'semester-summary' ? 'final' : type === 'all-subjects' ? 'final' : 'exam')
        const assessmentName = context.examName && kind === 'exam' ? context.examName : normalizeText(column.assessmentName) || (kind === 'final' ? '학기말' : '정기시험')
        const record: ScoreRecord = {
          id: `${fileId}-${sheet.name}-${rowIndex}-${column.index}`,
          studentId: student.id,
          subjectId: sId,
          kind,
          assessmentName,
          score,
          schoolYear: context.schoolYear,
          semester: context.semester,
          sourceId: fileId,
          sourcePriority: PRIORITY[type][kind],
        }
        data.scores.push(record)
        latestBySubject.set(sId, record)
        latestRecord = record
      }
    }
  }

  data.students = [...studentMap.values()]
  data.subjects = [...subjectMap.values()]
  if (!data.students.length) warnings.push('학생 데이터를 추출하지 못했습니다. 수동 매핑에서 헤더를 확인해 주세요.')
  if (!data.scores.length) warnings.push('점수 데이터를 추출하지 못했습니다.')

  return {
    id: fileId,
    fileName,
    sheetNames: view.sheets.map((sheet) => sheet.name),
    detection: { type, confidence: 0, scores: {} as Record<DocumentType, number>, evidence: [] },
    data,
    warnings,
    status: warnings.length ? 'warning' : 'success',
  }
}
