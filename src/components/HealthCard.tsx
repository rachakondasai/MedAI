import { motion } from 'framer-motion'
import { LucideIcon, TrendingUp, Sparkles } from 'lucide-react'

interface HealthCardProps {
  title: string
  value: string
  subtitle: string
  icon: LucideIcon
  color: 'blue' | 'green' | 'orange' | 'red' | 'purple'
  trend?: string
}

const colorMap = {
  blue: {
    bg: 'bg-blue-50/50',
    icon: 'from-blue-500 to-indigo-600',
    text: 'text-blue-700',
    border: 'border-blue-100/50',
    glow: 'shadow-blue-500/10',
    ring: 'ring-blue-400/20',
    trendBg: 'bg-blue-50',
    trendText: 'text-blue-600',
    accent: '#3b82f6',
  },
  green: {
    bg: 'bg-emerald-50/50',
    icon: 'from-emerald-500 to-teal-600',
    text: 'text-emerald-700',
    border: 'border-emerald-100/50',
    glow: 'shadow-emerald-500/10',
    ring: 'ring-emerald-400/20',
    trendBg: 'bg-emerald-50',
    trendText: 'text-emerald-600',
    accent: '#10b981',
  },
  orange: {
    bg: 'bg-amber-50/50',
    icon: 'from-amber-500 to-orange-600',
    text: 'text-amber-700',
    border: 'border-amber-100/50',
    glow: 'shadow-amber-500/10',
    ring: 'ring-amber-400/20',
    trendBg: 'bg-amber-50',
    trendText: 'text-amber-600',
    accent: '#f59e0b',
  },
  red: {
    bg: 'bg-red-50/50',
    icon: 'from-red-500 to-rose-600',
    text: 'text-red-700',
    border: 'border-red-100/50',
    glow: 'shadow-red-500/10',
    ring: 'ring-red-400/20',
    trendBg: 'bg-red-50',
    trendText: 'text-red-600',
    accent: '#ef4444',
  },
  purple: {
    bg: 'bg-purple-50/50',
    icon: 'from-purple-500 to-violet-600',
    text: 'text-purple-700',
    border: 'border-purple-100/50',
    glow: 'shadow-purple-500/10',
    ring: 'ring-purple-400/20',
    trendBg: 'bg-purple-50',
    trendText: 'text-purple-600',
    accent: '#8b5cf6',
  },
}

export default function HealthCard({ title, value, subtitle, icon: Icon, color, trend }: HealthCardProps) {
  const c = colorMap[color]

  return (
    <motion.div
      initial={{ opacity: 0, y: 20, scale: 0.95 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ duration: 0.4, type: 'spring', stiffness: 200 }}
      whileHover={{ y: -4, scale: 1.02 }}
      className={`relative bg-white/80 backdrop-blur-sm rounded-2xl border ${c.border} p-6 hover:shadow-xl ${c.glow} transition-all duration-300 cursor-default overflow-hidden group`}
    >
      {/* Subtle gradient overlay on hover */}
      <div className={`absolute inset-0 bg-gradient-to-br ${c.icon} opacity-0 group-hover:opacity-[0.03] transition-opacity duration-500 rounded-2xl`} />

      {/* Floating accent dot */}
      <motion.div
        className="absolute top-3 right-16 w-1.5 h-1.5 rounded-full opacity-0 group-hover:opacity-40"
        style={{ backgroundColor: c.accent }}
        animate={{ y: [0, -4, 0] }}
        transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
      />

      <div className="flex items-start justify-between relative z-10">
        <div>
          <p className="text-sm font-medium text-slate-500 flex items-center gap-1.5">
            {title}
          </p>
          <motion.p
            className={`text-3xl font-bold mt-2 ${c.text}`}
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.2 }}
          >
            {value}
          </motion.p>
          <p className="text-xs text-slate-400 mt-1">{subtitle}</p>
        </div>
        <motion.div
          whileHover={{ rotate: [0, -10, 10, 0], scale: 1.1 }}
          transition={{ duration: 0.5 }}
          className={`w-12 h-12 bg-gradient-to-br ${c.icon} rounded-xl flex items-center justify-center shadow-lg relative`}
        >
          <Icon className="w-6 h-6 text-white" />
          {/* Pulse ring behind icon */}
          <motion.div
            className="absolute inset-0 rounded-xl border-2 opacity-0 group-hover:opacity-100"
            style={{ borderColor: c.accent }}
            animate={{ scale: [1, 1.3, 1], opacity: [0, 0.3, 0] }}
            transition={{ duration: 2, repeat: Infinity }}
          />
        </motion.div>
      </div>
      {trend && (
        <motion.div
          initial={{ opacity: 0, y: 5 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="mt-4 pt-4 border-t border-slate-100/80"
        >
          <span className={`inline-flex items-center gap-1 text-xs font-semibold ${c.trendText} ${c.trendBg} px-2 py-0.5 rounded-full`}>
            <TrendingUp className="w-3 h-3" />
            {trend}
          </span>
        </motion.div>
      )}
    </motion.div>
  )
}
