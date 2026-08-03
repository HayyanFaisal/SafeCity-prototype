import { useMemo, useState } from 'react'
import { Download, FileWarning, Filter } from 'lucide-react'
import { useApp } from '../../store/AppContext'
import { downloadIncidentReport } from '../../lib/pdf'
import StatusBadge from '../ui/StatusBadge'
import type { Severity } from '../../types'

type SeverityFilter = Severity | 'all'

export default function IncidentLog() {
  const { incidentRows } = useApp()
  const [severity, setSeverity] = useState<SeverityFilter>('all')
  const [query, setQuery] = useState('')
  const [exported, setExported] = useState(false)

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase()
    return incidentRows.filter((r) => {
      if (severity !== 'all' && r.severity !== severity) return false
      if (!q) return true
      return (
        r.cameraId.toLowerCase().includes(q) ||
        r.cameraName.toLowerCase().includes(q) ||
        r.ip.toLowerCase().includes(q) ||
        r.event.toLowerCase().includes(q) ||
        (r.plate ?? '').toLowerCase().includes(q)
      )
    })
  }, [incidentRows, severity, query])

  const exportReport = () => {
    downloadIncidentReport(filtered)
    setExported(true)
    window.setTimeout(() => setExported(false), 2500)
  }

  const counts = useMemo(
    () => ({
      all: incidentRows.length,
      high: incidentRows.filter((r) => r.severity === 'high').length,
      medium: incidentRows.filter((r) => r.severity === 'medium').length,
      low: incidentRows.filter((r) => r.severity === 'low').length,
    }),
    [incidentRows],
  )

  const filters: Array<{ id: SeverityFilter; label: string }> = [
    { id: 'all', label: `ALL · ${counts.all}` },
    { id: 'high', label: `HIGH · ${counts.high}` },
    { id: 'medium', label: `MEDIUM · ${counts.medium}` },
    { id: 'low', label: `LOW · ${counts.low}` },
  ]

  return (
    <div className="flex min-h-0 flex-1 flex-col gap-3 p-3">
      {/* Toolbar */}
      <div className="flex flex-wrap items-center gap-2 rounded-xl border border-edge bg-surface/70 p-2 backdrop-blur">
        <FileWarning size={15} className="text-accent" />
        <div className="font-mono text-[10px] tracking-widest text-slate-500">INCIDENT ALERT LOG</div>
        <div className="ml-auto flex flex-wrap items-center gap-2">
          <div className="flex items-center gap-1.5">
            <Filter size={13} className="text-slate-500" />
            {filters.map((f) => (
              <button
                key={f.id}
                onClick={() => setSeverity(f.id)}
                className={`rounded-md border px-2 py-1 font-mono text-[10px] font-bold transition ${
                  severity === f.id
                    ? f.id === 'high'
                      ? 'border-danger/60 bg-danger/15 text-red-400'
                      : f.id === 'medium'
                        ? 'border-warn/60 bg-warn/15 text-amber-400'
                        : 'border-accent/60 bg-accent/15 text-cyan-300'
                    : 'border-edge bg-base text-slate-500 hover:text-slate-300'
                }`}
              >
                {f.label}
              </button>
            ))}
          </div>
          <button
            onClick={exportReport}
            disabled={filtered.length === 0}
            className={`flex items-center gap-1.5 rounded-lg border px-3 py-1.5 text-[11.5px] font-bold transition disabled:opacity-40 ${
              exported
                ? 'border-emerald-500/60 bg-emerald-500/20 text-emerald-300'
                : 'border-accent/50 bg-accent/15 text-cyan-300 hover:bg-accent/25'
            }`}
          >
            <Download size={13} />
            {exported ? 'EXPORTED!' : 'Export Official Incident Fine Report (PDF)'}
          </button>
        </div>
      </div>

      {/* Search */}
      <div className="rounded-xl border border-edge bg-surface/40 p-2 backdrop-blur">
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Filter by camera ID, name, IP, event, or plate…"
          className="w-full rounded-lg border border-edge bg-base px-3 py-2 text-[12px] text-slate-100 outline-none transition focus:border-accent/60 placeholder:text-slate-600"
        />
      </div>

      {/* Table */}
      <div className="min-h-0 flex-1 overflow-auto rounded-xl border border-edge bg-surface/50 backdrop-blur">
        <table className="w-full min-w-[880px] border-collapse text-left">
          <thead className="sticky top-0 z-10 bg-surface2">
            <tr className="font-mono text-[9.5px] uppercase tracking-widest text-slate-500">
              <th className="px-3 py-2.5">Severity</th>
              <th className="px-3 py-2.5">Timestamp</th>
              <th className="px-3 py-2.5">Camera ID</th>
              <th className="px-3 py-2.5">IP Address</th>
              <th className="px-3 py-2.5">Camera Name</th>
              <th className="px-3 py-2.5">Event</th>
              <th className="px-3 py-2.5">Plate / Vehicle</th>
              <th className="px-3 py-2.5">Confidence</th>
              <th className="px-3 py-2.5">Fine</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((row) => (
              <tr key={row.id} className="border-t border-edge transition hover:bg-white/[0.03]">
                <td className="px-3 py-2.5">
                  <StatusBadge priority={row.severity} />
                </td>
                <td className="px-3 py-2.5 font-mono text-[11px] text-slate-400">{row.timestamp}</td>
                <td className="px-3 py-2.5 font-mono text-[12px] font-bold text-cyan-300">{row.cameraId}</td>
                <td className="px-3 py-2.5 font-mono text-[11px] text-slate-400">{row.ip}</td>
                <td className="px-3 py-2.5 max-w-[220px] truncate text-[12px] text-slate-200">{row.cameraName}</td>
                <td className="px-3 py-2.5">
                  <span className="text-[12px] font-medium text-slate-100">{row.event}</span>
                </td>
                <td className="px-3 py-2.5">
                  {row.plate ? (
                    <span className="font-mono text-[11px] text-amber-300">
                      {row.plate}
                      {row.vehicle && <span className="text-slate-500"> · {row.vehicle}</span>}
                    </span>
                  ) : (
                    <span className="text-slate-600">—</span>
                  )}
                </td>
                <td className="px-3 py-2.5">
                  <span className={`font-mono text-[11px] font-bold ${row.confidence >= 95 ? 'text-emerald-400' : 'text-slate-300'}`}>
                    {row.confidence.toFixed(1)}%
                  </span>
                </td>
                <td className="px-3 py-2.5">
                  {row.fined ? (
                    <span className="rounded border border-emerald-500/40 bg-emerald-500/10 px-1.5 py-0.5 font-mono text-[9.5px] font-bold text-emerald-400">
                      ISSUED
                    </span>
                  ) : row.fined === false ? (
                    <span className="font-mono text-[9.5px] text-slate-600">—</span>
                  ) : (
                    <span className="font-mono text-[9.5px] text-slate-500">N/A</span>
                  )}
                </td>
              </tr>
            ))}
            {filtered.length === 0 && (
              <tr>
                <td colSpan={9} className="px-3 py-10 text-center text-[12px] text-slate-500">
                  No incidents match the current filters.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      <div className="flex items-center justify-between px-1 font-mono text-[10px] text-slate-600">
        <span>SHOWING {filtered.length} OF {incidentRows.length} LOGGED EVENTS</span>
        <span>DATA SOURCE · AI ENGINE v4.2 · AUTO-VERIFIED</span>
      </div>
    </div>
  )
}
