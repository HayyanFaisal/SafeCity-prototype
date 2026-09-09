import {
  Volume2,
  VolumeX,
  RefreshCw,
  Sun,
  Moon,
  Cpu,
  Shield,
  Menu,
  ChevronRight,
  Activity,
} from 'lucide-react'
import { useApp } from '../store/AppContext'
import { SITE_TAGLINE, ROLE_LABELS } from '../constants'
import { fmtClock } from '../lib/format'

export default function TopBar() {
  const {
    role,
    setRole,
    soundEnabled,
    setSoundEnabled,
    resetSimulation,
    theme,
    toggleTheme,
    hardware,
    tab,
  } = useApp()

  const doReset = () => {
    if (
      window.confirm(
        'Reset Simulation? This clears the fired-events set and incident log so the full sequence can replay.',
      )
    ) {
      resetSimulation()
    }
  }

  // Format date like: "Wed, Aug 19"
  const dateFormatted = new Date().toLocaleDateString('en-US', {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
  })

  // Tab Breadcrumb Label
  const tabNames: Record<string, string> = {
    overview: 'Main Safety Overview',
    models: 'Vehicle Speed Radar & AI Models',
    wall: 'Live Multi-Camera Wall',
    map: 'GIS Tactical Map',
    forensics: 'Forensics & Video Playback',
    trajectory: 'Re-ID Trajectory Search',
    incidents: 'Incident Log & E-Challans',
    cameras: 'Camera Node Feeds',
  }

  return (
    <header className="flex items-center justify-between px-4 sm:px-6 py-2.5 z-30 transition-all select-none border-b border-edge">
      {/* Left: Branding & Breadcrumbs */}
      <div className="flex items-center gap-3.5">
        {/* Neomorphic Hamburger button */}
        <button
          className="neo-btn p-2 text-slate-400 hover:text-blue-500 rounded-xl"
          title="Menu"
        >
          <Menu className="h-4.5 w-4.5" />
        </button>

        {/* Shield Crest */}
        <div className="flex items-center gap-2.5">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-blue-600/15 border border-blue-500/30 text-blue-500 shadow-sm">
            <Shield className="h-5 w-5 fill-blue-500/20 stroke-blue-600 dark:stroke-blue-400" />
          </div>
          <div>
            <div className="text-base font-extrabold tracking-tight leading-none text-slate-900 dark:text-white font-sans">
              Sahil-e-Baseera
            </div>
            <div className="text-[10px] font-semibold tracking-wider text-slate-500 leading-none mt-1 uppercase">
              {SITE_TAGLINE}
            </div>
          </div>
        </div>

        {/* Breadcrumb path */}
        <div className="hidden md:flex items-center gap-1.5 ml-4 pl-4 border-l border-edge text-xs">
          <span className="text-slate-400 font-medium">Home</span>
          <ChevronRight className="h-3.5 w-3.5 text-slate-400" />
          <span className="font-bold text-blue-600 dark:text-blue-400">
            {tabNames[tab] || 'Command Center'}
          </span>
        </div>
      </div>

      {/* Center: Live Hardware Telemetry Jitter Strip */}
      <div className="hidden xl:flex items-center gap-2.5 font-mono text-xs">
        {/* CPU */}
        <div className="neo-card-sm px-2.5 py-1 flex items-center gap-2" title={hardware.cpu.model}>
          <Cpu className="h-3.5 w-3.5 text-cyan" />
          <span className="text-slate-400">CPU:</span>
          <span className="font-bold text-cyan">{hardware.cpu.percent.toFixed(1)}%</span>
        </div>

        {/* GPU */}
        <div className="neo-card-sm px-2.5 py-1 flex items-center gap-2" title={hardware.gpu.model}>
          <Activity className="h-3.5 w-3.5 text-gold-soft" />
          <span className="text-slate-400">GPU:</span>
          <span className="font-bold text-gold-soft">{hardware.gpu.utilPercent.toFixed(1)}%</span>
          <span className="text-[10px] text-slate-500">({hardware.gpu.tempC}°C)</span>
        </div>

        {/* RAM */}
        <div className="neo-card-sm px-2.5 py-1 flex items-center gap-2">
          <span className="text-slate-400">RAM:</span>
          <span className="font-bold text-emerald-500">
            {hardware.ram.usedGb.toFixed(1)}/{hardware.ram.totalGb}G
          </span>
        </div>

        {/* INFERENCE FPS */}
        <div className="neo-card-sm px-2.5 py-1 flex items-center gap-2">
          <span className="text-slate-400">FPS:</span>
          <span className="font-bold text-sky-500">{hardware.fps.toFixed(1)}</span>
        </div>
      </div>

      {/* Right: Status, Controls, Clock */}
      <div className="flex items-center gap-3">
        {/* Live Indicator pill from screenshot */}
        <div className="hidden sm:flex items-center gap-2 px-3 py-1 rounded-full text-xs font-semibold bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/25">
          <span className="h-2 w-2 rounded-full bg-emerald-500 animate-ping"></span>
          <span>Cameras Live &amp; Active</span>
        </div>

        {/* Role Selector */}
        <select
          value={role}
          onChange={(e) => setRole(e.target.value as any)}
          className="neo-inset-sm text-xs px-2.5 py-1 rounded-lg border border-edge bg-surface2 font-medium text-slate-700 dark:text-slate-300 focus:outline-none"
        >
          {Object.entries(ROLE_LABELS).map(([k, label]) => (
            <option key={k} value={k}>
              {label}
            </option>
          ))}
        </select>

        {/* Reset */}
        <button
          onClick={doReset}
          className="neo-btn p-2 text-slate-400 hover:text-amber-500"
          title="Reset Simulation"
        >
          <RefreshCw className="h-4 w-4" />
        </button>

        {/* Audio Toggle */}
        <button
          onClick={() => setSoundEnabled(!soundEnabled)}
          className="neo-btn p-2 text-slate-400 hover:text-cyan"
          title={soundEnabled ? 'Mute Alert Audio' : 'Unmute Audio'}
        >
          {soundEnabled ? (
            <Volume2 className="h-4 w-4 text-cyan" />
          ) : (
            <VolumeX className="h-4 w-4" />
          )}
        </button>

        {/* Theme Toggle Button (Light/Dark Neomorphism) */}
        <button
          onClick={toggleTheme}
          className="neo-btn p-2 text-slate-700 dark:text-slate-200 hover:text-blue-600"
          title={theme === 'dark' ? 'Switch to Light Neomorphism' : 'Switch to Dark Neomorphism'}
        >
          {theme === 'dark' ? (
            <Sun className="h-4 w-4 text-amber-400" />
          ) : (
            <Moon className="h-4 w-4 text-blue-600" />
          )}
        </button>

        {/* Digital Clock & Date */}
        <div className="text-right leading-none pl-2 border-l border-edge">
          <div className="font-mono text-sm font-bold tracking-tight text-slate-900 dark:text-slate-100">
            {fmtClock(new Date())}
          </div>
          <div className="text-[10px] text-slate-500 font-medium mt-0.5">
            {dateFormatted}
          </div>
        </div>
      </div>
    </header>
  )
}
