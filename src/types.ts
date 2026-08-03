export type Role = 'super-admin' | 'operator' | 'guard'

export type Priority = 'high' | 'medium' | 'low'

export type Severity = Priority

export type TabId = 'grid' | 'map' | 'forensics' | 'trajectory' | 'incidents'

export type GridLayoutId = 'hikvision' | 'grid2x2' | 'grid3x3' | 'single'

export interface AiModel {
  id: string
  name: string
  short: string
  category: 'weapon' | 'fire' | 'traffic' | 'safety' | 'anpr' | 'person'
  icon: 'siren' | 'flame' | 'crosshair' | 'car' | 'usercheck' | 'shield'
  active: boolean
}

export interface EventMarkerSpec {
  id: string
  /** Seconds into the demo timeline */
  time: number
  title: string
  detail: string
  confidence: number
  /** Model class that detected this event */
  modelId: string
  /** Priority drives the alert response, or verified */
  priority: Priority
  /** Optional forensic evidence (fine/plate/vehicle) */
  plate?: string
  vehicle?: string
  fined?: boolean
}

export interface Camera {
  id: string
  name: string
  ip: string
  /** URL.createObjectURL result for the bound .mp4 */
  videoUrl: string | null
  fileName: string | null
  enabledModels: string[]
  verifiedEvents: string[]
}

export interface CameraPin {
  id: string
  /** 0..100 relative coordinates on the map */
  x: number
  y: number
  cameraId: string
}

export interface Stream {
  /** Tile position (0-8) */
  slot: number
  cameraId: string | null
}

export interface Toast {
  id: string
  markerId: string
  cameraId: string
  title: string
  detail: string
  time: number
  priority: 'medium' | 'low'
}

export interface AlertSnapshot {
  parentId: number
  slot: number
  markerId: string
  cameraId: string
}

export interface IncidentLogRow {
  id: string
  severity: Severity
  timestamp: string
  cameraId: string
  ip: string
  cameraName: string
  event: string
  modelId: string
  confidence: number
  plate?: string
  vehicle?: string
  fined?: boolean
  time: number
}
