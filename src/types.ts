export type Role = 'super-admin' | 'operator' | 'guard'

export type Severity = 'high' | 'medium' | 'low'

export type ThemeMode = 'dark' | 'light'

export type TabId =
  | 'overview'
  | 'wall'
  | 'map'
  | 'models'
  | 'forensics'
  | 'trajectory'
  | 'incidents'
  | 'cameras'

export type LayoutId = 'focus' | 'grid2x2' | 'grid3x3' | 'focus5' | 'full'

export type ReportPeriod = 'today' | 'week' | 'month' | 'year' | 'all' | 'custom'

export type ModelCategory = 'traffic' | 'behaviour' | 'safety' | 'tracking'

export interface ModelTelemetryCapture {
  timestamp: string
  cameraName: string
  confidence: number
  summary: string
  plate?: string
  plateConfidence?: number
  vehicleColor?: string
  vehicleMake?: string
  speedKmh?: number
  speedLimitKmh?: number
  deltaSpeedKmh?: number
  trackedDistanceM?: number
  hasHelmet?: boolean
  bikePlate?: string
  crowdCount?: number
  crowdThreshold?: number
  fallPostureStatus?: string
  medicalPriority?: 'URGENT' | 'MONITOR'
  wallBreachZone?: string
  intrusionVector?: string
  parkingDurationSec?: number
  noParkingZone?: string
  reverseHeadingDegrees?: number
  smokeDensityPct?: number
  fireLuminescence?: string
  accidentSeverity?: 'CRITICAL' | 'MODERATE'
  reidTrackId?: string
  trajectoryHandoff?: string[]
}

export interface AiModel {
  id: string
  name: string
  short: string
  category: ModelCategory
  severity: Severity
  description: string
  capturesList: string[]
  liveActiveDetections: number
  avgConfidence: number
  captureTelemetry: ModelTelemetryCapture[]
}

export interface ClipEvent {
  time: number
  modelId: string
  title: string
  detail: string
  confidence: number
  plate?: string
  vehicle?: string
  speed?: number
  crowdCount?: number
  telemetryExtra?: Partial<ModelTelemetryCapture>
}

export interface Camera {
  id: string
  index: number
  name: string
  zone: string
  ip: string
  videoUrl: string
  duration: number
  models: string[]
  events: ClipEvent[]
  x: number
  y: number
  customVideo?: boolean
}

export interface NewCameraInput {
  index: number
  name: string
  zone: string
  ip: string
  videoUrl: string
  models: string[]
  x: number
  y: number
}

export interface Incident {
  id: string
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
  crowdCount?: number
  acknowledged: boolean
  dispatched: boolean
  telemetryExtra?: Partial<ModelTelemetryCapture>
}

export interface Toast {
  id: string
  incidentId: string
  title: string
  detail: string
  cameraLabel: string
  severity: Severity
}

export interface CpuSpecs {
  model: string
  percent: number
  cores: number
}

export interface GpuSpecs {
  model: string
  utilPercent: number
  vramUsedMb: number
  vramTotalMb: number
  tempC: number
  cudaActive: boolean
}

export interface RamSpecs {
  usedGb: number
  totalGb: number
  percent: number
}

export interface StorageSpecs {
  usedGb: number
  totalGb: number
  percent: number
}

export interface HardwareTelemetry {
  cpu: CpuSpecs
  gpu: GpuSpecs
  ram: RamSpecs
  storage: StorageSpecs
  fps: number
}
