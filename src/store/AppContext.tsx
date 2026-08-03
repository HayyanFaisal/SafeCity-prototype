import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react'
import type {
  AiModel,
  Camera,
  Incident,
  LayoutId,
  ReportPeriod,
  Role,
  Severity,
  TabId,
  Toast,
} from '../types'
import { AI_MODELS, CAMERAS, DUTY_OFFICER } from '../constants'
import {
  loadCameraVideoUrls,
  loadFiredKeys,
  loadIncidents,
  loadSeverityOverrides,
  saveCameraVideoUrl,
  saveFiredKeys,
  saveIncidents,
  saveSeverityOverrides,
} from '../lib/storage'
import { blip, playSiren, stopSiren } from '../lib/audio'

interface AppState {
  // clock
  now: number

  // rbac
  role: Role
  setRole: (r: Role) => void
  canEdit: boolean

  // navigation
  tab: TabId
  setTab: (t: TabId) => void

  // cameras
  cameras: Camera[]
  getCamera: (id: string | null) => Camera | undefined
  setCameraVideo: (id: string, url: string) => void
  moveCamera: (id: string, x: number, y: number) => void
  updateCameraDetails: (
    id: string,
    patch: Partial<Pick<Camera, 'name' | 'ip'>>,
  ) => void
  setCameraModels: (id: string, modelIds: string[]) => void
  toggleCameraModel: (id: string, modelId: string) => void

  // models & severity
  models: AiModel[]
  severityOverrides: Record<string, Severity>
  setSeverity: (modelId: string, sev: Severity) => void
  severityOf: (modelId: string) => Severity

  // live wall
  layout: LayoutId
  setLayout: (l: LayoutId) => void
  order: string[] // camera ids in display order; order[0] = main
  focusCamera: (id: string) => void
  swapTiles: (fromIndex: number, toIndex: number) => void
  mainId: string
  playing: boolean
  setPlaying: (v: boolean) => void
  speed: number
  setSpeed: (s: number) => void

  // forensic playback panel
  forensicCameraId: string | null
  openForensic: (id: string) => void
  closeForensic: () => void

  // alerts
  incidents: Incident[]
  toasts: Toast[]
  dismissToast: (id: string) => void
  criticalAlert: Incident | null
  acknowledgeAlert: () => void
  dispatchAlert: (incident: Incident) => void
  soundEnabled: boolean
  setSoundEnabled: (v: boolean) => void
  resetSimulation: () => void

  // reporting period — shared by Analytics, Incident Log and PDF export
  reportPeriod: ReportPeriod
  setReportPeriod: (p: ReportPeriod) => void
  customRange: { from: number; to: number } | null
  setCustomRange: (r: { from: number; to: number } | null) => void

  // dispatch log (whatsapp/sms simulation)
  dispatchLog: DispatchEntry[]
}

export interface DispatchEntry {
  id: string
  incidentId: string
  channel: 'WhatsApp' | 'SMS' | 'Call'
  to: string
  message: string
  at: number
  status: 'sending' | 'delivered'
}

const AppContext = createContext<AppState | null>(null)

const DEFAULT_ORDER = CAMERAS.map((c) => c.id)

