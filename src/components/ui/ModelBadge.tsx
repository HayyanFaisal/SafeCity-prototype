import {
  Flame,
  Crosshair,
  ShieldAlert,
  Car,
  ScanLine,
  Users,
  Gauge,
  Bike,
  Baby,
  AlertTriangle,
} from 'lucide-react'
import type { ModelCategory } from '../../types'
import { AI_MODELS } from '../../constants'

const ICONS: Record<string, typeof Flame> = {
  weapon: Crosshair,
  fire: Flame,
  accident: AlertTriangle,
  abandoned: ShieldAlert,
  anpr: ScanLine,
  speed: Gauge,
  wrongway: Car,
  underage: Baby,
  fight: Users,
  helmet: Bike,
}

const COLOR: Record<ModelCategory, string> = {
  weapon: 'border-danger/50 bg-danger/10 text-danger',
  fire: 'border-danger/50 bg-danger/10 text-danger',
  accident: 'border-danger/50 bg-danger/10 text-danger',
  safety: 'border-gold/50 bg-gold/10 text-gold-soft',
  anpr: 'border-cyan/50 bg-cyan/10 text-cyan',
  traffic: 'border-warn/50 bg-warn/10 text-warn',
  person: 'border-steel/60 bg-steel/10 text-steel',
}

export function modelName(id: string) {
  return AI_MODELS.find((m) => m.id === id)?.name ?? id
}
export function modelShort(id: string) {
  return AI_MODELS.find((m) => m.id === id)?.short ?? id.toUpperCase()
}

export function ModelIcon({ id, className }: { id: string; className?: string }) {
  const Icon = ICONS[id] ?? ShieldAlert
  return <Icon className={className ?? 'h-3.5 w-3.5'} />
}

export default function ModelBadge({ id, size = 'sm' }: { id: string; size?: 'sm' | 'xs' }) {
  const model = AI_MODELS.find((m) => m.id === id)
  const cat = model?.category ?? 'safety'
  const Icon = ICONS[id] ?? ShieldAlert
  return (
    <span
      className={`chip ${COLOR[cat]} ${size === 'xs' ? 'px-1.5 py-px text-[8px]' : ''}`}
      title={model?.name}
    >
      <Icon className={size === 'xs' ? 'h-2.5 w-2.5' : 'h-3 w-3'} />
      {model?.short ?? id}
    </span>
  )
}
