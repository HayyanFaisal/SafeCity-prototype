import type { Camera, Incident, Severity } from '../types'

/**
 * Deterministic seed incidents for the Analytics page.
 *
 * The live demo only generates events for the current session, so the
 * weekly / monthly / yearly views would otherwise appear empty. This module
 * fabricates a realistic historical incident history (past 365 days) using a
 * seeded PRNG — the same dates are produced on every page load so charts stay
 * stable. Live-session incidents (real timestamps, from this session) are
 * merged on top by the caller.
 */

const MODEL_TITLES: Array<{
  modelId: string
  title: string
  details: string[]
  weight: number
}> = [
  {
    modelId: 'anpr',
    title: 'ANPR — Plate Recognition',
    details: [
      'Plate read at 98.3% confidence during routine patrol pass',
      'Plate read at 96.8% confidence at Gate-I entry lane',
      'Plate read at 95.4% confidence at security checkpoint',
    ],
    weight: 14,
  },
  {
    modelId: 'speed',
    title: 'Over-speeding Violation',
    details: [
      'Vehicle at 74 km/h in 40 km/h zone',
      'Vehicle at 81 km/h in 50 km/h zone',
      'Vehicle at 67 km/h near school zone',
    ],
    weight: 16,
  },
  {
    modelId: 'helmet',
    title: 'Helmet Violation',
    details: [
      'Motorcyclist detected without helmet',
      'Rider and pillion without protective helmets',
    ],
    weight: 15,
  },
  {
    modelId: 'wrongway',
    title: 'Wrong-Way Driving',
    details: [
      'Vehicle travelling against one-way traffic at Sector B junction',
      'Wrong-way entry detected at Gate-V Nishtar',
    ],
    weight: 11,
  },
  {
    modelId: 'underage',
    title: 'Underage Driving',
    details: [
      'Underage driver flagged near school gate',
      'Minor operating motorcycle without licence',
    ],
    weight: 9,
  },
  {
    modelId: 'fight',
    title: 'Fight / Altercation',
    details: [
      'Physical altercation detected near community park',
      'Crowd gathering flagged at Central Plaza',
    ],
    weight: 8,
  },
  {
    modelId: 'weapon',
    title: 'Weapon Detected',
    details: [
      'Handgun profile flagged in public area',
      'Rifle-shaped object detected near parking bay',
    ],
    weight: 5,
  },
  {
    modelId: 'fire',
    title: 'Fire & Smoke Detected',
    details: [
      'Early-stage fire signature near rooftop',
      'Smoke column detected at market road',
    ],
    weight: 4,
  },
  {
    modelId: 'accident',
    title: 'Road Accident Detected',
    details: [
      'Vehicle collision at Sector C junction',
      'Two-wheeler fall detected at roundabout',
    ],
    weight: 6,
  },
  {
    modelId: 'abandoned',
    title: 'Abandoned Object',
    details: [
      'Unattended bag detected in public area',
      'Object unattended 45+ seconds — potential threat',
    ],
    weight: 4,
  },
]

const SEVERITY_BY_MODEL: Record<string, Severity> = {
  weapon: 'high',
  fire: 'high',
  accident: 'high',
  abandoned: 'high',
  anpr: 'high',
  speed: 'medium',
  wrongway: 'medium',
  underage: 'medium',
  fight: 'medium',
  helmet: 'low',
}

const PLATES_CAR = [
  'JW-4451', 'LEB-4471', 'RIY-1188', 'ISD-2201', 'RWP-7733',
  'KHI-9071', 'LHR-3340', 'ISD-8812', 'RWP-1144', 'JW-6559',
]
const PLATES_BIKE = ['RWP-9918', 'RWP-2231', 'ISD-6620', 'RWP-4517', 'ISD-3302']
const VEHICLES = [
  'Honda Civic — Silver', 'Toyota Corolla — White', 'Suzuki Alto — Grey',
  'Honda City — Black', 'KIA Sportage — Blue', 'Toyota Fortuner — White',
  'Suzuki Cultus — Red', 'Honda Vezel — Black',
]
const BIKES = ['Honda CD-70 — Red', 'Suzuki GS-150 — Blue', 'Honda CG-125 — Black']
const ZONES = [
  'Gate-I Jinnah', 'Block A', 'Block B / Roundabout', 'Block D',
  'Gate-V Nishtar', 'Block E', 'Block H', 'Central Plaza',
]

