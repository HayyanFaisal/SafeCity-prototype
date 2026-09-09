import {
  LayoutDashboard,
  Monitor,
  MapPin,
  Search,
  Route,
  AlertCircle,
  Camera as CameraIcon,
  Gauge,
  ScanLine,
} from 'lucide-react'
import { useApp } from '../store/AppContext'
import type { TabId } from '../types'

interface NavItem {
  id: TabId
  label: string
  icon: any
  desc: string
}

const TABS: NavItem[] = [
  { id: 'overview', label: 'Main Safety Overview', icon: LayoutDashboard, desc: 'Command Center & KPIs' },
  { id: 'models', label: 'Vehicle Speed Radar', icon: Gauge, desc: 'Live Radar & Speed Limit Slider' },
  { id: 'models', label: 'Number Plate Scanner', icon: ScanLine, desc: 'ANPR & Fast OCR' },
  { id: 'wall', label: 'Live Wall Surveillance', icon: Monitor, desc: 'Multi-Camera Stream Grid' },
  { id: 'map', label: 'GIS Tactical Map', icon: MapPin, desc: 'Society Nodes & Coordinates' },
  { id: 'forensics', label: 'Forensics & Evidence', icon: Search, desc: 'Video Playback Inspection' },
  { id: 'trajectory', label: 'Re-ID Trajectory Search', icon: Route, desc: 'Multi-Camera Tracking' },
  { id: 'incidents', label: 'Incident Log & Alerts', icon: AlertCircle, desc: 'E-Challans & SOS Reports' },
  { id: 'cameras', label: 'Camera Node Feeds', icon: CameraIcon, desc: 'RTSP Feeds & Settings' },
]

export default function Sidebar() {
  const { tab, setTab, incidents } = useApp()
  const criticalCount = incidents.filter((i) => i.severity === 'high' && !i.acknowledged).length

  return (
    <aside className="flex w-64 flex-col px-3 py-4 select-none shrink-0 transition-all border-r border-edge">
      {/* Title */}
      <div className="text-[11px] font-bold tracking-wider uppercase text-slate-500 px-3 pb-3">
        SAFETY MONITORING CAMERAS
      </div>

      {/* Nav List */}
      <nav className="space-y-2 flex-1 overflow-y-auto pr-1">
        {TABS.map(({ id, label, icon: Icon, desc }, idx) => {
          const isUniqueTab = idx === 0 || idx === 1 || idx >= 3
          if (!isUniqueTab) return null

          const active = tab === id && (idx === 1 ? true : tab === id)
          const hasCritical = id === 'incidents' && criticalCount > 0

          return (
            <button
              key={`${id}-${idx}`}
              onClick={() => setTab(id)}
              className={`w-full flex items-center justify-between gap-3 px-3.5 py-3 rounded-2xl text-left transition-all ${
                active
                  ? 'neo-inset-sm font-bold text-blue-600 dark:text-cyan-400 border border-blue-400/40 dark:border-cyan-500/40'
                  : 'neo-btn text-slate-600 dark:text-slate-300 hover:text-blue-600 dark:hover:text-white'
              }`}
              title={desc}
            >
              <div className="flex items-center gap-3 min-w-0">
                <Icon
                  className={`h-4.5 w-4.5 flex-shrink-0 ${
                    active ? 'text-blue-600 dark:text-cyan-400' : 'text-slate-400'
                  }`}
                />
                <div className="truncate min-w-0">
                  <div className="text-xs font-semibold leading-tight truncate font-sans">
                    {label}
                  </div>
                  <div className="text-[10px] text-slate-500 truncate leading-none mt-0.5">
                    {desc}
                  </div>
                </div>
              </div>

              {hasCritical && (
                <span className="inline-flex items-center justify-center rounded-full bg-rose-500 px-2 py-0.5 text-[10px] font-bold text-white shadow-sm animate-pulse">
                  {criticalCount}
                </span>
              )}
            </button>
          )
        })}
      </nav>

      {/* Footer: Officer Status matching Screenshot */}
      <div className="pt-3 border-t border-edge">
        <div className="neo-card-sm p-3 flex items-center gap-3">
          <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-blue-500/10 text-blue-600 dark:text-blue-400 font-bold text-xs font-mono">
            OP
          </div>
          <div className="min-w-0 text-xs">
            <div className="font-bold text-slate-800 dark:text-slate-200 truncate">
              Traffic Enforcement
            </div>
            <div className="text-[10px] text-emerald-600 dark:text-emerald-400 font-semibold flex items-center gap-1">
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 inline-block"></span>
              Status: Authorized
            </div>
          </div>
        </div>
      </div>
    </aside>
  )
}
