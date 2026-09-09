import { useCallback, useEffect, useRef, useState } from 'react'
import { Edit3, Upload, X, Check, Trash2, ScanLine, CheckSquare, Square } from 'lucide-react'
import { useApp } from '../../store/AppContext'
import { AI_MODELS } from '../../constants'
import type { Camera } from '../../types'
import { loadMapImage, saveMapImage, saveCameraPins } from '../../lib/storage'

// Default map: the detailed Naval Anchorage SVG (in public/).
// The filename has parentheses — must be URI-encoded when used as a src.
const DEFAULT_MAP_SRC = '/naval-anchorage-map(1).svg'

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
    canEdit,
    incidents,
    setCameraVideo,
  } = useApp()

  const [editMode, setEditMode] = useState(false)
  // Custom uploaded image overrides the default SVG.
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
    cameras.forEach((c) => { pins[c.id] = { x: c.x, y: c.y } })
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
    const reader = new FileReader()
    reader.onload = () => saveMapImage(String(reader.result))
    reader.readAsDataURL(file)
  }

  const handleMapClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!editMode) return
    const rect = e.currentTarget.getBoundingClientRect()
    const x = Math.min(100, Math.max(0, ((e.clientX - rect.left) / rect.width) * 100))
    const y = Math.min(100, Math.max(0, ((e.clientY - rect.top) / rect.height) * 100))

    let nearest: Camera | null = null
    let nearestDist = 4
    for (const c of cameras) {
      const d = Math.hypot(c.x - x, c.y - y)
      if (d < nearestDist) { nearestDist = d; nearest = c }
    }
    if (nearest) { openConfig(nearest); return }

    let farthest: Camera = cameras[0]
    let farthestDist = -1
    for (const c of cameras) {
      const d = Math.hypot(c.x - x, c.y - y)
      if (d > farthestDist) { farthestDist = d; farthest = c }
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
    updateCameraDetails(id, { name: draftName || editingPin.cam.name, ip: draftIp || editingPin.cam.ip })
    setCameraModels(id, draftModels)
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
    if (editingPin) setCameraVideo(editingPin.cam.id, url)
  }

  // Active map source: custom upload beats the default detailed SVG
  const mapSrc = mapImage ?? DEFAULT_MAP_SRC

  return (
    <main className="flex min-h-0 flex-1 flex-col gap-4 overflow-auto bg-base p-6">

      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="hud-label text-2xl text-gold-soft">TACTICAL SURVEILLANCE MAP</h1>
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
              {mapImage && (
                <button
                  onClick={() => { setMapImage(null); saveMapImage(null) }}
                  className="btn gap-2 text-xs border-slate-600/50 text-slate-400 hover:border-danger/50 hover:text-danger"
                  title="Revert to Naval Anchorage base map"
                >
                  Reset Map
                </button>
              )}
              <button
                onClick={() => setEditMode((v) => !v)}
                className={`btn gap-2 text-xs ${editMode ? 'border-gold/60 bg-gold/15 text-gold-soft' : ''}`}
                title={editMode ? 'Exit edit mode' : 'Enter edit mode — drag pins to reposition'}
              >
                {editMode ? <Check className="h-4 w-4" /> : <Edit3 className="h-4 w-4" />}
                {editMode ? 'Done' : 'Edit Mode'}
              </button>
            </>
          )}
        </div>
      </div>

      {/* ── Map ── */}
      <div
        className="relative flex-1 overflow-hidden rounded-xl border border-edge/60 bg-black shadow-2xl"
        style={{ minHeight: '55vh' }}
        onClick={handleMapClick}
      >
        {/* Background map image */}
        <img
          src={mapSrc}
          alt="Naval Anchorage Islamabad — surveillance map"
          className="pointer-events-none absolute inset-0 h-full w-full object-cover"
          draggable={false}
        />

        {/* Subtle command-center dark overlay for readability */}
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_center,transparent_55%,rgba(0,0,0,0.45)_100%)]" />

        {/* Camera pins — red dots */}
        {cameras.map((cam) => {
          const alert = activeAlerts(cam.id)
          const hovered = hoverCam === cam.id

          // Dot colour: red on high-alert, amber on medium, red otherwise (always red per request)
          const dotColour =
            alert === 'medium' ? '#F59E0B' : '#EF4444'
          const ringColour =
            alert === 'medium' ? 'rgba(245,158,11,0.45)' : 'rgba(239,68,68,0.45)'
          const glowShadow =
            alert === 'medium'
              ? '0 0 8px 3px rgba(245,158,11,0.7)'
              : '0 0 10px 4px rgba(239,68,68,0.75)'

          return (
            <div
              key={cam.id}
              className="absolute z-10 -translate-x-1/2 -translate-y-1/2"
              style={{ left: `${cam.x}%`, top: `${cam.y}%` }}
            >
              {/* Outer ping ring — shown when alert OR always to make pins visible */}
              {alert ? (
                // Active alert: animated ping
                <span
                  className="absolute -inset-3 rounded-full animate-pin-ping"
                  style={{ backgroundColor: ringColour }}
                />
              ) : (
                // No alert: soft static ring so the pin is visible on the map
                <span
                  className="absolute rounded-full"
                  style={{
                    inset: '-5px',
                    backgroundColor: 'rgba(239,68,68,0.15)',
                    border: '1px solid rgba(239,68,68,0.35)',
                    borderRadius: '50%',
                  }}
                />
              )}

              {/* The red dot button */}
              <button
                onClick={(e) => {
                  e.stopPropagation()
                  if (editMode) {
                    openConfig(cam)
                  } else {
                    openForensic(cam.id)
                  }
                }}
                onMouseEnter={() => setHoverCam(cam.id)}
                onMouseLeave={() => setHoverCam(null)}
                className="relative flex items-center justify-center rounded-full transition-transform hover:scale-125 focus:outline-none"
                style={{
                  width: 16,
                  height: 16,
                  backgroundColor: dotColour,
                  boxShadow: glowShadow,
                  border: '2.5px solid rgba(255,255,255,0.85)',
                }}
                title={`${cam.name} · ${cam.ip}`}
              />

              {/* CAM label below the dot */}
              <div
                className="pointer-events-none absolute left-1/2 -translate-x-1/2 whitespace-nowrap text-center font-bold drop-shadow-md"
                style={{
                  top: 18,
                  fontSize: 9,
                  color: dotColour,
                  textShadow: '0 1px 3px rgba(0,0,0,0.9)',
                  letterSpacing: '0.04em',
                }}
              >
                CAM {cam.index}
              </div>

              {/* Hover tooltip */}
              {hovered && !editMode && (
                <div className="pointer-events-none absolute left-1/2 top-full z-30 mt-4 w-52 -translate-x-1/2 rounded-lg border border-edge/70 bg-surface/97 p-2.5 text-[10px] shadow-2xl backdrop-blur-xl">
                  {/* Alert badge at top if active */}
                  {alert && (
                    <div
                      className="mb-2 flex items-center gap-1.5 rounded px-2 py-1 text-[9px] font-bold"
                      style={{
                        backgroundColor: alert === 'high' ? 'rgba(239,68,68,0.2)' : 'rgba(245,158,11,0.2)',
                        color: alert === 'high' ? '#EF4444' : '#F59E0B',
                        border: `1px solid ${alert === 'high' ? 'rgba(239,68,68,0.4)' : 'rgba(245,158,11,0.4)'}`,
                      }}
                    >
                      <span
                        className="h-1.5 w-1.5 rounded-full animate-pulse"
                        style={{ backgroundColor: alert === 'high' ? '#EF4444' : '#F59E0B' }}
                      />
                      {alert === 'high' ? 'CRITICAL ALERT' : 'WARNING ALERT'}
                    </div>
                  )}
                  <div className="font-bold text-gold-soft">CAM {cam.index}</div>
                  <div className="mt-0.5 text-slate-200">{cam.name}</div>
                  <div className="mt-0.5 font-mono text-cyan">{cam.ip}</div>
                  <div className="mt-1 text-slate-500">{cam.zone}</div>
                  {cam.models.length > 0 && (
                    <div className="mt-1.5 flex flex-wrap gap-1">
                      {cam.models.map((mid) => (
                        <span
                          key={mid}
                          className="rounded border border-edge2/50 bg-surface2/50 px-1 py-px text-[8px] font-semibold text-slate-300"
                        >
                          {mid.toUpperCase()}
                        </span>
                      ))}
                    </div>
                  )}
                  <div className="mt-2 text-[8px] text-slate-600 italic">Click to open forensic view</div>
                </div>
              )}
            </div>
          )
        })}

        {/* Edit mode hint */}
        {editMode && (
          <div className="pointer-events-none absolute left-1/2 top-3 z-20 -translate-x-1/2 rounded-lg border border-gold/50 bg-surface/95 px-4 py-2 text-[11px] font-semibold text-gold-soft backdrop-blur-sm shadow-lg">
            EDIT MODE — click a pin to configure · click empty area to relocate
          </div>
        )}

        {/* Legend */}
        <div className="pointer-events-none absolute bottom-3 left-3 z-10 flex flex-col gap-1.5 rounded-lg border border-edge/50 bg-black/70 px-3 py-2.5 backdrop-blur-sm">
          <div className="text-[9px] font-bold uppercase tracking-widest text-slate-500 mb-1">Legend</div>
          <div className="flex items-center gap-2">
            <span className="h-3 w-3 rounded-full bg-red-500 shadow-[0_0_6px_2px_rgba(239,68,68,0.6)]" style={{ border: '2px solid rgba(255,255,255,0.8)' }} />
            <span className="text-[10px] text-slate-400">Camera (active)</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="h-3 w-3 rounded-full animate-pulse" style={{ backgroundColor: '#EF4444', boxShadow: '0 0 8px 3px rgba(239,68,68,0.7)', border: '2px solid rgba(255,255,255,0.8)' }} />
            <span className="text-[10px] text-slate-400">Critical alert</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="h-3 w-3 rounded-full animate-pulse" style={{ backgroundColor: '#F59E0B', boxShadow: '0 0 8px 3px rgba(245,158,11,0.7)', border: '2px solid rgba(255,255,255,0.8)' }} />
            <span className="text-[10px] text-slate-400">Warning alert</span>
          </div>
        </div>
      </div>

      {/* Camera status grid */}
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        {cameras.map((cam) => {
          const alert = activeAlerts(cam.id)
          return (
            <div
              key={cam.id}
              className={`rounded-lg border p-3 text-sm transition ${
                alert === 'high'
                  ? 'border-danger/50 bg-danger/8'
                  : alert === 'medium'
                    ? 'border-warn/50 bg-warn/8'
                    : 'border-edge/50 bg-surface2/40'
              }`}
            >
              <div className="mb-1.5 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  {/* Red dot status indicator */}
                  <span
                    className={`h-2.5 w-2.5 rounded-full flex-shrink-0 ${alert ? 'animate-pulse' : ''}`}
                    style={{
                      backgroundColor: alert === 'high' ? '#EF4444' : alert === 'medium' ? '#F59E0B' : '#EF4444',
                      boxShadow: alert
                        ? `0 0 6px 2px ${alert === 'high' ? 'rgba(239,68,68,0.6)' : 'rgba(245,158,11,0.6)'}`
                        : '0 0 4px 1px rgba(239,68,68,0.3)',
                      border: '1.5px solid rgba(255,255,255,0.6)',
                    }}
                  />
                  <span className="font-bold text-gold-soft text-xs">CAM {cam.index}</span>
                </div>
                <button
                  className="btn-icon h-6 w-6"
                  title="Open forensic playback"
                  onClick={() => openForensic(cam.id)}
                >
                  <ScanLine className="h-3 w-3" />
                </button>
              </div>
              <div className="text-[10px] text-slate-400 space-y-0.5">
                <div className="truncate font-medium text-slate-300">{cam.name}</div>
                <div className="font-mono text-cyan">{cam.ip}</div>
                <div className="text-slate-500">{cam.zone}</div>
              </div>
              {alert && (
                <div
                  className="mt-1.5 rounded px-1.5 py-0.5 text-[9px] font-bold"
                  style={{
                    backgroundColor: alert === 'high' ? 'rgba(239,68,68,0.15)' : 'rgba(245,158,11,0.15)',
                    color: alert === 'high' ? '#EF4444' : '#F59E0B',
                  }}
                >
                  {alert === 'high' ? '⚠ CRITICAL' : '▲ WARNING'}
                </div>
              )}
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
        onChange={(e) => { const f = e.target.files?.[0]; if (f) handleMapUpload(f); e.target.value = '' }}
      />
      <input
        ref={videoInputRef}
        type="file"
        accept="video/mp4"
        className="hidden"
        onChange={(e) => { const f = e.target.files?.[0]; if (f) handleVideoUpload(f); e.target.value = '' }}
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
                <label className="text-[10px] font-semibold text-slate-400">CAMERA NAME</label>
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
                  <button onClick={() => videoInputRef.current?.click()} className="btn gap-2 text-xs flex-1">
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
                  Cancel
                </button>
                <button onClick={savePin} className="btn-gold text-xs">
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
