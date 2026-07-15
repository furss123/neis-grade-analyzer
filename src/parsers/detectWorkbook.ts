import * as XLSX from 'xlsx'
import type { DetectionResult, DocumentType } from '../types/grade'
import { compactText, normalizeText } from '../normalization/normalizeHeaders'

export interface WorkbookView {
  workbook: XLSX.WorkBook
  sheets: Array<{ name: string; rows: unknown[][]; merges: XLSX.Range[] }>
  text: string
}

const FEATURES: Record<Exclude<DocumentType, 'unknown'>, Array<[string, number]>> = {
  'regular-exam-class': [['정기시험', 2], ['학급별일람표', 5], ['고사', 1], ['합계', 1], ['평균', 1]],
  'regular-exam-subject': [['교과목별일람표', 6], ['정기시험', 2], ['고사', 1], ['성명', 1]],
  'all-subjects': [['전과목성적일람표', 9], ['평가방법', 2], ['원점수', 2], ['성취도', 2], ['수행평가', 2]],
  'subject-assessment': [['정기시험/수행평가', 7], ['지필/수행', 6], ['수행평가성적일람표', 5], ['반/번호', 2], ['합계', 1]],
  'semester-summary': [['학기말성적종합일람표', 9], ['합계(원점수)', 4], ['석차등급', 3], ['수강자수', 2], ['성취도', 2]],
}

export async function readWorkbook(file: File): Promise<WorkbookView> {
  const data = await file.arrayBuffer()
  const workbook = XLSX.read(data, { type: 'array', cellDates: false, cellNF: false })
  return workbookToView(workbook)
}

export function workbookToView(workbook: XLSX.WorkBook): WorkbookView {
  const sheets = workbook.SheetNames.map((name) => {
    const sheet = workbook.Sheets[name]
    const rows = XLSX.utils.sheet_to_json<unknown[]>(sheet, { header: 1, defval: '', raw: true })
    return { name, rows, merges: sheet['!merges'] ?? [] }
  })
  const text = compactText(sheets.flatMap((sheet) => [sheet.name, ...sheet.rows.flat()]).map(normalizeText).join(' '))
  return { workbook, sheets, text }
}

export function detectWorkbook(view: WorkbookView): DetectionResult {
  const scores = {} as Record<DocumentType, number>
  const evidence: string[] = []
  let bestType: DocumentType = 'unknown'
  let bestScore = 0

  for (const [type, features] of Object.entries(FEATURES) as Array<[Exclude<DocumentType, 'unknown'>, Array<[string, number]>]>) {
    let score = 0
    for (const [keyword, weight] of features) {
      if (view.text.includes(compactText(keyword))) {
        score += weight
        evidence.push(`${type}: ${keyword}`)
      }
    }
    scores[type] = score
    if (score > bestScore) {
      bestType = type
      bestScore = score
    }
  }
  scores.unknown = 0
  const maxPossible = bestType === 'unknown' ? 1 : FEATURES[bestType].reduce((sum, [, weight]) => sum + weight, 0)
  const confidence = Math.min(1, bestScore / Math.max(6, maxPossible * 0.65))
  if (bestScore < 4) bestType = 'unknown'

  return { type: bestType, confidence: bestType === 'unknown' ? Math.min(confidence, 0.45) : confidence, scores, evidence }
}
