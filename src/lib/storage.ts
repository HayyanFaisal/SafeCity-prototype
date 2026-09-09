import { STORAGE_KEYS } from '../constants'
import type { Camera, Incident, Severity } from '../types'

/**
 * Safe localStorage wrapper — all persistence for the demo lives here.
 * Every value is JSON-serialized and guarded against quota/parse errors so a
 * corrupted entry can never crash the app (it just falls back to the default).
 */

export function loadJSON<T>(key: string, fallback: T): T {
  try {
    const raw = localStorage.getItem(key)
    if (!raw) return fallback
    return JSON.parse(raw) as T
  } catch {
    // corrupted / unavailable storage — use the provided default
    return fallback
  }
}

export function saveJSON(key: string, value: unknown): void {
  try {
    localStorage.setItem(key, JSON.stringify(value))
  } catch {
    // storage full / disabled — demo continues in-memory only
  }
}

export function loadIncidents(): Incident[] {
  const list = loadJSON<Incident[]>(STORAGE_KEYS.incidents, [])
  if (!Array.isArray(list)) return []
  // sanity: only accept well-formed records
  const valid = list.filter(
    (i) => i && typeof i.firedAt === 'number' && typeof i.cameraId === 'string',
  )
  // item 9: single source of truth — drop duplicate rows by id AND by the
  // natural key (cameraId + modelId + firedAt) to clean up legacy dupes.
  const seenIds = new Set<string>()
  const seenKeys = new Set<string>()
  const deduped: Incident[] = []
  for (const inc of valid) {
    if (seenIds.has(inc.id)) continue
    seenIds.add(inc.id)
    const natural = `${inc.cameraId}:${inc.modelId}:${inc.firedAt}`
    if (seenKeys.has(natural)) continue
    seenKeys.add(natural)
    deduped.push(inc)
  }
  return deduped
}

export function saveIncidents(incidents: Incident[]): void {
  saveJSON(STORAGE_KEYS.incidents, incidents)
}

export function loadSeverityOverrides(): Record<string, Severity> {
  return loadJSON<Record<string, Severity>>(STORAGE_KEYS.severityOverrides, {})
}

export function saveSeverityOverrides(overrides: Record<string, Severity>): void {
  saveJSON(STORAGE_KEYS.severityOverrides, overrides)
}

export function loadFiredKeys(): string[] {
  const keys = loadJSON<string[]>(STORAGE_KEYS.firedEvents, [])
  return Array.isArray(keys) ? keys : []
}

export function saveFiredKeys(keys: string[]): void {
  saveJSON(STORAGE_KEYS.firedEvents, keys)
}

/** Persisted camera pin positions (x/y only, per prompt: config persists like severity). */
export function loadCameraPins(): Partial<Record<string, { x: number; y: number }>> {
  return loadJSON<Partial<Record<string, { x: number; y: number }>>>(STORAGE_KEYS.cameraPins, {})
}

export function saveCameraPins(
  pins: Partial<Record<string, { x: number; y: number }>>,
): void {
  saveJSON(STORAGE_KEYS.cameraPins, pins)
}

/**
 * Persisted per-camera video URL override (only for non-blob, server paths —
 * blob object URLs are not persisted because they die with the page session).
 */
export function loadCameraVideoUrls(): Partial<Record<string, string>> {
  return loadJSON<Partial<Record<string, string>>>(STORAGE_KEYS.cameraVideoUrl, {})
}

export function saveCameraVideoUrl(camId: string, url: string): void {
  const all = loadCameraVideoUrls()
  all[camId] = url
  saveJSON(STORAGE_KEYS.cameraVideoUrl, all)
}

export function loadMapImage(): string | null {
  try {
    return localStorage.getItem(STORAGE_KEYS.mapImage)
  } catch {
    return null
  }
}

export function saveMapImage(dataUrl: string | null): void {
  try {
    if (dataUrl) localStorage.setItem(STORAGE_KEYS.mapImage, dataUrl)
    else localStorage.removeItem(STORAGE_KEYS.mapImage)
  } catch {
    // ignore quota errors — map image simply won't persist across reloads
  }
}

/* ── Camera CRUD persistence (Camera Management page) ──────────────────────── */

/**
 * Load the persisted camera catalogue (full Camera[] state incl. positions).
 * Returns `null` when never saved (fall back to built-in defaults); an empty
 * array is valid — the admin may have deleted every camera.
 */
export function loadCameraCatalogue(): Camera[] | null {
  const raw = localStorage.getItem(STORAGE_KEYS.cameras)
  if (!raw) return null
  const list = loadJSON<Camera[]>(STORAGE_KEYS.cameras, [])
  if (!Array.isArray(list)) return null
  return list.filter((c) => c && typeof c.id === 'string' && typeof c.index === 'number')
}

export function saveCameraCatalogue(cameras: Camera[]): void {
  saveJSON(STORAGE_KEYS.cameras, cameras)
}

/** Next sequential CAM number for newly added cameras (monotonic counter). */
export function loadCameraSequence(): number {
  const n = loadJSON<number>(STORAGE_KEYS.cameraSequence, 8)
  return typeof n === 'number' && Number.isFinite(n) ? n : 8
}

export function saveCameraSequence(seq: number): void {
  saveJSON(STORAGE_KEYS.cameraSequence, seq)
}

/** Convenience for camera pin round-tripping. */
export function pinOf(cam: Camera): { x: number; y: number } {
  return { x: cam.x, y: cam.y }
}
