import React, { useCallback, useEffect, useRef, useState } from 'react'
import { Crosshair, Plus, Trash2, Video as VideoIcon } from 'lucide-react'
import type { Camera } from '../../types'
import { useApp } from '../../store/AppContext'

interface VideoTileProps {
  slot: number
  camera: Camera | null
  className?: string
}

const ACCEPTED = 'video/*,.mp4,.webm,.ogg,.mov'

export default function VideoTile({ slot, camera, className = '' }: VideoTileProps) {
  const {
    mountFileToSlot, unmountSlot, swapSlots, isMasterPlaying, openForensics,
    alertModal, layout,
  } = useApp()

  const videoRef = useRef<HTMLVideoElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)
  const [dragging, setDragging] = useState(false)
  const [over, setOver] = useState(false)

  // Master play/pause sync
  useEffect(() => {
    const vid = videoRef.current
    if (!vid || !camera?.videoUrl) return
    if (isMasterPlaying) {
      void vid.play().catch(() => {})
    } else {
      vid.pause()
    }
  }, [isMasterPlaying, camera?.videoUrl, slot])

  // Loop demo clips
  useEffect(() => {
    const vid = videoRef.current
    if (!vid) return
    const onEnded = () => {
      vid.currentTime = 0
      if (isMasterPlaying) void vid.play().catch(() => {})
    }
    vid.addEventListener('ended', onEnded)
    return () => vid.removeEventListener('ended', onEnded)
  }, [isMasterPlaying])

  const isAlertTile = alertModal !== null && alertModal.parentId >= 7 && alertModal.parentId - 7 === slot

  const onFile = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0]
      if (file) mountFileToSlot(slot, file)
      e.target.value = ''
    },
    [mountFileToSlot, slot],
  )

  const onDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault()
      setOver(false)
      const from = Number(e.dataTransfer.getData('text/slot'))
      if (Number.isFinite(from)) {
        swapSlots(from, slot)
      } else {
        const file = e.dataTransfer.files?.[0]
        if (file) mountFileToSlot(slot, file)
      }
    },
    [slot, swapSlots, mountFileToSlot],
  )

  const onDragStart = useCallback(
    (e: React.DragEvent) => {
      e.dataTransfer.setData('text/slot', String(slot))
      e.dataTransfer.effectAllowed = 'move'
      setDragging(true)
    },
    [slot],
  )

  const isCompact = layout === 'grid3x3' || layout === 'grid2x2'

  return (
    <div
      draggable={!!camera}
      onDragStart={onDragStart}
      onDragEnd={() => setDragging(false)}
      onDragOver={(e) => {
        e.preventDefault()
        setOver(true)
      }}
      onDragLeave={() => setOver(false)}
      onDrop={onDrop}
      onClick={() => camera && openForensics(camera.id)}
      className={`group relative flex min-h-0 flex-col overflow-hidden rounded-lg border bg-surface transition-all duration-200 ${
        isAlertTile
          ? 'border-danger/80 shadow-glow-red'
          : over
            ? 'border-accent/80 shadow-glow-cyan'
            : 'border-edge hover:border-accent/40'
      } ${dragging ? 'opacity-40' : ''} ${className}`}
    >
      {camera?.videoUrl ? (
        <>
          <video
            ref={videoRef}
            data-slot-index={slot}
            src={camera.videoUrl}
            muted
            playsInline
            loop={false}
            preload="auto"
            className="absolute inset-0 h-full w-full cursor-pointer object-cover"
          />
          {/* Scan effect */}
          <div className="pointer-events-none absolute inset-x-0 top-0 h-10 overflow-hidden">
            <div className="h-full w-full animate-scan-line bg-gradient-to-b from-transparent via-accent/10 to-transparent" style={{ top: '-10%' }} />
          </div>

          {/* HUD */}
          <div className="pointer-events-none absolute inset-x-0 top-0 flex items-center gap-2 p-2">
            <span className="flex items-center gap-1 rounded bg-black/60 px-1.5 py-0.5 font-mono text-[10px] font-bold text-cyan-300 backdrop-blur">
              <VideoIcon size={10} /> {camera.id}
            </span>
            <span className="flex items-center gap-1 rounded bg-black/60 px-1.5 py-0.5 font-mono text-[9.5px] text-slate-300 backdrop-blur">
              {camera.ip}
            </span>
            <span className="ml-auto flex items-center gap-1 rounded bg-black/60 px-1.5 py-0.5 font-mono text-[9.5px] font-bold text-red-400 backdrop-blur">
              <span className="h-1.5 w-1.5 animate-live-blink rounded-full bg-red-500" /> LIVE
            </span>
          </div>

          {/* Bottom info */}
          <div className="pointer-events-none absolute inset-x-0 bottom-0 flex items-center gap-2 bg-gradient-to-t from-black/85 to-transparent p-2 pt-5">
            <div className="min-w-0">
              <div className="truncate text-[11px] font-semibold text-slate-100">{camera.name}</div>
              <div className="truncate font-mono text-[9px] text-slate-500">{camera.fileName}</div>
            </div>
            {isAlertTile && (
              <span className="ml-auto shrink-0 animate-live-blink font-mono text-[9px] font-bold text-red-400">ALERT</span>
            )}
          </div>

          {/* Hover actions */}
          {!isCompact && (
            <div className="pointer-events-none absolute inset-0 flex items-center justify-center gap-2 opacity-0 transition group-hover:opacity-100">
              <button
                onClick={(e) => {
                  e.stopPropagation()
                  openForensics(camera.id)
                }}
                className="pointer-events-auto rounded-lg border border-edge bg-black/70 p-2.5 text-cyan-300 backdrop-blur transition hover:border-accent/60 hover:bg-black/85"
                aria-label="Forensic inspection"
              >
                <Crosshair size={16} />
              </button>
              <button
                onClick={(e) => {
                  e.stopPropagation()
                  unmountSlot(slot)
                }}
                className="pointer-events-auto rounded-lg border border-edge bg-black/70 p-2.5 text-red-400 backdrop-blur transition hover:border-danger/60 hover:bg-black/85"
                aria-label="Unmount stream"
              >
                <Trash2 size={16} />
              </button>
            </div>
          )}
        </>
      ) : (
        <>
          <button
            onClick={(e) => {
              e.stopPropagation()
              inputRef.current?.click()
            }}
            className="absolute inset-0 flex flex-col items-center justify-center gap-3 rounded-lg border-2 border-dashed border-edge bg-base/40 p-4 text-slate-500 transition hover:border-accent/50 hover:bg-accent/5 hover:text-slate-300"
          >
            <span className="grid h-12 w-12 place-items-center rounded-full border border-edge bg-surface2 transition group-hover:border-accent/40">
              <Plus size={22} />
            </span>
            <span className="text-center text-[11px] font-medium leading-snug">
              Click to Mount Local Video (.mp4)
            </span>
            <span className="font-mono text-[9px] text-slate-600">SLOT {String(slot + 1).padStart(2, '0')} · EMPTY</span>
          </button>
          <input ref={inputRef} type="file" accept={ACCEPTED} className="hidden" onChange={onFile} />
        </>
      )}

      {/* Label when compact */}
      {isCompact && camera && (
        <div className="pointer-events-none absolute left-1.5 top-1.5 z-10 rounded bg-black/60 px-1 py-0.5 font-mono text-[8.5px] font-bold text-cyan-300 backdrop-blur">
          {camera.id}
        </div>
      )}
    </div>
  )
}
