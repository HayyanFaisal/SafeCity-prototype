import type { Priority } from '../../types'

const STYLES: Record<Priority, string> = {
  high: 'border-danger/50 bg-danger/15 text-red-400',
  medium: 'border-warn/50 bg-warn/15 text-amber-400',
  low: 'border-accent/40 bg-accent/10 text-cyan-300',
}

const LABELS: Record<Priority, string> = {
  high: 'HIGH',
  medium: 'MEDIUM',
  low: 'LOW',
}

export default function StatusBadge({ priority, label }: { priority: Priority; label?: string }) {
  return (
    <span
      className={`inline-flex items-center gap-1 rounded border px-1.5 py-0.5 font-mono text-[10px] font-bold tracking-widest ${STYLES[priority]}`}
    >
      <span className="h-1.5 w-1.5 rounded-full bg-current" />
      {label ?? LABELS[priority]}
    </span>
  )
}
