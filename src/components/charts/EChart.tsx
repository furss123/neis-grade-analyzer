import { useEffect, useRef } from 'react'
import { BarChart, PieChart } from 'echarts/charts'
import { DataZoomComponent, GridComponent, LegendComponent, TooltipComponent } from 'echarts/components'
import { init, use, type EChartsCoreOption } from 'echarts/core'
import { CanvasRenderer } from 'echarts/renderers'

use([BarChart, PieChart, GridComponent, TooltipComponent, LegendComponent, DataZoomComponent, CanvasRenderer])

interface EChartProps {
  option: EChartsCoreOption
  height: number
  label: string
}

export function EChart({ option, height, label }: EChartProps) {
  const containerRef = useRef<HTMLDivElement>(null)
  const chartRef = useRef<ReturnType<typeof init> | null>(null)

  useEffect(() => {
    if (!containerRef.current) return
    const chart = init(containerRef.current)
    const observer = new ResizeObserver(() => chart.resize())
    observer.observe(containerRef.current)
    chartRef.current = chart
    return () => {
      observer.disconnect()
      chart.dispose()
      chartRef.current = null
    }
  }, [])

  useEffect(() => {
    chartRef.current?.setOption(option, { notMerge: true })
  }, [option])

  return <div ref={containerRef} role="img" aria-label={label} style={{ height }} />
}
