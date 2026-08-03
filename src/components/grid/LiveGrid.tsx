import type { ComponentType } from 'react'
import { Grid3X3, LayoutGrid, Maximize2, MonitorStop } from 'lucide-react'
import type { GridLayoutId } from '../../types'
import { useApp } from '../../store/AppContext'
import VideoTile from './VideoTile'

const LAYOUTS: Array<{ id: GridLayoutId; label: string; icon: ComponentType<{ size?: number | string; className?: string }> }> = [
  { id: 'hikvision', label: '1+5 Hikvision', icon: MonitorStop },
  { id: 'grid2x2', label: '2×2 Grid', icon: LayoutGrid },
  { id: 'grid3x3', label: '3×3 Grid', icon: Grid3X3 },
  { id: 'single', label: 'Single Main', icon: Maximize2 },
]

export default function LiveGrid() {
  const { layout, setLayout, streams, getCamera } = useApp()

  const cameraForSlot = (slot: number) => {
    const stream = streams.find((s) => s.slot === slot)
    return stream ? getCamera(stream.cameraId) : null
  }

  const render = (key: number) => <VideoTile key={key} slot={key} camera={cameraForSlot(key)} />

  return (
    <div className="flex min-h-0 flex-1 flex-col gap-3 p-3">
      {/* Toolbar */}
      <div className="flex flex-wrap items-center gap-2 rounded-xl border border-edge bg-surface/70 p-2 backdrop-blur">
        <div className="px-2 font-mono text-[10px] tracking-widest text-slate-500">GRID LAYOUT</div>
        <div className="flex flex-wrap gap-1.5">
          {LAYOUTS.map((l) => {
            const Icon = l.icon
            const active = layout === l.id
            return (
              <button
                key={l.id}
                onClick={() => setLayout(l.id)}
                className={`flex items-center gap-1.5 rounded-lg border px-2.5 py-1.5 text-[11.5px] font-semibold transition ${
                  active
                    ? 'border-accent/60 bg-accent/15 text-cyan-300'
                    : 'border-edge bg-base text-slate-400 hover:border-accent/40 hover:text-slate-200'
                }`}
              >
                <Icon size={13} />
                {l.label}
              </button>
            )
          })}
        </div>
        <div className="ml-auto hidden items-center gap-1.5 font-mono text-[10px] text-slate-500 md:flex">
          <span className="text-cyan-400">DRAG</span> tiles to swap · <span className="text-cyan-400">CLICK</span> tile for forensics
        </div>
      </div>

      {/* Grid area */}
      <div className="min-h-0 flex-1">
        {layout === 'hikvision' && (
          <div className="grid h-full grid-cols-5 grid-rows-4 gap-2">
            {render(0)}
            {render(1)}
            {render(2)}
            {render(3)}
            {render(4)}
            {render(5)}
          </div>
        )}

        {layout === 'grid2x2' && (
          <div className="grid h-full grid-cols-2 grid-rows-2 gap-2">
            {render(0)}
            {render(1)}
            {render(2)}
            {render(3)}
          </div>
        )}

        {layout === 'grid3x3' && (
          <div className="grid h-full grid-cols-3 grid-rows-3 gap-2">
            {render(0)}
            {render(1)}
            {render(2)}
            {render(3)}
            {render(4)}
            {render(5)}
            {render(6)}
            {render(7)}
            {render(8)}
          </div>
        )}

        {layout === 'single' && (
          <div className="grid h-full grid-cols-1 grid-rows-1">
            {render(0)}
          </div>
        )}
      </div>
    </div>
  )
}