/* ── Small deterministic PRNG (mulberry32) ─────────────────────────────────── */
function mulberry32(seed: number): () => number {
  let a = seed >>> 0
  return () => {
    a |= 0
    a = (a + 0x6d2b79f5) | 0
    let t = Math.imul(a ^ (a >>> 15), 1 | a)
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

/* ── Helpers ───────────────────────────────────────────────────────────────── */
const YEAR_MS = 365 * 24 * 3600 * 1000
const HOUR_MS = 3600 * 1000

function pick<T>(rnd: () => number, arr: T[]): T {
  return arr[Math.floor(rnd() * arr.length) % arr.length]
}

function weightedModel(rnd: () => number): (typeof MODEL_TITLES)[number] {
  const total = MODEL_TITLES.reduce((sum, m) => sum + m.weight, 0)
  let hit = rnd() * total
  for (const m of MODEL_TITLES) {
    hit -= m.weight
    if (hit <= 0) return m
  }
  return MODEL_TITLES[0]
}

/** Two-wheeler models read motorbike plates/vehicles. */
function isTwoWheeler(modelId: string): boolean {
  return modelId === 'helmet' || modelId === 'underage'
}

function hourOfDay(rnd: () => number): number {
  // Heavier traffic during morning/evening peaks — shape a believable curve.
  const u = rnd()
  if (u < 0.18) return 7 + Math.floor(rnd() * 3) // 07–09
  if (u < 0.34) return 16 + Math.floor(rnd() * 4) // 16–19
  if (u < 0.5) return 10 + Math.floor(rnd() * 3) // 10–12
  if (u < 0.64) return 13 + Math.floor(rnd() * 3) // 13–15
  return Math.floor(rnd() * 24)
}

/**
 * Build the synthetic 365-day incident history.
 * `now` anchors the generation so the data always covers "the last year" up to
 * the current moment (live incidents from this session happened after this).
 */
export function buildSeedIncidents(now: number, cameras: Camera[]): Incident[] {
  const rnd = mulberry32(20260804)
  const out: Incident[] = []
  const end = now - 6 * HOUR_MS // don't collide with today's live session

  for (let dayOffset = 1; dayOffset <= 365; dayOffset++) {
    const dayStart = end - dayOffset * 24 * HOUR_MS
    const weekday = new Date(dayStart).getDay()
    // Weekend days are calmer; mid-week heavier.
    const baseCount = weekday === 0 || weekday === 6 ? 5 : 9
    const count = baseCount + Math.floor(rnd() * 6)

    for (let i = 0; i < count; i++) {
      const model = weightedModel(rnd)
      const cam = pick(rnd, cameras)
      const hour = hourOfDay(rnd)
      const minute = Math.floor(rnd() * 60)
      const second = Math.floor(rnd() * 60)
      const firedAt = dayStart + hour * HOUR_MS + minute * 60_000 + second * 1000

      const detail = pick(rnd, model.details)
      const hasVehicleData =
        model.modelId === 'anpr' || model.modelId === 'speed' || model.modelId === 'helmet'
      const plate = hasVehicleData
        ? pick(rnd, isTwoWheeler(model.modelId) ? PLATES_BIKE : PLATES_CAR)
        : undefined
      const vehicle = hasVehicleData
        ? pick(rnd, isTwoWheeler(model.modelId) ? BIKES : VEHICLES)
        : undefined
      const speedVal = model.modelId === 'speed' ? 62 + Math.floor(rnd() * 24) : undefined

      const inc: Incident = {
        id: `seed-${dayOffset}-${i}`,
        firedAt,
        clockLabel: new Date(firedAt).toLocaleString('en-GB', { hour12: false }),
        cameraId: cam.id,
        cameraIndex: cam.index,
        cameraName: cam.name,
        zone: cam.zone,
        ip: cam.ip,
        modelId: model.modelId,
        event: model.title,
        detail,
        severity: SEVERITY_BY_MODEL[model.modelId] ?? 'low',
        confidence: 88 + Math.floor(rnd() * 11),
        plate,
        vehicle,
        speed: speedVal,
        acknowledged: rnd() > 0.3,
        dispatched: rnd() > 0.55,
      }
      out.push(inc)
    }
  }
  return out
}

/** Deterministic daily totals used by the "last 90 days" trend seeding hook. */
export function buildSeedDailyTotals(now: number): { day: string; count: number }[] {
  const rnd = mulberry32(19920715)
  const rows: { day: string; count: number }[] = []
  for (let i = 89; i >= 0; i--) {
    const d = new Date(now - i * 24 * HOUR_MS)
    rows.push({
      day: d.toLocaleDateString('en-GB', { day: '2-digit', month: 'short' }),
      count: 5 + Math.floor(rnd() * 13),
    })
  }
  return rows
}

/** Unused-import guard for consumers that want the constant list. */
export function zoneListFor(cameras: Camera[]): string[] {
  return Array.from(new Set(cameras.map((c) => c.zone))).length > 0
    ? cameras.map((c) => c.zone)
    : ZONES
}

export const SEED_CONSTANTS = { YEAR_MS, HOUR_MS, ZONES }
