import { useApp } from '../../store/AppContext'
import { SEVERITY_META } from '../../constants'
import ModelBadge from '../ui/ModelBadge'
import type { Severity } from '../../types'

export default function ModelsConfig() {
  const { models, severityOverrides, setSeverity, cameras, toggleCameraModel, canEdit } = useApp()

  return (
    <main className="flex min-h-0 flex-1 flex-col gap-4 bg-base p-6 overflow-auto">
      <h1 className="hud-label text-2xl text-gold-soft">AI MODELS CONFIGURATION</h1>

      {/* Global Model Settings */}
      <section className="space-y-3">
        <h2 className="hud-label text-lg text-steel">Global Model Severity</h2>
        <div className="grid grid-cols-2 gap-3">
          {models.map((model) => {
            const currentSev = severityOverrides[model.id] ?? model.severity

            return (
              <div
                key={model.id}
                className="rounded-lg border border-edge/50 bg-surface2/50 p-4 space-y-3"
              >
                <div>
                  <div className="font-bold text-slate-200 mb-1">{model.name}</div>
                  <ModelBadge id={model.id} />
                </div>

                {canEdit && (
                  <select
                    value={currentSev}
                    onChange={(e) => setSeverity(model.id, e.target.value as Severity)}
                    className="btn w-full text-xs text-left"
                  >
                    {(Object.keys(SEVERITY_META) as Severity[]).map((sev) => (
                      <option key={sev} value={sev}>
                        {SEVERITY_META[sev].label}
                      </option>
                    ))}
                  </select>
                )}
              </div>
            )
          })}
        </div>
      </section>

      {/* Per-Camera Settings */}
      <section className="space-y-3">
        <h2 className="hud-label text-lg text-steel">Per-Camera Model Assignment</h2>
        <div className="grid gap-3">
          {cameras.map((cam) => (
            <div
              key={cam.id}
              className="rounded-lg border border-edge/50 bg-surface2/50 p-4 space-y-3"
            >
              <div className="flex items-center justify-between mb-3">
                <div>
                  <div className="font-bold text-gold-soft text-lg">CAM {cam.index}</div>
                  <div className="text-sm text-slate-400">{cam.name}</div>
                </div>
                <div className="text-[10px] text-slate-500 text-right">
                  <div>{cam.ip}</div>
                  <div>{cam.models.length} models active</div>
                </div>
              </div>

              {canEdit && (
                <div className="grid grid-cols-5 gap-2">
                  {models.map((model) => {
                    const isActive = cam.models.includes(model.id)
                    return (
                      <button
                        key={model.id}
                        onClick={() => toggleCameraModel(cam.id, model.id)}
                        className={`py-2 px-2 rounded text-center text-[10px] font-bold transition ${
                          isActive
                            ? 'border border-gold/60 bg-gold/20 text-gold-soft'
                            : 'border border-edge2/30 bg-surface/40 text-slate-400 hover:border-edge2/60'
                        }`}
                        title={model.name}
                      >
                        {model.short}
                      </button>
                    )
                  })}
                </div>
              )}
            </div>
          ))}
        </div>
      </section>

      {/* Legend */}
      <section className="space-y-3">
        <h2 className="hud-label text-lg text-steel">Severity Levels</h2>
        <div className="grid grid-cols-3 gap-3">
          {(Object.entries(SEVERITY_META) as Array<[Severity, typeof SEVERITY_META['high']]>).map(
            ([sev, meta]) => (
              <div
                key={sev}
                className="rounded-lg border px-3 py-2 text-sm"
                style={{
                  borderColor: meta.color,
                  backgroundColor: `${meta.color}15`,
                }}
              >
                <div className="font-bold" style={{ color: meta.color }}>
                  {meta.label}
                </div>
                <div className="text-[10px] text-slate-400 mt-1">
                  {sev === 'high' && 'Immediate alert + siren'}
                  {sev === 'medium' && 'Toast notification'}
                  {sev === 'low' && 'Silent logging'}
                </div>
              </div>
            ),
          )}
        </div>
      </section>
    </main>
  )
}
