// Web Audio siren for critical alerts — no external asset required.
let ctx: AudioContext | null = null
let osc: OscillatorNode | null = null
let gain: GainNode | null = null
let lfo: OscillatorNode | null = null
let lfoGain: GainNode | null = null

function ensureCtx(): AudioContext {
  if (!ctx) {
    const AC = window.AudioContext || (window as any).webkitAudioContext
    ctx = new AC()
  }
  return ctx
}

export function playSiren() {
  const c = ensureCtx()
  if (c.state === 'suspended') c.resume()
  if (osc) return // already playing

  osc = c.createOscillator()
  gain = c.createGain()
  lfo = c.createOscillator()
  lfoGain = c.createGain()

  osc.type = 'sawtooth'
  osc.frequency.value = 660

  // LFO sweeps the pitch like an emergency siren
  lfo.type = 'sine'
  lfo.frequency.value = 2.2
  lfoGain.gain.value = 220

  lfo.connect(lfoGain)
  lfoGain.connect(osc.frequency)

  gain.gain.value = 0.0001
  gain.gain.exponentialRampToValueAtTime(0.12, c.currentTime + 0.08)

  osc.connect(gain)
  gain.connect(c.destination)

  osc.start()
  lfo.start()
}

export function stopSiren() {
  if (!ctx || !osc || !gain) return
  try {
    gain.gain.cancelScheduledValues(ctx.currentTime)
    gain.gain.setValueAtTime(gain.gain.value, ctx.currentTime)
    gain.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + 0.15)
    osc.stop(ctx.currentTime + 0.2)
    lfo?.stop(ctx.currentTime + 0.2)
  } catch {
    /* noop */
  }
  osc = null
  lfo = null
  gain = null
  lfoGain = null
}

/** Short confirmation blip (medium alerts). */
export function blip() {
  const c = ensureCtx()
  if (c.state === 'suspended') c.resume()
  const o = c.createOscillator()
  const g = c.createGain()
  o.type = 'triangle'
  o.frequency.value = 880
  g.gain.value = 0.0001
  g.gain.exponentialRampToValueAtTime(0.08, c.currentTime + 0.02)
  g.gain.exponentialRampToValueAtTime(0.0001, c.currentTime + 0.25)
  o.connect(g)
  g.connect(c.destination)
  o.start()
  o.stop(c.currentTime + 0.28)
}
