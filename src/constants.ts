import type { AiModel, Camera, Role, Severity } from './types'

export const SITE_NAME = 'NAVAL ANCHORAGE — ISLAMABAD / RAWALPINDI'
export const SITE_SHORT = 'PNS SafeCity'
export const SITE_TAGLINE = 'AI Command & Control Center'
export const DEFAULT_IP_PREFIX = '192.168.27'

/** Duty officer for demo WhatsApp / SMS dispatch (change freely). */
export const DUTY_OFFICER = {
  name: 'Muhammad Ammar',
  role: 'Duty Security Officer',
  phone: '+923494533107',
  // WhatsApp deep-link number (digits only, no '+' or spaces)
  whatsapp: '923494533107',
}

/** localStorage keys — single source of truth for persisted demo state. */
export const STORAGE_KEYS = {
  incidents: 'safecity.incidents.v1',
  firedEvents: 'safecity.firedEvents.v1',
  severityOverrides: 'safecity.severityOverrides.v1',
  cameraPins: 'safecity.cameraPins.v1',
  cameraVideoUrl: 'safecity.cameraVideoUrl.v1',
  mapImage: 'safecity.mapImage.v1',
} as const

export const ROLE_LABELS: Record<Role, string> = {
  'super-admin': 'System Administrator',
  operator: 'Control Room Operator',
  guard: 'Security Guard (View-Only)',
}

export const SEVERITY_META: Record<
  Severity,
  { label: string; color: string; ring: string; text: string; dot: string; badge: string }
> = {
  high: {
    label: 'CRITICAL',
    color: '#F43F5E',
    ring: 'ring-danger/60',
    text: 'text-danger',
    dot: 'bg-danger',
    badge: 'border-danger/50 bg-danger/15 text-danger',
  },
  medium: {
    label: 'WARNING',
    color: '#F59E0B',
    ring: 'ring-warn/60',
    text: 'text-warn',
    dot: 'bg-warn',
    badge: 'border-warn/50 bg-warn/15 text-warn',
  },
  low: {
    label: 'ADVISORY',
    color: '#38BDF8',
    ring: 'ring-info/50',
    text: 'text-info',
    dot: 'bg-info',
    badge: 'border-info/50 bg-info/15 text-info',
  },
}

/**
 * 8 specialised AI models. Default severity mirrors the FYP proposal:
 *  High: Fire, Weapon, Accident, Abandoned Object, ANPR-hit
 *  Medium: Speeding, Wrong-way, Underage, Crowd/Fight
 *  Low: Helmet
 */
export const AI_MODELS: AiModel[] = [
  { id: 'weapon', name: 'Weapon / Gun Detection', short: 'WEAPON', category: 'weapon', severity: 'high' },
  { id: 'fire', name: 'Fire & Smoke Detection', short: 'FIRE/SMOKE', category: 'fire', severity: 'high' },
  { id: 'accident', name: 'Road Accident / Crash', short: 'ACCIDENT', category: 'accident', severity: 'high' },
  { id: 'abandoned', name: 'Abandoned Object', short: 'ABANDONED', category: 'safety', severity: 'high' },
  { id: 'anpr', name: 'ANPR — Plate Recognition', short: 'ANPR', category: 'anpr', severity: 'high' },
  { id: 'speed', name: 'Over-speeding Detection', short: 'SPEED', category: 'traffic', severity: 'medium' },
  { id: 'wrongway', name: 'Wrong-Way Detection', short: 'WRONG-WAY', category: 'traffic', severity: 'medium' },
  { id: 'underage', name: 'Underage Driving', short: 'UNDERAGE', category: 'traffic', severity: 'medium' },
  { id: 'fight', name: 'Fight / Crowd Behaviour', short: 'FIGHT', category: 'person', severity: 'medium' },
  { id: 'helmet', name: 'Helmet Violation', short: 'HELMET', category: 'safety', severity: 'low' },
]

const V = (name: string) => `/videos/${name}`

/**
 * 8 demo cameras. Each is pre-bound to a real AI-inference video and the
 * event timestamps come directly from inputs/Timestamps.txt.
 */
