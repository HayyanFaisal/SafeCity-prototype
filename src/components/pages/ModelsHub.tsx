import { useState, useEffect } from 'react'
import {
  Gauge,
  Sliders,
  Car,
  BarChart3,
  Video,
  Radio,
  Layers,
} from 'lucide-react'
import { AI_MODELS } from '../../constants'
import { useApp } from '../../store/AppContext'

interface SpeedEvent {
  id: string
  time: string
  vehicleId: string
  vehicleType: 'Car' | 'Motorcycle' | 'Truck' | 'Bus'
  speedKmh: number
}

export default function ModelsHub() {
  const { cameras } = useApp()
  const [selectedModelId, setSelectedModelId] = useState<string>('speed')

  // Vehicle Speed Radar Interactive Controls (from User Reference Screenshot)
  const [speedLimit, setSpeedLimit] = useState<number>(8.0)
  // Threshold sliders for other models
  const [genericThreshold, setGenericThreshold] = useState<number>(85)

  // Live Telemetry Events List (Modeled directly after user reference screenshot)
  const [speedEvents, setSpeedEvents] = useState<SpeedEvent[]>([
    { id: '1', time: '33:46', vehicleId: 'Car #306', vehicleType: 'Car', speedKmh: 10.5 },
    { id: '2', time: '33:46', vehicleId: 'Car #298', vehicleType: 'Car', speedKmh: 8.5 },
    { id: '3', time: '33:46', vehicleId: 'Car #324', vehicleType: 'Motorcycle', speedKmh: 8.0 },
    { id: '4', time: '33:46', vehicleId: 'Car #290', vehicleType: 'Motorcycle', speedKmh: 8.1 },
    { id: '5', time: '33:46', vehicleId: 'Car #241', vehicleType: 'Car', speedKmh: 10.6 },
    { id: '6', time: '33:45', vehicleId: 'Car #188', vehicleType: 'Car', speedKmh: 13.0 },
    { id: '7', time: '33:45', vehicleId: 'Car #145', vehicleType: 'Car', speedKmh: 7.4 },
    { id: '8', time: '33:44', vehicleId: 'Car #112', vehicleType: 'Motorcycle', speedKmh: 6.8 },
  ])

  // Periodic Telemetry Inflow & Live Updates
  useEffect(() => {
    const timer = setInterval(() => {
      const now = new Date()
      const timeStr = `${now.getMinutes().toString().padStart(2, '0')}:${now.getSeconds().toString().padStart(2, '0')}`
      const carNum = Math.floor(Math.random() * 400) + 100
      const isMotor = Math.random() > 0.65
      const spd = parseFloat((6.0 + Math.random() * 8.5).toFixed(1))

      setSpeedEvents((prev) => [
        {
          id: Date.now().toString(),
          time: timeStr,
          vehicleId: `${isMotor ? 'Moto' : 'Car'} #${carNum}`,
          vehicleType: isMotor ? 'Motorcycle' : 'Car',
          speedKmh: spd,
        },
        ...prev.slice(0, 49),
      ])
    }, 4000)
    return () => clearInterval(timer)
  }, [])

  const currentModel = AI_MODELS.find((m) => m.id === selectedModelId) || AI_MODELS[0]
  const activeCamera = cameras[0] || {
    id: 'cam-01',
    name: 'Sector 4 - Main Commercial Boulevard',
    videoUrl: '/videos/video(1).mp4',
  }

  // Dynamic calculations based on user slider
  const violationsCount = speedEvents.filter((e) => e.speedKmh > speedLimit).length
  const highestSpeed = Math.max(...speedEvents.map((e) => e.speedKmh), 14.2)
  const maxOver = Math.max(0, highestSpeed - speedLimit)

  // Histogram binning
  const bins = [0, 0, 0, 0, 0] // 0-4, 4-8, 8-10, 10-12, 12+
  speedEvents.forEach((e) => {
    if (e.speedKmh < 4) bins[0]++
    else if (e.speedKmh < 8) bins[1]++
    else if (e.speedKmh < 10) bins[2]++
    else if (e.speedKmh < 12) bins[3]++
    else bins[4]++
  })

  // Needle angle for speedometer dial (-90deg at 0 km/h, +90deg at 20 km/h)
  const clampSpd = Math.min(20, Math.max(0, highestSpeed))
  const angle = -90 + (clampSpd / 20) * 180
  const rad = (angle * Math.PI) / 180
  const needleX = 100 + 70 * Math.sin(rad)
  const needleY = 100 - 70 * Math.cos(rad)

  const isSpeedModel = currentModel.id === 'speed'

  return (
    <div className="space-y-6 pb-12">
      {/* Top Models Quick Bar (12 Models) */}
      <div className="flex items-center gap-2 overflow-x-auto pb-2 border-b border-edge">
        {AI_MODELS.map((model) => {
          const isSelected = model.id === selectedModelId
          return (
            <button
              key={model.id}
              onClick={() => setSelectedModelId(model.id)}
              className={`shrink-0 px-3.5 py-2 rounded-xl text-xs font-semibold transition-all ${
                isSelected
                  ? 'neo-inset-sm text-blue-600 dark:text-cyan-400 font-bold border border-blue-400/40'
                  : 'neo-btn text-slate-600 dark:text-slate-300'
              }`}
            >
              {model.name}
            </button>
          )
        })}
      </div>

      {/* Header Banner with Interactive Slider */}
      <div className="neo-card p-5 flex flex-col lg:flex-row lg:items-center justify-between gap-5">
        <div>
          <h1 className="text-2xl font-extrabold tracking-tight text-slate-900 dark:text-white flex items-center gap-3">
            <span className="p-2 rounded-xl bg-amber-500/10 text-amber-500 border border-amber-500/20">
              {isSpeedModel ? <Gauge className="h-6 w-6" /> : <Layers className="h-6 w-6" />}
            </span>
            {currentModel.name}
          </h1>
          <p className="text-xs text-slate-500 mt-1 max-w-2xl">
            {currentModel.description}
          </p>
        </div>

        {/* Interactive Control Slider */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4 neo-inset-sm p-3.5 border border-edge">
          <div className="flex items-center gap-2">
            <Sliders className="h-4 w-4 text-amber-500" />
            <span className="text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300">
              {isSpeedModel ? 'Corridor Speed Limit:' : 'Detection Threshold:'}
            </span>
            <span className="text-sm font-extrabold text-amber-500 font-mono px-2 py-0.5 rounded-lg bg-amber-500/10 border border-amber-500/25">
              {isSpeedModel ? `${speedLimit.toFixed(1)} km/h` : `${genericThreshold}%`}
            </span>
          </div>

          <div className="flex items-center gap-3 w-full sm:w-56">
            <span className="text-[10px] font-mono text-slate-400">
              {isSpeedModel ? '5' : '40%'}
            </span>
            <input
              type="range"
              min={isSpeedModel ? '5.0' : '40'}
              max={isSpeedModel ? '35.0' : '99'}
              step={isSpeedModel ? '0.5' : '1'}
              value={isSpeedModel ? speedLimit : genericThreshold}
              onChange={(e) => {
                const val = parseFloat(e.target.value)
                if (isSpeedModel) setSpeedLimit(val)
                else setGenericThreshold(val)
              }}
              className="w-full cursor-pointer"
              title="Drag to dynamically recompute telemetry and violations in real time"
            />
            <span className="text-[10px] font-mono text-slate-400">
              {isSpeedModel ? '35' : '99%'}
            </span>
          </div>
        </div>
      </div>

      {/* Main Grid: Video Stream + Telemetry Events Log (Screenshot Layout) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: Live Surveillance Feed */}
        <div className="lg:col-span-5 neo-card overflow-hidden flex flex-col">
          <div className="p-3.5 border-b border-edge flex items-center justify-between bg-surface2/30">
            <div className="flex items-center gap-2">
              <Video className="h-4 w-4 text-blue-500" />
              <span className="text-xs font-bold text-slate-800 dark:text-slate-200">
                Live {currentModel.name} Camera Feed
              </span>
            </div>
            <span className="px-2.5 py-0.5 rounded-full text-[10px] font-extrabold bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20 animate-pulse">
              ● LIVE FEED ACTIVE
            </span>
          </div>

          {/* Video Player */}
          <div className="relative aspect-video w-full bg-black flex items-center justify-center overflow-hidden">
            <video
              src={activeCamera.videoUrl}
              autoPlay
              muted
              loop
              playsInline
              className="w-full h-full object-cover"
            />

            {/* Radar / Model Overlay HUD */}
            <div className="absolute inset-0 pointer-events-none p-3 flex flex-col justify-between">
              <div className="flex justify-between items-start text-[10px] font-mono">
                <span className="bg-black/60 text-cyan px-2 py-0.5 rounded">
                  NODE: {activeCamera.name}
                </span>
                <span className="bg-black/60 text-amber-400 px-2 py-0.5 rounded">
                  {isSpeedModel ? `LIMIT: ${speedLimit.toFixed(1)} KM/H` : `CONF: >${genericThreshold}%`}
                </span>
              </div>
              <div className="text-[10px] font-mono text-emerald-400 bg-black/60 px-2 py-0.5 rounded self-start">
                {isSpeedModel ? 'HOMOGRAPHY 4-POINT CALIBRATED' : 'INFERENCE PIPELINE ACTIVE'}
              </div>
            </div>
          </div>

          {/* Feed Footer */}
          <div className="p-3 text-xs text-slate-500 flex items-center justify-between font-mono border-t border-edge bg-surface2/20">
            <span>Zone: Main Sector Entrance</span>
            <span className="text-blue-600 dark:text-blue-400 font-semibold">
              BoT-SORT Tracking Active
            </span>
          </div>
        </div>

        {/* Right Column: Speed / Model Telemetry Log (From Screenshot) */}
        <div className="lg:col-span-7 neo-card p-5 flex flex-col h-[480px]">
          <div className="flex items-center justify-between pb-3 border-b border-edge">
            <div>
              <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2 font-sans">
                {isSpeedModel ? <Gauge className="h-4 w-4 text-amber-500" /> : <Radio className="h-4 w-4 text-blue-500" />}
                {isSpeedModel ? 'Speed Radar Telemetry Log' : `${currentModel.name} Telemetry Log`}
              </h3>
              <p className="text-[11px] text-slate-500 mt-0.5">
                Live tracked events, vehicles, and real-time inference telemetry
              </p>
            </div>
            <div className="flex items-center gap-2">
              <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-blue-500/10 text-blue-600 dark:text-blue-400 border border-blue-500/20">
                LIVE TELEMETRY
              </span>
            </div>
          </div>

          {/* Telemetry Table matching user reference image */}
          <div className="flex-1 overflow-y-auto mt-2 pr-1">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="text-[10px] font-extrabold uppercase text-slate-400 border-b border-edge sticky top-0 bg-surface/90 backdrop-blur z-10">
                  <th className="py-2 px-2">Time</th>
                  <th className="py-2 px-2">Target ID</th>
                  <th className="py-2 px-2">Class</th>
                  <th className="py-2 px-2">{isSpeedModel ? 'Speed' : 'Confidence / Metric'}</th>
                  <th className="py-2 px-2">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-edge/60 font-sans">
                {isSpeedModel ? (
                  speedEvents.map((evt) => {
                    const isOver = evt.speedKmh > speedLimit
                    const delta = evt.speedKmh - speedLimit

                    return (
                      <tr
                        key={evt.id}
                        className="hover:bg-surface2/40 transition-colors"
                      >
                        {/* Time */}
                        <td className="py-2.5 px-2 font-mono text-slate-500">
                          {evt.time}
                        </td>

                        {/* Vehicle ID */}
                        <td className="py-2.5 px-2">
                          <span className="px-2 py-0.5 rounded text-[11px] font-semibold bg-blue-500/10 text-blue-600 dark:text-blue-400 border border-blue-500/20">
                            {evt.vehicleId}
                          </span>
                        </td>

                        {/* Class */}
                        <td className="py-2.5 px-2 text-slate-600 dark:text-slate-300 flex items-center gap-1.5">
                          <Car className="h-3.5 w-3.5 text-slate-400" />
                          <span>{evt.vehicleType}</span>
                        </td>

                        {/* Speed */}
                        <td className="py-2.5 px-2">
                          <div
                            className={`font-bold font-mono text-sm leading-tight ${
                              isOver
                                ? 'text-rose-600 dark:text-rose-400'
                                : 'text-emerald-600 dark:text-emerald-400'
                            }`}
                          >
                            {evt.speedKmh.toFixed(1)}{' '}
                            <span className="text-[10px] font-normal">km/h</span>
                          </div>
                          <div
                            className={`text-[10px] font-mono leading-none mt-0.5 ${
                              isOver
                                ? 'text-rose-500'
                                : 'text-emerald-500'
                            }`}
                          >
                            {isOver
                              ? `+${delta.toFixed(1)} km/h over`
                              : '+0.0 km/h over'}
                          </div>
                        </td>

                        {/* Status Badge */}
                        <td className="py-2.5 px-2">
                          {isOver ? (
                            <span className="px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-rose-500/10 text-rose-600 dark:text-rose-400 border border-rose-500/30">
                              OVER LIMIT
                            </span>
                          ) : (
                            <span className="px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30">
                              OK
                            </span>
                          )}
                        </td>
                      </tr>
                    )
                  })
                ) : (
                  currentModel.captureTelemetry.map((item, idx) => (
                    <tr key={idx} className="hover:bg-surface2/40 transition-colors">
                      <td className="py-2.5 px-2 font-mono text-slate-500">{item.timestamp}</td>
                      <td className="py-2.5 px-2">
                        <span className="px-2 py-0.5 rounded text-[11px] font-semibold bg-blue-500/10 text-blue-600 dark:text-blue-400 border border-blue-500/20">
                          {item.plate || item.bikePlate || `OBJ #${100 + idx}`}
                        </span>
                      </td>
                      <td className="py-2.5 px-2 text-slate-600 dark:text-slate-300">
                        {item.vehicleMake || item.summary.split(' ')[0] || 'Target'}
                      </td>
                      <td className="py-2.5 px-2 font-mono font-bold text-cyan">
                        {item.confidence.toFixed(1)}% match
                      </td>
                      <td className="py-2.5 px-2">
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30">
                          VERIFIED
                        </span>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* 4-Card KPI Strip (Screenshot Exact Design) */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-5">
        {/* KPI 1 */}
        <div className="neo-card p-4 border-l-4 border-l-amber-500">
          <div className="text-[11px] font-bold uppercase tracking-wider text-slate-500">
            {isSpeedModel ? 'SPEED VIOLATIONS' : 'ACTIVE DETECTIONS'}
          </div>
          <div className="text-3xl font-extrabold text-amber-500 mt-1 font-mono">
            {isSpeedModel ? violationsCount : currentModel.liveActiveDetections}
          </div>
          <div className="text-xs text-amber-600 dark:text-amber-400 mt-1 font-medium">
            {isSpeedModel ? 'Vehicles exceeding limit' : 'Real-time pipeline captures'}
          </div>
        </div>

        {/* KPI 2 */}
        <div className="neo-card p-4 border-l-4 border-l-rose-500">
          <div className="text-[11px] font-bold uppercase tracking-wider text-slate-500">
            {isSpeedModel ? 'HIGHEST SPEED LOGGED' : 'DETECTION ACCURACY'}
          </div>
          <div className="text-3xl font-extrabold text-rose-500 mt-1 font-mono">
            {isSpeedModel ? `${highestSpeed.toFixed(1)} km/h` : `${currentModel.avgConfidence}%`}
          </div>
          <div className="text-xs text-rose-600 dark:text-rose-400 mt-1 font-medium">
            {isSpeedModel ? `+${maxOver.toFixed(1)} km/h over speed limit` : 'Validation F1 score'}
          </div>
        </div>

        {/* KPI 3 */}
        <div className="neo-card p-4 border-l-4 border-l-blue-500">
          <div className="text-[11px] font-bold uppercase tracking-wider text-slate-500">
            {isSpeedModel ? 'SPEED SENSOR' : 'INFERENCE PIPELINE'}
          </div>
          <div className="text-3xl font-extrabold text-blue-600 dark:text-blue-400 mt-1 font-sans">
            CALIBRATED
          </div>
          <div className="text-xs text-slate-500 mt-1 font-medium">
            {isSpeedModel ? 'Road Distance Calibrated' : 'GPU TensorRT Acceleration'}
          </div>
        </div>

        {/* KPI 4 */}
        <div className="neo-card p-4 border-l-4 border-l-emerald-500">
          <div className="text-[11px] font-bold uppercase tracking-wider text-slate-500">
            {isSpeedModel ? 'RADAR ACCURACY' : 'TRACKING ACCURACY'}
          </div>
          <div className="text-3xl font-extrabold text-emerald-600 dark:text-emerald-400 mt-1 font-mono">
            99.5%
          </div>
          <div className="text-xs text-slate-500 mt-1 font-medium">
            Continuous Live Tracking
          </div>
        </div>
      </div>

      {/* Bottom Split: Semicircular Peak Speed Dial + Speed Ranges Histogram */}
      <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
        {/* PEAK SPEED DIAL GAUGE */}
        <div className="md:col-span-4 neo-card p-5 flex flex-col items-center justify-between text-center">
          <div className="w-full flex items-center justify-between text-xs font-bold uppercase pb-2 border-b border-edge text-slate-500">
            <span>PEAK SPEED DIAL</span>
            <span className="text-rose-500 font-mono">
              {highestSpeed.toFixed(1)} km/h
            </span>
          </div>

          <div className="relative w-52 h-36 mt-4 flex items-center justify-center">
            <svg viewBox="0 0 200 120" className="w-full h-full">
              {/* Background Arc */}
              <path
                d="M 20 100 A 80 80 0 0 1 180 100"
                fill="none"
                stroke="currentColor"
                className="text-slate-200 dark:text-slate-800"
                strokeWidth="14"
                strokeLinecap="round"
              />
              {/* Green Safe Zone Arc */}
              <path
                d="M 20 100 A 80 80 0 0 1 100 20"
                fill="none"
                stroke="#10b981"
                strokeWidth="14"
                strokeLinecap="round"
              />
              {/* Red Over-Speed Zone Arc */}
              <path
                d="M 100 20 A 80 80 0 0 1 180 100"
                fill="none"
                stroke="#f43f5e"
                strokeWidth="14"
                strokeLinecap="round"
              />
              {/* Center Pivot */}
              <circle cx="100" cy="100" r="10" fill="#3b82f6" />
              {/* Dynamic Needle */}
              <line
                x1="100"
                y1="100"
                x2={needleX.toFixed(1)}
                y2={needleY.toFixed(1)}
                stroke="#ef4444"
                strokeWidth="4"
                strokeLinecap="round"
                className="transition-all duration-300 ease-out"
              />
            </svg>
            <div className="absolute bottom-1 text-center">
              <span className="text-2xl font-extrabold text-slate-900 dark:text-white font-mono">
                {highestSpeed.toFixed(1)}
              </span>
              <span className="text-[10px] text-slate-500 block -mt-1 font-mono font-bold">
                KM/H PEAK
              </span>
            </div>
          </div>

          <div className="w-full grid grid-cols-2 gap-2 text-center text-xs pt-3 border-t border-edge font-mono">
            <div className="p-1.5 rounded-lg bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20 font-bold">
              Limit: {speedLimit.toFixed(1)} km/h
            </div>
            <div className="p-1.5 rounded-lg bg-rose-500/10 text-rose-600 dark:text-rose-400 border border-rose-500/20 font-bold">
              Over: +{maxOver.toFixed(1)} km/h
            </div>
          </div>
        </div>

        {/* SPEED RANGES BREAKDOWN HISTOGRAM */}
        <div className="md:col-span-8 neo-card p-5 flex flex-col justify-between">
          <div className="flex items-center justify-between pb-3 border-b border-edge">
            <div className="flex items-center gap-2">
              <BarChart3 className="h-4 w-4 text-amber-500" />
              <h3 className="text-sm font-bold text-slate-900 dark:text-white uppercase tracking-wider font-sans">
                Speed Ranges Breakdown
              </h3>
            </div>
            <span className="text-[10px] font-mono px-2.5 py-0.5 rounded bg-surface2 text-slate-500 border border-edge">
              All Tracked Vehicles
            </span>
          </div>

          {/* Visual Histogram Bars matching Screenshot */}
          <div className="h-44 mt-4 flex items-end justify-between gap-4 px-2">
            {[
              { label: '0-4 km/h (Slow)', count: bins[0], color: 'bg-emerald-400' },
              { label: '4-8 km/h (Normal)', count: bins[1], color: 'bg-sky-400' },
              { label: '8-10 km/h (Over limit)', count: bins[2], color: 'bg-amber-400' },
              { label: '10-12 km/h (Fast)', count: bins[3], color: 'bg-orange-400' },
              { label: '12+ km/h (Dangerous)', count: bins[4], color: 'bg-rose-500' },
            ].map((bar, idx) => {
              const maxCount = Math.max(...bins, 1)
              const heightPct = Math.max(12, (bar.count / maxCount) * 100)

              return (
                <div
                  key={idx}
                  className="flex-1 flex flex-col items-center gap-2 h-full justify-end"
                >
                  <span className="text-xs font-bold font-mono text-slate-700 dark:text-slate-300">
                    {bar.count}
                  </span>
                  <div className="w-full bg-surface2/60 rounded-t-lg h-32 flex items-end p-1">
                    <div
                      style={{ height: `${heightPct}%` }}
                      className={`w-full ${bar.color} rounded-t transition-all duration-500 shadow-sm`}
                    ></div>
                  </div>
                  <span className="text-[10px] text-slate-500 text-center font-medium leading-tight line-clamp-2">
                    {bar.label}
                  </span>
                </div>
              )
            })}
          </div>
        </div>
      </div>
    </div>
  )
}
