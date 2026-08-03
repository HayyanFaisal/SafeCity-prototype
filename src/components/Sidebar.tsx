import { Monitor, MapPin, BarChart3, AlertCircle, Sliders, Route } from 'lucide-react'
import { useApp } from '../store/AppContext'
import type { TabId } from '../types'

const TABS: Array<{ id: TabId; label: string; icon: typeof Monitor }> = [
  { id: 'wall', label: 'Live Wall', icon: Monitor },
  { id: 'map', label: 'Tactical Map', icon: MapPin },
  { id: 'analytics', label: 'Analytics', icon: BarChart3 },
  { id: 'incidents', label: 'Incident Log', icon: AlertCircle },
  { id: 'trajectory', label: 'Trajectory', icon: Route },
  { id: 'models', label: 'AI Models', icon: Sliders },
]

export default function Sidebar() {
  const { tab, setTab, incidents } = useApp()

  // High-severity incident count
  const criticalCount = incidents.filter((i) => i.severity === 'high' && !i.acknowledged).length

  return (
    <aside className="flex w-56 flex-col border-r border-edge/50 bg-surface px-3 py-4">
      {/* Nav tabs */}
      <nav className="space-y-2">
        {TABS.map(({ id, label, icon: Icon }) => {
          const active = tab === id
          const hasCritical = id === 'incidents' && criticalCount > 0

          return (
            <button
              key={id}
              onClick={() => setTab(id)}
              className={`w-full flex items-center justify-between gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition ${
                active
                  ? 'border-gold/60 bg-gold/15 text-gold-soft shadow-glow-gold'
                  : 'border border-edge2/50 bg-surface2/40 text-slate-300 hover:border-steel/60 hover:bg-steel/10'
              }`}
              title={label}
            >
              <div className="flex items-center gap-2.5">
                <Icon className="h-4.5 w-4.5 flex-shrink-0" />
                <span className="font-display tracking-wide">{label}</span>
              </div>
              {hasCritical && (
                <span className="inline-flex items-center justify-center rounded-full bg-danger px-2 py-0.5 text-[10px] font-bold text-white">
                  {criticalCount}
                </span>
              )}
            </button>
          )
        })}
      </nav>

      {/* Spacer */}
      <div className="flex-1" />

      {/* Footer info */}
      <div className="space-y-2 border-t border-edge2/30 pt-3 text-[11px] text-slate-400">
        <div>
          <span className="font-semibold">Active Incidents:</span> {incidents.length}
        </div>
        <div className="text-[10px]">
          System v1.0 • PNS SafeCity © 2026
        </div>
      </div>
    </aside>
  )
}
