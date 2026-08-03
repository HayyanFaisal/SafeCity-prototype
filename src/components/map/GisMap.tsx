import React, { useCallback, useRef, useState } from 'react'
import { Camera as CameraIcon, Edit3, Lock, MapPin, RotateCcw, Upload } from 'lucide-react'
import { useApp } from '../../store/AppContext'
import type { CameraPin } from '../../types'
import CameraPinModal from './CameraPinModal'

const MAP_ACCEPT = 'image/*,.jpg,.jpeg,.png,.svg'

export default function GisMap() {
  const {
    canEditMaps, uploadMapImage, restoreDefaultMap, mapImageUrl, mapImageName,
    pins, getCamera, openForensics, beginPlot, draftPin,
    alertModal, toasts,
  } = useApp()

  const [editMode, setEditMode] = useState(false)
  const [pinModal, setPinModal] = useState<{ pin: CameraPin; isNew: boolean; x: number; y: number } | null>(null)
  const [hoverPin, setHoverPin] = useState<string | null>(null)
  const mapInputRef = useRef<HTMLInputElement>(null)
  const mapAreaRef = useRef<HTMLDivElement>(null)

  const onMapClick = useCallback(
    (e: React.MouseEvent<HTMLDivElement>) => {
      if (!editMode) return
      const rect = mapAreaRef.current?.getBoundingClientRect()
      if (!rect) return
      const x = ((e.clientX - rect.left) / rect.width) * 100
      const y = ((e.clientY - rect.top) / rect.height) * 100
      beginPlot(Math.max(0, Math.min(100, x)), Math.max(0, Math.min(100, y)))
    },
    [editMode, beginPlot],
  )

  const onMapUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) uploadMapImage(file)
    e.target.value = ''
  }

  const canEdit = canEditMaps

  // Active alert cameras: high-priority modal + toast cameras
  const alertCamIds = new Set<string>()
  if (alertModal) alertCamIds.add(alertModal.cameraId)
  const toastCamIds = new Set(toasts.map((t) => t.cameraId))

  return (
    <div className="flex min-h-0 flex-1 flex-col gap-3 p-3">
      {/* Toolbar */}
      <div className="flex flex-wrap items-center gap-2 rounded-xl border border-edge bg-surface/70 p-2 backdrop-blur">
        <div className="px-1 font-mono text-[10px] tracking-widest text-slate-500">SOCIETY GIS OVERLAY</div>
        <button
          onClick={() => setEditMode((v) => !v)}
          disabled={!canEdit}
          className={`flex items-center gap-1.5 rounded-lg border px-3 py-1.5 text-[12px] font-semibold transition disabled:opacity-40 ${
            editMode
              ? 'border-warn/60 bg-warn/20 text-amber-300'
              : 'border-edge bg-base text-slate-300 hover:border-accent/40'
          }`}
        >
          {editMode ? <Lock size={13} /> : <Edit3 size={13} />}
          {editMode ? 'EDIT MODE ON' : 'EDIT MODE OFF'}
        </button>
        {canEdit && (
          <>
            <button
              onClick={() => mapInputRef.current?.click()}
              className="flex items-center gap-1.5 rounded-lg border border-accent/40 bg-accent/10 px-3 py-1.5 text-[12px] font-semibold text-cyan-300 transition hover:bg-accent/20"
            >
              <Upload size={13} /> Upload Map Image
            </button>
            <input ref={mapInputRef} type="file" accept={MAP_ACCEPT} className="hidden" onChange={onMapUpload} />
            <button
              onClick={restoreDefaultMap}
              className="flex items-center gap-1.5 rounded-lg border border-edge bg-base px-3 py-1.5 text-[12px] text-slate-400 transition hover:text-slate-200"
            >
              <RotateCcw size={13} /> Default
            </button>
          </>
        )}
        <div className="ml-auto hidden items-center gap-1.5 font-mono text-[10px] text-slate-500 md:flex">
          <MapPin size={11} className="text-accent" /> {pins.length} NODES · {mapImageName}
        </div>
      </div>

      {/* Map canvas */}
      <div className="relative min-h-0 flex-1 overflow-hidden rounded-xl border border-edge bg-base">
        {mapImageUrl && (
          <div
            ref={mapAreaRef}
            onClick={onMapClick}
            className={`relative h-full w-full ${editMode ? 'cursor-crosshair' : 'cursor-default'}`}
          >
            <img src={mapImageUrl} alt="Society GIS map" className="h-full w-full object-contain" draggable={false} />
            {editMode && <div className="pointer-events-none absolute inset-0 rounded-xl border-2 border-dashed border-accent/40" />}

            {/* Pins */}
            {pins.map((pin) => {
              const cam = getCamera(pin.cameraId)
              if (!cam) return null
              const isHover = hoverPin === pin.id
              const hasVideo = !!cam.videoUrl
              const isDraft = draftPin?.cameraId === pin.cameraId
              const isHighAlert = alertCamIds.has(pin.cameraId)
              const isMedAlert = !isHighAlert && toastCamIds.has(pin.cameraId)
              return (
                <button
                  key={pin.id}
                  onClick={(e) => {
                    e.stopPropagation()
                    if (editMode) {
                      setPinModal({ pin, isNew: false, x: pin.x, y: pin.y })
                    } else if (hasVideo) {
                      openForensics(cam.id)
                    } else {
                      // No stream linked yet — open config to link one
                      setPinModal({ pin, isNew: false, x: pin.x, y: pin.y })
                    }
                  }}
                  onMouseEnter={() => setHoverPin(pin.id)}
                  onMouseLeave={() => setHoverPin(null)}
                  className="group absolute z-10 -translate-x-1/2 -translate-y-1/2"
                  style={{ left: `${pin.x}%`, top: `${pin.y}%` }}
                  aria-label={`${cam.id} — ${cam.name}`}
                >
                  {(isDraft || isHighAlert || isMedAlert) && (
                    <span
                      className={`absolute -inset-3 animate-pulse-ring rounded-full border-2 ${
                        isHighAlert ? 'border-danger shadow-glow-red' : 'border-warn shadow-glow-amber'
                      }`}
                    />
                  )}
                  <span className="relative flex items-center justify-center">
                    <span
                      className={`flex h-8 w-8 items-center justify-center rounded-full border-2 bg-base shadow-lg transition ${
                        isHighAlert
                          ? 'scale-110 border-danger'
                          : isMedAlert
                            ? 'scale-105 border-warn'
                            : isHover || isDraft
                              ? 'scale-110 border-accent shadow-glow-cyan'
                              : hasVideo
                                ? 'border-accent/70'
                                : 'border-slate-600'
                      }`}
                    >
                      <CameraIcon
                        size={14}
                        className={isHighAlert ? 'text-red-400' : isMedAlert ? 'text-amber-400' : hasVideo ? 'text-accent' : 'text-slate-500'}
                      />
                    </span>
                    <span
                      className={`pointer-events-none absolute left-1/2 top-full z-20 mt-1.5 -translate-x-1/2 whitespace-nowrap rounded-md border border-edge bg-base/95 px-2 py-1 font-mono text-[9.5px] backdrop-blur transition ${
                        isHover ? 'opacity-100' : 'opacity-0'
                      }`}
                    >
                      <span className="block font-bold text-cyan-300">{cam.id} · {cam.name}</span>
                      <span className="block text-slate-400">
                        {cam.ip}
                        {isHighAlert ? ' · ⚠ HIGH ALERT' : isMedAlert ? ' · ⚠ MED ALERT' : hasVideo ? ' · STREAM LINKED' : ' · NO STREAM'}
                      </span>
                    </span>
                  </span>
                </button>
              )
            })}

            {/* Draft pin */}
            {draftPin && (
              <button
                onClick={(e) => {
                  e.stopPropagation()
                  setPinModal({ pin: { id: 'draft', x: draftPin.x, y: draftPin.y, cameraId: draftPin.cameraId }, isNew: true, x: draftPin.x, y: draftPin.y })
                }}
                className="absolute z-20 -translate-x-1/2 -translate-y-1/2"
                style={{ left: `${draftPin.x}%`, top: `${draftPin.y}%` }}
              >
                <span className="absolute -inset-3 animate-pulse-ring rounded-full border-2 border-warn/80" />
                <span className="flex h-8 w-8 items-center justify-center rounded-full border-2 border-warn bg-base shadow-glow-amber">
                  <CameraIcon size={14} className="text-amber-400" />
                </span>
              </button>
            )}

            {/* Hints */}
            {editMode ? (
              <div className="pointer-events-none absolute bottom-3 left-3 rounded-lg border border-warn/40 bg-base/90 px-3 py-2 font-mono text-[10px] text-warn backdrop-blur">
                EDIT MODE — CLICK MAP TO PLOT NEW CAMERA NODE · CLICK PIN TO EDIT/DELETE
              </div>
            ) : (
              <div className="pointer-events-none absolute bottom-3 left-3 rounded-lg border border-accent/30 bg-base/80 px-3 py-2 font-mono text-[10px] text-slate-400 backdrop-blur">
                OPERATIONAL — CLICK A PIN TO JUMP INTO PLAYBACK & FORENSIC MODE
              </div>
            )}
          </div>
        )}
      </div>

      <CameraPinModal data={pinModal} onClose={() => setPinModal(null)} />
    </div>
  )
}
