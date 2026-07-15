export function GuidePage() {
  return (
    <main className="narrow-page">
      <span className="eyebrow">나이스 파일 준비 안내</span>
      <h1>분석에 알맞은 파일 내려받기</h1>
      <p className="lead">학교급·교육청 배포 버전·권한에 따라 메뉴 이름이 조금 다를 수 있습니다. 아래 경로와 유사한 이름을 찾아 주세요.</p>
      <div className="steps">
        <Guide number="01" title="담임 · 한 번의 시험" path="성적 → 지필평가조회/통계 → 지필평가조회 → 학급별 일람표" note="받은점수 기준, 전체 과목을 권장합니다." />
        <Guide number="02" title="담임 · 학기 전체" path="성적 → 성적조회/통계 → 학기말성적조회 → 전과목 성적 일람표" note="시험과 수행평가 상세 분석에는 받은점수 기준이 좋습니다." />
        <Guide number="03" title="담임 · 학기말 결과" path="성적 → 성적조회/통계 → 학기말성적조회 → 학기말성적종합일람표" note="성취도·석차등급·석차 분석에 사용합니다." />
        <Guide number="04" title="교과 · 시험과 수행평가" path="성적 → 성적조회/통계 → 학기말성적조회 → 지필/수행 성적일람표" note="받은점수 기준과 환산점 기준을 모두 지원합니다." />
        <Guide number="05" title="교과 · 특정 시험" path="성적 → 지필평가조회/통계 → 지필평가조회 → 교과목별 일람표 조회" note="교과목별 또는 강의실별 유형을 선택합니다." />
      </div>
      <div className="notice"><strong>중요</strong><p>실제 학생 성적 파일을 GitHub, 이메일, 공유 드라이브에 올리지 마세요. 이 앱은 파일을 브라우저 메모리에서만 처리합니다.</p></div>
    </main>
  )
}

function Guide({ number, title, path, note }: { number: string; title: string; path: string; note: string }) {
  return <article className="step"><span>{number}</span><div><h2>{title}</h2><code>{path}</code><p>{note}</p></div></article>
}
