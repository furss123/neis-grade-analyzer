import * as XLSX from 'xlsx'
import type { StandardGradeData } from '../types/grade'

export function exportWorkbook(data: StandardGradeData, anonymized = false): void {
  const students = new Map(data.students.map((student, index) => [student.id, {
    ...student,
    name: anonymized ? `학생 ${String(index + 1).padStart(2, '0')}` : student.name,
    studentNumber: anonymized ? undefined : student.studentNumber,
  }]))
  const subjects = new Map(data.subjects.map((subject) => [subject.id, subject]))
  const rows = data.scores.map((score) => {
    const student = students.get(score.studentId)
    const subject = subjects.get(score.subjectId)
    return {
      학년도: score.schoolYear ?? data.context.schoolYear,
      학기: score.semester ?? data.context.semester,
      학년: student?.grade,
      반: student?.className,
      번호: student?.number,
      학번: student?.studentNumber,
      성명: student?.name,
      교과군: subject?.group,
      과목: subject?.name,
      평가유형: score.kind === 'exam' ? '정기시험' : score.kind === 'performance' ? '수행평가' : '학기말',
      평가명: score.assessmentName,
      점수: score.score,
      반영비율: score.weight,
      성취도: score.achievement,
      석차등급: score.gradeRank,
      석차: score.rank,
      수강자수: score.enrollmentCount,
      동석차수: score.tieCount,
    }
  })
  const workbook = XLSX.utils.book_new()
  XLSX.utils.book_append_sheet(workbook, XLSX.utils.json_to_sheet(rows), '표준 성적 데이터')
  XLSX.writeFile(workbook, anonymized ? '나이스_성적분석_익명.xlsx' : '나이스_성적분석.xlsx')
}
