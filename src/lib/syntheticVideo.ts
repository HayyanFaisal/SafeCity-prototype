import { hashString, mulberry32 } from './format'
import { EVENT_MARKERS } from '../constants'
import type { EventMarkerSpec } from '../types'

const W = 640
const H = 360
const DURATION_MS = 80_000
const FPS = 10

interface Palette {
  sky: [string, string]
  roadDark: string
  buildingA: string
  buildingB: string
  trim: string
  district: string
}

const PALETTES: Record<string, Palette> = {
  'CAM-01': { sky: ['#0A1120', '#182848'], roadDark: '#232B3B', buildingA: '#151E2E', buildingB: '#1B2637', trim: '#0E7490', district: 'MAIN GATE' },
  'CAM-02': { sky: ['#08101C', '#152238'], roadDark: '#202838', buildingA: '#131D2C', buildingB: '#192335', trim: '#7C3AED', district: 'SEC A' },
  'CAM-03': { sky: ['#0A1120', '#172A3A'], roadDark: '#222A3A', buildingA: '#141E2E', buildingB: '#1A2436', trim: '#0E7490', district: 'SEC B' },
  'CAM-04': { sky: ['#0B1522', '#1A2B3E'], roadDark: '#232B3B', buildingA: '#151F30', buildingB: '#1B2639', trim: '#0891B2', district: 'SEC C' },
  'CAM-05': { sky: ['#0A1120', '#182448'], roadDark: '#211745', buildingA: '#1A1628', buildingB: '#221D33', trim: '#EF4444', district: 'CHECKPOINT' },
  'CAM-06': { sky: ['#0A1120', '#1A2A2A'], roadDark: '#222B3A', buildingA: '#141E2E', buildingB: '#1A2436', trim: '#F59E0B', district: 'MARKET' },
  'CAM-07': { sky: ['#0B1020', '#1B2933'], roadDark: '#212939', buildingA: '#131C2C', buildingB: '#192434', trim: '#10B981', district: 'SCHOOL' },
  'CAM-08': { sky: ['#0A1424', '#123A4A'], roadDark: '#1E2B3A', buildingA: '#12202E', buildingB: '#172835', trim: '#06B6D4', district: 'JAZZ PARK' },
}

const le = (a: number, b: number, t: number) => a + (b - a) * t

