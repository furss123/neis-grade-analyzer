export interface DescriptiveStats {
  count: number
  mean: number
  median: number
  min: number
  max: number
  standardDeviation: number
}

export function descriptiveStats(values: Array<number | undefined>): DescriptiveStats {
  const numbers = values.filter((value): value is number => value !== undefined && Number.isFinite(value)).sort((a, b) => a - b)
  if (!numbers.length) return { count: 0, mean: 0, median: 0, min: 0, max: 0, standardDeviation: 0 }
  const mean = numbers.reduce((sum, value) => sum + value, 0) / numbers.length
  const middle = Math.floor(numbers.length / 2)
  const median = numbers.length % 2 ? numbers[middle] : (numbers[middle - 1] + numbers[middle]) / 2
  const variance = numbers.reduce((sum, value) => sum + (value - mean) ** 2, 0) / numbers.length
  return {
    count: numbers.length,
    mean: round(mean),
    median: round(median),
    min: numbers[0],
    max: numbers[numbers.length - 1],
    standardDeviation: round(Math.sqrt(variance)),
  }
}

function round(value: number): number {
  return Math.round(value * 100) / 100
}
