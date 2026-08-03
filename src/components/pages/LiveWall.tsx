import { useCallback, useState } from 'react'
import {
  Play,
  Pause,
  Zap,
  Grid3X3,
  Grid2X2,
  Maximize2,
  ScanLine,
} from 'lucide-react'
import { useApp } from '../../store/AppContext'
import type { LayoutId } from '../../types'
import ModelBadge from '../ui/ModelBadge'
import CriticalAlert from '../alerts/CriticalAlert'
import ToastStack from '../alerts/ToastStack'
import ForensicPanel from '../forensics/ForensicPanel'

/**
 * Layout presets.
 *
 * Slot-fill rule (documented per rearchitecting prompt):
 * "Keep current primary + fill remaining slots by camera ID order."
 * `order` is the canonical display sequence (order[0] = primary). Switching
 * presets slices `order` to the preset's tile count, so playback of streams
 * that stay visible is never interrupted — the same camera ids keep their
 * same keyed <video> elements, they only change CSS grid placement.
 *
 * focus  : 1 Main (60-70%) + right column of 3 + bottom row of 3  = 7 tiles
 * grid2x2: 2×2 = 4 tiles
 * grid3x3: 3×3 = 9 tiles
 * focus5 : 1 Main + 4 split = 5 tiles
 * full   : Single Main fullscreen = 1 tile
 */
const LAYOUTS: Record<
  LayoutId,
  {
    label: string
    count: number
    /** tailwind classes applied to the grid container */
    container: string
    /** size classes for the primary tile */
    main: string
    /** size classes for secondary tiles */
    sub: string
  }
> = {
  focus: {
    label: '1+6 Focus',
    count: 7,
    container: 'grid-cols-4 grid-rows-3',
    main: 'col-span-2 row-span-3',
    sub: 'col-span-1 row-span-1',
  },
  grid2x2: {
    label: '2×2 Grid',
    count: 4,
    container: 'grid-cols-2 grid-rows-2',
    main: 'col-span-1 row-span-1',
    sub: 'col-span-1 row-span-1',
  },
  grid3x3: {
    label: '3×3 Grid',
    count: 9,
    container: 'grid-cols-3 grid-rows-3',
    main: 'col-span-1 row-span-1',
    sub: 'col-span-1 row-span-1',
  },
  focus5: {
    label: '1+4 Split',
    count: 5,
    container: 'grid-cols-3 grid-rows-2',
    main: 'col-span-2 row-span-2',
    sub: 'col-span-1 row-span-1',
  },
  full: {
    label: 'Fullscreen',
    count: 1,
    container: 'grid-cols-1 grid-rows-1',
    main: 'col-span-1 row-span-1',
    sub: 'col-span-1 row-span-1',
  },
}

