export function fmtClock(d: Date): string {
  return d.toLocaleTimeString('en-GB', { hour12: false })
}

export function fmtDate(d: Date): string {
  return d.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })
}

export function fmtStamp(ms: number): string {
  const d = new Date(ms)
  const date = d.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })
  const time = d.toLocaleTimeString('en-GB', { hour12: false })
  return `${date} · ${time}`
}

export function fmtStampShort(ms: number): string {
  return new Date(ms).toLocaleTimeString('en-GB', { hour12: false })
}

export function pad2(n: number): string {
  return String(n).padStart(2, '0')
}

export function classNames(...xs: (string | false | null | undefined)[]): string {
  return xs.filter(Boolean).join(' ')
}