function drawFrame(ctx: CanvasRenderingContext2D, camId: string, t: number, rng: () => number) {
  const p = PALETTES[camId] ?? PALETTES['CAM-01']
  const vx = W / 2
  const horizon = H * 0.42

  // Sky
  const sky = ctx.createLinearGradient(0, 0, 0, horizon)
  sky.addColorStop(0, p.sky[0])
  sky.addColorStop(1, p.sky[1])
  ctx.fillStyle = sky
  ctx.fillRect(0, 0, W, horizon + 2)

  // Stars
  ctx.fillStyle = 'rgba(255,255,255,0.55)'
  for (let i = 0; i < 40; i++) {
    const sx = rng() * W
    const sy = rng() * horizon * 0.7
    const tw = 0.4 + rng() * 0.9
    ctx.globalAlpha = 0.3 + rng() * 0.5
    ctx.fillRect(sx, sy, tw, tw)
  }
  ctx.globalAlpha = 1

  // Ground
  const ground = ctx.createLinearGradient(0, horizon, 0, H)
  ground.addColorStop(0, '#0B1120')
  ground.addColorStop(1, '#0D1424')
  ctx.fillStyle = ground
  ctx.fillRect(0, horizon, W, H - horizon)

  // Road
  ctx.fillStyle = p.roadDark
  ctx.beginPath()
  ctx.moveTo(vx, horizon)
  ctx.lineTo(W * 0.93, H)
  ctx.lineTo(W * 0.07, H)
  ctx.closePath()
  ctx.fill()

  // Road edge lines
  ctx.strokeStyle = 'rgba(250,204,21,0.5)'
  ctx.lineWidth = 2
  for (const side of [-1, 1]) {
    ctx.beginPath()
    ctx.moveTo(vx + side * 6, horizon)
    ctx.lineTo(vx + side * W * 0.36, H)
    ctx.stroke()
  }

  // Lane dashes
  ctx.strokeStyle = 'rgba(255,255,255,0.35)'
  ctx.lineWidth = 3
  ctx.setLineDash([14, 22])
  ctx.beginPath()
  ctx.moveTo(vx, horizon)
  ctx.lineTo(vx, H)
  ctx.stroke()
  ctx.setLineDash([])

  // Buildings (left & right, 3 each, converging to horizon)
  const buildFacades = [
    { side: -1, offsets: [0.04, 0.16, 0.24], w: [0.1, 0.08, 0.07], h: [0.5, 0.38, 0.26] },
    { side: 1, offsets: [0.66, 0.76, 0.85], w: [0.1, 0.08, 0.07], h: [0.44, 0.34, 0.3] },
  ]
  for (const facade of buildFacades) {
    for (let bi = 0; bi < 3; bi++) {
      const bx = W * facade.offsets[bi]
      const bw = W * facade.w[bi]
      const bh = H * facade.h[bi]
      const by = horizon - bh
      ctx.fillStyle = bi % 2 === 0 ? p.buildingA : p.buildingB
      ctx.fillRect(bx, by, bw, bh)
      ctx.strokeStyle = 'rgba(255,255,255,0.07)'
      ctx.lineWidth = 1
      ctx.strokeRect(bx, by, bw, bh)

      // Windows
      const cols = 4
      const rows = 5
      for (let c = 0; c < cols; c++) {
        for (let r = 0; r < rows; r++) {
          const lit = rng() > 0.45
          if (!lit) continue
          const warm = rng() > 0.5
          ctx.fillStyle = warm ? 'rgba(255,196,90,0.75)' : 'rgba(6,182,212,0.7)'
          const ww = bw / (cols * 2.4)
          const wh = bh / (rows * 2.6)
          ctx.fillRect(bx + bw * 0.12 + c * (bw * 0.24), by + bh * 0.1 + r * (bh * 0.18), ww, wh)
        }
      }

      // District label on nearest building
      if (bi === 0) {
        ctx.fillStyle = p.trim
        ctx.font = '700 15px "JetBrains Mono", monospace'
        ctx.textAlign = 'center'
        ctx.fillText(p.district, bx + bw / 2, by + bh * 0.32)
      }
    }
  }

  // Street lamps
  ctx.fillStyle = 'rgba(250,204,21,0.85)'
  for (let i = 0; i < 5; i++) {
    const ly = le(horizon, H, i / 4)
    const lx = vx + (rng() > 0.5 ? 1 : -1) * le(14, W * 0.3, i / 4)
    ctx.beginPath()
    ctx.arc(lx, ly, i / 4 > 0.5 ? 3 : 1.6, 0, Math.PI * 2)
    ctx.fill()
  }

  // Moving car (approaching camera)
  const carDist = (t * 0.013 + rng() * 0.05) % 1
  const ease = carDist * carDist
  const carY = le(horizon, H, ease)
  const carX = vx + Math.sin(t * 0.35 + rng() * 6) * le(4, W * 0.1, ease)
  const carScale = le(0.25, 1, ease)
  const carW = 46 * carScale
  const carH = 20 * carScale
  const bodyCol = ['#64748B', '#B45309', '#1E40AF', '#9F1239', '#15803D'][Math.floor(rng() * 5)]
  ctx.save()
  ctx.translate(carX, carY)
  ctx.fillStyle = bodyCol
  ctx.fillRect(-carW / 2, -carH / 2, carW, carH)
  ctx.fillStyle = 'rgba(190,220,255,0.9)'
  ctx.fillRect(-carW / 2 + carW * 0.12, -carH / 2 - carH * 0.28, carW * 0.24, carH * 0.3)
  ctx.fillStyle = '#0B0F19'
  ctx.fillRect(-carW * 0.42, -carH * 0.22, carW * 0.14, carH * 0.4)
  ctx.fillRect(carW * 0.28, -carH * 0.22, carW * 0.14, carH * 0.4)
  ctx.fillStyle = 'rgba(255,200,60,0.95)'
  ctx.beginPath()
  ctx.arc(-carW * 0.3, carH * 0.3, carH * 0.24, 0, Math.PI * 2)
  ctx.fill()
  ctx.restore()

  // Pedestrian crossing
  const pedPhase = (t * 0.007 + rng()) % 1
  const pedY = le(horizon + 8, H * 0.85, pedPhase)
  const pedX = le(W * 0.2, W * 0.8, (t * 0.004 + rng()) % 1)
  if (pedPhase < 0.8) {
    ctx.fillStyle = '#93C5FD'
    ctx.beginPath()
    ctx.arc(pedX, pedY - 10, 4, 0, Math.PI * 2)
    ctx.fill()
    ctx.fillStyle = '#334155'
    ctx.fillRect(pedX - 2.5, pedY - 6, 5, 14)
    ctx.fillRect(pedX - 4.5, pedY + 6, 3, 7)
    ctx.fillRect(pedX + 1.5, pedY + 6, 3, 7)
  }

  // Vignette
  const vig = ctx.createRadialGradient(vx, H / 2, H * 0.3, vx, H / 2, H * 1.05)
  vig.addColorStop(0, 'rgba(0,0,0,0)')
  vig.addColorStop(1, 'rgba(0,0,0,0.55)')
  ctx.fillStyle = vig
  ctx.fillRect(0, 0, W, H)

  // Gate arch overlay for CAM-01
  if (camId === 'CAM-01') {
    ctx.strokeStyle = 'rgba(76,94,130,0.9)'
    ctx.lineWidth = 8
    ctx.beginPath()
    ctx.moveTo(W * 0.3, H)
    ctx.lineTo(W * 0.3, H * 0.55)
    ctx.quadraticCurveTo(W * 0.5, H * 0.28, W * 0.7, H * 0.55)
    ctx.lineTo(W * 0.7, H)
    ctx.stroke()
  }

  // AI event overlays
  for (const ev of EVENT_MARKERS as unknown as EventMarkerSpec[]) {
    const dt = Math.abs(t - ev.time)
    if (dt > 2.2) continue
    const intensity = 1 - dt / 2.2
    const boxColor = ev.priority === 'high' ? '#EF4444' : ev.priority === 'medium' ? '#F59E0B' : '#06B6D4'
    const bx = carX - carW / 2 - 6 + Math.sin(t * 9) * 1.5
    const by = carY - carH - 10
    ctx.strokeStyle = boxColor
    ctx.lineWidth = 2.5
    ctx.strokeRect(bx, by, carW + 12, carH + 16)
    ctx.globalAlpha = 0.12 * intensity
    ctx.fillStyle = boxColor
    ctx.fillRect(bx, by, carW + 12, carH + 16)
    ctx.globalAlpha = 1

    ctx.fillStyle = boxColor
    ctx.font = '700 12px "JetBrains Mono", monospace'
    ctx.textAlign = 'left'
    const label = `${ev.title.toUpperCase()} ${ev.confidence.toFixed(0)}%`
    const lw = ctx.measureText(label).width + 10
    ctx.fillRect(bx, by - 16, lw, 16)
    ctx.fillStyle = '#0B0F19'
    ctx.fillText(label, bx + 5, by - 4)

    // Plate readout if present
    if (ev.plate) {
      ctx.fillStyle = '#FEF3C7'
      ctx.font = '700 11px "JetBrains Mono", monospace'
      ctx.textAlign = 'center'
      ctx.fillText(`${ev.plate}`, carX, carY - carH * 0.75)
    }
  }

  // HUD
  const sec = Math.floor(t)
  const hh = String(Math.floor(sec / 3600)).padStart(2, '0')
  const mm = String(Math.floor((sec % 3600) / 60)).padStart(2, '0')
  const ss = String(sec % 60).padStart(2, '0')
  const camIp = `192.168.27.${100 + Number(camId.slice(-1))}`

  ctx.fillStyle = 'rgba(6,8,14,0.72)'
  ctx.fillRect(0, 0, W, 30)
  ctx.fillStyle = '#EF4444'
  ctx.beginPath()
  ctx.arc(16, 15, 5, 0, Math.PI * 2)
  ctx.fill()
  ctx.fillStyle = '#FCA5A5'
  ctx.font = '700 13px "JetBrains Mono", monospace'
  ctx.textAlign = 'left'
  ctx.fillText('REC', 28, 19)
  ctx.fillStyle = '#E2E8F0'
  ctx.fillText(`${camId} • ${camIp}`, 74, 19)
  ctx.textAlign = 'right'
  ctx.fillStyle = '#7DD3FC'
  ctx.fillText(`${hh}:${mm}:${ss}`, W - 12, 19)

  ctx.fillStyle = 'rgba(6,8,14,0.66)'
  ctx.fillRect(0, H - 26, W, 26)
  ctx.textAlign = 'left'
  ctx.fillStyle = '#F59E0B'
  ctx.font = '700 12px "JetBrains Mono", monospace'
  ctx.fillText('● AI-ENGINE v4.2', 10, H - 9)
  ctx.textAlign = 'right'
  ctx.fillStyle = '#64748B'
  ctx.fillText(p.district.padEnd(26, ' ·'), W - 10, H - 9)
}

