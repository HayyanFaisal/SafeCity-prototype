import type { EventMarkerSpec, Role } from './types'

export const ROLE_LABELS: Record<Role, string> = {
  'super-admin': 'Super Admin',
  operator: 'Operator / Analyst',
  guard: 'Security Guard (View-Only)',
}

export const SITE_NAME = 'NAVAL ANCHORAGE / PINDI HOUSING SOCIETY'
export const SITE_SHORT = 'AI SAFE CITY — COMMAND CENTER'
export const DEFAULT_IP_PREFIX = '192.168.27'

export const AI_MODEL_SEEDS = [
  { id: 'gun', name: 'Gun / Weapon Detection', short: 'GUN', category: 'weapon', icon: 'siren' },
  { id: 'fire', name: 'Fire & Smoke Detection', short: 'FIRE', category: 'fire', icon: 'flame' },
  { id: 'unattended', name: 'Unattended Object / Bomb Threat', short: 'BOMB', category: 'safety', icon: 'shield' },
  { id: 'crash', name: 'Vehicle Crash / Accident', short: 'CRASH', category: 'traffic', icon: 'crosshair' },
  { id: 'crowd', name: 'Crowd Gathering / Fights', short: 'CROWD', category: 'person', icon: 'usercheck' },
  { id: 'helmet', name: 'Helmet Missing', short: 'HELMET', category: 'safety', icon: 'shield' },
  { id: 'speed', name: 'Over-speeding', short: 'SPEED', category: 'traffic', icon: 'car' },
  { id: 'anpr', name: 'ANPR — Plate Recognition', short: 'ANPR', category: 'anpr', icon: 'car' },
] as const

export const DEFAULT_MODEL_ACTIVE: Record<string, boolean> = {
  gun: true,
  fire: true,
  unattended: true,
  crash: true,
  crowd: true,
  helmet: false,
  speed: true,
  anpr: true,
}

/** Cameras that ship with the demo dataset (pins + sample videos are code-generated). */
export const CAMERA_SEEDS = [
  { id: 'CAM-01', name: 'Main Entrance Gate', ip: '192.168.27.101', x: 50, y: 95.5 },
  { id: 'CAM-02', name: 'Sector A — Main Entrance', ip: '192.168.27.102', x: 31, y: 38 },
  { id: 'CAM-03', name: 'Sector B — Mid Junction', ip: '192.168.27.103', x: 66, y: 38 },
  { id: 'CAM-04', name: 'Sector C — North Plaza', ip: '192.168.27.104', x: 83, y: 37 },
  { id: 'CAM-05', name: 'Security Checkpoint', ip: '192.168.27.105', x: 38.8, y: 41.5 },
  { id: 'CAM-06', name: 'Sector E — Market Road', ip: '192.168.27.106', x: 66, y: 64 },
  { id: 'CAM-07', name: 'Sector H — School Gate', ip: '192.168.27.107', x: 56, y: 78 },
  { id: 'CAM-08', name: 'Jazz Park Lake View', ip: '192.168.27.108', x: 82.5, y: 80 },
] as const

/** 80-second demo incident timeline shared by every bound stream. */
export const EVENT_MARKERS: EventMarkerSpec[] = [
  { id: 'evt-01', time: 5, title: 'Speed Violation', detail: 'Vehicle exceeded 55 km/h within society limit', confidence: 94.2, modelId: 'speed', priority: 'low', plate: 'ABC-1234', vehicle: 'Toyota Corolla — Silver', fined: true },
  { id: 'evt-02', time: 12, title: 'Gun Detected', detail: 'Handgun profile flagged near Sector A Entrance', confidence: 98.7, modelId: 'gun', priority: 'high' },
  { id: 'evt-03', time: 21, title: 'Helmet Missing', detail: 'Rider detected without protective helmet', confidence: 91.4, modelId: 'helmet', priority: 'low', plate: 'RWP-9918', vehicle: 'Honda CD-70 — Red', fined: true },
  { id: 'evt-04', time: 32, title: 'Crowd Gathering', detail: 'Aggregate detection: 16+ persons forming crowd', confidence: 87.6, modelId: 'crowd', priority: 'medium' },
  { id: 'evt-05', time: 45, title: 'Speed Violation', detail: 'Vehicle exceeded 55 km/h inside society limit', confidence: 95.8, modelId: 'speed', priority: 'low', plate: 'JW-4451', vehicle: 'Honda Civic — White', fined: true },
  { id: 'evt-06', time: 56, title: 'ANPR Hit — Person of Interest', detail: 'Plate matched watch list: ABC-1234', confidence: 99.1, modelId: 'anpr', priority: 'medium', plate: 'ABC-1234', vehicle: 'Toyota Corolla — Silver' },
  { id: 'evt-07', time: 67, title: 'Fire & Smoke', detail: 'Smoke plume detected near Sector E Market Road', confidence: 96.3, modelId: 'fire', priority: 'high' },
  { id: 'evt-08', time: 75, title: 'Unattended Object', detail: 'Suspicious bag left unattended 45+ seconds', confidence: 93.9, modelId: 'unattended', priority: 'high' },
] as const

export const TRAJECTORY_CAMERA_STOPS = [
  'CAM-02 Sector A — Main Entrance',
  'CAM-05 Security Checkpoint',
  'CAM-06 Sector E — Market Road',
  'CAM-01 Main Entrance Gate',
]
