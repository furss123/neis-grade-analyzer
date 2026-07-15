import { useRef, useState } from 'react'

interface Props {
  busy: boolean
  onFiles: (files: File[]) => void
}

export function DropZone({ busy, onFiles }: Props) {
  const [dragging, setDragging] = useState(false)
  const folderRef = useRef<HTMLInputElement>(null)

  const submit = (list: FileList | null) => {
    const files = [...(list ?? [])].filter((file) => /\.(xlsx|xls)$/i.test(file.name))
    if (files.length) onFiles(files)
  }

  return (
    <div
      className={`drop-zone ${dragging ? 'is-dragging' : ''}`}
      onDragOver={(event) => { event.preventDefault(); setDragging(true) }}
      onDragLeave={() => setDragging(false)}
      onDrop={(event) => { event.preventDefault(); setDragging(false); submit(event.dataTransfer.files) }}
    >
      <div className="upload-icon" aria-hidden="true">↑</div>
      <h2>{busy ? '엑셀 구조를 분석하고 있습니다' : '나이스 성적 파일을 놓아 주세요'}</h2>
      <p>.xlsx, .xls 파일을 여러 개 한 번에 처리할 수 있습니다.</p>
      <div className="button-row">
        <label className="button primary">
          파일 선택
          <input type="file" accept=".xlsx,.xls" multiple hidden disabled={busy} onChange={(event) => submit(event.target.files)} />
        </label>
        <button className="button secondary" disabled={busy} onClick={() => { folderRef.current?.setAttribute('webkitdirectory', ''); folderRef.current?.click() }}>폴더 선택</button>
        <input ref={folderRef} type="file" multiple hidden onChange={(event) => submit(event.target.files)} />
      </div>
      <span className="local-badge">파일은 이 브라우저 밖으로 전송되지 않습니다</span>
    </div>
  )
}
