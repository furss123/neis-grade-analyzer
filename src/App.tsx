import { lazy, Suspense, useEffect, useState } from 'react'
import { useGradeStore } from './stores/useGradeStore'
import type { TeacherMode } from './types/grade'

type Page = 'upload' | 'analysis' | 'guide'

const UploadPage = lazy(() => import('./pages/UploadPage').then((module) => ({ default: module.UploadPage })))
const AnalysisPage = lazy(() => import('./pages/AnalysisPage').then((module) => ({ default: module.AnalysisPage })))
const GuidePage = lazy(() => import('./pages/GuidePage').then((module) => ({ default: module.GuidePage })))

function pageFromHash(): Page {
  const page = location.hash.replace('#/', '')
  return page === 'analysis' || page === 'guide' ? page : 'upload'
}

export default function App() {
  const { mode, setMode, files } = useGradeStore()
  const [page, setPage] = useState<Page>(pageFromHash)
  useEffect(() => {
    const listener = () => setPage(pageFromHash())
    window.addEventListener('hashchange', listener)
    return () => window.removeEventListener('hashchange', listener)
  }, [])
  const navigate = (next: Page) => { location.hash = `/${next}`; setPage(next) }

  if (!mode) return <RoleSelect onSelect={(selected) => { setMode(selected); navigate('upload') }} />

  return (
    <div className="app-shell">
      <header className="topbar no-print">
        <button className="brand" onClick={() => navigate('upload')}><span className="brand-mark">N</span><span>나이스 성적 분석기<small>NEIS GRADE LAB</small></span></button>
        <nav><button className={page === 'upload' ? 'active' : ''} onClick={() => navigate('upload')}>파일 분석</button><button disabled={!files.length} className={page === 'analysis' ? 'active' : ''} onClick={() => navigate('analysis')}>분석 결과</button><button className={page === 'guide' ? 'active' : ''} onClick={() => navigate('guide')}>파일 준비 안내</button></nav>
        <button className="mode-switch" onClick={() => setMode(mode === 'homeroom' ? 'subject' : 'homeroom')}><span>{mode === 'homeroom' ? '담임' : '교과'}</span> 모드 전환</button>
      </header>
      <Suspense fallback={<main className="empty-state"><span>⌁</span><p>화면을 준비하고 있습니다.</p></main>}>
        {page === 'upload' && <UploadPage onAnalyze={() => navigate('analysis')} />}
        {page === 'analysis' && <AnalysisPage onUpload={() => navigate('upload')} />}
        {page === 'guide' && <GuidePage />}
      </Suspense>
      <footer className="no-print"><span>모든 분석은 사용자의 기기에서만 처리됩니다.</span><span>실제 성적 파일을 저장소에 업로드하지 마세요.</span></footer>
    </div>
  )
}

function RoleSelect({ onSelect }: { onSelect: (mode: TeacherMode) => void }) {
  return <main className="role-page"><div className="role-copy"><span className="brand-mark large">N</span><span className="eyebrow">NEIS GRADE LAB</span><h1>누구의 시선으로<br />성적을 살펴볼까요?</h1><p>역할은 화면 구성을 위한 선택입니다. 어떤 파일이든 두 모드에서 사용할 수 있습니다.</p></div><div className="role-cards"><RoleCard title="담임교사" tag="학급 전체" description="전과목의 지필·수행평가와 학생 변화, 상담 대상을 한눈에 봅니다." items={['전과목 성적 분석', '학생별 강점·보완', '시험 간 변화']} onClick={() => onSelect('homeroom')} /><RoleCard title="교과교사" tag="담당 교과" description="여러 반의 시험과 수행평가를 비교하고 지도 대상을 찾습니다." items={['반별 성취 비교', '수행평가 영역 분석', '성취도·등급 분포']} onClick={() => onSelect('subject')} /></div><div className="role-privacy">⌁ 파일은 서버로 전송되지 않고 브라우저 메모리에서만 처리됩니다.</div></main>
}

function RoleCard({ title, tag, description, items, onClick }: { title: string; tag: string; description: string; items: string[]; onClick: () => void }) {
  return <button className="role-card" onClick={onClick}><span className="role-tag">{tag}</span><h2>{title}<span>→</span></h2><p>{description}</p><ul>{items.map((item) => <li key={item}>✓ {item}</li>)}</ul></button>
}
