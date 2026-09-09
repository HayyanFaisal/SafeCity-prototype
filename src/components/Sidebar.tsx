import {
  LayoutDashboard,
  Monitor,
  MapPin,
  Cpu,
  Search,
  Route,
  AlertCircle,
  Camera as CameraIcon,
} from 'lucide-react'
import { useApp } from '../store/AppContext'
import type { TabId } from '../types'

const TABS: Array<{ id: TabId; label: string; icon: any; desc: string }> = [
  { id: 'overview', label: 'Safety Overview', icon: LayoutDashboard, desc: 'Command Center & KPIs' },
  { id: 'wall', label: 'Live Wall', icon: Monitor, desc: 'Multi-Camera Surveillance' },
  { id: 'map', label: 'Tactical Map', icon: MapPin, desc: 'GIS Society Coordinates' },
  { id: 'models', label: 'AI Model Hub', icon: Cpu, desc: '12 Models & Telemetry' },
  { id: 'forensics', label: 'Forensics', icon: Search, desc: 'Playback & Inspection' },
  { id: 'trajectory', label: 'Trajectory', icon: Route, desc: 'Re-ID Multi-Cam Path' },
  { id: 'incidents', label: 'Incident Log', icon: AlertCircle, desc: 'Filter & Export Reports' },
  { id: 'cameras', label: 'Cameras', icon: CameraIcon, desc: 'Node IPs & Feeds' },
]

export default function Sidebar() {
  const { tab, setTab, incidents } = useApp()

  // High-severity unacknowledged incident count
  const criticalCount = incidents.filter((i) => i.severity === 'high' && !i.acknowledged).length

  return (
    <aside className="flex w-60 flex-col border-r border-edge/60 bg-surface px-3 py-4 select-none shrink-0 transition-colors">
      {/* Navigation section */}
      <div className="text-[10px] font-bold tracking-widest uppercase text-slate-500 px-3 pb-2 hud-label">
        COMMAND MODULES
      </div>

      <nav className="space-y-1.5 flex-1 overflow-y-auto pr-1">
        {TABS.map(({ id, label, icon: Icon, desc }) => {
          const active = tab === id
          const hasCritical = id === 'incidents' && criticalCount > 0

          return (
            <button
              key={id}
              onClick={() => setTab(id)}
              className={`w-full flex items-center justify-between gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition text-left ${
                active
                  ? 'border border-gold/60 bg-gold/15 text-gold-soft shadow-glow-gold'
                  : 'border border-edge2/40 bg-surface2/30 text-slate-300 hover:border-steel/60 hover:bg-steel/10 hover:text-white'
              }`}
              title={desc}
            >
              <div className="flex items-center gap-3 min-w-0">
                <Icon
                  className={`h-4.5 w-4.5 flex-shrink-0 ${
                    active ? 'text-gold-soft' : 'text-slate-400'
                  }`}
                />
                <div className="truncate min-w-0">
                  <div className="font-display font-semibold tracking-wide truncate">{label}</div>
                  <div className="text-[10px] text-slate-500 truncate leading-none mt-0.5">
                    {desc}
                  </div>
                </div>
              </div>

              {hasCritical && (
                <span className="inline-flex items-center justify-center rounded-full bg-danger px-2 py-0.5 text-[10px] font-bold text-white shadow-glow-red animate-pulse">
                  {criticalCount}
                </span>
              )}
            </button>
          )
        })}
      </nav>

      {/* Footer System Status */}
      <div className="space-y-2 border-t border-edge2/40 pt-3 text-xs text-slate-400">
        <div className="flex items-center justify-between">
          <span className="text-slate-500 font-semibold text-[11px]">ACTIVE INCIDENTS</span>
          <span className="font-mono font-bold text-gold-soft">{incidents.length}</span>
        </div>
        <div className="flex items-center justify-between">
          <span className="text-slate-500 font-semibold text-[11px]">AI PIPELINE</span>
          <span className="pill border-emerald-500/30 bg-emerald-500/10 text-emerald-400 text-[9px]">
            ONLINE
          </span>
        </div>
        <div className="text-[10px] text-slate-500 text-center pt-1 font-mono">
          SafeCity Suite v2.0 • PoC
        </div>
      </div>
    </aside>
  )
}
