/**
 * Exportação CSV para backup manual — "o registro financeiro do negócio não
 * pode sumir". Delimitador ";" porque é o que o Excel em pt-BR espera.
 */
export interface CsvColumn<T> {
  key: string
  label: string
  value: (row: T) => string | number | null
}

function escapeCsvValue(value: string | number | null): string {
  const text = value === null ? '' : String(value)
  if (/[;"\n]/.test(text)) {
    return `"${text.replace(/"/g, '""')}"`
  }
  return text
}

export function toCsv<T>(rows: T[], columns: CsvColumn<T>[]): string {
  const header = columns.map((c) => escapeCsvValue(c.label)).join(';')
  const lines = rows.map((row) => columns.map((c) => escapeCsvValue(c.value(row))).join(';'))
  return [header, ...lines].join('\n')
}

export function downloadCsv(filename: string, csvContent: string): void {
  // BOM no início ajuda o Excel a reconhecer UTF-8 corretamente.
  const blob = new Blob(['﻿', csvContent], { type: 'text/csv;charset=utf-8;' })
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = filename
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
  URL.revokeObjectURL(url)
}
