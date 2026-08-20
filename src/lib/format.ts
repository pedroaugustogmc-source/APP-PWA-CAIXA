export function formatBRL(value: number): string {
  return value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })
}

export function formatPercent(value: number, digits = 0): string {
  return value.toLocaleString('pt-BR', {
    style: 'percent',
    minimumFractionDigits: digits,
    maximumFractionDigits: digits,
  })
}

export function formatDate(iso: string): string {
  return new Date(`${iso}T00:00:00`).toLocaleDateString('pt-BR')
}

export function formatDias(dias: number): string {
  return `${dias} ${dias === 1 ? 'dia' : 'dias'}`
}

/** "2026-01" -> "jan/26" */
export function formatMes(mesISO: string): string {
  const [ano, mes] = mesISO.split('-')
  if (!ano || !mes) return mesISO
  return new Date(Number(ano), Number(mes) - 1, 1).toLocaleDateString('pt-BR', { month: 'short', year: '2-digit' })
}
