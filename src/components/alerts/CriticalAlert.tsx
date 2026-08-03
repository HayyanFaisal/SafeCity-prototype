import { X, Phone, MessageCircle, ExternalLink, Focus } from 'lucide-react'
import { useApp } from '../../store/AppContext'
import { DUTY_OFFICER, SEVERITY_META } from '../../constants'
import ModelBadge from '../ui/ModelBadge'

export default function CriticalAlert() {
  const { criticalAlert, acknowledgeAlert, dispatchAlert, canEdit, focusCamera } = useApp()

  if (!criticalAlert) return null

  const sev = SEVERITY_META.high

  /**
   * FOCUS STREAM: moves the offending camera into the primary tile (via the
   * existing order-swap — videos stay keyed by camera id, so no reload) and
   * closes the modal.
   */
  const focusStream = () => {
    focusCamera(criticalAlert.cameraId)
    acknowledgeAlert()
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4 backdrop-blur-sm">
      <div className="w-full max-w-md animate-confirm-pop rounded-xl border-2 border-danger bg-base shadow-2xl">
        {/* Header */}
        <div
          className="flex items-center justify-between border-b-2 border-danger/50 px-6 py-4"
          style={{ backgroundColor: `${sev.color}20` }}
        >
          <div className="flex items-center gap-3">
            <div className="h-3 w-3 rounded-full bg-danger animate-pulse" />
            <span className="hud-label text-lg font-bold text-danger">{sev.label} ALERT</span>
          </div>
          {!canEdit && (
            <button onClick={acknowledgeAlert} className="btn-icon" title="Acknowledge">
              <X className="h-5 w-5" />
            </button>
          )}
        </div>

        {/* Content */}
        <div className="space-y-4 px-6 py-5">
          {/* Mock integration tag */}
          <div className="rounded border border-cyan/30 bg-cyan/5 px-3 py-1.5 text-center text-[10px] font-semibold text-cyan">
            DEMO MODE — siren, push notification & dispatch are simulated
          </div>

          {/* Event title + detail */}
          <div>
            <h2 className="text-xl font-bold text-white mb-2">{criticalAlert.event}</h2>
            <p className="text-sm text-slate-300">{criticalAlert.detail}</p>
          </div>

          {/* Camera + zone */}
          <div className="rounded-lg border border-edge/60 bg-surface2/50 p-3 space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-slate-400">Camera:</span>
              <span className="font-mono font-semibold text-gold-soft">
                CAM {criticalAlert.cameraIndex} — {criticalAlert.cameraName}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-400">Zone:</span>
              <span className="font-semibold text-steel">{criticalAlert.zone}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-400">Time:</span>
              <span className="font-mono text-cyan">{criticalAlert.clockLabel}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-400">Confidence:</span>
              <span className="font-semibold text-warn">{criticalAlert.confidence}%</span>
            </div>
          </div>

          {/* Model badge */}
          <div>
            <ModelBadge id={criticalAlert.modelId} />
          </div>

          {/* Dispatch actions */}
          {canEdit && (
            <div className="space-y-2 border-t border-edge/50 pt-4">
              <p className="text-xs text-slate-400 font-semibold">DISPATCH OPTIONS (DEMO):</p>
              <div className="grid grid-cols-2 gap-2">
                {/* WhatsApp deep-link (real) — Muhammad Ammar +92 349 4533107 */}
                <a
                  href={`https://wa.me/${DUTY_OFFICER.whatsapp}?text=${encodeURIComponent(
                    `🚨 PNS SafeCity ALERT\n${criticalAlert.event} — CAM ${criticalAlert.cameraIndex}\nZone: ${criticalAlert.zone}\nTime: ${criticalAlert.clockLabel}`,
                  )}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="btn text-xs flex items-center justify-center gap-2 bg-green-900/40 border-green-700/60 text-green-300 hover:bg-green-900/60"
                  title="Open WhatsApp with pre-filled message"
                >
                  <MessageCircle className="h-4 w-4" />
                  WhatsApp
                  <ExternalLink className="h-3 w-3" />
                </a>

                {/* Simulated call dispatch */}
                <button
                  onClick={() => dispatchAlert(criticalAlert)}
                  className="btn text-xs flex items-center justify-center gap-2 bg-blue-900/40 border-blue-700/60 text-blue-300 hover:bg-blue-900/60"
                  title="Simulated call/wSMS dispatch (logs a mock payload)"
                >
                  <Phone className="h-4 w-4" />
                  Dispatch
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="border-t border-edge/50 bg-surface2/50 px-6 py-3 flex gap-3">
          <button
            onClick={focusStream}
            className="btn text-xs flex-1 border-cyan/50 text-cyan hover:border-cyan hover:bg-cyan/10"
            title="Move this camera to the primary tile and close the alert"
          >
            <Focus className="h-4 w-4" />
            FOCUS STREAM
          </button>
          <button
            onClick={acknowledgeAlert}
            className="btn-gold flex-1"
            title="Acknowledge & close"
          >
            ACKNOWLEDGE
          </button>
        </div>
      </div>
    </div>
  )
}