export const CAMERAS: Camera[] = [
  {
    id: 'CAM-01',
    index: 1,
    name: 'Main Boulevard Gate 1',
    zone: 'Main Entrance',
    ip: '192.168.27.101',
    videoUrl: V('anpr_.mp4'),
    duration: 20,
    models: ['anpr', 'speed'],
    x: 50,
    y: 93,
    events: [
      { time: 3, modelId: 'anpr', title: 'ANPR Plate Captured', detail: 'License plate LEB-4471 recognised at Gate 1', confidence: 97.4, plate: 'LEB-4471', vehicle: 'Toyota Corolla — White' },
      { time: 9, modelId: 'anpr', title: 'ANPR Watch-List Hit', detail: 'Plate matched restricted watch-list entry', confidence: 98.9, plate: 'RIY-1188', vehicle: 'Honda Civic — Black' },
    ],
  },
  {
    id: 'CAM-02',
    index: 2,
    name: 'Sector A — Jamia Mosque Rd',
    zone: 'Sector A',
    ip: '192.168.27.102',
    videoUrl: V('fire_and_smoke.mp4'),
    duration: 12,
    models: ['fire'],
    x: 30,
    y: 40,
    events: [
      { time: 1, modelId: 'fire', title: 'Fire & Smoke Detected', detail: 'Early-stage fire signature near Sector A rooftop', confidence: 96.1 },
    ],
  },
  {
    id: 'CAM-03',
    index: 3,
    name: 'Sector B — Community Park',
    zone: 'Sector B',
    ip: '192.168.27.103',
    videoUrl: V('weapon(1)_.mp4'),
    duration: 10,
    models: ['weapon'],
    x: 66,
    y: 38,
    events: [
      { time: 1, modelId: 'weapon', title: 'Weapon Detected', detail: 'Handgun profile flagged in public park area', confidence: 95.7 },
    ],
  },
  {
    id: 'CAM-04',
    index: 4,
    name: 'Service Rd — Sector C Junction',
    zone: 'Sector C',
    ip: '192.168.27.104',
    videoUrl: V('accident.mp4'),
    duration: 14,
    models: ['accident'],
    x: 82,
    y: 36,
    events: [
      { time: 3, modelId: 'accident', title: 'Road Accident Detected', detail: 'Vehicle collision at Sector C junction', confidence: 94.3 },
      { time: 10, modelId: 'accident', title: 'Secondary Impact', detail: 'Follow-up collision — dispatch recommended', confidence: 92.8 },
    ],
  },
  {
    id: 'CAM-05',
    index: 5,
    name: 'Security Checkpoint — Sector D',
    zone: 'Sector D',
    ip: '192.168.27.105',
    videoUrl: V('helmet_violation(1)_.mp4'),
    duration: 18,
    models: ['helmet', 'anpr'],
    x: 39,
    y: 58,
    events: [
      { time: 3, modelId: 'helmet', title: 'Helmet Violation', detail: 'Motorcyclist detected without helmet', confidence: 91.2, plate: 'RWP-9918', vehicle: 'Honda CD-70 — Red' },
      { time: 13, modelId: 'helmet', title: 'Helmet Violation', detail: 'Second rider without protective helmet', confidence: 90.4, plate: 'RWP-2231', vehicle: 'Suzuki GS-150 — Blue' },
    ],
  },
  {
    id: 'CAM-06',
    index: 6,
    name: 'Market Road — Sector E',
    zone: 'Sector E',
    ip: '192.168.27.106',
    videoUrl: V('speed_estimation_.mp4'),
    duration: 15,
    models: ['speed', 'anpr'],
    x: 66,
    y: 63,
    events: [
      { time: 3, modelId: 'speed', title: 'Over-speeding Violation', detail: 'Vehicle at 68 km/h in 40 km/h zone', confidence: 95.2, plate: 'JW-4451', vehicle: 'Honda Civic — Silver', speed: 68 },
    ],
  },
  {
    id: 'CAM-07',
    index: 7,
    name: 'School Gate — Sector H',
    zone: 'Sector H',
    ip: '192.168.27.107',
    videoUrl: V('fight_detection_output.mp4'),
    duration: 12,
    models: ['fight'],
    x: 56,
    y: 78,
    events: [
      { time: 3, modelId: 'fight', title: 'Fight / Altercation', detail: 'Physical altercation detected near school gate', confidence: 89.6 },
    ],
  },
  {
    id: 'CAM-08',
    index: 8,
    name: 'Central Plaza — Parking Bay',
    zone: 'Commercial',
    ip: '192.168.27.108',
    videoUrl: V('abandoned_object_.mp4'),
    duration: 30,
    models: ['abandoned'],
    x: 82,
    y: 80,
    events: [
      { time: 10, modelId: 'abandoned', title: 'Abandoned Object', detail: 'Unattended bag detected in parking bay', confidence: 93.5 },
      { time: 26, modelId: 'abandoned', title: 'Abandoned Object — Confirmed', detail: 'Object unattended 45+ sec — potential threat', confidence: 96.2 },
    ],
  },
]

/** Extra selectable clips for switching a camera's stream (Models page). */
export const EXTRA_VIDEOS: { label: string; url: string }[] = [
  { label: 'Wrong-way Driving', url: V('wrongway.mp4') },
  { label: 'Underage Driver', url: V('underage(1).mp4') },
  { label: 'Accident (alt)', url: V('accident_detection_output.mp4') },
  { label: 'Fire & Smoke (alt)', url: V('fire_and_smoke(1)_.mp4') },
  { label: 'Helmet (raw)', url: V('helmet_violation_detection_raw.mp4') },
  { label: 'Helmet (alt)', url: V('helmet_violation.mp4') },
]

/** Directed topological graph edges (camera adjacency) for the map + pruning demo. */
export const CAMERA_EDGES: [string, string][] = [
  ['CAM-01', 'CAM-05'],
  ['CAM-05', 'CAM-02'],
  ['CAM-05', 'CAM-06'],
  ['CAM-06', 'CAM-03'],
  ['CAM-03', 'CAM-04'],
  ['CAM-06', 'CAM-08'],
  ['CAM-01', 'CAM-07'],
  ['CAM-07', 'CAM-06'],
]

/** Society zones drawn on the tactical map. */
export const MAP_ZONES = [
  { id: 'A', label: 'Sector A', x: 14, y: 22, w: 30, h: 26, color: '#123a5e' },
  { id: 'B', label: 'Sector B', x: 52, y: 20, w: 30, h: 24, color: '#0f3a53' },
  { id: 'C', label: 'Sector C', x: 70, y: 26, w: 22, h: 20, color: '#123a5e' },
  { id: 'D', label: 'Sector D', x: 20, y: 50, w: 26, h: 22, color: '#0e3348' },
  { id: 'E', label: 'Sector E — Market', x: 52, y: 52, w: 26, h: 20, color: '#123a5e' },
  { id: 'H', label: 'Sector H — School', x: 44, y: 72, w: 26, h: 18, color: '#0f3a53' },
  { id: 'COM', label: 'Central Plaza', x: 72, y: 70, w: 22, h: 20, color: '#14405f' },
]
