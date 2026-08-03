import React, { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react'
import type {
  AiModel,
  AlertSnapshot,
  Camera,
  CameraPin,
  GridLayoutId,
  IncidentLogRow,
  Priority,
  Role,
  Stream,
  TabId,
  Toast,
} from '../types'
import {
  AI_MODEL_SEEDS,
  CAMERA_SEEDS,
  DEFAULT_MODEL_ACTIVE,
  EVENT_MARKERS,
  DEFAULT_IP_PREFIX,
} from '../constants'
import { createSyntheticClip } from '../lib/syntheticVideo'
import { playSiren, stopSiren } from '../lib/audio'

const SEED_PARENT = 7

export interface PriorityBuckets {
  high: string[]
  medium: string[]
  low: string[]
}

interface ModelEditor {
  models: AiModel[]
  toggle: (id: string) => void
  setEnabledForCamera: (cameraId: string, modelId: string, on: boolean) => void
}

interface AppStateValue {
  // RBAC
  role: Role
  setRole: (r: Role) => void
  canEditMaps: boolean
  canEditSettings: boolean
  canAssignModels: boolean

  // Tabs + drawers
  tab: TabId
  setTab: (t: TabId) => void
  settingsOpen: boolean
  setSettingsOpen: (v: boolean) => void
  modelDrawerOpen: boolean
  setModelDrawerOpen: (v: boolean) => void

  // Grid
  layout: GridLayoutId
  setLayout: (l: GridLayoutId) => void
  streams: Stream[]
  isMasterPlaying: boolean
  setMasterPlaying: (v: boolean) => void
  mountFileToSlot: (slot: number, file: File) => void
  unmountSlot: (slot: number) => void
  swapSlots: (a: number, b: number) => void
  bootDemo: () => void
  demoBusy: boolean

  // Cameras + map
  cameras: Camera[]
  pins: CameraPin[]
  draftPin: { x: number; y: number; cameraId: string; isNew: boolean } | null
  beginPlot: (x: number, y: number) => void
  savePin: (cameraId: string, x: number, y: number, isNew: boolean) => void
  deleteDraft: () => void
  deletePin: (pinId: string) => void
  updateCamera: (cameraId: string, patch: Partial<Camera>) => void
  mapImageUrl: string | null
  mapImageName: string | null
  uploadMapImage: (file: File) => void
  restoreDefaultMap: () => void
  getCamera: (id: string | null) => Camera | null
  findPinByCamera: (cameraId: string) => CameraPin | undefined
  canPlacePin: boolean

  // Forensic
  focusedCameraId: string | null
  openForensics: (cameraId: string) => void
  closeForensics: () => void
  focusStream: (cameraId: string) => void
  forensicSeek: number | null
  setForensicSeek: (time: number | null) => void

  // Model manager & assignment drawer
  modelEditor: ModelEditor
  priorityBuckets: PriorityBuckets
  setPriorityBuckets: (b: PriorityBuckets) => void
  priorityOf: (modelId: string) => Priority

  // Alerts
  alertModal: AlertSnapshot | null
  acknowledgeAlert: () => void
  toasts: Toast[]
  dismissToast: (id: string) => void
  soundEnabled: boolean
  setSoundEnabled: (v: boolean) => void

  // Incident log
  incidentRows: IncidentLogRow[]

  // Media
  generateClip: (cameraId: string) => Promise<Blob>
  revokeCameras: () => void
}

const AppContext = createContext<AppStateValue | null>(null)

function initCameras(): Camera[] {
  return CAMERA_SEEDS.map((seed) => ({
    id: seed.id,
    name: seed.name,
    ip: seed.ip,
    videoUrl: null,
    fileName: null,
    enabledModels: Object.keys(DEFAULT_MODEL_ACTIVE).filter((m) => DEFAULT_MODEL_ACTIVE[m]),
    verifiedEvents: [],
  }))
}

function initPins(): CameraPin[] {
  return CAMERA_SEEDS.map((seed, i) => ({
    id: `pin-${i + 1}`,
    x: seed.x,
    y: seed.y,
    cameraId: seed.id,
  }))
}

function buildIncidentRows(cameras: Camera[], firedAt: string): IncidentLogRow[] {
  const rows: IncidentLogRow[] = []
  for (const marker of EVENT_MARKERS) {
    const camera = cameras.find((c) => c.enabledModels.includes(marker.modelId))
    if (!camera) continue
    rows.push({
      id: marker.id,
      severity: marker.priority,
      timestamp: firedAt,
      cameraId: camera.id,
      ip: camera.ip,
      cameraName: camera.name,
      event: marker.title,
      modelId: marker.modelId,
      confidence: marker.confidence,
      plate: marker.plate,
      vehicle: marker.vehicle,
      fined: marker.fined,
      time: marker.time,
    })
  }
  return rows.sort((a, b) => a.time - b.time)
}

export function AppProvider({ children }: { children: React.ReactNode }) {
  const [role, setRole] = useState<Role>('super-admin')
  const [tab, setTab] = useState<TabId>('grid')

  // Drawers
  const [settingsOpen, setSettingsOpen] = useState(false)
  const [modelDrawerOpen, setModelDrawerOpen] = useState(false)

  // Cameras / map
  const [cameras, setCameras] = useState<Camera[]>(initCameras)
  const [pins, setPins] = useState<CameraPin[]>(initPins)
  const [draftPin, setDraftPin] = useState<{ x: number; y: number; cameraId: string; isNew: boolean } | null>(null)
  const [mapImageUrl, setMapImageUrl] = useState<string | null>('/society-map.svg')
  const [mapImageName, setMapImageName] = useState<string | null>('society-map.svg (default)')

  // Grid
  const [layout, setLayout] = useState<GridLayoutId>('hikvision')
  const [streams, setStreams] = useState<Stream[]>(() =>
    Array.from({ length: 9 }, (_, slot) => ({ slot, cameraId: null })),
  )
  const [isMasterPlaying, setMasterPlaying] = useState(false)
  const [demoBusy, setDemoBusy] = useState(false)

  // Forensics
  const [focusedCameraId, setFocusedCameraId] = useState<string | null>(null)
  const [forensicSeek, setForensicSeek] = useState<number | null>(null)

  // Models & priority
  const [models, setModels] = useState<AiModel[]>(() =>
    AI_MODEL_SEEDS.map((seed) => ({ ...seed, active: DEFAULT_MODEL_ACTIVE[seed.id] ?? false })),
  )
  const [priorityBuckets, setPriorityBuckets] = useState<PriorityBuckets>({
    high: ['gun', 'fire', 'unattended'],
    medium: ['crash', 'crowd'],
    low: ['helmet', 'speed', 'anpr'],
  })

  // Alerts
  const [alertModal, setAlertModal] = useState<AlertSnapshot | null>(null)
  const alertModalRef = useRef<AlertSnapshot | null>(null)
  const [toasts, setToasts] = useState<Toast[]>([])
  const [soundEnabled, setSoundEnabled] = useState(true)
  const pendingToasts = useRef<Map<string, number>>(new Map())
  const pendingAlerts = useRef<Set<string>>(new Set())

  const [incidentRows, setIncidentRows] = useState<IncidentLogRow[]>([])
  const incidentRowsRef = useRef<IncidentLogRow[]>([])
  const cameraRef = useRef<Camera[]>(initCameras())

  const priorityOf = useCallback(
    (modelId: string): Priority => {
      if (priorityBuckets.high.includes(modelId)) return 'high'
      if (priorityBuckets.medium.includes(modelId)) return 'medium'
      return 'low'
    },
    [priorityBuckets],
  )

  const getCamera = useCallback(
    (id: string | null): Camera | null => cameras.find((c) => c.id === id) ?? null,
    [cameras],
  )

  const findPinByCamera = useCallback(
    (cameraId: string): CameraPin | undefined => pins.find((p) => p.cameraId === cameraId),
    [pins],
  )

  const canEditMaps = role === 'super-admin'
  const canEditSettings = role === 'super-admin'
  const canAssignModels = role === 'super-admin'
  const canPlacePin = canEditMaps

  // Keep refs in sync for the alert engine
  useEffect(() => {
    cameraRef.current = cameras
  }, [cameras])

  useEffect(() => {
    incidentRowsRef.current = incidentRows
    if (incidentRows.length > 0) return
    const firedAt = new Date().toISOString().replace(/T/, ' ').slice(0, 19)
    const rows = buildIncidentRows(cameraRef.current, `${firedAt}`)
    setIncidentRows(rows)
  }, [incidentRows])

  // ---- Media --------------------------------------------------------------

  const generateClip = useCallback(async (cameraId: string): Promise<Blob> => {
    return createSyntheticClip(cameraId)
  }, [])

  const revokeCameras = useCallback(() => {
    setCameras((prev) => {
      prev.forEach((c) => {
        if (c.videoUrl) URL.revokeObjectURL(c.videoUrl)
      })
      return prev
    })
  }, [])

  const bootDemo = useCallback(async () => {
    if (demoBusy) return
    setDemoBusy(true)
    const preview = document.createElement('video')
    const ok = new Promise<boolean>((resolve) => {
      preview.addEventListener(
        'loadeddata',
        () => {
          const seekable = preview.seekable
          if (seekable.length > 0) resolve(seekable.end(seekable.length - 1) >= 10)
          else resolve(true)
        },
        { once: true },
      )
      preview.addEventListener(
        'error',
        () => resolve(false),
        { once: true },
      )
    })
    try {
      const sample = await createSyntheticClip('CAM-01')
      preview.src = URL.createObjectURL(sample)
      await Promise.race([ok, new Promise((r) => setTimeout(r, 4000))])
      URL.revokeObjectURL(preview.src)
      if (!(await ok)) {
        setDemoBusy(false)
        return
      }
    } catch {
      setDemoBusy(false)
      return
    }

    const seededCameras = initCameras()
    const updates = await Promise.all(
      CAMERA_SEEDS.map(async (seed, index) => {
        const clip = await createSyntheticClip(seed.id)
        const url = URL.createObjectURL(clip)
        return {
          ...seededCameras[index],
          videoUrl: url,
          fileName: `${seed.id}_demo_recording.webm`,
        }
      }),
    )
    setCameras(updates)
    const selected = ['CAM-01', 'CAM-02', 'CAM-03', 'CAM-05', 'CAM-06', 'CAM-08']
    const assigned = new Map<number, string>()
    selected.forEach((cid, i) => {
      assigned.set(SEED_PARENT + i, cid)
    })
    setStreams((prev) => {
      const next = prev.map((s) => {
        const camId = assigned.get(s.slot) ?? s.cameraId
        return { ...s, cameraId: camId }
      })
      return next
    })
    setIncidentRows([])
    setMasterPlaying(true)
    setDemoBusy(false)
  }, [demoBusy])

  // ---- Camera mutations ---------------------------------------------------

  const updateCamera = useCallback((cameraId: string, patch: Partial<Camera>) => {
    setCameras((prev) => prev.map((c) => (c.id === cameraId ? { ...c, ...patch } : c)))
  }, [])

  const beginPlot = useCallback((x: number, y: number) => {
    const camId = `CAM-${String(Math.floor(Math.random() * 880) + 11).padStart(2, '0')}`
    setCameras((prev) =>
      prev.some((c) => c.id === camId)
        ? prev
        : [
            ...prev,
            {
              id: camId,
              name: `Camera ${camId}`,
              ip: `${DEFAULT_IP_PREFIX}.${camId.replace('CAM-', '')}`,
              videoUrl: null,
              fileName: null,
              enabledModels: Object.keys(DEFAULT_MODEL_ACTIVE).filter((m) => DEFAULT_MODEL_ACTIVE[m]),
              verifiedEvents: [],
            },
          ],
    )
    setDraftPin({ x, y, cameraId: camId, isNew: true })
  }, [])

  const savePin = useCallback(
    (cameraId: string, x: number, y: number, isNew: boolean) => {
      if (isNew) {
        const existingCamera = cameras.find((c) => c.id === cameraId)
        if (!existingCamera) {
          const ipParts = cameraId.replace('CAM-', '')
          setCameras((prev) => [
            ...prev,
            {
              id: cameraId,
              name: `Camera ${cameraId}`,
              ip: `${DEFAULT_IP_PREFIX}.${ipParts}`,
              videoUrl: null,
              fileName: null,
              enabledModels: Object.keys(DEFAULT_MODEL_ACTIVE).filter((m) => DEFAULT_MODEL_ACTIVE[m]),
              verifiedEvents: [],
            },
          ])
        }
        setPins((prev) => [...prev, { id: `pin-${Date.now()}`, x, y, cameraId }])
      } else {
        setPins((prev) =>
          prev.map((p) => (p.cameraId === cameraId ? { ...p, x, y } : p)),
        )
      }
      setDraftPin(null)
    },
    [cameras],
  )

  const deleteDraft = useCallback(() => setDraftPin(null), [])

  const deletePin = useCallback(
    (pinId: string) => {
      setPins((prev) => {
        const target = prev.find((p) => p.id === pinId)
        if (target) {
          const stillPinned = prev.some((p) => p.id !== pinId && p.cameraId === target.cameraId)
          if (!stillPinned) {
            const cam = cameraRef.current.find((c) => c.id === target.cameraId)
            if (cam?.videoUrl) URL.revokeObjectURL(cam.videoUrl)
            setCameras((cams) => cams.filter((c) => c.id !== target.cameraId))
            setStreams((str) => str.map((s) => (s.cameraId === target.cameraId ? { ...s, cameraId: null } : s)))
            setFocusedCameraId((f) => (f === target.cameraId ? null : f))
          }
        }
        return prev.filter((p) => p.id !== pinId)
      })
    },
    [],
  )

  // ---- Map image ----------------------------------------------------------

  const uploadMapImage = useCallback((file: File) => {
    const url = URL.createObjectURL(file)
    setMapImageUrl((prev) => {
      if (prev && prev !== '/society-map.svg') URL.revokeObjectURL(prev)
      return url
    })
    setMapImageName(file.name)
  }, [])

  const restoreDefaultMap = useCallback(() => {
    setMapImageUrl((prev) => {
      if (prev && prev !== '/society-map.svg') URL.revokeObjectURL(prev)
      return '/society-map.svg'
    })
    setMapImageName('society-map.svg (default)')
  }, [])

  // ---- Grid ---------------------------------------------------------------

  const mountFileToSlot = useCallback(
    (slot: number, file: File) => {
      const url = URL.createObjectURL(file)
      const camId = `CAM-${String(Math.floor(Math.random() * 88) + 11)}`
      const newCamera: Camera = {
        id: camId,
        name: `${camId} — Local Stream`,
        ip: `${DEFAULT_IP_PREFIX}.${Math.floor(Math.random() * 200) + 20}`,
        videoUrl: url,
        fileName: file.name,
        enabledModels: Object.keys(DEFAULT_MODEL_ACTIVE).filter((m) => DEFAULT_MODEL_ACTIVE[m]),
        verifiedEvents: [],
      }
      setCameras((prev) => [...prev, newCamera])
      setStreams((prev) => prev.map((s) => (s.slot === slot ? { ...s, cameraId: camId } : s)))
    },
    [],
  )

  const unmountSlot = useCallback(
    (slot: number) => {
      setStreams((prev) => {
        const target = prev.find((s) => s.slot === slot)
        const camId = target?.cameraId ?? null
        if (camId) {
          const cam = cameraRef.current.find((c) => c.id === camId)
          if (cam?.videoUrl && !camId.startsWith('CAM-')) URL.revokeObjectURL(cam.videoUrl)
        }
        return prev.map((s) => (s.slot === slot ? { ...s, cameraId: null } : s))
      })
    },
    [],
  )

  const swapSlots = useCallback((a: number, b: number) => {
    if (a === b) return
    setStreams((prev) =>
      prev.map((s) => {
        if (s.slot === a) return { ...s, slot: b }
        if (s.slot === b) return { ...s, slot: a }
        return s
      }),
    )
  }, [])

  // ---- Forensics ----------------------------------------------------------

  const openForensics = useCallback((cameraId: string) => {
    setFocusedCameraId(cameraId)
    setTab('forensics')
  }, [])

  const closeForensics = useCallback(() => {
    setFocusedCameraId(null)
    setTab('grid')
  }, [])

  const focusStream = useCallback((cameraId: string) => {
    setTab('grid')
    setFocusedCameraId(null)
    setMasterPlaying(false)
    window.setTimeout(() => {
      setStreams((prev) => {
        const target = prev.find((s) => s.cameraId === cameraId)
        if (!target) return prev
        const existing = prev.some((s) => s.slot === 0 && s.cameraId === cameraId)
        if (existing) return prev
        const swapTo = 0
        // Bring the alert camera into slot 0 (swap with whatever is there)
        return prev.map((s) => {
          if (s.slot === target.slot) return { slot: s.slot, cameraId: prev[swapTo].cameraId }
          if (s.slot === swapTo) return { slot: swapTo, cameraId }
          return s
        })
      })
      setMasterPlaying(true)
    }, 60)
  }, [])

  // ---- Model editor -------------------------------------------------------

  const toggleModel = useCallback((id: string) => {
    setModels((prev) => prev.map((m) => (m.id === id ? { ...m, active: !m.active } : m)))
  }, [])

  const setEnabledForCamera = useCallback((cameraId: string, modelId: string, on: boolean) => {
    setCameras((prev) =>
      prev.map((c) => {
        if (c.id !== cameraId) return c
        const set = new Set(c.enabledModels)
        if (on) set.add(modelId)
        else set.delete(modelId)
        return { ...c, enabledModels: [...set] }
      }),
    )
  }, [])

  const modelEditor = useMemo<ModelEditor>(
    () => ({ models, toggle: toggleModel, setEnabledForCamera }),
    [models, toggleModel, setEnabledForCamera],
  )

  // Set camera enabled models when the global model list changes
  useEffect(() => {
    setCameras((prev) =>
      prev.map((c) => {
        const next = new Set(c.enabledModels)
        for (const m of models) {
          if (!m.active) next.delete(m.id)
        }
        const changed = next.size !== c.enabledModels.length
        return changed ? { ...c, enabledModels: [...next] } : c
      }),
    )
  }, [models])

  // ---- Alert engine -------------------------------------------------------

  const fireToast = useCallback(
    (marker: (typeof EVENT_MARKERS)[number], cam: Camera, firedAt: number) => {
      const key = `${marker.id}:${cam.id}`
      const last = pendingToasts.current.get(key)
      if (last !== undefined && firedAt - last < 15_000) return
      pendingToasts.current.set(key, firedAt)
      const stamp = new Date(firedAt).toISOString().replace(/T/, ' ').slice(0, 19)
      setIncidentRows((prev) => [
        ...prev.filter((r) => !(r.id === marker.id && r.cameraId === cam.id)),
        {
          id: `${marker.id}@${cam.id}`,
          severity: 'low',
          timestamp: stamp,
          cameraId: cam.id,
          ip: cam.ip,
          cameraName: cam.name,
          event: marker.title,
          modelId: marker.modelId,
          confidence: marker.confidence,
          plate: marker.plate,
          vehicle: marker.vehicle,
          fined: marker.fined,
          time: marker.time,
        },
      ])
      const toast: Toast = {
        id: `${key}:${firedAt}:${Math.random().toString(36).slice(2, 6)}`,
        markerId: marker.id,
        cameraId: cam.id,
        title: marker.title,
        detail: marker.detail,
        time: marker.time,
        priority: marker.priority === 'medium' ? 'medium' : 'low',
      }
      setToasts((prev) => [...prev.slice(-3), toast])
      // Auto-dismiss
      window.setTimeout(() => {
        setToasts((prev) => prev.filter((t) => t.id !== toast.id))
      }, 8000)
    },
    [],
  )

  const fireHighAlert = useCallback(
    (marker: (typeof EVENT_MARKERS)[number], cam: Camera, slot: number, parentId: number) => {
      const key = `${marker.id}:${cam.id}`
      if (pendingAlerts.current.has(key)) return
      pendingAlerts.current.add(key)
      const snap: AlertSnapshot = { parentId, slot, markerId: marker.id, cameraId: cam.id }
      alertModalRef.current = snap
      setAlertModal(snap)
      setIncidentRows((prev) => [
        ...prev.filter((r) => !(r.id === marker.id && r.cameraId === cam.id)),
        {
          id: `${marker.id}@${cam.id}`,
          severity: 'high',
          timestamp: new Date().toDateString(),
          cameraId: cam.id,
          ip: cam.ip,
          cameraName: cam.name,
          event: marker.title,
          modelId: marker.modelId,
          confidence: marker.confidence,
          plate: marker.plate,
          vehicle: marker.vehicle,
          fined: marker.fined,
          time: marker.time,
        },
      ])
    },
    [],
  )

  const acknowledgeAlert = useCallback(() => {
    alertModalRef.current = null
    setAlertModal(null)
    stopSiren()
  }, [])

  const dismissToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id))
  }, [])

  // Master play state mirrored to video elements
  const isMasterPlayingRef = useRef(isMasterPlaying)
  useEffect(() => {
    isMasterPlayingRef.current = isMasterPlaying
  }, [isMasterPlaying])

  // Polling engine — checks bound video elements against the event timeline
  useEffect(() => {
    if (!isMasterPlaying) return
    const interval = window.setInterval(() => {
      const cams = cameraRef.current
      const streamList = streams
      for (const cam of cams) {
        if (!cam.videoUrl) continue
        const slot = streamList.find((s) => s.cameraId === cam.id)?.slot
        const parentId = SEED_PARENT + (slot ?? 0)
        for (const marker of EVENT_MARKERS) {
          const videoEl: HTMLVideoElement | null = document.querySelector(
            `video[data-slot-index="${parentId - SEED_PARENT}"]`,
          )
          if (!videoEl) continue
          const ct = videoEl.currentTime
          if (Math.abs(ct - marker.time) >= 0.03 && Math.abs(ct - marker.time) <= 0.5) {
            const prio = priorityOf(marker.modelId)
            if (prio === 'high') {
              fireHighAlert(marker, cam, slot ?? 0, parentId)
            } else if (prio === 'medium' || prio === 'low') {
              fireToast(marker, cam, Date.now())
            }
          }
        }
      }
    }, 220)
    return () => window.clearInterval(interval)
  }, [isMasterPlaying, streams, priorityOf, fireHighAlert, fireToast])

  // Forensics raw seek monitor
  useEffect(() => {
    if (!focusedCameraId || tab !== 'forensics') return
    const interval = window.setInterval(() => {
      const vid = document.querySelector('video[data-forensics]') as HTMLVideoElement | null
      if (!vid) return
      const cam = cameraRef.current.find((c) => c.id === focusedCameraId)
      if (!cam) return
      const ct = vid.currentTime
      for (const marker of EVENT_MARKERS) {
        const prio = priorityOf(marker.modelId)
        if (Math.abs(ct - marker.time) >= 0.03 && Math.abs(ct - marker.time) <= 0.5) {
          if (prio === 'high') {
            fireHighAlert(marker, cam, 0, SEED_PARENT + 9)
          } else {
            fireToast(marker, cam, Date.now())
          }
        }
      }
    }, 250)
    return () => window.clearInterval(interval)
  }, [focusedCameraId, tab, priorityOf, fireHighAlert, fireToast])

  // Sound gate
  const soundEnabledRef = useRef(soundEnabled)
  useEffect(() => {
    soundEnabledRef.current = soundEnabled
    if (!soundEnabled) stopSiren()
  }, [soundEnabled])

  useEffect(() => {
    if (alertModal) {
      if (soundEnabledRef.current) playSiren()
    } else {
      stopSiren()
    }
  }, [alertModal])

  const value = useMemo<AppStateValue>(
    () => ({
      role,
      setRole,
      canEditMaps,
      canEditSettings,
      canAssignModels,

      tab,
      setTab,
      settingsOpen,
      setSettingsOpen,
      modelDrawerOpen,
      setModelDrawerOpen,

      layout,
      setLayout,
      streams,
      isMasterPlaying,
      setMasterPlaying,
      mountFileToSlot,
      unmountSlot,
      swapSlots,
      bootDemo,
      demoBusy,

      cameras,
      pins,
      draftPin,
      beginPlot,
      savePin,
      deleteDraft,
      deletePin,
      updateCamera,
      mapImageUrl,
      mapImageName,
      uploadMapImage,
      restoreDefaultMap,
      getCamera,
      findPinByCamera,
      canPlacePin,

      focusedCameraId,
      openForensics,
      closeForensics,
      focusStream,
      forensicSeek,
      setForensicSeek,

      modelEditor,
      priorityBuckets,
      setPriorityBuckets,
      priorityOf,

      alertModal,
      acknowledgeAlert,
      toasts,
      dismissToast,
      soundEnabled,
      setSoundEnabled,

      incidentRows,

      generateClip,
      revokeCameras,
    }),
    [
      role, tab, settingsOpen, modelDrawerOpen, layout, streams, isMasterPlaying,
      demoBusy, cameras, pins, draftPin, mapImageUrl, mapImageName, canEditMaps,
      canEditSettings, canAssignModels, canPlacePin, focusedCameraId, alertModal,
      toasts, soundEnabled, incidentRows, priorityBuckets,
    ],
  )

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>
}

export function useApp(): AppStateValue {
  const ctx = useContext(AppContext)
  if (!ctx) throw new Error('useApp must be used within AppProvider')
  return ctx
}
