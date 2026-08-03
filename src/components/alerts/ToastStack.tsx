import { X } from 'lucide-react'
import { useApp } from '../../store/AppContext'
import { SEVERITY_META } from '../../constants'

export default function ToastStack() {
  const { toasts, dismissToast } = useApp()

  return (
    <div className="fixed bottom-4 right-4 z-40 space-y-2 pointer-events-auto">
      {toasts.map((t) => {
        const sev = SEVERITY_META[t.severity]
        return (
          <div
            key={t.id}
            className="animate-toast-in flex gap-3 rounded-lg border px-4 py-3 shadow-lg backdrop-blur-sm"
            style={{
              borderColor: sev.color,
              backgroundColor: `${sev.color}15`,
            }}
          >
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-1">
                <div
                  className="h-2 w-2 rounded-full flex-shrink-0"
                  style={{ backgroundColor: sev.color }}
                />
                <span className="font-bold text-sm" style={{ color: sev.color }}>
                  {t.title}
                </span>
              </div>
              <p className="text-xs text-slate-300 mb-1">{t.detail}</p>
              <div className="text-[10px] text-slate-400">{t.cameraLabel}</div>
            </div>
            <button
              onClick={() => dismissToast(t.id)}
              className="flex-shrink-0 text-slate-400 hover:text-white transition"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        )
      })}
    </div>
  )
}
