import { Volume2, VolumeX, LogOut, RefreshCw, MessageCircle } from 'lucide-react'
import { useApp } from '../store/AppContext'
import { SITE_NAME, SITE_SHORT, SITE_TAGLINE, ROLE_LABELS, DUTY_OFFICER } from '../constants'
import { fmtClock } from '../lib/format'
import Crest from './ui/Crest'

export default function TopBar() {
  const { now, role, setRole, soundEnabled, setSoundEnabled, resetSimulation, canEdit } = useApp()

  const doReset = () => {
    if (window.confirm('Reset Simulation? This clears the fired-events set and the incident log so the full event sequence can replay.')) {
      resetSimulation()
    }
  }

  return (
    <header className="flex items-center justify-between border-b border-edge/50 bg-gradient-to-r from-deep via-surface2 to-deep px-6 py-4 shadow-lg">
      {/* Left: Branding */}
      <div className="flex items-center gap-4">
        <Crest size={44} />
        <div className="min-w-0">
          <div className="hud-label text-sm leading-tight text-gold-soft">{SITE_SHORT}</div>
          <div className="text-xs text-slate-400">{SITE_TAGLINE}</div>
          <div className="text-[10px] text-slate-500 leading-none">{SITE_NAME}</div>
        </div>
        {/* DEMO MODE tag — mock integrations are clearly labelled */}
        <span className="ml-2 hidden lg:inline-flex items-center gap-1.5 rounded border border-warn/40 bg-warn/10 px-2 py-0.5 text-[10px] font-bold text-warn">
          <span className="h-1.5 w-1.5 rounded-full bg-warn animate-pulse" />
          DEMO MODE
        </span>
      </div>

      {/* Center: Clock + Status */}
      <div className="flex items-center gap-8">
        <div className="text-center">
          <div className="hud-label text-xs text-slate-400 mb-1">SYSTEM TIME</div>
          <div className="font-mono text-lg font-bold text-gold-soft tracking-widest">
            {fmtClock(new Date(now))}
          </div>
        </div>
        <div className="hidden xl:block text-center">
          <div className="hud-label text-[10px] text-slate-500 mb-1">DUTY OFFICER</div>
          <div className="text-xs font-semibold text-cyan">{DUTY_OFFICER.name}</div>
          <div className="text-[10px] font-mono text-slate-500">{DUTY_OFFICER.phone}</div>
        </div>
      </div>

      {/* Right: Controls */}
      <div className="flex items-center gap-4">
        {/* WhatsApp quick link (real deep-link to Muhammad Ammar) */}
        <a
          href={`https://wa.me/${DUTY_OFFICER.whatsapp}`}
          target="_blank"
          rel="noopener noreferrer"
          className="btn-icon"
          title={`WhatsApp ${DUTY_OFFICER.name}`}
        >
          <MessageCircle className="h-5 w-5 text-green-400" />
        </a>

        {/* Sound toggle */}
        <button
          onClick={() => setSoundEnabled(!soundEnabled)}
          className="btn-icon"
          title={soundEnabled ? 'Mute alerts' : 'Enable alerts'}
        >
          {soundEnabled ? <Volume2 className="h-5 w-5" /> : <VolumeX className="h-5 w-5 opacity-50" />}
        </button>

        {/* Reset Simulation (admin) — Fix 1 control */}
        {canEdit && (
          <button
            onClick={doReset}
            className="btn gap-2 text-xs border-danger/40 text-danger hover:border-danger/70"
            title="Clear fired-events + incident log to replay the full event sequence"
          >
            <RefreshCw className="h-4 w-4" />
            Reset Simulation
          </button>
        )}

        {/* Role switcher */}
        <select
          value={role}
          onChange={(e) => setRole(e.target.value as any)}
          className="btn text-xs"
          title="Switch user role (admin has full edit access)"
        >
          {(Object.keys(ROLE_LABELS) as Array<keyof typeof ROLE_LABELS>).map((r) => (
            <option key={r} value={r}>
              {ROLE_LABELS[r]}
            </option>
          ))}
        </select>

        {/* Logout (placeholder) */}
        <button className="btn-icon" title="Logout (placeholder)">
          <LogOut className="h-5 w-5" />
        </button>
      </div>
    </header>
  )
}