export function AppProvider({ children }: { children: React.ReactNode }) {
  const [now, setNow] = useState(Date.now())
  const [role, setRole] = useState<Role>('super-admin')
  const [tab, setTab] = useState<TabId>('wall')

  // cameras hydrate persisted non-blob video overrides (blob URLs die with the
  // page session and are never persisted)
  const [cameras, setCameras] = useState<Camera[]>(() => {
    const overrides = loadCameraVideoUrls()
    return CAMERAS.map((c) => {
      const url = overrides[c.id]
      if (!url) return c
      return { ...c, videoUrl: url }
    })
  })
  const [severityOverrides, setSeverityOverrides] = useState<Record<string, Severity>>(
    () => loadSeverityOverrides(),
  )

  const [layout, setLayout] = useState<LayoutId>('focus')
  const [order, setOrder] = useState<string[]>(DEFAULT_ORDER)
  const [playing, setPlaying] = useState(true)
  const [speed, setSpeed] = useState(1)

  const [incidents, setIncidents] = useState<Incident[]>(() => loadIncidents())
  const [toasts, setToasts] = useState<Toast[]>([])
  const [criticalAlert, setCriticalAlert] = useState<Incident | null>(null)
  const [soundEnabled, setSoundEnabled] = useState(true)
  const [dispatchLog, setDispatchLog] = useState<DispatchEntry[]>([])

  const [forensicCameraId, setForensicCameraId] = useState<string | null>(null)

  const [reportPeriod, setReportPeriod] = useState<ReportPeriod>('today')
  const [customRange, setCustomRange] = useState<{ from: number; to: number } | null>(null)

  const canEdit = role === 'super-admin'

  // ---- wall clock ---------------------------------------------------------
  useEffect(() => {
    const t = window.setInterval(() => setNow(Date.now()), 1000)
    return () => window.clearInterval(t)
  }, [])

  // ---- persistence --------------------------------------------------------
  // Fix 2: incidents persist across reloads; in-memory flow stays live but
  // every change is written through to localStorage.
  useEffect(() => {
    saveIncidents(incidents)
  }, [incidents])

  useEffect(() => {
    saveSeverityOverrides(severityOverrides)
  }, [severityOverrides])

  // ---- helpers ------------------------------------------------------------
  const getCamera = useCallback(
    (id: string | null) => cameras.find((c) => c.id === id),
    [cameras],
  )

  const severityOf = useCallback(
    (modelId: string): Severity => {
      if (severityOverrides[modelId]) return severityOverrides[modelId]
      return AI_MODELS.find((m) => m.id === modelId)?.severity ?? 'low'
    },
    [severityOverrides],
  )

  const setSeverity = useCallback((modelId: string, sev: Severity) => {
    setSeverityOverrides((prev) => ({ ...prev, [modelId]: sev }))
  }, [])

  const models = useMemo<AiModel[]>(
    () => AI_MODELS.map((m) => ({ ...m, severity: severityOverrides[m.id] ?? m.severity })),
    [severityOverrides],
  )

  const setCameraVideo = useCallback((id: string, url: string) => {
    setCameras((prev) =>
      prev.map((c) =>
        c.id === id
          ? { ...c, videoUrl: url, customVideo: url.startsWith('blob:') }
          : c,
      ),
    )
    // only persist non-blob URLs (blob object URLs expire with the session)
    if (!url.startsWith('blob:')) saveCameraVideoUrl(id, url)
  }, [])

  const moveCamera = useCallback((id: string, x: number, y: number) => {
    setCameras((prev) => prev.map((c) => (c.id === id ? { ...c, x, y } : c)))
  }, [])

  const updateCameraDetails = useCallback(
    (id: string, patch: Partial<Pick<Camera, 'name' | 'ip'>>) => {
      setCameras((prev) => prev.map((c) => (c.id === id ? { ...c, ...patch } : c)))
    },
    [],
  )

  const setCameraModels = useCallback((id: string, modelIds: string[]) => {
    setCameras((prev) => prev.map((c) => (c.id === id ? { ...c, models: modelIds } : c)))
  }, [])

  const toggleCameraModel = useCallback((id: string, modelId: string) => {
    setCameras((prev) =>
      prev.map((c) => {
        if (c.id !== id) return c
        const has = c.models.includes(modelId)
        return { ...c, models: has ? c.models.filter((m) => m !== modelId) : [...c.models, modelId] }
      }),
    )
  }, [])

  // ---- live wall ordering -------------------------------------------------
  const mainId = order[0]

  const focusCamera = useCallback((id: string) => {
    setOrder((prev) => {
      const idx = prev.indexOf(id)
      if (idx <= 0) return prev
      const next = [...prev]
      // swap main (0) with clicked position
      const tmp = next[0]
      next[0] = next[idx]
      next[idx] = tmp
      return next
    })
  }, [])

  /**
   * Drag-and-drop tile swap: swaps the cameras at two display slots. Unlike
   * focusCamera this works between any two slots and never remounts the video
   * elements (tiles stay keyed by camera id).
   */
  const swapTiles = useCallback((fromIndex: number, toIndex: number) => {
    setOrder((prev) => {
      if (fromIndex === toIndex) return prev
      if (fromIndex < 0 || toIndex < 0 || fromIndex >= prev.length || toIndex >= prev.length) {
        return prev
      }
      const next = [...prev]
      ;[next[fromIndex], next[toIndex]] = [next[toIndex], next[fromIndex]]
      return next
    })
  }, [])

  // ---- forensic playback --------------------------------------------------
  const openForensic = useCallback((id: string) => {
    setForensicCameraId(id)
  }, [])
  const closeForensic = useCallback(() => {
    setForensicCameraId(null)
  }, [])

  // ---- alert engine -------------------------------------------------------
  // Fix 1: fire-once-per-session dedupe. Key = camId:modelId:time (no loop
  // counter, no cooldown). Once an event fires it may never fire again during
  // this session, no matter how many times the clip loops. The set is
  // persisted so a page reload also doesn't re-fire old events. Reset
  // Simulation (admin) clears it for a deliberate fresh run.
  const firedKeysRef = useRef<Set<string> | null>(null)
  if (firedKeysRef.current === null) {
    // lazy init once — the fire-once set survives reloads via localStorage
    firedKeysRef.current = new Set(loadFiredKeys())
  }
  // stable non-null reference captured for closures (TS can't narrow the ref)
  const firedKeys = firedKeysRef.current

  const camerasRef = useRef(cameras)
  const severityRef = useRef(severityOf)
  const playingRef = useRef(playing)
  useEffect(() => {
    camerasRef.current = cameras
  }, [cameras])
  useEffect(() => {
    severityRef.current = severityOf
  }, [severityOf])
  useEffect(() => {
    playingRef.current = playing
  }, [playing])

  const pushIncident = useCallback((inc: Incident) => {
    setIncidents((prev) => [inc, ...prev].slice(0, 2000))
  }, [])

  const fireEvent = useCallback(
    (cam: Camera, ev: Camera['events'][number]) => {
      const sev = severityRef.current(ev.modelId)
      const at = Date.now()
      const clockLabel = new Date(at).toLocaleString('en-GB', { hour12: false })
      const inc: Incident = {
        id: `${cam.id}-${ev.modelId}-${at}`,
        firedAt: at,
        clockLabel,
        cameraId: cam.id,
        cameraIndex: cam.index,
        cameraName: cam.name,
        zone: cam.zone,
        ip: cam.ip,
        modelId: ev.modelId,
        event: ev.title,
        detail: ev.detail,
        severity: sev,
        confidence: ev.confidence,
        plate: ev.plate,
        vehicle: ev.vehicle,
        speed: ev.speed,
        acknowledged: false,
        dispatched: false,
      }
      pushIncident(inc)

      if (sev === 'high') {
        setCriticalAlert((cur) => cur ?? inc)
        // auto-float the offending camera to main stream
        focusCamera(cam.id)
      } else if (sev === 'medium') {
        blip()
        const toast: Toast = {
          id: `t-${inc.id}`,
          incidentId: inc.id,
          title: inc.event,
          detail: inc.detail,
          cameraLabel: `CAM ${cam.index} · ${cam.zone}`,
          severity: sev,
        }
        setToasts((prev) => [...prev.slice(-2), toast])
        window.setTimeout(() => {
          setToasts((prev) => prev.filter((t) => t.id !== toast.id))
        }, 5000)
      }
      // low = silent log only
    },
    [focusCamera, pushIncident],
  )

  // Poll bound video elements and match against clip event times
  useEffect(() => {
    const interval = window.setInterval(() => {
      if (!playingRef.current) return
      const els = document.querySelectorAll<HTMLVideoElement>('video[data-cam]')
      els.forEach((el) => {
        const camId = el.getAttribute('data-cam')
        if (!camId) return
        const cam = camerasRef.current.find((c) => c.id === camId)
        if (!cam) return
        const ct = el.currentTime
        for (const ev of cam.events) {
          if (Math.abs(ct - ev.time) <= 0.35) {
            const key = `${cam.id}:${ev.modelId}:${ev.time}`
            if (firedKeys.has(key)) continue
            firedKeys.add(key)
            saveFiredKeys(Array.from(firedKeys))
            fireEvent(cam, ev)
          }
        }
      })
    }, 250)
    return () => window.clearInterval(interval)
  }, [fireEvent])

  // ---- alert controls -----------------------------------------------------
  const acknowledgeAlert = useCallback(() => {
    setCriticalAlert((cur) => {
      if (cur) {
        setIncidents((prev) =>
          prev.map((i) => (i.id === cur.id ? { ...i, acknowledged: true } : i)),
        )
      }
      return null
    })
    stopSiren()
  }, [])

  const dispatchAlert = useCallback((incident: Incident) => {
    const msg = `🚨 PNS SafeCity ALERT\n${incident.event} — CAM ${incident.cameraIndex}\nZone: ${incident.zone}\nConfidence: ${incident.confidence}%\nTime: ${incident.clockLabel}\nAction required.`
    const id = `d-${incident.id}-${Date.now()}`
    const entry: DispatchEntry = {
      id,
      incidentId: incident.id,
      channel: 'WhatsApp',
      to: `${DUTY_OFFICER.name} (${DUTY_OFFICER.phone})`,
      message: msg,
      at: Date.now(),
      status: 'sending',
    }
    setDispatchLog((prev) => [entry, ...prev].slice(0, 50))
    setIncidents((prev) => prev.map((i) => (i.id === incident.id ? { ...i, dispatched: true } : i)))
    window.setTimeout(() => {
      setDispatchLog((prev) =>
        prev.map((d) => (d.id === id ? { ...d, status: 'delivered' } : d)),
      )
    }, 1400)
  }, [])

  const dismissToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id))
  }, [])

  /**
   * Admin-only: clears the fire-once set (and the persisted incident log) so a
   * fresh demo run can deliberately replay the full event sequence.
   */
  const resetSimulation = useCallback(() => {
    firedKeysRef.current = new Set()
    saveFiredKeys([])
    setCriticalAlert(null)
    setToasts([])
    setIncidents([])
    stopSiren()
  }, [])

  // siren tied to critical alert
  const soundRef = useRef(soundEnabled)
  useEffect(() => {
    soundRef.current = soundEnabled
    if (!soundEnabled) stopSiren()
  }, [soundEnabled])
  useEffect(() => {
    if (criticalAlert && soundRef.current) playSiren()
    else stopSiren()
  }, [criticalAlert])

  const value = useMemo<AppState>(
    () => ({
      now,
      role,
      setRole,
      canEdit,
      tab,
      setTab,
      cameras,
      getCamera,
      setCameraVideo,
      moveCamera,
      updateCameraDetails,
      setCameraModels,
      toggleCameraModel,
      models,
      severityOverrides,
      setSeverity,
      severityOf,
      layout,
      setLayout,
      order,
      focusCamera,
      swapTiles,
      mainId,
      playing,
      setPlaying,
      speed,
      setSpeed,
      forensicCameraId,
      openForensic,
      closeForensic,
      incidents,
      toasts,
      dismissToast,
      criticalAlert,
      acknowledgeAlert,
      dispatchAlert,
      soundEnabled,
      setSoundEnabled,
      resetSimulation,
      reportPeriod,
      setReportPeriod,
      customRange,
      setCustomRange,
      dispatchLog,
    }),
    [
      now, role, canEdit, tab, cameras, getCamera, setCameraVideo, moveCamera,
      updateCameraDetails, setCameraModels, toggleCameraModel, models,
      severityOverrides, setSeverity, severityOf, layout, order, focusCamera,
      swapTiles, mainId, playing, speed, forensicCameraId, openForensic,
      closeForensic, incidents, toasts, dismissToast, criticalAlert,
      acknowledgeAlert, dispatchAlert, soundEnabled, resetSimulation, reportPeriod,
      customRange, dispatchLog,
    ],
  )

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>
}

export function useApp(): AppState {
  const ctx = useContext(AppContext)
  if (!ctx) throw new Error('useApp must be used within AppProvider')
  return ctx
}
