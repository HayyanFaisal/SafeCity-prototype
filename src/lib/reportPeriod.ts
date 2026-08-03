import type { Incident, ReportPeriod } from '../types'

/**
 * Shared period filtering for Analytics, Incident Log and PDF export.
 * All consumers filter the SAME persisted incident store by `firedAt` so the
 * dashboard, the log table and the report always reconcile.
 */

export interface PeriodRange {
  label: string
  /** inclusive start (ms epoch) */
  start: number
  /** exclusive end (ms epoch) */
  end: number
}

export function startOfDay(d: Date): number {
  const x = new Date(d)
  x.setHours(0, 0, 0, 0)
  return x.getTime()
}

export function rangeFor(period: ReportPeriod, now: number, custom?: { from: number; to: number }): PeriodRange {
  const end = startOfDay(new Date(now)) + 24 * 60 * 60 * 1000 // start of tomorrow
  switch (period) {
    case 'today':
      return { label: 'Today', start: startOfDay(new Date(now)), end }
    case 'week': {
      const d = new Date(now)
      // Monday-based week start
      const day = (d.getDay() + 6) % 7
      const start = startOfDay(d) - day * 24 * 60 * 60 * 1000
      return { label: 'This Week', start, end }
    }
    case 'month': {
      const d = new Date(now)
      const start = new Date(d.getFullYear(), d.getMonth(), 1).getTime()
      return { label: 'This Month', start, end }
    }
    case 'custom':
      return {
        label: 'Custom Range',
        start: custom?.from ?? 0,
        end: custom?.to ?? end,
      }
    case 'all':
    default:
      return { label: 'All Time', start: 0, end: Number.MAX_SAFE_INTEGER }
  }
}

export function filterByRange(
  incidents: Incident[],
  range: PeriodRange,
): Incident[] {
  return incidents
    .filter((i) => i.firedAt >= range.start && i.firedAt < range.end)
    .sort((a, b) => b.firedAt - a.firedAt)
}

export function formatRangeLabel(range: PeriodRange): string {
  const f = (ms: number) =>
    new Date(ms).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })
  if (range.start === 0) return range.label
  return `${f(range.start)} – ${f(Math.min(range.end - 1, Date.now()))} (${range.label})`
}
