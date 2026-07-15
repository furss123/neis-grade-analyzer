import type { DocumentType, ParsedFile } from '../types/grade'
import { detectWorkbook, readWorkbook } from './detectWorkbook'
import { parseWorkbookView } from './genericParser'

export async function parseGradeFile(file: File, forcedType?: DocumentType): Promise<ParsedFile> {
  const id = `${Date.now()}-${crypto.randomUUID()}`
  try {
    const view = await readWorkbook(file)
    const detection = detectWorkbook(view)
    const type = forcedType ?? detection.type
    const parsed = parseWorkbookView(view, id, file.name, type)
    parsed.detection = { ...detection, type }
    if (detection.confidence < 0.55) parsed.warnings.unshift('자동 판별 신뢰도가 낮습니다. 파일 유형을 확인해 주세요.')
    parsed.status = parsed.warnings.length ? 'warning' : 'success'
    return parsed
  } catch (error) {
    return {
      id,
      fileName: file.name,
      sheetNames: [],
      detection: { type: 'unknown', confidence: 0, scores: { unknown: 0 } as ParsedFile['detection']['scores'], evidence: [] },
      data: { context: {}, students: [], subjects: [], scores: [] },
      warnings: [],
      status: 'error',
      error: error instanceof Error ? error.message : '파일을 읽을 수 없습니다.',
    }
  }
}
