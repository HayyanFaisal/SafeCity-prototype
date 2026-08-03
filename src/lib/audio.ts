let ctx: AudioContext | null = null
let sirenTimer: number | null = null
let sirenNodes: { stop: () => void } | null = null

function ensureCtx(): AudioContext | null {
  if (typeof window === 'undefined') return null
  if (!ctx) {
    const AC = window.AudioContext || (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext
    if (!AC) return null
    ctx = new AC()
  }
  if (ctx.state === 'suspended') void ctx.resume()
  return ctx
}

/** Two-tone emergency siren loop (WebAudio synthesis, no asset needed). */
export function playSiren(): void {
  const ac = ensureCtx()
  if (!ac) return
  stopSiren()
  const master = ac.createGain()
  master.gain.value = 0.12
  master.connect(ac.destination)

  const osc = ac.createOscillator()
  osc.type = 'sawtooth'
  osc.frequency.value = 620
  osc.connect(master)
  osc.start()

  let rising = true
  let freq = 620
  const step = () => {
    if (rising) {
      freq += 26
      if (freq >= 940) rising = false
    } else {
      freq -= 26
      if (freq <= 620) rising = true
    }
    osc.frequency.setValueAtTime(freq, ac.currentTime)
  }
  const id = window.setInterval(step, 46)
  sirenTimer = id
  sirenNodes = {
    stop: () => {
      window.clearInterval(id)
      try {
        osc.stop()
      } catch {
        /* already stopped */
      }
      master.disconnect()
    },
  }
}

export function stopSiren(): void {
  if (sirenTimer !== null) {
    window.clearInterval(sirenTimer)
    sirenTimer = null
  }
  if (sirenNodes) {
    sirenNodes.stop()
    sirenNodes = null
  }
}

/** Acknowledged / confirm blip. */
export function playAck(): void {
  const ac = ensureCtx()
  if (!ac) return
  const t = ac.currentTime
  const osc = ac.createOscillator()
  const gain = ac.createGain()
  osc.type = 'sine'
  osc.frequency.setValueAtTime(880, t)
  osc.frequency.setValueAtTime(1320, t + 0.09)
  gain.gain.setValueAtTime(0.08, t)
  gain.gain.exponentialRampToValueAtTime(0.0001, t + 0.22)
  osc.connect(gain)
  gain.connect(ac.destination)
  osc.start(t)
  osc.stop(t + 0.24)
}
