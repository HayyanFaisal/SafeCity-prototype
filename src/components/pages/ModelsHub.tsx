import { useState } from 'react'
import {
  Layers,
  CheckCircle,
  Maximize2,
} from 'lucide-react'
import { useApp } from '../../store/AppContext'
import { AI_MODELS, CATEGORY_META, SEVERITY_META } from '../../constants'
import type { Severity } from '../../types'

export default function ModelsHub() {
  const { canEdit, severityOverrides, setSeverity, cameras } = useApp()
  const [selectedCategory, setSelectedCategory] = useState<string>('all')
  const [activeModalModelId, setActiveModalModelId] = useState<string | null>(null)

  const filteredModels =
    selectedCategory === 'all'
      ? AI_MODELS
      : AI_MODELS.filter((m) => m.category === selectedCategory)

  const activeModel = AI_MODELS.find((m) => m.id === activeModalModelId) || null

  return (
    <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-6 select-none transition-colors">
      {/* Top Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-edge2/40 pb-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-white flex items-center gap-3">
            <span className="p-2 rounded-xl bg-cyan/10 border border-cyan/30 text-cyan flex items-center justify-center">
              <Layers className="h-6 w-6" />
            </span>
            AI Enforcement Model Intelligence Hub
          </h1>
          <p className="text-xs sm:text-sm text-slate-400 mt-1">
            Complete telemetry, captured evidence, and priority settings for all 12 deep learning surveillance engines.
          </p>
        </div>

        {/* Category Filter Pills */}
        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={() => setSelectedCategory('all')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition ${
              selectedCategory === 'all'
                ? 'bg-gold text-slate-950 shadow-glow-gold'
                : 'bg-surface2/60 border border-edge2/50 text-slate-300 hover:text-white'
            }`}
          >
            All Models (12)
          </button>
          <button
            onClick={() => setSelectedCategory('traffic')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition ${
              selectedCategory === 'traffic'
                ? 'bg-cyan text-slate-950 shadow-glow-cyan'
                : 'bg-surface2/60 border border-edge2/50 text-slate-300 hover:text-white'
            }`}
          >
            Traffic (5)
          </button>
          <button
            onClick={() => setSelectedCategory('behaviour')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition ${
              selectedCategory === 'behaviour'
                ? 'bg-amber-400 text-slate-950 shadow-glow-amber'
                : 'bg-surface2/60 border border-edge2/50 text-slate-300 hover:text-white'
            }`}
          >
            Person Behaviour (3)
          </button>
          <button
            onClick={() => setSelectedCategory('safety')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition ${
              selectedCategory === 'safety'
                ? 'bg-rose-500 text-white shadow-glow-red'
                : 'bg-surface2/60 border border-edge2/50 text-slate-300 hover:text-white'
            }`}
          >
            Critical Safety (2)
          </button>
          <button
            onClick={() => setSelectedCategory('tracking')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition ${
              selectedCategory === 'tracking'
                ? 'bg-purple-500 text-white'
                : 'bg-surface2/60 border border-edge2/50 text-slate-300 hover:text-white'
            }`}
          >
            Multi-Cam Tracking (2)
          </button>
        </div>
      </div>

      {/* 12 Models Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
        {filteredModels.map((model) => {
          const effectiveSeverity = severityOverrides[model.id] ?? model.severity
          const sev = SEVERITY_META[effectiveSeverity]
          const cat = CATEGORY_META[model.category]

          // Find cameras running this model
          const assignedCams = cameras.filter((c) => c.models.includes(model.id))

          return (
            <div
              key={model.id}
              className="card p-5 border-edge2/60 bg-surface/90 hover:border-steel/60 transition flex flex-col justify-between"
            >
              <div>
                {/* Header */}
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <span className={`pill text-[10px] ${cat.badge} border`}>{cat.title}</span>
                    <h3 className="font-bold text-white text-base mt-2">{model.name}</h3>
                    <div className="text-[11px] font-mono text-slate-400 mt-0.5">
                      Short ID: <span className="text-gold-soft font-bold">{model.short}</span>
                    </div>
                  </div>

                  <span
                    className={`pill text-[10px] ${sev.badge} border shrink-0`}
                    title={`Severity: ${sev.label}`}
                  >
                    {sev.label}
                  </span>
                </div>

                <p className="text-xs text-slate-300 mt-3 line-clamp-2">{model.description}</p>

                {/* What the model captures feature box */}
                <div className="mt-4 p-3 rounded-xl bg-surface2/50 border border-edge2/50">
                  <div className="text-[10px] font-bold uppercase tracking-wider text-slate-400 hud-label mb-2">
                    CAPTURED DATA & TELEMETRY
                  </div>
                  <ul className="space-y-1 text-xs text-slate-300">
                    {model.capturesList.map((item, idx) => (
                      <li key={idx} className="flex items-center gap-2">
                        <span className="w-1.5 h-1.5 rounded-full bg-cyan shrink-0" />
                        <span className="truncate">{item}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                {/* Sample Live Evidence Preview Box */}
                {model.captureTelemetry.length > 0 && (
                  <div className="mt-3 p-3 rounded-xl bg-base/60 border border-edge2/40 text-xs">
                    <div className="flex items-center justify-between text-[10px] text-slate-400 font-mono">
                      <span>LATEST EVENT FLAG</span>
                      <span>{model.captureTelemetry[0].timestamp}</span>
                    </div>
                    <div className="font-semibold text-gold-soft mt-1">
                      {model.captureTelemetry[0].summary}
                    </div>
                    <div className="flex items-center gap-2 mt-2 text-[11px] font-mono text-slate-400">
                      <span>Accuracy:</span>
                      <span className="text-emerald-400 font-bold">
                        {model.captureTelemetry[0].confidence}%
                      </span>
                      <span>•</span>
                      <span>{model.captureTelemetry[0].cameraName}</span>
                    </div>
                  </div>
                )}
              </div>

              {/* Card Footer */}
              <div className="mt-5 pt-3 border-t border-edge2/40 flex items-center justify-between">
                <div className="text-xs text-slate-400">
                  <span>Bound: </span>
                  <span className="font-semibold text-white">
                    {assignedCams.length > 0
                      ? `${assignedCams.length} Cameras`
                      : 'Not assigned'}
                  </span>
                </div>

                <div className="flex items-center gap-2">
                  {canEdit && (
                    <select
                      value={effectiveSeverity}
                      onChange={(e) => setSeverity(model.id, e.target.value as Severity)}
                      className="bg-surface2 border border-edge2/60 text-[10px] font-semibold text-slate-300 rounded px-2 py-1"
                      title="Adjust priority bucket"
                    >
                      <option value="high">Critical</option>
                      <option value="medium">Warning</option>
                      <option value="low">Advisory</option>
                    </select>
                  )}

                  <button
                    onClick={() => setActiveModalModelId(model.id)}
                    className="p-1.5 rounded-lg border border-edge2/60 bg-surface2/60 text-slate-300 hover:text-gold-soft"
                    title="View Full Telemetry Details"
                  >
                    <Maximize2 className="h-4 w-4" />
                  </button>
                </div>
              </div>
            </div>
          )
        })}
      </div>

      {/* Detail Modal */}
      {activeModel && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4 backdrop-blur-sm"
          onClick={() => setActiveModalModelId(null)}
        >
          <div
            className="card max-w-2xl w-full p-6 space-y-4 border-edge2 bg-surface"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-start justify-between pb-3 border-b border-edge2/60">
              <div>
                <span className="pill text-[10px] border-cyan/40 bg-cyan/10 text-cyan">
                  {CATEGORY_META[activeModel.category].title}
                </span>
                <h2 className="text-xl font-bold text-white mt-1">{activeModel.name}</h2>
                <p className="text-xs text-slate-400 mt-0.5">{activeModel.description}</p>
              </div>
              <button
                onClick={() => setActiveModalModelId(null)}
                className="p-1.5 rounded-lg bg-surface2 text-slate-400 hover:text-white"
              >
                ✕
              </button>
            </div>

            {/* Captures List */}
            <div>
              <div className="text-xs font-bold uppercase text-slate-400 hud-label mb-2">
                What This Deep Learning Model Captures:
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {activeModel.capturesList.map((c, i) => (
                  <div
                    key={i}
                    className="p-2.5 rounded-lg bg-surface2/50 border border-edge2/50 text-xs text-slate-200 flex items-center gap-2"
                  >
                    <CheckCircle className="h-4 w-4 text-cyan shrink-0" />
                    <span>{c}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Live Captured Events History */}
            <div>
              <div className="text-xs font-bold uppercase text-slate-400 hud-label mb-2">
                Simulated Detection Log & Evidence:
              </div>
              <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
                {activeModel.captureTelemetry.map((t, idx) => (
                  <div
                    key={idx}
                    className="p-3 rounded-xl bg-base border border-edge2/60 text-xs flex items-center justify-between"
                  >
                    <div>
                      <div className="font-bold text-white">{t.summary}</div>
                      <div className="text-[11px] text-slate-400 font-mono mt-0.5">
                        Camera: {t.cameraName} • Time: {t.timestamp}
                      </div>
                    </div>
                    <span className="pill border-emerald-500/30 bg-emerald-500/10 text-emerald-400 font-mono text-[11px]">
                      {t.confidence}% Conf
                    </span>
                  </div>
                ))}
              </div>
            </div>

            <div className="pt-3 border-t border-edge2/60 flex justify-end">
              <button
                onClick={() => setActiveModalModelId(null)}
                className="btn bg-gold text-slate-950 font-bold hover:bg-gold-soft"
              >
                Close Inspector
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
