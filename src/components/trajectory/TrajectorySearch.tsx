import { useMemo, useState } from 'react'
import { ArrowDown, Car, Clock3, MapPin, Route, Search, User, Video } from 'lucide-react'
import { TRAJECTORY_CAMERA_STOPS } from '../../constants'
import { useApp } from '../../store/AppContext'
import { formatTimestamp } from '../../lib/format'

type QueryMode = 'plate' | 'person'

export default function TrajectorySearch() {
  const { cameras, getCamera, openForensics } = useApp()
  const [mode, setMode] = useState<QueryMode>('plate')
  const [value, setValue] = useState('')
  const [searched, setSearched] = useState(false)

  const isPlate = mode === 'plate'
  const validPlate = /^[A-Z0-9]{3}-[0-9]{4}$/.test(value.toUpperCase().trim())
  const validPerson = value.trim().length >= 3

  const canSearch = isPlate ? validPlate : validPerson

  const trajectory = useMemo(() => {
    if (!searched) return null
    const base = Date.now() - 4 * 60 * 60 * 1000
    const times = TRAJECTORY_CAMERA_STOPS.map((label, i) => {
      const camId = label.split(' ')[0]
      return {
        label,
        camId,
        time: new Date(base + i * 21 * 60 * 1000),
        confidence: 96.4 - i * 2.1,
      }
    })
    return times
  }, [searched])

  const submit = () => {
    setSearched(true)
  }

  return (
    <div className="flex min-h-0 flex-1 flex-col gap-3 overflow-y-auto p-3">
      {/* Header */}
      <div className="flex flex-wrap items-center gap-2 rounded-xl border border-edge bg-surface/70 p-3 backdrop-blur">
        <Route size={16} className="text-accent" />
        <div className="font-mono text-[10px] tracking-widest text-slate-500">FORENSIC TRAJECTORY SEARCH</div>
        <div className="ml-auto font-mono text-[10px] text-slate-600">TRACK ID · TR-{searched ? formatTimestamp(new Date()).slice(0, 10).replace(/-/g, '') : '———'}</div>
      </div>

      {/* Query form */}
      <div className="rounded-xl border border-edge bg-surface/70 p-4 backdrop-blur">
        <div className="mb-3 flex gap-2">
          <button
            onClick={() => { setMode('plate'); setSearched(false) }}
            className={`flex items-center gap-1.5 rounded-lg border px-3 py-1.5 text-[12px] font-semibold transition ${
              mode === 'plate' ? 'border-accent/60 bg-accent/15 text-cyan-300' : 'border-edge bg-base text-slate-400'
            }`}
          >
            <Car size={13} /> License Plate
          </button>
          <button
            onClick={() => { setMode('person'); setSearched(false) }}
            className={`flex items-center gap-1.5 rounded-lg border px-3 py-1.5 text-[12px] font-semibold transition ${
              mode === 'person' ? 'border-accent/60 bg-accent/15 text-cyan-300' : 'border-edge bg-base text-slate-400'
            }`}
          >
            <User size={13} /> Person Profile
          </button>
        </div>

        <div className="flex flex-wrap gap-2">
          <input
            value={value}
            onChange={(e) => setValue(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && canSearch && submit()}
            placeholder={isPlate ? 'Enter license plate — e.g. ABC-1234' : 'Enter target person name / profile — e.g. "Male, grey jacket, 5’10"'}
            className="min-w-0 flex-1 rounded-lg border border-edge bg-base px-3 py-2.5 font-mono text-[13px] text-slate-100 outline-none transition focus:border-accent/60 placeholder:font-sans placeholder:text-slate-600"
            autoCapitalize="characters"
          />
          <button
            onClick={submit}
            disabled={!canSearch}
            className="flex items-center gap-1.5 rounded-lg border border-accent/50 bg-accent/15 px-4 py-2.5 text-[12px] font-bold text-cyan-300 transition hover:bg-accent/25 disabled:opacity-40"
          >
            <Search size={14} /> Run Trajectory
          </button>
        </div>
        {isPlate && value && !validPlate && (
          <div className="mt-2 font-mono text-[10px] text-warn">Plate format: ABC-1234 (3 letters, dash, 4 digits)</div>
        )}
        {!searched && (
          <div className="mt-3 rounded-lg border border-edge bg-base/50 p-3 font-mono text-[10.5px] leading-relaxed text-slate-500">
            <span className="text-cyan-400">TIP:</span> Query “ABC-1234” — a vehicle of interest already logged by the ANPR engine at
            the main gate. Trajectory reconstruction stitches the chronological route across the society camera mesh.
          </div>
        )}
      </div>

      {/* Results */}
      {searched && trajectory && (
        <div className="rounded-xl border border-edge bg-surface/70 p-4 backdrop-blur">
          <div className="mb-4 flex flex-wrap items-center gap-3">
            <div className="flex items-center gap-2">
              {isPlate ? <Car size={16} className="text-accent" /> : <User size={16} className="text-accent" />}
              <span className="text-[13px] font-bold text-slate-100">{isPlate ? value.toUpperCase() : value}</span>
            </div>
            <span className="rounded-md border border-accent/40 bg-accent/10 px-2 py-0.5 font-mono text-[10px] font-bold text-cyan-300">
              {trajectory.length} CAMERA NODES
            </span>
            <span className="rounded-md border border-emerald-500/40 bg-emerald-500/10 px-2 py-0.5 font-mono text-[10px] font-bold text-emerald-400">
              MATCH 99.1%
            </span>
          </div>

          {/* Flowchart */}
          <div className="relative space-y-0">
            {trajectory.map((stop, i) => {
              const camId = stop.camId
              const cam = getCamera(camId)
              const hasStream = !!cam?.videoUrl
              const isLast = i === trajectory.length - 1
              return (
                <div key={stop.camId} className="relative flex gap-3">
                  {/* Spine */}
                  <div className="flex w-8 shrink-0 flex-col items-center">
                    <div className={`z-10 grid h-8 w-8 place-items-center rounded-full border-2 ${isLast ? 'border-danger bg-danger/20' : 'border-accent bg-accent/15'}`}>
                      {isLast ? <MapPin size={14} className="text-red-400" /> : <Video size={13} className="text-cyan-300" />}
                    </div>
                    {!isLast && <div className="w-0.5 flex-1 border-l-2 border-dashed border-slate-600" />}
                  </div>
                  {/* Node card */}
                  <div className="mb-3 min-w-0 flex-1">
                    <div className={`rounded-xl border p-3 transition ${hasStream ? 'border-edge bg-base hover:border-accent/40' : 'border-edge bg-base/60 opacity-80'}`}>
                      <div className="flex flex-wrap items-center gap-2">
                        <span className={`font-mono text-[12px] font-bold ${isLast ? 'text-red-400' : 'text-cyan-300'}`}>
                          NODE {i + 1} · {stop.camId}
                        </span>
                        {isLast && <span className="rounded border border-danger/40 bg-danger/10 px-1.5 py-0.5 font-mono text-[9px] font-bold text-red-400">EXIT ZONE</span>}
                        <span className="ml-auto flex items-center gap-1 font-mono text-[10px] text-slate-400">
                          <Clock3 size={11} /> {stop.time.toLocaleTimeString()} · {formatTimestamp(stop.time).slice(0, 10)}
                        </span>
                      </div>
                      <div className="mt-1 text-[12px] text-slate-300">{stop.label.replace(`${stop.camId} `, '')}</div>
                      <div className="mt-2 flex flex-wrap items-center gap-2">
                        {cam ? (
                          <>
                            <span className="font-mono text-[9.5px] text-slate-500">{cam.ip}</span>
                            <span className="font-mono text-[9.5px] text-emerald-400">CONF {stop.confidence.toFixed(1)}%</span>
                            {hasStream && (
                              <button
                                onClick={() => openForensics(camId)}
                                className="ml-auto flex items-center gap-1 rounded-md border border-accent/40 bg-accent/10 px-2 py-1 font-mono text-[9.5px] font-bold text-cyan-300 transition hover:bg-accent/20"
                              >
                                <Video size={10} /> VIEW RECORDING
                              </button>
                            )}
                          </>
                        ) : (
                          <span className="font-mono text-[9.5px] text-slate-600">CAMERA NOT FOUND</span>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              )
            })}

            {/* Summary */}
            <div className="mt-4 rounded-xl border border-danger/40 bg-danger/5 p-4">
              <div className="flex items-center gap-2 font-mono text-[10px] tracking-widest text-red-400">
                <ArrowDown size={12} /> TRAJECTORY SUMMARY
              </div>
              <div className="mt-2 text-[12px] leading-relaxed text-slate-300">
                Target {isPlate ? `vehicle ${value.toUpperCase()}` : `person “${value}”`} entered at{' '}
                <span className="font-semibold text-cyan-300">{trajectory[0].label}</span> and traversed
                {trajectory.length - 2} intermediate checkpoint(s) before exiting the society perimeter at{' '}
                <span className="font-semibold text-red-400">{trajectory[trajectory.length - 1].label}</span>.
                Total transit window: <span className="font-mono text-slate-100">01:03:00</span>.
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Cameras legend */}
      <div className="rounded-xl border border-edge bg-surface/40 p-3">
        <div className="mb-2 font-mono text-[10px] tracking-widest text-slate-500">CAMERA NODE GRID — SOCIETY MESH</div>
        <div className="flex flex-wrap gap-1.5">
          {cameras.map((c) => (
            <button
              key={c.id}
              onClick={() => c.videoUrl && openForensics(c.id)}
              className={`flex items-center gap-1.5 rounded-md border px-2 py-1 font-mono text-[10px] transition ${
                c.videoUrl
                  ? 'border-accent/30 bg-accent/5 text-cyan-300 hover:border-accent/60'
                  : 'border-edge bg-base text-slate-600'
              }`}
            >
              <Video size={10} /> {c.id}
            </button>
          ))}
        </div>
      </div>
    </div>
  )
}
