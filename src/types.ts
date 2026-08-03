export type Role = 'super-admin' | 'operator' | 'guard'

export type Severity = 'high' | 'medium' | 'low'

export type TabId = 'wall' | 'map' | 'analytics' | 'incidents' | 'models' | 'trajectory'

/**
 * Layout presets supported by the Live Wall.
 *  - focus    : 1 Main + 6 Peripheral (default)
 *  - grid2x2  : 2×2 grid (4 streams)
 *  - grid3x3  : 3×3 grid (9 streams)
 *  - focus5   : 1 Main + 4 Split
 *  - full     : Single Main Fullscreen
 */
export type LayoutId = 'focus' | 'grid2x2' | 'grid3x3' | 'focus5' | 'full'

/** Reporting period used by Analytics / Incident Log / PDF export. */
export type ReportPeriod = 'today' | 'week' | 'month' | 'all' | 'custom'

export type ModelCategory =
  | 'weapon'
  | 'fire'
  | 'traffic'
  | 'safety'
  | 'anpr'
  | 'person'
  | 'accident'

export interface AiModel {
  id: string
  name: string
  short: string
  category: ModelCategory
  /** default severity per FYP proposal; user can override */
  severity: Severity
}

/** A model firing at a specific second inside a looping camera clip. */
export interface ClipEvent {
  /** seconds into the clip */
  time: number
  modelId: string
  title: string
  detail: string
  confidence: number
  plate?: string
  vehicle?: string
  speed?: number
}

export interface Camera {
  id: string
  /** display number e.g. 1 => CAM 1 */
  index: number
  name: string
  zone: string
  ip: string
  /** looping demo video from /videos */
  videoUrl: string
  /** duration hint (sec) for looping */
  duration: number
  /** AI models running on this camera */
  models: string[]
  /** events fired by this camera's clip */
  events: ClipEvent[]
  /** map position 0..100 */
  x: number
  y: number
  /** true when the bound video was user-uploaded (blob URL, not persisted) */
  customVideo?: boolean
}

export interface Incident {
  id: string
  /** wall-clock ISO when it fired */
  firedAt: number
  clockLabel: string
  cameraId: string
  cameraIndex: number
  cameraName: string
  zone: string
  ip: string
  modelId: string
  event: string
  detail: string
  severity: Severity
  confidence: number
  plate?: string
  vehicle?: string
  speed?: number
  acknowledged: boolean
  dispatched: boolean
}

export interface Toast {
  id: string
  incidentId: string
  title: string
  detail: string
  cameraLabel: string
  severity: Severity
}
