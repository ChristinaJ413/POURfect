/** Display formatting for latent / chart values (3 decimal places). */
export function formatDecimal(value: number | string | null | undefined): string {
  const n = typeof value === 'number' ? value : Number(value)
  if (!Number.isFinite(n)) return '—'
  return n.toFixed(3)
}
