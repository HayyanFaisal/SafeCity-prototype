import React, { useEffect, useRef, useState } from 'react'
import { Check, FileVideo, Trash2, Upload } from 'lucide-react'
import Modal from '../ui/Modal'
import { DEFAULT_IP_PREFIX, EVENT_MARKERS } from '../../constants'
import { useApp } from '../../store/AppContext'
import type { CameraPin } from '../../types'
import { ModelIcon } from '../ui/modelIcon'

interface CameraPinModalData {
  pin: CameraPin
  isNew: boolean
  x: number
  y: number
}

interface CameraPinModalProps {
  data: CameraPinModalData | null
  onClose: () => void
}

const VIDEO_ACCEPT = 'video/*,.mp4,.webm,.ogg,.mov'

export default function CameraPinModal({ data, onClose }: CameraPinModalProps) {
  const { cameras, updateCamera, savePin, deleteDraft, deletePin, modelEditor } = useApp()
  const camera = data ? cameras.find((c) => c.id === data.pin.cameraId) : undefined

  const [camId, setCamId] = useState('')
  const [name, setName] = useState('')
  const [ip, setIp] = useState('')
  const [enabled, setEnabled] = useState<string[]>([])
  const [fileName, setFileName] = useState<string | null>(null)
  const videoInputRef = useRef<HTMLInputElement>(null)

  // Sync form state when the modal opens for a camera
  useEffect(() => {
    if (!data || !camera) return
    setCamId(camera.id)
    setName(camera.name)
    setIp(camera.ip)
    setEnabled(camera.enabledModels)
    setFileName(camera.fileName)
  }, [data, camera])

  if (!data || !camera) return null

  const isNew = data.isNew

  const save = () => {
    const cleanId = camId.trim().toUpperCase().replace(/\s+/g, '')
    const finalId = cleanId || camera.id
    const safeIp = ip.trim() || `${DEFAULT_IP_PREFIX}.${finalId.replace('CAM-', '')}`
    updateCamera(finalId, { name: name.trim() || `Camera ${finalId}`, ip: safeIp, enabledModels: enabled })
    // If ID changed, keep pin linked to the new ID
    if (finalId !== camera.id) {
      // Save via existing flow with final coordinate + new id
      savePin(finalId, data.x, data.y, true)
      deletePin(data.pin.id)
    } else {
      savePin(finalId, data.x, data.y, false)
    }
    onClose()
  }

  const onVideoFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file || !camera) return
    const url = URL.createObjectURL(file)
    // Revoke previous bound stream if any
    if (camera.videoUrl) URL.revokeObjectURL(camera.videoUrl)
    updateCamera(camera.id, { videoUrl: url, fileName: file.name })
    setFileName(file.name)
    e.target.value = ''
  }

  const toggleModel = (id: string) => {
    setEnabled((prev) => (prev.includes(id) ? prev.filter((m) => m !== id) : [...prev, id]))
  }

  const remove = () => {
    deletePin(data.pin.id)
    onClose()
  }

  const markerModels = new Set(EVENT_MARKERS.map((m) => m.modelId))

  return (
    <Modal
      open
      onClose={onClose}
      title={isNew ? 'Configure Camera Pin' : `Edit Camera Pin — ${camera.id}`}
      subtitle={`MAP COORDINATES  X ${data.x.toFixed(2)}%  ·  Y ${data.y.toFixed(2)}%`}
      size="lg"
    >
      <div className="space-y-4">
        {/* Identity */}
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <label className="block">
            <span className="mb-1 block font-mono text-[10px] font-bold tracking-widest text-slate-500">CAMERA ID</span>
            <input
              value={camId}
              onChange={(e) => setCamId(e.target.value)}
              disabled={!isNew}
              className="w-full rounded-lg border border-edge bg-base px-3 py-2 font-mono text-[13px] text-slate-100 outline-none transition focus:border-accent/60 disabled:opacity-50"
              placeholder="CAM-09"
            />
          </label>
          <label className="block">
            <span className="mb-1 block font-mono text-[10px] font-bold tracking-widest text-slate-500">CAMERA NAME</span>
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full rounded-lg border border-edge bg-base px-3 py-2 text-[13px] text-slate-100 outline-none transition focus:border-accent/60"
              placeholder="Sector A Main Entrance"
            />
          </label>
        </div>

        <label className="block">
          <span className="mb-1 block font-mono text-[10px] font-bold tracking-widest text-slate-500">IP ADDRESS</span>
          <input
            value={ip}
            onChange={(e) => setIp(e.target.value)}
            className="w-full rounded-lg border border-edge bg-base px-3 py-2 font-mono text-[13px] text-slate-100 outline-none transition focus:border-accent/60"
            placeholder={`${DEFAULT_IP_PREFIX}.X`}
          />
        </label>

        {/* AI models */}
        <div>
          <div className="mb-1.5 flex items-center justify-between">
            <span className="font-mono text-[10px] font-bold tracking-widest text-slate-500">ACTIVE AI MODELS</span>
            <span className="font-mono text-[9.5px] text-slate-600">{enabled.length} ARMED</span>
          </div>
          <div className="grid grid-cols-2 gap-1.5">
            {modelEditor.models.map((m) => {
              const active = enabled.includes(m.id)
              const isEventModel = markerModels.has(m.id)
              return (
                <button
                  key={m.id}
                  onClick={() => toggleModel(m.id)}
                  className={`flex items-center gap-2 rounded-lg border px-2.5 py-2 text-left text-[11.5px] transition ${
                    active
                      ? 'border-accent/50 bg-accent/10 text-slate-100'
                      : 'border-edge bg-base text-slate-500 hover:border-accent/30'
                  }`}
                >
                  <ModelIcon model={m} size={13} className={active ? 'text-accent' : 'text-slate-600'} />
                  <span className="min-w-0 flex-1 truncate font-medium">{m.name}</span>
                  {isEventModel && <span className="font-mono text-[8.5px] text-warn">EVT</span>}
                  <span
                    className={`grid h-4 w-4 shrink-0 place-items-center rounded border ${
                      active ? 'border-accent bg-accent text-base' : 'border-edge bg-surface2 text-transparent'
                    }`}
                  >
                    <Check size={11} strokeWidth={3} />
                  </span>
                </button>
              )
            })}
          </div>
        </div>

        {/* Video stream */}
        <div className="rounded-lg border border-edge bg-base/50 p-3">
          <div className="mb-1 font-mono text-[10px] font-bold tracking-widest text-slate-500">LINK VIDEO STREAM (.MP4)</div>
          <div className="flex flex-wrap items-center gap-2">
            <button
              onClick={() => videoInputRef.current?.click()}
              className="flex items-center gap-1.5 rounded-lg border border-accent/40 bg-accent/10 px-3 py-2 text-[12px] font-semibold text-cyan-300 transition hover:bg-accent/20"
            >
              <Upload size={13} /> Upload Local .mp4
            </button>
            <input ref={videoInputRef} type="file" accept={VIDEO_ACCEPT} className="hidden" onChange={onVideoFile} />
            {fileName ? (
              <span className="flex items-center gap-1.5 truncate font-mono text-[11px] text-emerald-400">
                <FileVideo size={12} /> {fileName}
              </span>
            ) : (
              <span className="font-mono text-[11px] text-slate-600">No stream linked — preview unavailable</span>
            )}
          </div>
        </div>

        {/* Actions */}
        <div className="flex items-center gap-2 border-t border-edge pt-3">
          {!isNew && (
            <button
              onClick={remove}
              className="flex items-center gap-1.5 rounded-lg border border-danger/50 bg-danger/10 px-3 py-2 text-[12px] font-semibold text-red-400 transition hover:bg-danger/20"
            >
              <Trash2 size={13} /> Delete Pin
            </button>
          )}
          <div className="ml-auto flex gap-2">
            <button
              onClick={() => {
                if (isNew) deleteDraft()
                onClose()
              }}
              className="rounded-lg border border-edge bg-base px-4 py-2 text-[12px] font-semibold text-slate-400 transition hover:text-slate-200"
            >
              Cancel
            </button>
            <button
              onClick={save}
              className="flex items-center gap-1.5 rounded-lg border border-emerald-500/50 bg-emerald-500/15 px-4 py-2 text-[12px] font-bold text-emerald-300 transition hover:bg-emerald-500/25"
            >
              <Check size={14} /> Save Pin
            </button>
          </div>
        </div>
      </div>
    </Modal>
  )
}
