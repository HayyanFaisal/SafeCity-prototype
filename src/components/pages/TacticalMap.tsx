import { useCallback, useEffect, useRef, useState } from 'react'
import { Edit3, Upload, MapPin, X, Check, Trash2, ScanLine, CheckSquare, Square } from 'lucide-react'
import { useApp } from '../../store/AppContext'
import { MAP_ZONES, CAMERA_EDGES, AI_MODELS } from '../../constants'
import type { Camera } from '../../types'
import { loadMapImage, saveMapImage, saveCameraPins } from '../../lib/storage'

interface EditingPin {
  cam: Camera
}

export default function TacticalMap() {
  const {
    cameras,
    now,
    moveCamera,
    updateCameraDetails,
    setCameraModels,
    openForensic,
    setTab,
    canEdit,
    incidents,
    setCameraVideo,
  } = useApp()

  const [editMode, setEditMode] = useState(false)
  const [mapImage, setMapImage] = useState<string | null>(() => loadMapImage())
  const [editingPin, setEditingPin] = useState<EditingPin | null>(null)
  const [hoverCam, setHoverCam] = useState<string | null>(null)

  // draft fields for the config modal
  const [draftName, setDraftName] = useState('')
  const [draftIp, setDraftIp] = useState('')
  const [draftModels, setDraftModels] = useState<string[]>([])
  const [draftVideoUrl, setDraftVideoUrl] = useState('')

  const fileInputRef = useRef<HTMLInputElement | null>(null)
  const videoInputRef = useRef<HTMLInputElement | null>(null)

  // persist custom pin positions (x/y percentages) keyed by camera id.
  useEffect(() => {
    const pins: Record<string, { x: number; y: number }> = {}
    cameras.forEach((c) => {
      pins[c.id] = { x: c.x, y: c.y }
    })
    saveCameraPins(pins)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [cameras])

  // Real-time pulsing pins: any incident fired in the last 60s (not yet
  // acknowledged) makes its camera pulse red (high) or amber (medium).
  const activeAlerts = useCallback(
    (camId: string) => {
      const recent = incidents.filter(
        (i) => i.cameraId === camId && !i.acknowledged && now - i.firedAt < 60_000,
      )
      if (recent.length === 0) return null
      const hasHigh = recent.some((i) => i.severity === 'high')
      return hasHigh ? 'high' : 'medium'
    },
    [incidents, now],
  )

  const handleMapUpload = (file: File) => {
    const url = URL.createObjectURL(file)
    setMapImage(url)
    // persist as a data URL so it survives reloads (blob URLs die)
    const reader = new FileReader()
    reader.onload = () => saveMapImage(String(reader.result))
    reader.readAsDataURL(file)
  }

  const handleMapClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!editMode) return
    const rect = e.currentTarget.getBoundingClientRect()
    const x = Math.min(100, Math.max(0, ((e.clientX - rect.left) / rect.width) * 100))
    const y = Math.min(100, Math.max(0, ((e.clientY - rect.top) / rect.height) * 100))

    // find nearest existing camera within 6% — if so, open its config
    let nearest: Camera | null = null
    let nearestDist = 6
    for (const c of cameras) {
      const d = Math.hypot(c.x - x, c.y - y)
      if (d < nearestDist) {
        nearestDist = d
        nearest = c
      }
    }

    if (nearest) {
      openConfig(nearest)
      return
    }

    // Click on empty map space in edit mode = re-plot the demo camera whose
    // current position is farthest from the click (moves it to this spot).
    // Demo shorthand for "click-to-plot a node": the pre-defined cameras are
    // repositioned rather than creating brand-new hardware nodes.
    let farthest: Camera = cameras[0]
    let farthestDist = -1
    for (const c of cameras) {
      const d = Math.hypot(c.x - x, c.y - y)
      if (d > farthestDist) {
        farthestDist = d
        farthest = c
      }
    }
    moveCamera(farthest.id, x, y)
  }

  const openConfig = (cam: Camera) => {
    setEditingPin({ cam })
    setDraftName(cam.name)
    setDraftIp(cam.ip)
    setDraftModels([...cam.models])
    setDraftVideoUrl(cam.videoUrl)
  }

  const savePin = () => {
    if (!editingPin) return
    const id = editingPin.cam.id
    // persist edits through the shared camera store:
    updateCameraDetails(id, { name: draftName || editingPin.cam.name, ip: draftIp || editingPin.cam.ip })
    setCameraModels(id, draftModels)
    // video URL changes were applied immediately on upload (handleVideoUpload)
    setEditingPin(null)
  }

  const updateModels = (modelId: string) => {
    setDraftModels((prev) =>
      prev.includes(modelId) ? prev.filter((m) => m !== modelId) : [...prev, modelId],
    )
  }

  const handleVideoUpload = (file: File) => {
    const url = URL.createObjectURL(file)
    setDraftVideoUrl(url)
    if (editingPin) {
      setCameraVideo(editingPin.cam.id, url)
    }
  }

  return (
    <main className="flex min-h-0 flex-1 flex-col gap-4 overflow-auto bg-base p-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <h1 className="hud-label text-2xl text-gold-soft">TACTICAL SURVEILLANCE MAP</h1>
          <span className="rounded border border-cyan/40 bg-cyan/10 px-2 py-0.5 text-[10px] font-bold text-cyan">
            DEMO MODE — map is simulated
          </span>
        </div>
        <div className="flex items-center gap-2 text-xs text-slate-400">
          <div className="mr-2">{new Date(now).toLocaleString('en-GB', { hour12: false })}</div>
          {canEdit && (
            <>
              <button
                onClick={() => fileInputRef.current?.click()}
                className="btn gap-2 text-xs"
                title="Upload a custom map image (JPG/PNG/SVG)"
              >
                <Upload className="h-4 w-4" />
                Upload Map
              </button>
              <button
                onClick={() => setEditMode((v) => !v)}
                className={`btn gap-2 text-xs ${editMode ? 'border-gold/60 bg-gold/15 text-gold-soft' : ''}`}
                title={editMode ? 'Exit edit mode' : 'Enter edit mode (admin)'}
              >
                {editMode ? <Check className="h-4 w-4" /> : <Edit3 className="h-4 w-4" />}
                {editMode ? 'Done' : 'Edit Mode'}
              </button>
            </>
          )}
        </div>
      </div>

      {/* Map container */}
      <div
        className="relative min-h-[50vh] flex-1 overflow-hidden rounded-lg border border-edge/60 bg-surface2/20"
        onClick={handleMapClick}
        onMouseMove={() => {}}
      >
        {/* Background: uploaded image, else SVG map */}
        {mapImage ? (
          <img
            src={mapImage}
            alt="Custom society map"
            className="pointer-events-none absolute inset-0 h-full w-full object-cover"
          />
        ) : (
          <svg viewBox="0 0 100 100" className="pointer-events-none h-full w-full" preserveAspectRatio="xMidYMid meet">
            {/* zones + edges rendered like the prior static map */}
            <rect width="100" height="100" fill="#050B18" />
            {MAP_ZONES.map((zone) => (
              <g key={zone.id}>
                <rect x={zone.x} y={zone.y} width={zone.w} height={zone.h} fill={zone.color} stroke="#4C7BB5" strokeWidth="0.5" opacity="0.6" />
                <text x={zone.x + zone.w / 2} y={zone.y + zone.h / 2 + 1} textAnchor="middle" fontSize="2.2" fill="#E4C35A" fontWeight="bold">
                  {zone.label}
                </text>
              </g>
            ))}
            {CAMERA_EDGES.map(([fromId, toId], idx) => {
              const from = cameras.find((c) => c.id === fromId)
              const to = cameras.find((c) => c.id === toId)
              if (!from || !to) return null
              return <line key={idx} x1={from.x} y1={from.y} x2={to.x} y2={to.y} stroke="#22D3EE" strokeWidth="0.4" opacity="0.35" strokeDasharray="1,1" />
            })}
          </svg>
        )}

        {/* Rec grid scan overlay */}
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_center,rgba(34,211,238,0.06),transparent_65%)]" />

        {/* Camera pins */}
        {cameras.map((cam) => {
          const alert = activeAlerts(cam.id)
          const hovered = hoverCam === cam.id
          return (
            <div
              key={cam.id}
              className="absolute z-10 -translate-x-1/2 -translate-y-1/2"
              style={{ left: `${cam.x}%`, top: `${cam.y}%` }}
            >
              {/* pulse ring on active alert */}
              {alert && (
                <span
                  className={`absolute -inset-3 rounded-full animate-pin-ping ${
                    alert === 'high' ? 'bg-danger/50' : 'bg-warn/50'
                  }`}
                />
              )}
              <button
                onClick={(e) => {
                  e.stopPropagation()
                  if (editMode) {
                    openConfig(cam)
                  } else {
                    // cross-navigate: focus camera in Live Wall grid (move to
                    // primary + switch tab) — per rearchitecting prompt.
                    setTab('wall')
                    openForensic(cam.id)
                  }
                }}
                onMouseEnter={() => setHoverCam(cam.id)}
                onMouseLeave={() => setHoverCam(null)}
                className="group flex items-center justify-center"
                title={`${cam.name} — ${cam.ip}`}
              >
                {/* pin body color by alert state */}
                <div
                  className={`flex h-8 w-8 items-center justify-center rounded-full border-2 ${
                    alert === 'high'
                      ? 'border-danger bg-danger/30 text-danger shadow-glow-red'
                      : alert === 'medium'
                        ? 'border-warn bg-warn/20 text-warn shadow-glow-amber'
                        : 'border-cyan bg-cyan/15 text-cyan shadow-glow-cyan'
                  }`}
                >
                  <MapPin className="h-4 w-4" />
                </div>
              </button>

              {/* label */}
              <div className="pointer-events-none -mt-1 whitespace-nowrap text-center text-[9px] font-bold text-gold-soft drop-shadow">
                CAM {cam.index}
              </div>

              {/* hover tooltip */}
              {hovered && !editMode && (
                <div className="pointer-events-none absolute left-1/2 top-full z-30 mt-1 w-44 -translate-x-1/2 rounded-lg border border-edge/60 bg-surface/95 p-2 text-[10px] shadow-xl backdrop-blur-xl">
                  <div className="font-bold text-gold-soft">CAM {cam.index}</div>
                  <div className="text-slate-300">{cam.name}</div>
                  <div className="mt-0.5 font-mono text-cyan">{cam.ip}</div>
                  <div className="mt-1 flex flex-wrap gap-1">
                    {cam.models.map((mid) => (
                      <span key={mid} className="rounded border border-edge2/50 bg-surface2/50 px-1 py-px text-[8px] text-slate-300">
                        {mid.toUpperCase()}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )
        })}

        {/* Edit mode hint */}
        {editMode && (
          <div className="pointer-events-none absolute left-1/2 top-3 z-20 -translate-x-1/2 rounded-lg border border-gold/50 bg-surface/90 px-3 py-1.5 text-[11px] font-semibold text-gold-soft backdrop-blur-sm">
            EDIT MODE — click a pin to configure it
          </div>
        )}
      </div>

      {/* Camera list */}
      <div className="grid grid-cols-2 gap-3">
        {cameras.map((cam) => {
          const alert = activeAlerts(cam.id)
          return (
            <div key={cam.id} className="rounded-lg border border-edge/50 bg-surface2/40 p-3 text-sm">
              <div className="mb-1 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className={`h-2 w-2 rounded-full ${alert === 'high' ? 'bg-danger animate-pulse' : alert === 'medium' ? 'bg-warn animate-pulse' : 'bg-cyan'}`} />
                  <span className="font-bold text-gold-soft">CAM {cam.index}</span>
                </div>
                <button
                  className="btn-icon h-7 w-7"
                  title="Open forensic playback"
                  onClick={() => {
                    setTab('wall')
                    openForensic(cam.id)
                  }}
                >
                  <ScanLine className="h-3.5 w-3.5" />
                </button>
              </div>
              <div className="text-[11px] text-slate-400 space-y-0.5">
                <div>{cam.name}</div>
                <div className="text-cyan">{cam.ip}</div>
                <div className="text-slate-500">{cam.models.length} models active</div>
              </div>
            </div>
          )
        })}
      </div>

      {/* Hidden file inputs */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*,.svg"
        className="hidden"
        onChange={(e) => {
          const f = e.target.files?.[0]
          if (f) handleMapUpload(f)
          e.target.value = ''
        }}
      />
      <input
        ref={videoInputRef}
        type="file"
        accept="video/mp4"
        className="hidden"
        onChange={(e) => {
          const f = e.target.files?.[0]
          if (f) handleVideoUpload(f)
          e.target.value = ''
        }}
      />

      {/* Pin config modal */}
      {editingPin && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4 backdrop-blur-sm">
          <div className="w-full max-w-md animate-confirm-pop rounded-xl border border-edge/60 bg-deep/95 p-5 shadow-2xl">
            <div className="mb-4 flex items-center justify-between">
              <h2 className="hud-label text-sm font-bold text-gold-soft">
                CONFIGURE CAMERA — CAM {editingPin.cam.index}
              </h2>
              <button className="btn-icon" onClick={() => setEditingPin(null)} title="Close">
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="space-y-3">
              <div>
                <label className="text-[10px] font-semibold text-slate-400">CAMERA ID / NAME</label>
                <input
                  value={draftName}
                  onChange={(e) => setDraftName(e.target.value)}
                  className="w-full rounded-lg border border-edge2/50 bg-surface/60 px-2 py-1.5 text-xs text-slate-200 focus:border-cyan/60 focus:outline-none"
                />
              </div>
              <div>
                <label className="text-[10px] font-semibold text-slate-400">IP ADDRESS</label>
                <input
                  value={draftIp}
                  onChange={(e) => setDraftIp(e.target.value)}
                  className="w-full rounded-lg border border-edge2/50 bg-surface/60 px-2 py-1.5 text-xs font-mono text-cyan focus:border-cyan/60 focus:outline-none"
                />
              </div>

              <div>
                <label className="text-[10px] font-semibold text-slate-400">ACTIVE AI MODELS</label>
                <div className="mt-1 grid grid-cols-2 gap-1.5">
                  {AI_MODELS.map((m) => {
                    const active = draftModels.includes(m.id)
                    return (
                      <button
                        key={m.id}
                        onClick={() => updateModels(m.id)}
                        className={`flex items-center gap-1.5 rounded border px-2 py-1 text-[10px] font-semibold transition ${
                          active
                            ? 'border-gold/60 bg-gold/15 text-gold-soft'
                            : 'border-edge2/40 bg-surface/40 text-slate-400 hover:border-edge2/70'
                        }`}
                      >
                        {active ? <CheckSquare className="h-3 w-3" /> : <Square className="h-3 w-3" />}
                        {m.short}
                      </button>
                    )
                  })}
                </div>
              </div>

              <div>
                <label className="text-[10px] font-semibold text-slate-400">LINKED VIDEO STREAM</label>
                <div className="mt-1 flex items-center gap-2">
                  <button
                    onClick={() => videoInputRef.current?.click()}
                    className="btn gap-2 text-xs flex-1"
                  >
                    <Upload className="h-4 w-4" />
                    {draftVideoUrl ? 'Replace .mp4' : 'Upload .mp4'}
                  </button>
                  {draftVideoUrl && (
                    <span className="truncate text-[9px] text-cyan max-w-[140px]">
                      {draftVideoUrl.startsWith('blob:') ? 'local file' : 'built-in clip'}
                    </span>
                  )}
                </div>
              </div>

              <div className="flex items-center justify-between border-t border-edge/40 pt-3">
                <button
                  onClick={() => setEditingPin(null)}
                  className="btn text-xs gap-2 text-danger border-danger/40 hover:border-danger/70"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                  Reset
                </button>
                <button
                  onClick={savePin}
                  className="btn-gold text-xs"
                >
                  <Check className="h-3.5 w-3.5" />
                  Save Pin
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </main>
  )
}