function pickRecorderMime(): string {
  const candidates = ['video/webm;codecs=vp8', 'video/webm;codecs=vp8,opus', 'video/webm']
  for (const c of candidates) {
    if (typeof MediaRecorder !== 'undefined' && MediaRecorder.isTypeSupported(c)) return c
  }
  return ''
}

/**
 * Renders an 80-second synthetic CCTV clip (640x360, ~10 fps) for a camera
 * using its seeded palette, then encodes it into a playable webm blob.
 */
export function createSyntheticClip(camId: string): Promise<Blob> {
  return new Promise((resolve, reject) => {
    const canvas = document.createElement('canvas')
    canvas.width = W
    canvas.height = H
    const ctx = canvas.getContext('2d')
    if (!ctx) {
      reject(new Error('Canvas 2D unsupported'))
      return
    }
    const rng = mulberry32(hashString(camId) || 1)
    const stream = canvas.captureStream(FPS)
    const mime = pickRecorderMime()
    const recorder = new MediaRecorder(stream, mime ? { mimeType: mime, videoBitsPerSecond: 900_000 } : undefined)
    const chunks: Blob[] = []
    recorder.ondataavailable = (e) => {
      if (e.data.size > 0) chunks.push(e.data)
    }
    recorder.onstop = () => {
      resolve(new Blob(chunks, { type: mime || 'video/webm' }))
    }
    recorder.onerror = () => reject(new Error('MediaRecorder failed'))

    let t = 0
    const started = performance.now()
    const tick = () => {
      if (recorder.state === 'inactive') return
      t = (performance.now() - started) / 1000
      drawFrame(ctx, camId, Math.min(t, DURATION_MS / 1000), rng)
      if (t >= DURATION_MS / 1000) {
        recorder.stop()
        stream.getTracks().forEach((tr) => tr.stop())
        return
      }
      setTimeout(tick, 1000 / FPS)
    }

    recorder.start(500)
    tick()
  })
}
