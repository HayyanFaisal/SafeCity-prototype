import { useMemo, useRef, useState } from 'react'
import { ChevronDown, Crown, Lock, Play, Pause, Loader2, Radio, Settings, SlidersHorizontal, UserCheck, Volume2, VolumeX, ShieldCheck, Bell } from 'lucide-react'
import { ROLE_LABELS, SITE_NAME } from '../../constants'
import { useApp } from '../../store/AppContext'
import type { Role } from '../../types'

const ROLE_ICON: Record<Role, typeof Crown> = {
  'super-admin': Crown,
  operator: UserCheck,
  guard: ShieldCheck,
}

export default function TopBar() {
  const {
    role, setRole, isMasterPlaying, setMasterPlaying, bootDemo, demoBusy,
    canEditSettings, setSettingsOpen, canAssignModels, setModelDrawerOpen,
    soundEnabled, setSoundEnabled, incidentRows,
  } = useApp()

  const [roleOpen, setRoleOpen] = useState(false)
  const roleRef = useRef<HTMLDivElement>(null)
  const RoleIcon = ROLE_ICON[role]

  const highCount = incidentRows.filter((r) => r.severity === 'high').length

  const permissions = useMemo(() => {
    switch (role) {
      case 'super-admin':
        return 'Full access · Upload maps · Configure pins · Manage feeds · Assign AI models · Adjust priorities'
      case 'operator':
        return 'Live grid · Map inspection · Forensic queries · Model toggles'
      default:
        return 'View-only grid & map · Receives alert popups'
    }
  }, [role])

  return (
    <header className="relative z-30 flex h-14 shrink-0 items-center gap-3 border-b border-edge bg-surface/80 px-4 backdrop-blur">
      {/* Presence */}
      <div className="flex min-w-0 items-center gap-2">
        <span className="relative flex h-2.5 w-2.5">
          <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-60" />
          <span className="relative inline-flex h-2.5 w-2.5 rounded-full bg-emerald-400" />
        </span>
        <div className="truncate">
          <span className="text-[13px] font-bold tracking-tight text-slate-100">{SITE_NAME}</span>
          <span className="ml-2 hidden font-mono text-[10px] tracking-widest text-slate-500 lg:inline">PK-AH-07 · 24/7</span>
        </div>
      </div>

      {/* Role switcher */}
      <div className="relative ml-auto flex items-center" ref={roleRef}>
        {highCount > 0 && (
          <span className="mr-2 hidden items-center gap-1 rounded-full border border-danger/50 bg-danger/15 px-2 py-0.5 font-mono text-[10px] font-bold text-red-400 sm:flex">
            <Bell size={11} className="animate-live-blink" /> {highCount} ACTIVE
          </span>
        )}
        <button
          onClick={() => setRoleOpen((v) => !v)}
          className="flex items-center gap-2 rounded-lg border border-edge bg-base px-3 py-1.5 text-left transition hover:border-accent/40"
        >
          <RoleIcon size={14} className="text-accent" />
          <div className="hidden sm:block">
            <div className="text-[12px] font-semibold leading-tight text-slate-100">{ROLE_LABELS[role]}</div>
            <div className="font-mono text-[9.5px] leading-tight text-slate-500">{permissions}</div>
          </div>
          <ChevronDown size={14} className="text-slate-500" />
        </button>

        {roleOpen && (
          <>
            <div className="fixed inset-0 z-40" onClick={() => setRoleOpen(false)} />
            <div className="absolute right-0 top-full z-50 mt-2 w-72 overflow-hidden rounded-xl border border-edge bg-surface shadow-panel">
              <div className="border-b border-edge px-3 py-2 font-mono text-[10px] tracking-widest text-slate-500">
                SESSION ROLE — RBAC PERMISSIONS
              </div>
              {(['super-admin', 'operator', 'guard'] as Role[]).map((r) => {
                const Icon = ROLE_ICON[r]
                const selected = r === role
                return (
                  <button
                    key={r}
                    onClick={() => {
                      setRole(r)
                      setRoleOpen(false)
                    }}
                    className={`flex w-full items-start gap-3 px-4 py-3 text-left transition hover:bg-white/5 ${
                      selected ? 'bg-accent/10' : ''
                    }`}
                  >
                    <Icon size={16} className={selected ? 'text-accent' : 'text-slate-500'} />
                    <span className="flex-1">
                      <span className={`block text-[13px] font-semibold ${selected ? 'text-accent' : 'text-slate-200'}`}>
                        {ROLE_LABELS[r]}
                      </span>
                      <span className="mt-0.5 block font-mono text-[10px] leading-snug text-slate-500">{permissionsFor(r)}</span>
                    </span>
                    {selected && <Lock size={14} className="text-accent" />}
                  </button>
                )
              })}
              <div className="border-t border-edge px-3 py-2 text-center font-mono text-[9.5px] text-slate-600">
                LIVE ROLE SWITCH FOR FYP EVALUATION
              </div>
            </div>
          </>
        )}
      </div>

      {/* Action cluster */}
      <div className="flex items-center gap-2">
        <button
          onClick={() => void bootDemo()}
          disabled={demoBusy}
          className="flex items-center gap-1.5 rounded-lg border border-accent/50 bg-accent/15 px-3 py-1.5 text-[12px] font-semibold text-cyan-300 transition hover:bg-accent/25 disabled:opacity-50"
        >
          {demoBusy ? <Loader2 size={14} className="animate-spin" /> : <Play size={14} />}
          {demoBusy ? 'SYNTH:' : 'BOOT DEMO'}
        </button>
        <button
          onClick={() => setMasterPlaying(!isMasterPlaying)}
          className={`flex items-center gap-1.5 rounded-lg border px-3 py-1.5 text-[12px] font-semibold transition ${
            isMasterPlaying
              ? 'border-warn/50 bg-warn/15 text-amber-300 hover:bg-warn/25'
              : 'border-edge bg-base text-slate-300 hover:border-accent/40'
          }`}
        >
          {isMasterPlaying ? <Pause size={14} /> : <Play size={14} />}
          {isMasterPlaying ? 'PAUSE ALL' : 'PLAY ALL'}
        </button>
        <button
          onClick={() => setSoundEnabled(!soundEnabled)}
          aria-label="Toggle alert sound"
          className="rounded-lg border border-edge bg-base p-2 text-slate-400 transition hover:border-accent/40 hover:text-slate-200"
        >
          {soundEnabled ? <Volume2 size={14} /> : <VolumeX size={14} />}
        </button>
        {canEditSettings && (
          <button
            onClick={() => setSettingsOpen(true)}
            className="hidden rounded-lg border border-edge bg-base p-2 text-slate-400 transition hover:border-accent/40 hover:text-slate-200 sm:block"
            aria-label="Priority manager"
          >
            <Settings size={14} />
          </button>
        )}
        {canAssignModels && (
          <button
            onClick={() => setModelDrawerOpen(true)}
            className="hidden rounded-lg border border-edge bg-base p-2 text-slate-400 transition hover:border-accent/40 hover:text-slate-200 sm:block"
            aria-label="Model assignment"
          >
            <SlidersHorizontal size={14} />
          </button>
        )}
        <div className="ml-1 flex items-center gap-1.5 rounded-lg border border-emerald-500/30 bg-emerald-500/10 px-2 py-1">
          <Radio size={12} className="animate-live-blink text-emerald-400" />
          <span className="font-mono text-[10px] font-bold tracking-widest text-emerald-400">LIVE</span>
        </div>
      </div>
    </header>
  )
}

function permissionsFor(role: Role): string {
  switch (role) {
    case 'super-admin':
      return 'Upload maps · place/configure/link pins · assign AI models · manage feeds · adjust alert priorities'
    case 'operator':
      return 'View live grid · inspect map pins · forensic trajectory queries · toggle model views'
    default:
      return 'Live grid & map viewing · receives alert popups · no editing capabilities'
  }
}
