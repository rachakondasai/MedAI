/**
 * Toast.tsx — Global notification toast system
 * Supports: success, error, info, warning
 * Usage: import { toast } from '../components/Toast'
 *        toast.success('Order confirmed!')
 */
import { useState, useEffect, useCallback, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { CheckCircle2, AlertCircle, Info, AlertTriangle, X } from 'lucide-react'

export type ToastType = 'success' | 'error' | 'info' | 'warning'

export interface ToastItem {
  id: string
  type: ToastType
  message: string
  duration?: number
}

const CONFIGS: Record<ToastType, {
  icon: any; gradient: string; bg: string; border: string; text: string; iconColor: string
}> = {
  success: {
    icon: CheckCircle2,
    gradient: 'from-emerald-500 to-teal-500',
    bg: 'bg-emerald-50',
    border: 'border-emerald-200',
    text: 'text-emerald-900',
    iconColor: 'text-emerald-500',
  },
  error: {
    icon: AlertCircle,
    gradient: 'from-red-500 to-rose-500',
    bg: 'bg-red-50',
    border: 'border-red-200',
    text: 'text-red-900',
    iconColor: 'text-red-500',
  },
  info: {
    icon: Info,
    gradient: 'from-blue-500 to-indigo-500',
    bg: 'bg-blue-50',
    border: 'border-blue-200',
    text: 'text-blue-900',
    iconColor: 'text-blue-500',
  },
  warning: {
    icon: AlertTriangle,
    gradient: 'from-amber-500 to-orange-500',
    bg: 'bg-amber-50',
    border: 'border-amber-200',
    text: 'text-amber-900',
    iconColor: 'text-amber-500',
  },
}

// ─── Global event emitter ─────────────────────────────────────────────────
type Listener = (toast: ToastItem) => void
const listeners = new Set<Listener>()

export const toast = {
  success: (message: string, duration = 3500) => emit({ type: 'success', message, duration }),
  error:   (message: string, duration = 4500) => emit({ type: 'error',   message, duration }),
  info:    (message: string, duration = 3500) => emit({ type: 'info',    message, duration }),
  warning: (message: string, duration = 4000) => emit({ type: 'warning', message, duration }),
}

function emit(options: Omit<ToastItem, 'id'>) {
  const item: ToastItem = { id: `t-${Date.now()}-${Math.random()}`, ...options }
  listeners.forEach(fn => fn(item))
}

// ─── Single Toast ─────────────────────────────────────────────────────────
function ToastCard({ item, onRemove }: { item: ToastItem; onRemove: (id: string) => void }) {
  const cfg = CONFIGS[item.type]
  const Icon = cfg.icon

  useEffect(() => {
    const t = setTimeout(() => onRemove(item.id), item.duration ?? 3500)
    return () => clearTimeout(t)
  }, [item.id, item.duration, onRemove])

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: -16, scale: 0.94 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: -12, scale: 0.94 }}
      transition={{ type: 'spring', stiffness: 440, damping: 32 }}
      className={`flex items-start gap-3 px-4 py-3.5 rounded-2xl border shadow-xl ${cfg.bg} ${cfg.border} max-w-[340px] w-full pointer-events-auto`}
      style={{ boxShadow: '0 8px 32px rgba(0,0,0,0.12)' }}
    >
      {/* Left accent bar */}
      <div className={`absolute left-0 top-2 bottom-2 w-1 rounded-full bg-gradient-to-b ${cfg.gradient}`} style={{ position: 'relative', width: 4, flexShrink: 0, borderRadius: 4, background: `linear-gradient(to bottom, var(--tw-gradient-stops))` }} />

      <div className={`w-8 h-8 rounded-xl bg-gradient-to-br ${cfg.gradient} flex items-center justify-center flex-shrink-0 shadow-md`}>
        <Icon className="w-4 h-4 text-white" />
      </div>
      <p className={`text-sm font-semibold flex-1 leading-snug ${cfg.text} pt-0.5`}>{item.message}</p>
      <button
        onClick={() => onRemove(item.id)}
        className="w-6 h-6 rounded-full bg-white/60 flex items-center justify-center text-slate-400 hover:text-slate-600 hover:bg-white transition-all flex-shrink-0 mt-0.5"
      >
        <X className="w-3 h-3" />
      </button>
    </motion.div>
  )
}

// ─── Toast Container ─────────────────────────────────────────────────────
export default function ToastContainer() {
  const [items, setItems] = useState<ToastItem[]>([])

  const add = useCallback((item: ToastItem) => {
    setItems(prev => [item, ...prev].slice(0, 5)) // max 5
  }, [])

  const remove = useCallback((id: string) => {
    setItems(prev => prev.filter(t => t.id !== id))
  }, [])

  useEffect(() => {
    listeners.add(add)
    return () => { listeners.delete(add) }
  }, [add])

  return (
    <div
      className="fixed top-4 left-1/2 -translate-x-1/2 z-[100] flex flex-col gap-2 pointer-events-none"
      style={{ width: 'min(92vw, 380px)' }}
    >
      <AnimatePresence mode="popLayout">
        {items.map(item => (
          <ToastCard key={item.id} item={item} onRemove={remove} />
        ))}
      </AnimatePresence>
    </div>
  )
}
