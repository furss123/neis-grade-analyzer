import { flexRender, getCoreRowModel, getSortedRowModel, useReactTable, type SortingState } from '@tanstack/react-table'
import { useMemo, useState } from 'react'

export interface StudentRow {
  id: string
  name: string
  className?: string
  number?: number
  mean: number
  strongest?: string
  weakest?: string
  records: number
}

interface StudentTableProps {
  rows: StudentRow[]
  selectedId?: string
  onSelect: (studentId: string) => void
}

export function StudentTable({ rows, selectedId, onSelect }: StudentTableProps) {
  const [sorting, setSorting] = useState<SortingState>([{ id: 'mean', desc: true }])
  const columns = useMemo(() => [
    { accessorKey: 'name', header: '학생' },
    { id: 'classNumber', header: '반/번호', cell: ({ row }: { row: { original: StudentRow } }) => `${row.original.className ?? '-'} / ${row.original.number ?? '-'}` },
    { accessorKey: 'mean', header: '평균' },
    { accessorKey: 'strongest', header: '강점 과목' },
    { accessorKey: 'weakest', header: '보완 과목' },
    { accessorKey: 'records', header: '평가 수' },
    { id: 'action', header: '심층 분석', enableSorting: false, cell: ({ row }: { row: { original: StudentRow } }) => <button className="table-action" onClick={() => onSelect(row.original.id)}>{selectedId === row.original.id ? '보고 있음' : '심층 보기'}</button> },
  ], [onSelect, selectedId])
  const table = useReactTable({ data: rows, columns, state: { sorting }, onSortingChange: setSorting, getCoreRowModel: getCoreRowModel(), getSortedRowModel: getSortedRowModel() })

  return (
    <div className="table-wrap">
      <table>
        <thead>{table.getHeaderGroups().map((group) => <tr key={group.id}>{group.headers.map((header) => <th key={header.id}>{header.column.getCanSort() ? <button className="sort-button" onClick={header.column.getToggleSortingHandler()}>{flexRender(header.column.columnDef.header, header.getContext())}{header.column.getIsSorted() === 'asc' ? ' ↑' : header.column.getIsSorted() === 'desc' ? ' ↓' : ''}</button> : flexRender(header.column.columnDef.header, header.getContext())}</th>)}</tr>)}</thead>
        <tbody>{table.getRowModel().rows.map((row) => <tr className={row.original.id === selectedId ? 'selected-row' : ''} key={row.id}>{row.getVisibleCells().map((cell) => <td key={cell.id}>{flexRender(cell.column.columnDef.cell, cell.getContext())}</td>)}</tr>)}</tbody>
      </table>
    </div>
  )
}
