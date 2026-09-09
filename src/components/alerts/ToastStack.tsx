import { Check, ExternalLink, MessageCircle, X } from 'lucide-react'
import { useApp } from '../../store/AppContext'
import { DUTY_OFFICER, SEVERITY_META } from '../../constants'
import { blip } from '../../lib/audio'
import type { Toast } from '../../types'

function waLink(t: Toast): string {
  const label = t.severity === 'medium' ? '⚠️ WARNING' : 'ℹ️ ADVISORY'
  const msg = `${label} — Naval Anchorage SafeCity\n${t.title}\n${t.detail}\n${t.cameraLabel}`
  return `https://wa.me/${DUTY_OFFICER.whatsapp}?text=${encodeURIComponent(msg)}`
}

export default function ToastStack() {
  const { toasts, dismissToast, acknowledgeIncident } = useApp()

  /**
   * Acknowledge a toast: marks the backing incident as acknowledged in the
   * persisted incident store and removes the toast from the stack.
   */
  const handleAcknowledge = (t: Toast) => {
    acknowledgeIncident(t.incidentId)
    dismissToast(t.id)
  }

  return (
    // Positioned above the activity feed (z-40 > feed z-30).
    // Right-aligned and above the feed widget (bottom-[5.5rem]).
    <div className="fixed bottom-[5.5rem] right-4 z-40 flex flex-col-reverse gap-2 pointer-events-auto">
      {toasts.map((t) => {
        const sev = SEVERITY_META[t.severity]
        return (
          <div
            key={t.id}
            className="animate-toast-in w-80 rounded-lg border shadow-xl"
            style={{
              borderColor: `${sev.color}90`,
              // Opaque solid surface so the toast is always legible over any
              // content behind it (item 4) — no blur/glass, full readability.
              backgroundColor: '#0B182B',
              boxShadow: `0 10px 30px rgba(0,0,0,0.6), 0 0 0 1px ${sev.color}30`,
            }}
          >
            {/* Content */}
            <div className="flex gap-3 px-4 py-3">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <div
                    className="h-2 w-2 rounded-full flex-shrink-0 animate-pulse"
                    style={{ backgroundColor: sev.color }}
                  />
                  <span className="font-bold text-sm" style={{ color: sev.color }}>
                    {t.title}
                  </span>
                </div>
                <p className="text-xs text-slate-300 mb-1 leading-relaxed">{t.detail}</p>
                <div className="text-[10px] text-slate-400">{t.cameraLabel}</div>
              </div>
              {/* Quick dismiss */}
              <button
                onClick={() => dismissToast(t.id)}
                className="flex-shrink-0 text-slate-400 hover:text-white transition self-start mt-0.5"
                title="Dismiss"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            {/* Action row: WhatsApp + Acknowledge */}
            <div
              className="flex border-t px-3 py-2 gap-2"
              style={{ borderColor: `${sev.color}30` }}
            >
              <a
                href={waLink(t)}
                target="_blank"
                rel="noopener noreferrer"
                onClick={() => blip()}
                className="flex flex-1 items-center justify-center gap-1.5 rounded border border-green-700/50 bg-green-900/30 px-2 py-1 text-[10px] font-semibold text-green-400 hover:bg-green-900/60 transition"
                title="Notify duty officer via WhatsApp"
              >
                <MessageCircle className="h-3 w-3" />
                WhatsApp
                <ExternalLink className="h-2.5 w-2.5 opacity-60" />
              </a>
              <button
                onClick={() => handleAcknowledge(t)}
                className="flex flex-1 items-center justify-center gap-1.5 rounded border border-cyan/40 bg-cyan/10 px-2 py-1 text-[10px] font-semibold text-cyan hover:bg-cyan/25 transition"
                title="Acknowledge and remove"
              >
                <Check className="h-3 w-3" />
                Acknowledge
              </button>
            </div>
          </div>
        )
      })}
    </div>
  )
}
