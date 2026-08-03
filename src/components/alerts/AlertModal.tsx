import { Check, Crosshair, Siren, Volume2, VolumeX } from 'lucide-react'
import Modal from '../ui/Modal'
import { useApp } from '../../store/AppContext'
import { EVENT_MARKERS } from '../../constants'
import { formatTime } from '../../lib/format'

export default function AlertModal() {
  const { alertModal, acknowledgeAlert, getCamera, focusStream, soundEnabled, setSoundEnabled } = useApp()

  if (!alertModal) return null

  const camera = getCamera(alertModal.cameraId)
  if (!camera) return null

  const marker = EVENT_MARKERS.find((m) => m.id === alertModal.markerId) ?? EVENT_MARKERS[0]

  return (
    <Modal open tone="danger" size="md">
      <div className="flex items-start gap-3">
        <div className="relative mt-0.5 grid h-12 w-12 shrink-0 place-items-center rounded-xl border border-danger/60 bg-danger/15 shadow-glow-red">
          <Siren size={24} className="animate-live-blink text-red-400" />
          <span className="absolute -inset-1 animate-pulse-ring rounded-xl border-2 border-danger/50" />
        </div>
        <div className="min-w-0 flex-1">
          <div className="font-mono text-[10px] font-bold tracking-widest text-red-400">URGENT · HIGH PRIORITY ALERT</div>
          <div className="mt-0.5 text-[16px] font-extrabold text-slate-50">{marker.title}</div>
          <div className="mt-1 text-[12px] leading-relaxed text-slate-400">{marker.detail}</div>
        </div>
      </div>

      {/* Evidence strip */}
      <div className="mt-4 grid grid-cols-2 gap-2 rounded-xl border border-danger/40 bg-danger/5 p-3 font-mono text-[10px] sm:grid-cols-4">
        <div>
          <div className="text-slate-500">CAMERA</div>
          <div className="font-bold text-cyan-300">{camera.id}</div>
        </div>
        <div>
          <div className="text-slate-500">IP ADDRESS</div>
          <div className="font-bold text-slate-200">{camera.ip}</div>
        </div>
        <div>
          <div className="text-slate-500">TIMESTAMP</div>
          <div className="font-bold text-slate-200">@{formatTime(marker.time)}</div>
        </div>
        <div>
          <div className="text-slate-500">CONFIDENCE</div>
          <div className="font-bold text-emerald-400">{marker.confidence.toFixed(1)}%</div>
        </div>
      </div>

      <div className="mt-3 truncate rounded-lg border border-edge bg-base/60 px-3 py-2 font-mono text-[10.5px] text-slate-400">
        {camera.name}
      </div>

      {/* Actions */}
      <div className="mt-4 flex flex-wrap items-center gap-2">
        <button
          onClick={() => focusStream(camera.id)}
          className="flex flex-1 items-center justify-center gap-2 rounded-lg border border-danger/60 bg-danger/20 px-4 py-2.5 text-[12.5px] font-bold text-red-300 transition hover:bg-danger/30"
        >
          <Crosshair size={15} /> Focus Stream — {camera.id}
        </button>
        <button
          onClick={acknowledgeAlert}
          className="flex flex-1 items-center justify-center gap-2 rounded-lg border border-emerald-500/50 bg-emerald-500/15 px-4 py-2.5 text-[12.5px] font-bold text-emerald-300 transition hover:bg-emerald-500/25"
        >
          <Check size={15} /> Acknowledge
        </button>
        <button
          onClick={() => setSoundEnabled(!soundEnabled)}
          className="grid h-10 w-10 place-items-center rounded-lg border border-edge bg-base text-slate-400 transition hover:text-slate-100"
          aria-label="Toggle alert sound"
        >
          {soundEnabled ? <Volume2 size={16} /> : <VolumeX size={16} />}
        </button>
      </div>
    </Modal>
  )
}
