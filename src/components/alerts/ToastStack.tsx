import { AlertTriangle, BellRing, Clock3, X } from 'lucide-react'
import { useApp } from '../../store/AppContext'
import { formatTime } from '../../lib/format'

export default function ToastStack() {
  const { toasts, dismissToast, openForensics, setForensicSeek } = useApp()

  const jumpTo = (cameraId: string, time: number) => {
    openForensics(cameraId)
    // Queue the seek; ForensicPanel consumes it on mount via effect
    window.setTimeout(() => setForensicSeek(time), 80)
  }

  return (
    <div className="pointer-events-none fixed right-4 top-16 z-[80] flex w-80 max-w-[calc(100vw-2rem)] flex-col gap-2">
      {toasts.map((toast) => (
        <div
          key={toast.id}
          className={`pointer-events-auto animate-[toast-in_0.3s_cubic-bezier(0.21,1.02,0.73,1)] rounded-xl border bg-surface/95 p-3 shadow-panel backdrop-blur ${
            toast.priority === 'medium' ? 'border-warn/50 shadow-glow-amber' : 'border-accent/40'
          }`}
        >
          <div className="flex items-start gap-2.5">
            <span
              className={`mt-0.5 grid h-8 w-8 shrink-0 place-items-center rounded-lg border ${
                toast.priority === 'medium'
                  ? 'border-warn/50 bg-warn/15 text-amber-400'
                  : 'border-accent/40 bg-accent/10 text-cyan-300'
              }`}
            >
              {toast.priority === 'medium' ? <AlertTriangle size={15} /> : <BellRing size={15} />}
            </span>
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-1.5">
                <span className={`font-mono text-[9px] font-bold tracking-widest ${toast.priority === 'medium' ? 'text-amber-400' : 'text-cyan-400'}`}>
                  {toast.priority.toUpperCase()} DETECTION
                </span>
                <span className="ml-auto font-mono text-[9px] text-slate-500">{toast.cameraId}</span>
              </div>
              <div className="mt-0.5 text-[12.5px] font-bold text-slate-100">{toast.title}</div>
              <div className="mt-0.5 text-[11px] leading-snug text-slate-400">{toast.detail}</div>
            </div>
            <button
              onClick={() => dismissToast(toast.id)}
              className="shrink-0 rounded p-1 text-slate-500 transition hover:text-slate-200"
              aria-label="Dismiss"
            >
              <X size={13} />
            </button>
          </div>
          <div className="mt-2 flex items-center gap-2 border-t border-edge pt-2">
            <span className="flex items-center gap-1 font-mono text-[9.5px] text-slate-500">
              <Clock3 size={10} /> @{formatTime(toast.time)}
            </span>
            <button
              onClick={() => jumpTo(toast.cameraId, toast.time)}
              className="ml-auto rounded-md border border-accent/40 bg-accent/10 px-2.5 py-1 font-mono text-[9.5px] font-bold text-cyan-300 transition hover:bg-accent/20"
            >
              JUMP TO TIMESTAMP
            </button>
          </div>
        </div>
      ))}
    </div>
  )
}
