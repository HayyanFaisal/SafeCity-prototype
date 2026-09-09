import {
  Volume2,
  VolumeX,
  LogOut,
  RefreshCw,
  MessageCircle,
  Sun,
  Moon,
  Cpu,
  Activity,
} from 'lucide-react'
import { useApp } from '../store/AppContext'
import { SITE_NAME, SITE_SHORT, SITE_TAGLINE, ROLE_LABELS, DUTY_OFFICER } from '../constants'
import { fmtClock } from '../lib/format'
import Crest from './ui/Crest'

export default function TopBar() {
  const {
    now,
    role,
    setRole,
    soundEnabled,
    setSoundEnabled,
    resetSimulation,
    canEdit,
    theme,
    toggleTheme,
    hardware,
  } = useApp()

  const doReset = () => {
    if (
      window.confirm(
        'Reset Simulation? This clears the fired-events set and the incident log so the full event sequence can replay.',
      )
    ) {
      resetSimulation()
    }
  }

  return (
    <header className="flex items-center justify-between border-b border-edge/60 bg-gradient-to-r from-deep via-surface2 to-deep px-4 sm:px-6 py-2.5 shadow-lg select-none z-30 transition-colors">
      {/* Left: Branding */}
      <div className="flex items-center gap-3">
        <Crest size={40} />
        <div className="min-w-0">
          <div className="hud-label text-sm leading-tight text-gold-soft font-bold tracking-wider">
            {SITE_SHORT}
          </div>
          <div className="text-xs text-slate-400 font-medium">{SITE_TAGLINE}</div>
          <div className="text-[10px] text-slate-500 hidden sm:block leading-none mt-0.5">
            {SITE_NAME}
          </div>
        </div>
      </div>

      {/* Center: Live Hardware Telemetry Strip (From FYP-Copy Sentinel) */}
      <div className="hidden lg:flex items-center gap-3">
        {/* CPU */}
        <div
          className="flex items-center gap-2 px-2.5 py-1 rounded-lg border border-edge2/60 bg-surface/60 text-xs font-mono"
          title={hardware.cpu.model}
        >
          <Cpu className="h-3.5 w-3.5 text-cyan" />
          <span className="text-slate-400">CPU:</span>
          <span className="font-bold text-cyan">{hardware.cpu.percent}%</span>
        </div>

        {/* GPU */}
        <div
          className="flex items-center gap-2 px-2.5 py-1 rounded-lg border border-edge2/60 bg-surface/60 text-xs font-mono"
          title={`${hardware.gpu.model} (VRAM: ${hardware.gpu.vramUsedMb}/${hardware.gpu.vramTotalMb} MB)`}
        >
          <Activity className="h-3.5 w-3.5 text-emerald-400" />
          <span className="text-slate-400">RTX 3050:</span>
          <span className="font-bold text-emerald-400">{hardware.gpu.utilPercent}%</span>
          <span className="text-[10px] px-1 py-0.2 rounded bg-emerald-500/20 text-emerald-300 font-semibold border border-emerald-500/30">
            CUDA
          </span>
        </div>

        {/* RAM */}
        <div className="hidden xl:flex items-center gap-2 px-2.5 py-1 rounded-lg border border-edge2/60 bg-surface/60 text-xs font-mono">
          <span className="text-slate-400">RAM:</span>
          <span className="font-bold text-gold-soft">{hardware.ram.usedGb}G</span>
          <span className="text-slate-500">({hardware.ram.percent}%)</span>
        </div>

        {/* FPS */}
        <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg border border-edge2/60 bg-surface/60 text-xs font-mono text-slate-300">
          <span className="w-2 h-2 rounded-full bg-green-400 animate-pulse"></span>
          <span>{hardware.fps} FPS</span>
        </div>

        {/* System Time */}
        <div className="text-center px-3 font-mono">
          <div className="text-[10px] text-slate-400 hud-label leading-none">SYSTEM TIME</div>
          <div className="text-sm font-bold text-gold-soft tracking-wider mt-0.5">
            {fmtClock(new Date(now))}
          </div>
        </div>
      </div>

      {/* Right: Controls & Actions */}
      <div className="flex items-center gap-2 sm:gap-3">
        {/* Dark / Light Mode Switcher (From FYP-Copy) */}
        <button
          onClick={toggleTheme}
          className="btn-icon"
          title={theme === 'dark' ? 'Switch to Light Theme' : 'Switch to Dark Theme'}
        >
          {theme === 'dark' ? (
            <Sun className="h-4.5 w-4.5 text-amber-400 hover:rotate-45 transition-transform" />
          ) : (
            <Moon className="h-4.5 w-4.5 text-indigo-500 hover:-rotate-12 transition-transform" />
          )}
        </button>

        {/* WhatsApp quick link to Muhammad Ammar */}
        <a
          href={`https://wa.me/${DUTY_OFFICER.whatsapp}`}
          target="_blank"
          rel="noopener noreferrer"
          className="btn-icon"
          title={`WhatsApp Officer ${DUTY_OFFICER.name} (${DUTY_OFFICER.phone})`}
        >
          <MessageCircle className="h-4.5 w-4.5 text-green-400" />
        </a>

        {/* Siren sound toggle */}
        <button
          onClick={() => setSoundEnabled(!soundEnabled)}
          className="btn-icon"
          title={soundEnabled ? 'Mute Alert Siren' : 'Enable Alert Siren'}
        >
          {soundEnabled ? (
            <Volume2 className="h-4.5 w-4.5 text-cyan" />
          ) : (
            <VolumeX className="h-4.5 w-4.5 opacity-50 text-slate-400" />
          )}
        </button>

        {/* Reset Simulation button (admin) */}
        {canEdit && (
          <button
            onClick={doReset}
            className="btn gap-1.5 text-xs border-danger/40 text-danger hover:border-danger/70 hover:bg-danger/10"
            title="Clear fired-events + incident log to replay the full event sequence"
          >
            <RefreshCw className="h-3.5 w-3.5" />
            <span className="hidden sm:inline">Reset</span>
          </button>
        )}

        {/* Role switcher */}
        <select
          value={role}
          onChange={(e) => setRole(e.target.value as any)}
          className="btn text-xs cursor-pointer font-sans"
          title="Switch user role"
        >
          {(Object.keys(ROLE_LABELS) as Array<keyof typeof ROLE_LABELS>).map((r) => (
            <option key={r} value={r} className="bg-surface text-slate-200">
              {ROLE_LABELS[r]}
            </option>
          ))}
        </select>

        {/* Logout */}
        <button className="btn-icon" title="Logout session">
          <LogOut className="h-4.5 w-4.5" />
        </button>
      </div>
    </header>
  )
}
