import { Car, Flame, ShieldAlert, Siren, UserCheck, Crosshair, type LucideIcon } from 'lucide-react'
import type { AiModel } from '../../types'

const ICONS: Record<AiModel['icon'], LucideIcon> = {
  siren: Siren,
  flame: Flame,
  crosshair: Crosshair,
  car: Car,
  usercheck: UserCheck,
  shield: ShieldAlert,
}

export function ModelIcon({ model, size = 16, className }: { model: AiModel; size?: number; className?: string }) {
  const Icon = ICONS[model.icon]
  return <Icon size={size} className={className} />
}

export function iconForModel(model: AiModel): LucideIcon {
  return ICONS[model.icon]
}