export default function LiveWall() {
  const {
    cameras,
    order,
    focusCamera,
    swapTiles,
    layout,
    setLayout,
    playing,
    setPlaying,
    speed,
    setSpeed,
    openForensic,
    forensicCameraId,
  } = useApp()

  const [dragIndex, setDragIndex] = useState<number | null>(null)
  const [dropTarget, setDropTarget] = useState<number | null>(null)
  const [fullscreenId, setFullscreenId] = useState<string | null>(null)

  const layoutDef = LAYOUTS[layout]
  const visibleIds = order.slice(0, layoutDef.count)

  const getCam = useCallback((id: string) => cameras.find((c) => c.id === id), [cameras])

  /**
   * Drag-and-drop swap (in addition to click-to-focus).
   * HTML5 DnD: dragstart records the source slot index, dragover marks the
   * hovered target, drop calls swapTiles(from, to). Videos are keyed by
   * camera id so React moves them between slots without remounting.
   */
  const onDrop = (toIndex: number) => {
    if (dragIndex !== null && dragIndex !== toIndex) {
      swapTiles(dragIndex, toIndex)
    }
    setDragIndex(null)
    setDropTarget(null)
  }

  const exitFullscreen = () => {
    if (document.fullscreenElement) void document.exitFullscreen()
    setFullscreenId(null)
  }

  const toggleFullscreen = (camId: string) => {
    if (fullscreenId === camId) {
      exitFullscreen()
      return
    }
    setFullscreenId(camId)
    // fallback: if the browser blocks fullscreen, we simply show a large
    // focused tile instead — never crash.
  }

  return (
    <main className="relative flex min-h-0 flex-1 flex-col gap-3 overflow-hidden bg-base p-4">
      {/* Toolbar */}
      <div className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-edge/50 bg-surface2/60 px-4 py-3 backdrop-blur-sm">
        <div className="flex items-center gap-2">
          <button
            onClick={() => setPlaying(!playing)}
            className="btn-icon"
            title={playing ? 'Pause all' : 'Play all'}
          >
            {playing ? <Pause className="h-5 w-5" /> : <Play className="h-5 w-5" />}
          </button>

          <div className="h-6 w-px bg-edge2/50" />

          <div className="flex items-center gap-2">
            <span className="text-xs text-slate-400 font-semibold">SPEED:</span>
            <select
              value={speed}
              onChange={(e) => setSpeed(parseFloat(e.target.value))}
              className="btn text-xs"
              title="Playback speed (primary + forensic)"
            >
              <option value={1}>1×</option>
              <option value={2}>2×</option>
            </select>
          </div>

          <div className="h-6 w-px bg-edge2/50" />
          <span className="hidden md:inline-flex items-center gap-1.5 rounded border border-cyan/40 bg-cyan/10 px-2 py-0.5 text-[10px] font-bold text-cyan">
            <ScanLine className="h-3 w-3" />
            DEMO MODE — streams + alerts are simulated
          </span>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {(Object.keys(LAYOUTS) as LayoutId[]).map((id) => {
            const def = LAYOUTS[id]
            const active = layout === id
            return (
              <button
                key={id}
                onClick={() => setLayout(id)}
                className={`btn text-xs ${active ? 'border-gold/60 bg-gold/15 text-gold-soft' : ''}`}
                title={def.label}
              >
                {id === 'focus' && <Zap className="h-3.5 w-3.5" />}
                {id === 'grid2x2' && <Grid2X2 className="h-3.5 w-3.5" />}
                {id === 'grid3x3' && <Grid3X3 className="h-3.5 w-3.5" />}
                {def.label}
              </button>
            )
          })}
        </div>
      </div>

      {/* Grid */}
      <div
        className={`grid min-h-0 flex-1 gap-3 ${layoutDef.container}`}
        style={{ gridTemplateColumns: undefined }}
      >
        {visibleIds.map((camId, idx) => {
          const cam = getCam(camId)
          if (!cam) return null

          const isMain = layout !== 'grid2x2' && layout !== 'grid3x3' && idx === 0
          const isDragSource = dragIndex === idx
          const isDropTarget = dropTarget === idx && dragIndex !== null && dragIndex !== idx

          return (
            <div
              key={camId}
              data-slot={idx}
              draggable
              onDragStart={(e) => {
                setDragIndex(idx)
                e.dataTransfer.effectAllowed = 'move'
              }}
              onDragOver={(e) => {
                e.preventDefault()
                setDropTarget(idx)
              }}
              onDragLeave={() => setDropTarget((cur) => (cur === idx ? null : cur))}
              onDrop={(e) => {
                e.preventDefault()
                onDrop(idx)
              }}
              onDragEnd={() => {
                setDragIndex(null)
                setDropTarget(null)
              }}
              onClick={() => focusCamera(camId)}
              className={`group relative flex flex-col overflow-hidden rounded-lg border bg-base shadow-lg transition ${
                isMain ? layoutDef.main : layoutDef.sub
              } ${
                isDragSource
                  ? 'border-cyan/70 opacity-60'
                  : isDropTarget
                    ? 'border-gold/70 ring-2 ring-gold/40'
                    : 'border-edge/60 hover:border-gold/50'
              } cursor-pointer`}
              title="Click to focus · Drag to another tile to swap"
            >
              {/* Video — keyed by camera id so swaps never remount/restart it */}
              <video
                key={`video-${camId}`}
                data-cam={camId}
                src={cam.videoUrl}
                className="pointer-events-none h-full w-full bg-black object-cover"
                autoPlay
                loop
                muted
                playsInline
                ref={(el) => {
                  if (el) {
                    el.playbackRate = speed
                    if (playing && el.paused) void el.play().catch(() => {})
                  }
                }}
              />

              {/* Scanlines overlay */}
              <div className="scanlines pointer-events-none absolute inset-0" />

              {/* HUD */}
              <div className="pointer-events-none absolute inset-0 flex flex-col justify-between p-2">
                <div className="flex items-start justify-between gap-2">
                  <div className="flex flex-col gap-1">
                    <div className="hud-label text-xs font-bold text-gold-soft drop-shadow-lg">
                      CAM {cam.index}
                    </div>
                    <div className="text-[10px] text-slate-300 drop-shadow-md">{cam.zone}</div>
                  </div>
                  <div className="flex items-center gap-0.5 rounded bg-danger/80 px-2 py-0.5 animate-live-blink">
                    <div className="h-1.5 w-1.5 rounded-full bg-white" />
                    <span className="text-[10px] font-bold text-white">REC</span>
                  </div>
                </div>

                {/* Active AI model badges — one glowing tag per active model */}
                <div className="flex flex-col items-end gap-1">
                  {isMain && (
                    <div className="mb-1 flex items-center gap-1">
                      <button
                        onClick={(e) => {
                          e.stopPropagation()
                          setPlaying(!playing)
                        }}
                        className="rounded border border-edge2/70 bg-surface/80 p-1 text-slate-200 hover:border-cyan/60 hover:text-cyan"
                        title={playing ? 'Pause stream' : 'Play stream'}
                      >
                        {playing ? <Pause className="h-3.5 w-3.5" /> : <Play className="h-3.5 w-3.5" />}
                      </button>
                      <button
                        onClick={(e) => {
                          e.stopPropagation()
                          setSpeed(speed === 1 ? 2 : 1)
                        }}
                        className={`rounded border px-1.5 py-0.5 text-[10px] font-bold ${
                          speed === 2
                            ? 'border-cyan/60 bg-cyan/15 text-cyan'
                            : 'border-edge2/70 bg-surface/80 text-slate-200 hover:border-cyan/60'
                        }`}
                        title="Toggle 1× / 2× speed"
                      >
                        {speed}×
                      </button>
                      <button
                        onClick={(e) => {
                          e.stopPropagation()
                          toggleFullscreen(camId)
                        }}
                        className="rounded border border-edge2/70 bg-surface/80 p-1 text-slate-200 hover:border-cyan/60 hover:text-cyan"
                        title="Fullscreen"
                      >
                        <Maximize2 className="h-3.5 w-3.5" />
                      </button>
                      <button
                        onClick={(e) => {
                          e.stopPropagation()
                          openForensic(camId)
                        }}
                        className="rounded border border-gold/50 bg-gold/10 p-1 text-gold-soft hover:bg-gold/20"
                        title="Open forensic playback"
                      >
                        <ScanLine className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  )}
                  {cam.models.length > 0 && (
                    <div className="flex flex-wrap justify-end gap-1">
                      {cam.models.map((mid) => (
                        <ModelBadge key={mid} id={mid} size="xs" />
                      ))}
                    </div>
                  )}
                </div>
              </div>

              {/* Hover hint */}
              <div className="pointer-events-none absolute inset-0 hidden items-center justify-center bg-black/40 backdrop-blur-sm group-hover:flex">
                <span className="rounded bg-surface/80 px-2 py-1 text-[10px] font-semibold text-gold-soft">
                  Click to focus · Drag to swap
                </span>
              </div>

              {isDropTarget && (
                <div className="pointer-events-none absolute inset-0 border-2 border-dashed border-gold/70 bg-gold/5" />
              )}
            </div>
          )
        })}
      </div>

      {/* Forensic inspection overlay */}
      {forensicCameraId && (
        <div className="fixed inset-0 z-40 flex items-center justify-center bg-black/80 p-4 backdrop-blur-sm">
          <ForensicPanel cameraId={forensicCameraId} onClose={() => exitFullscreen()} />
        </div>
      )}

      {/* Alert overlays */}
      <CriticalAlert />
      <ToastStack />
    </main>
  )
}
