import { useState } from 'react'
import { Camera as CameraIcon, SlidersHorizontal, X } from 'lucide-react'
import { useApp } from '../../store/AppContext'
import { ModelIcon } from '../ui/modelIcon'

export default function ModelAssignmentDrawer() {
  const {
    modelDrawerOpen, setModelDrawerOpen, cameras, modelEditor, canAssignModels,
    priorityOf, streams,
  } = useApp()

  const [selectedCamId, setSelectedCamId] = useState<string | null>(cameras[0]?.id ?? null)

  if (!modelDrawerOpen) return null

  const selectedCam = cameras.find((c) => c.id === selectedCamId) ?? cameras[0]
  const activeModels = selectedCam ? new Set(selectedCam.enabledModels) : new Set<string>()

  const toggleForCamera = (modelId: string) => {
    if (!selectedCam) return
    modelEditor.setEnabledForCamera(selectedCam.id, modelId, !activeModels.has(modelId))
  }

  return (
    <div className="fixed inset-0 z-[90] flex justify-end">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setModelDrawerOpen(false)} />
      <div className="relative z-10 flex h-full w-full max-w-md flex-col border-l border-edge bg-surface shadow-panel animate-[toast-in_0.25s_cubic-bezier(0.21,1.02,0.73,1)]">
        {/* Header */}
        <div className="flex items-center gap-2 border-b border-edge px-4 py-3">
          <SlidersHorizontal size={16} className="text-accent" />
          <div className="min-w-0">
            <div className="text-[14px] font-bold text-slate-100">AI Model Assignment</div>
            <div className="font-mono text-[9.5px] text-slate-500">ENABLE / DISABLE MODELS PER CAMERA STREAM</div>
          </div>
          <button
            onClick={() => setModelDrawerOpen(false)}
            className="ml-auto rounded-md p-1.5 text-slate-400 transition hover:bg-white/5 hover:text-slate-100"
            aria-label="Close"
          >
            <X size={16} />
          </button>
        </div>

        {!canAssignModels && (
          <div className="border-b border-edge bg-danger/10 px-4 py-2 font-mono text-[10px] text-red-400">
            ROLE LOCKED — SUPER ADMIN ONLY
          </div>
        )}

        {/* Camera selector */}
        <div className="border-b border-edge p-3">
          <div className="mb-2 font-mono text-[9.5px] tracking-widest text-slate-500">SELECT CAMERA</div>
          <div className="flex flex-wrap gap-1.5">
            {cameras.map((cam) => {
              const isSelected = cam.id === selectedCam?.id
              const slot = streams.find((s) => s.cameraId === cam.id)?.slot
              return (
                <button
                  key={cam.id}
                  onClick={() => setSelectedCamId(cam.id)}
                  className={`flex items-center gap-1.5 rounded-md border px-2 py-1 font-mono text-[10px] font-bold transition ${
                    isSelected
                      ? 'border-accent/60 bg-accent/15 text-cyan-300'
                      : 'border-edge bg-base text-slate-400 hover:border-accent/40'
                  }`}
                >
                  <CameraIcon size={10} />
                  {cam.id}
                  {slot !== undefined && <span className="text-[8.5px] text-slate-600">S{slot + 1}</span>}
                </button>
              )
            })}
          </div>
        </div>

        {selectedCam && (
          <>
            {/* Camera info */}
            <div className="border-b border-edge bg-base/40 px-4 py-3">
              <div className="text-[13px] font-bold text-slate-100">{selectedCam.name}</div>
              <div className="font-mono text-[10px] text-slate-500">{selectedCam.id} · {selectedCam.ip}</div>
              <div className="mt-1.5 flex items-center gap-2">
                <span className={`rounded px-1.5 py-0.5 font-mono text-[9px] font-bold ${selectedCam.videoUrl ? 'border border-emerald-500/40 bg-emerald-500/10 text-emerald-400' : 'border border-edge bg-base text-slate-600'}`}>
                  {selectedCam.videoUrl ? 'STREAM LINKED' : 'NO STREAM'}
                </span>
                <span className="rounded border border-accent/30 bg-accent/10 px-1.5 py-0.5 font-mono text-[9px] font-bold text-cyan-300">
                  {activeModels.size}/{modelEditor.models.length} MODELS
                </span>
              </div>
            </div>

            {/* Model toggles */}
            <div className="min-h-0 flex-1 overflow-y-auto p-4">
              <div className="mb-2 flex items-center justify-between">
                <span className="font-mono text-[9.5px] tracking-widest text-slate-500">AI MODEL ENGINE</span>
                <span className="font-mono text-[9px] text-slate-600">EVT = HAS TIMELINE EVENT</span>
              </div>
              <div className="space-y-2">
                {modelEditor.models.map((model) => {
                  const on = activeModels.has(model.id)
                  const prio = priorityOf(model.id)
                  const hasEvent = ['gun', 'fire', 'unattended', 'crash', 'crowd', 'helmet', 'speed', 'anpr'].includes(model.id)
                  const prioDot = prio === 'high' ? 'bg-danger' : prio === 'medium' ? 'bg-warn' : 'bg-accent'
                  return (
                    <div
                      key={model.id}
                      className={`flex items-center gap-3 rounded-xl border p-3 transition ${on ? 'border-accent/30 bg-accent/5' : 'border-edge bg-base/60'}`}
                    >
                      <ModelIcon model={model} size={16} className={on ? 'text-accent' : 'text-slate-600'} />
                      <div className="min-w-0 flex-1">
                        <div className="truncate text-[12px] font-semibold text-slate-200">{model.name}</div>
                        <div className="mt-0.5 flex items-center gap-2 font-mono text-[9px] text-slate-500">
                          <span className={`h-1.5 w-1.5 rounded-full ${prioDot}`} />
                          {prio.toUpperCase()} PRIORITY
                          {hasEvent && <span className="text-warn">· EVT</span>}
                        </div>
                      </div>
                      <button
                        onClick={() => canAssignModels && toggleForCamera(model.id)}
                        disabled={!canAssignModels}
                        aria-pressed={on}
                        aria-label={`Toggle ${model.name}`}
                        className={`relative h-6 w-11 shrink-0 rounded-full border transition disabled:opacity-40 ${
                          on ? 'border-accent/60 bg-accent/30' : 'border-edge bg-base'
                        }`}
                      >
                        <span
                          className={`absolute top-0.5 h-4.5 w-4.5 rounded-full transition-all ${
                            on ? 'left-[22px] bg-accent shadow-glow-cyan' : 'left-0.5 bg-slate-600'
                          }`}
                        />
                      </button>
                    </div>
                  )
                })}
              </div>

              {/* Legend */}
              <div className="mt-4 rounded-xl border border-edge bg-base/50 p-3">
                <div className="font-mono text-[9px] leading-relaxed text-slate-600">
                  Disabling a model removes its detections from this camera’s alert feed and incident log.
                  Timeline events whose model is disabled will not auto-trigger.
                </div>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  )
}
