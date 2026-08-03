import { Activity, FileText, Grid3X3, Map as MapIcon, Route, Settings, SlidersHorizontal, Video, ShieldAlert } from 'lucide-react'
import type { TabId } from '../../types'
import { useApp } from '../../store/AppContext'
import { SITE_NAME, SITE_SHORT } from '../../constants'

const NAV: Array<{ id: TabId; label: string; icon: typeof Grid3X3 }> = [
  { id: 'grid', label: 'Live Monitoring', icon: Grid3X3 },
  { id: 'map', label: 'Society GIS Map', icon: MapIcon },
  { id: 'forensics', label: 'Forensic Inspection', icon: Video },
  { id: 'trajectory', label: 'Trajectory Search', icon: Route },
  { id: 'incidents', label: 'Incident Alert Log', icon: FileText },
]

export default function Sidebar() {
  const { tab, setTab, incidentRows, canEditSettings, setSettingsOpen, setModelDrawerOpen, canAssignModels } = useApp()

  const highCount = incidentRows.filter((r) => r.severity === 'high').length

  return (
    <aside className="hidden w-60 shrink-0 flex-col border-r border-edge bg-surface/60 backdrop-blur md:flex">
      {/* Brand */}
      <div className="flex items-center gap-3 border-b border-edge px-4 py-4">
        <div className="relative grid h-10 w-10 place-items-center rounded-lg border border-accent/40 bg-base shadow-glow-cyan">
          <ShieldAlert size={20} className="text-accent" />
          <span className="absolute -right-1 -top-1 h-2.5 w-2.5 animate-live-blink rounded-full bg-red-500" />
        </div>
        <div className="min-w-0">
          <div className="truncate text-[13px] font-extrabold tracking-tight text-slate-100">
            SAFE CITY <span className="text-accent">C2</span>
          </div>
          <div className="truncate font-mono text-[9.5px] leading-tight text-slate-500">{SITE_SHORT}</div>
        </div>
      </div>

      {/* Nav */}
      <nav className="flex-1 space-y-1 overflow-y-auto px-3 py-4">
        {NAV.map((item) => {
          const Icon = item.icon
          const active = tab === item.id
          return (
            <button
              key={item.id}
              onClick={() => setTab(item.id)}
              className={`group relative flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-left text-[13px] font-medium transition ${
                active ? 'bg-accent/10 text-accent' : 'text-slate-400 hover:bg-white/5 hover:text-slate-200'
              }`}
            >
              {active && <span className="absolute left-0 top-1/2 h-6 w-0.5 -translate-y-1/2 rounded-full bg-accent shadow-glow-cyan" />}
              <Icon size={16} className={active ? 'text-accent' : 'text-slate-500 group-hover:text-slate-300'} />
              <span className="flex-1">{item.label}</span>
              {item.id === 'incidents' && highCount > 0 && (
                <span className="rounded-md border border-danger/40 bg-danger/15 px-1.5 py-0.5 font-mono text-[10px] font-bold text-red-400">
                  {highCount}
                </span>
              )}
            </button>
          )
        })}
      </nav>

      {/* Stats */}
      <div className="border-t border-edge px-4 py-3">
        <div className="mb-2 flex items-center gap-2 font-mono text-[10px] tracking-widest text-slate-500">
          <Activity size={12} className="text-accent" /> SYSTEM HEALTH
        </div>
        <div className="space-y-1.5">
          {[
            { label: 'CAMERAS ONLINE', value: '8/8', color: 'text-emerald-400' },
            { label: 'AI MODELS ARMED', value: '7', color: 'text-cyan-300' },
            { label: 'EVENTS LOGGED', value: String(incidentRows.length), color: highCount ? 'text-red-400' : 'text-slate-300' },
          ].map((row) => (
            <div key={row.label} className="flex items-center justify-between font-mono text-[11px]">
              <span className="text-slate-500">{row.label}</span>
              <span className={`font-bold ${row.color}`}>{row.value}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Admin actions */}
      {(canEditSettings || canAssignModels) && (
        <div className="space-y-1 border-t border-edge px-3 py-3">
          {canEditSettings && (
            <button
              onClick={() => setSettingsOpen(true)}
              className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-left text-[12.5px] font-medium text-slate-300 transition hover:bg-white/5 hover:text-slate-100"
            >
              <Settings size={15} className="text-slate-500" /> Priority Manager
            </button>
          )}
          {canAssignModels && (
            <button
              onClick={() => setModelDrawerOpen(true)}
              className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-left text-[12.5px] font-medium text-slate-300 transition hover:bg-white/5 hover:text-slate-100"
            >
              <SlidersHorizontal size={15} className="text-slate-500" /> Model Assignment
            </button>
          )}
        </div>
      )}

      <div className="border-t border-edge px-4 py-3">
        <div className="font-mono text-[9.5px] leading-relaxed text-slate-600">
          {SITE_NAME}
          <br />
          VMS v4.2.0 · iVMS-STYLE · PK-STD
        </div>
      </div>
    </aside>
  )
}
