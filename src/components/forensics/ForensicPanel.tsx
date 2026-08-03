import React, { useEffect, useRef, useState } from 'react'
import { ArrowLeft, Crosshair, Pause, Play, Video as VideoIcon } from 'lucide-react'
import { useApp } from '../../store/AppContext'
import { EVENT_MARKERS } from '../../constants'
import { formatTime } from '../../lib/format'
import type { EventMarkerSpec } from '../../types'

const DURATION = 80

export default function ForensicPanel() {
  const { focusedCameraId, getCamera, closeForensics, forensicSeek, setForensicSeek } = useApp()
  const camera = focusedCameraId ? getCamera(focusedCameraId) : null

  const videoRef = useRef<HTMLVideoElement>(null)
  const [currentTime, setCurrentTime] = useState(0)
  const [duration, setDuration] = useState(DURATION)
  const [hoverMarker, setHoverMarker] = useState<EventMarkerSpec | null>(null)
  const [playing, setPlaying] = useState(false)

  // Reset + autoplay when camera changes
  useEffect(() => {
    setCurrentTime(0)
    setHoverMarker(null)
    const vid = videoRef.current
    if (vid) {
      vid.currentTime = 0
      void vid.play().catch(() => {})
    }
  }, [focusedCameraId])

  // Consume a queued jump-to-timestamp seek (from toast "JUMP TO TIMESTAMP")
  useEffect(() => {
    if (forensicSeek === null) return
    const vid = videoRef.current
    if (vid) {
      vid.currentTime = Math.max(0, Math.min(forensicSeek, duration || DURATION))
      setCurrentTime(forensicSeek)
      setPlaying(true)
      void vid.play().catch(() => {})
    }
    setForensicSeek(null)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [forensicSeek])

  const togglePlay = () => {
    const vid = videoRef.current
    if (!vid) return
    if (vid.paused) {
      void vid.play().catch(() => {})
      setPlaying(true)
    } else {
      vid.pause()
      setPlaying(false)
    }
  }

  const seekTo = (time: number) => {
    const vid = videoRef.current
    if (!vid) return
    vid.currentTime = Math.max(0, Math.min(time, duration || DURATION))
    setCurrentTime(time)
    if (playing) void vid.play().catch(() => {})
  }

  const onScrub = (e: React.ChangeEvent<HTMLInputElement>) => {
    seekTo(Number(e.target.value))
  }

  if (!camera) {
    return (
      <div className="grid min-h-0 flex-1 place-items-center p-6">
        <div className="rounded-xl border border-edge bg-surface p-8 text-center">
          <VideoIcon size={32} className="mx-auto mb-3 text-slate-600" />
          <div className="text-sm font-semibold text-slate-300">No camera selected</div>
          <div className="mt-1 font-mono text-[11px] text-slate-500">
            Click a live tile or map pin to open playback & forensic inspection
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="flex min-h-0 flex-1 flex-col gap-3 p-3">
      {/* Header */}
      <div className="flex flex-wrap items-center gap-2 rounded-xl border border-edge bg-surface/70 p-2 backdrop-blur">
        <button
          onClick={closeForensics}
          className="flex items-center gap-1.5 rounded-lg border border-edge bg-base px-3 py-1.5 text-[12px] font-semibold text-slate-300 transition hover:border-accent/40 hover:text-slate-100"
        >
          <ArrowLeft size={14} /> Back to Grid
        </button>
        <div className="min-w-0">
          <div className="truncate text-[13px] font-bold text-slate-100">{camera.name}</div>
          <div className="font-mono text-[10px] text-slate-500">{camera.id} · {camera.ip}</div>
        </div>
        <div className="ml-auto flex items-center gap-2">
          <span className="flex items-center gap-1.5 rounded-lg border border-danger/40 bg-danger/10 px-2 py-1 font-mono text-[10px] font-bold text-red-400">
            <span className="h-1.5 w-1.5 animate-live-blink rounded-full bg-red-500" /> PLAYBACK
          </span>
          <button
            onClick={togglePlay}
            className="flex items-center gap-1.5 rounded-lg border border-accent/50 bg-accent/15 px-3 py-1.5 text-[12px] font-semibold text-cyan-300 transition hover:bg-accent/25"
          >
            {playing ? <Pause size={14} /> : <Play size={14} />}
            {playing ? 'Pause' : 'Play'}
          </button>
        </div>
      </div>

      {/* Video + timeline */}
      <div className="flex min-h-0 flex-1 flex-col gap-3">
        <div className="relative min-h-0 flex-1 overflow-hidden rounded-xl border border-edge bg-base">
          <video
            ref={videoRef}
            data-forensics
            src={camera.videoUrl ?? undefined}
            muted
            playsInline
            preload="auto"
            className="absolute inset-0 h-full w-full object-contain"
            onTimeUpdate={(e) => {
              setCurrentTime(e.currentTarget.currentTime)
              setPlaying(!e.currentTarget.paused)
            }}
            onLoadedMetadata={(e) => {
              const d = e.currentTarget.duration
              if (Number.isFinite(d) && d > 0) setDuration(d)
            }}
            onEnded={() => {
              const vid = videoRef.current
              if (vid) {
                vid.currentTime = 0
                void vid.play().catch(() => {})
              }
            }}
          />

          {/* Timeline scrubber */}
          <div className="absolute inset-x-0 bottom-0 border-t border-edge bg-base/90 p-3 backdrop-blur">
            {/* Marker flags */}
            <div className="relative mb-1.5 h-7">
              {EVENT_MARKERS.map((marker) => {
                const pct = (marker.time / (duration || DURATION)) * 100
                const color = marker.priority === 'high' ? 'bg-danger' : marker.priority === 'medium' ? 'bg-warn' : 'bg-accent'
                return (
                  <div key={marker.id} className="absolute -translate-x-1/2" style={{ left: `${pct}%` }}>
                    <button
                      onClick={() => seekTo(marker.time)}
                      onMouseEnter={() => setHoverMarker(marker)}
                      onMouseLeave={() => setHoverMarker(null)}
                      className="group flex flex-col items-center"
                      aria-label={`${marker.title} at ${formatTime(marker.time)}`}
                    >
                      <span className={`h-5 w-1.5 rounded-sm ${color} shadow-md transition group-hover:scale-y-125`} />
                      <span className={`mt-0.5 h-1.5 w-1.5 rounded-full ${color}`} />
                    </button>
                  </div>
                )
              })}
            </div>

            <input
              type="range"
              min={0}
              max={duration || DURATION}
              step={0.1}
              value={Math.min(currentTime, duration || DURATION)}
              onChange={onScrub}
              className="w-full accent-cyan-400"
            />
            <div className="mt-1 flex items-center justify-between font-mono text-[10.5px]">
              <span className="text-cyan-300">{formatTime(currentTime)}</span>
              <span className="text-slate-600">{formatTime(duration || DURATION)}</span>
            </div>

            {/* Marker tooltip */}
            {hoverMarker && (
              <div className="pointer-events-none absolute bottom-16 left-1/2 z-20 w-60 -translate-x-1/2 rounded-xl border border-edge bg-surface p-3 shadow-panel">
                <div className="flex items-center gap-2">
                  <span className={`h-2 w-2 rounded-full ${hoverMarker.priority === 'high' ? 'bg-danger' : hoverMarker.priority === 'medium' ? 'bg-warn' : 'bg-accent'}`} />
                  <span className="text-[12px] font-bold text-slate-100">{hoverMarker.title}</span>
                </div>
                <div className="mt-1.5 font-mono text-[10px] leading-relaxed text-slate-400">
                  <div>TIME · {formatTime(hoverMarker.time)}</div>
                  <div>CONFIDENCE · {hoverMarker.confidence.toFixed(1)}%</div>
                  <div>MODEL · {hoverMarker.modelId.toUpperCase()}</div>
                  {hoverMarker.plate && <div>PLATE · {hoverMarker.plate}</div>}
                  {hoverMarker.vehicle && <div>VEHICLE · {hoverMarker.vehicle}</div>}
                </div>
                <div className="mt-2 border-t border-edge pt-2 text-[10.5px] leading-snug text-slate-300">{hoverMarker.detail}</div>
                <div className="mt-1.5 text-center font-mono text-[9px] text-cyan-400">CLICK FLAG TO SEEK</div>
              </div>
            )}
          </div>
        </div>

        {/* Event strip */}
        <div className="flex flex-wrap items-center gap-2 rounded-xl border border-edge bg-surface/70 p-2 backdrop-blur">
          <Crosshair size={14} className="text-accent" />
          <span className="font-mono text-[10px] tracking-widest text-slate-500">EVENT TIMELINE</span>
          <div className="flex flex-wrap gap-1.5">
            {EVENT_MARKERS.map((marker) => (
              <button
                key={marker.id}
                onClick={() => seekTo(marker.time)}
                className={`flex items-center gap-1 rounded-md border px-1.5 py-0.5 font-mono text-[9.5px] transition hover:opacity-100 ${
                  marker.priority === 'high'
                    ? 'border-danger/40 bg-danger/10 text-red-400'
                    : marker.priority === 'medium'
                      ? 'border-warn/40 bg-warn/10 text-amber-400'
                      : 'border-accent/30 bg-accent/10 text-cyan-300'
                }`}
              >
                <span className={`h-1.5 w-1.5 rounded-full ${marker.priority === 'high' ? 'bg-danger' : marker.priority === 'medium' ? 'bg-warn' : 'bg-accent'}`} />
                @{formatTime(marker.time)} {marker.title}
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
