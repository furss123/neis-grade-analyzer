import { create } from 'zustand'
import type { DocumentType, ParsedFile, TeacherMode } from '../types/grade'

interface GradeStore {
  mode?: TeacherMode
  files: ParsedFile[]
  busy: boolean
  setMode: (mode?: TeacherMode) => void
  setBusy: (busy: boolean) => void
  addFiles: (files: ParsedFile[]) => void
  removeFile: (id: string) => void
  updateFileType: (id: string, type: DocumentType) => void
  updateContext: (id: string, key: 'schoolYear' | 'semester' | 'grade' | 'className', value: string) => void
  clear: () => void
}

export const useGradeStore = create<GradeStore>((set) => ({
  files: [],
  busy: false,
  setMode: (mode) => set({ mode }),
  setBusy: (busy) => set({ busy }),
  addFiles: (files) => set((state) => ({ files: [...state.files, ...files] })),
  removeFile: (id) => set((state) => ({ files: state.files.filter((file) => file.id !== id) })),
  updateFileType: (id, type) => set((state) => ({
    files: state.files.map((file) => file.id === id ? { ...file, detection: { ...file.detection, type } } : file),
  })),
  updateContext: (id, key, value) => set((state) => ({
    files: state.files.map((file) => file.id === id ? {
      ...file,
      data: { ...file.data, context: { ...file.data.context, [key]: ['schoolYear', 'semester', 'grade'].includes(key) ? Number(value) || undefined : value || undefined } },
    } : file),
  })),
  clear: () => set({ files: [] }),
}))
