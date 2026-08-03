import React, { useEffect } from 'react'
import { X } from 'lucide-react'

interface ModalProps {
  open: boolean
  onClose?: () => void
  title?: React.ReactNode
  subtitle?: string
  children: React.ReactNode
  size?: 'md' | 'lg' | 'xl'
  tone?: 'default' | 'danger'
}

const SIZE_CLASSES = {
  md: 'max-w-md',
  lg: 'max-w-lg',
  xl: 'max-w-2xl',
}

export default function Modal({ open, onClose, title, subtitle, children, size = 'md', tone = 'default' }: ModalProps) {
  useEffect(() => {
    if (!open) return
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && onClose) onClose()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [open, onClose])

  if (!open) return null

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      <div
        className="absolute inset-0 bg-black/70 backdrop-blur-sm animate-[fadeIn_0.15s_ease-out]"
        onClick={onClose}
      />
      <div
        className={`relative w-full ${SIZE_CLASSES[size]} rounded-xl border border-edge bg-surface shadow-panel animate-[confirm-pop_0.22s_cubic-bezier(0.34,1.56,0.64,1)] ${
          tone === 'danger' ? 'ring-1 ring-danger/60 shadow-glow-red' : ''
        }`}
      >
        {(title || onClose) && (
          <div className="flex items-start justify-between gap-4 border-b border-edge px-5 py-4">
            <div>
              {title && (
                <div className={`text-[15px] font-bold tracking-tight ${tone === 'danger' ? 'text-red-400' : 'text-slate-100'}`}>
                  {title}
                </div>
              )}
              {subtitle && <div className="mt-0.5 font-mono text-[11px] text-slate-400">{subtitle}</div>}
            </div>
            {onClose && (
              <button
                onClick={onClose}
                className="rounded-md p-1.5 text-slate-400 transition hover:bg-white/5 hover:text-slate-100"
                aria-label="Close"
              >
                <X size={16} />
              </button>
            )}
          </div>
        )}
        <div className="px-5 py-4">{children}</div>
      </div>
    </div>
  )
}
