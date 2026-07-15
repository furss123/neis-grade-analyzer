import type { EChartsCoreOption } from 'echarts/core'

interface AssessmentBarRow {
  subjectId: string
  assessmentName: string
  mean: number
}

export function buildAssessmentBarOption(rows: AssessmentBarRow[], subjectNames: Map<string, string>): { option: EChartsCoreOption; needsScroll: boolean } {
  const visibleBars = 10
  const needsScroll = rows.length > visibleBars
  const chartEnd = needsScroll ? Math.max(8, (visibleBars / rows.length) * 100) : 100
  const option: EChartsCoreOption = {
    animationDuration: 500,
    grid: { top: 28, right: 16, bottom: needsScroll ? 86 : 58, left: 45 },
    tooltip: { trigger: 'axis' },
    dataZoom: needsScroll ? [
      { type: 'inside', start: 0, end: chartEnd, filterMode: 'filter' },
      { type: 'slider', start: 0, end: chartEnd, filterMode: 'filter', bottom: 8, height: 18, showDetail: false, brushSelect: false },
    ] : [],
    xAxis: {
      type: 'category',
      data: rows.map((row) => `${subjectNames.get(row.subjectId) ?? row.subjectId}\n${row.assessmentName}`),
      axisLabel: {
        interval: 0,
        rotate: 0,
        color: '#586174',
        fontSize: 10,
        lineHeight: 14,
        hideOverlap: true,
        formatter: (value: string) => value.split('\n').map((line) => line.length > 11 ? `${line.slice(0, 11)}…` : line).join('\n'),
      },
    },
    yAxis: { type: 'value', min: 0, max: 100, axisLabel: { color: '#7b8495' }, splitLine: { lineStyle: { color: '#edf0f4' } } },
    series: [{ type: 'bar', data: rows.map((row) => row.mean), itemStyle: { color: '#21a179', borderRadius: [7, 7, 0, 0] }, barMaxWidth: 42 }],
  }
  return { option, needsScroll }
}
