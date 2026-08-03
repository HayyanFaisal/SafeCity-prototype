import { useMemo, useState } from 'react'
import { AlertTriangle, ArrowDown, Flame, Siren, X } from 'lucide-react'
import { useApp } from '../../store/AppContext'
import { ModelIcon } from '../ui/modelIcon'

type BucketKey = 'high' | 'medium' | 'low'

const BUCKET_META: Record<BucketKey, { label: string; desc: string; cls: string; dot: string }> = {
  high: {
    label: 'HIGH PRIORITY',
    desc: 'Urgent red modal · siren · neon tile border · map pulse',
    cls: 'border-danger/50 bg-danger/10',
    dot: 'bg-danger',
  },
  medium: {
    label: 'MEDIUM PRIORITY',
    desc: 'Floating toast · jump-to-timestamp action',
    cls: 'border-warn/50 bg-warn/10',
    dot: 'bg-warn',
  },
  low: {
    label: 'LOW PRIORITY',
    desc: 'Quiet toast · logged to incident report',
    cls: 'border-accent/40 bg-accent/10',
    dot: 'bg-accent',
  },
}

export default function SettingsDrawer() {
  const { settingsOpen, setSettingsOpen, priorityBuckets, setPriorityBuckets, modelEditor, canEditSettings } = useApp()
  const [dragId, setDragId] = useState<string | null>(null)
  const [overBucket, setOverBucket] = useState<BucketKey | null>(null)

  const buckets = useMemo<Record<BucketKey, string[]>>(() => priorityBuckets, [priorityBuckets])
  const models = useMemo(() => {
    const byId = new Map(modelEditor.models.map((m) => [m.id, m]))
    return byId
  }, [modelEditor.models])

  if (!settingsOpen) return null

  const onDrop = (target: BucketKey) => {
    if (dragId) {
      const next: Record<BucketKey, string[]> = {
        high: priorityBuckets.high.filter((m) => m !== dragId),
        medium: priorityBuckets.medium.filter((m) => m !== dragId),
        low: priorityBuckets.low.filter((m) => m !== dragId),
      }
      next[target] = [...next[target], dragId]
      setPriorityBuckets(next)
    }
    setDragId(null)
    setOverBucket(null)
  }

  const allIds = useMemo(
    () => [...priorityBuckets.high, ...priorityBuckets.medium, ...priorityBuckets.low],
    [priorityBuckets],
  )

  return (
    <div className="fixed inset-0 z-[90] flex justify-end">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setSettingsOpen(false)} />
      <div className="relative z-10 flex h-full w-full max-w-md flex-col border-l border-edge bg-surface shadow-panel animate-[toast-in_0.25s_cubic-bezier(0.21,1.02,0.73,1)]">
        {/* Header */}
        <div className="flex items-center gap-2 border-b border-edge px-4 py-3">
          <AlertTriangle size={16} className="text-accent" />
          <div className="min-w-0">
            <div className="text-[14px] font-bold text-slate-100">Model Priority Manager</div>
            <div className="font-mono text-[9.5px] text-slate-500">AUTOMATED TRIGGER RESPONSES · {allIds.length} MODELS ARMED</div>
          </div>
          <button
            onClick={() => setSettingsOpen(false)}
            className="ml-auto rounded-md p-1.5 text-slate-400 transition hover:bg-white/5 hover:text-slate-100"
            aria-label="Close"
          >
            <X size={16} />
          </button>
        </div>

        {!canEditSettings && (
          <div className="border-b border-edge bg-danger/10 px-4 py-2 font-mono text-[10px] text-red-400">
            ROLE LOCKED — SUPER ADMIN ONLY
          </div>
        )}

        {/* Buckets */}
        <div className="flex min-h-0 flex-1 flex-col gap-3 overflow-y-auto p-4">
          {(Object.keys(BUCKET_META) as BucketKey[]).map((key) => {
            const meta = BUCKET_META[key]
            const ids = buckets[key]
            return (
              <div
                key={key}
                onDragOver={(e) => {
                  e.preventDefault()
                  setOverBucket(key)
                }}
                onDragLeave={() => setOverBucket((o) => (o === key ? null : o))}
                onDrop={() => onDrop(key)}
                className={`rounded-xl border p-3 transition ${meta.cls} ${overBucket === key ? 'ring-2 ring-accent/50' : ''} ${canEditSettings ? '' : 'opacity-80'}`}
              >
                <div className="flex items-center gap-2">
                  <span className={`h-2 w-2 rounded-full ${meta.dot}`} />
                  <span className="font-mono text-[10.5px] font-bold tracking-widest text-slate-200">{meta.label}</span>
                  <span className="ml-auto font-mono text-[10px] text-slate-500">{ids.length}</span>
                </div>
                <div className="mt-0.5 font-mono text-[9.5px] text-slate-500">{meta.desc}</div>
                <div className="mt-2 space-y-1.5">
                  {ids.length === 0 && (
                    <div className="rounded-lg border border-dashed border-edge bg-base/40 px-3 py-2 text-center font-mono text-[9.5px] text-slate-600">
                      DROP MODELS HERE
                    </div>
                  )}
                  {ids.map((modelId) => {
                    const model = models.get(modelId)
                    if (!model) return null
                    return (
                      <div
                        key={modelId}
                        draggable={canEditSettings}
                        onDragStart={() => setDragId(modelId)}
                        onDragEnd={() => {
                          setDragId(null)
                          setOverBucket(null)
                        }}
                        className={`flex cursor-grab items-center gap-2 rounded-lg border border-edge bg-base px-2.5 py-2 active:cursor-grabbing ${dragId === modelId ? 'opacity-40' : ''}`}
                      >
                        <ModelIcon model={model} size={13} className="text-slate-300" />
                        <span className="min-w-0 flex-1 truncate text-[11.5px] font-medium text-slate-200">{model.name}</span>
                        <span className={`rounded px-1 py-0.5 font-mono text-[8.5px] font-bold text-slate-500 ${meta.cls}`}>
                          {meta.label}
                        </span>
                      </div>
                    )
                  })}
                </div>
              </div>
            )
          })}

          {/* Default layout hint */}
          <div className="mt-auto space-y-1.5 rounded-xl border border-edge bg-base/50 p-3">
            <div className="flex items-center gap-1.5 font-mono text-[9.5px] tracking-widest text-slate-500">
              <ArrowDown size={11} className="text-warn" /> DEFAULT PROFILE
            </div>
            <div className="flex flex-wrap gap-1.5 font-mono text-[9.5px] text-slate-400">
              <span className="flex items-center gap-1 rounded border border-danger/40 bg-danger/10 px-1.5 py-0.5 text-red-400"><Siren size={9} /> Gun</span>
              <span className="flex items-center gap-1 rounded border border-danger/40 bg-danger/10 px-1.5 py-0.5 text-red-400"><Flame size={9} /> Fire & Smoke</span>
              <span className="flex items-center gap-1 rounded border border-danger/40 bg-danger/10 px-1.5 py-0.5 text-red-400">Unattended</span>
            </div>
            <div className="font-mono text-[9px] leading-relaxed text-slate-600">
              Drag model chips across buckets to re-prioritize trigger responses. Changes apply to the live alert engine instantly.
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
