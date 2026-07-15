import type { StrengthPoint } from '../../analytics/studentDeepAnalysis'

export function StrengthRadar({ points }: { points: StrengthPoint[] }) {
  const center = 120
  const radius = 82
  const coordinate = (index: number, scale: number) => {
    const angle = -Math.PI / 2 + (index * Math.PI * 2) / points.length
    return [center + Math.cos(angle) * radius * scale, center + Math.sin(angle) * radius * scale]
  }
  const polygon = (scale: number) => points.map((_, index) => coordinate(index, scale).join(',')).join(' ')
  const data = points.map((point, index) => coordinate(index, point.value / 100).join(',')).join(' ')

  return <svg className="strength-radar" viewBox="0 0 240 240" role="img" aria-label="국어 수학 영어 사회 과학 상대 강약 레이더 차트">
    {[.25, .5, .75, 1].map((scale) => <polygon points={polygon(scale)} key={scale} fill="none" stroke="#dfe7e4" />)}
    {points.map((point, index) => {
      const [x, y] = coordinate(index, 1)
      const [labelX, labelY] = coordinate(index, 1.18)
      return <g key={point.domain}><line x1={center} y1={center} x2={x} y2={y} stroke="#e6ebe9" /><text x={labelX} y={labelY} textAnchor="middle" dominantBaseline="middle">{point.domain}</text></g>
    })}
    <polygon points={data} fill="rgba(24,140,107,.2)" stroke="#188c6b" strokeWidth="2" />
    {points.map((point, index) => { const [x, y] = coordinate(index, point.value / 100); return <circle key={point.domain} cx={x} cy={y} r="3" fill="#188c6b" /> })}
  </svg>
}
