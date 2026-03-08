import { motion } from 'framer-motion'
import { LucideIcon } from 'lucide-react'

interface HealthCardProps {
  title: string
  value: string
  subtitle: string
  icon: LucideIcon
  color: 'blue' | 'green' | 'orange' | 'red' | 'purple'
  trend?: string
}

const colorMap = {
  blue: { bg: 'bg-blue-50', icon: 'bg-blue-500', text: 'text-blue-700', border: 'border-blue-100' },
  green: { bg: 'bg-emerald-50', icon: 'bg-emerald-500', text: 'text-emerald-700', border: 'border-emerald-100' },
  orange: { bg: 'bg-amber-50', icon: 'bg-amber-500', text: 'text-amber-700', border: 'border-amber-100' },
  red: { bg: 'bg-red-50', icon: 'bg-red-500', text: 'text-red-700', border: 'border-red-100' },
  purple: { bg: 'bg-purple-50', icon: 'bg-purple-500', text: 'text-purple-700', border: 'border-purple-100' },
}

export default function HealthCard({ title, value, subtitle, icon: Icon, color, trend }: HealthCardProps) {
  const c = colorMap[color]

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className={`bg-white rounded-2xl border ${c.border} p-6 hover:shadow-lg hover:shadow-slate-200/50 transition-all duration-300 cursor-default`}
    >
      <div className="flex items-start justify-between">
        <div>
          <p className="text-sm font-medium text-slate-500">{title}</p>
          <p className={`text-3xl font-bold mt-2 ${c.text}`}>{value}</p>
          <p className="text-xs text-slate-400 mt-1">{subtitle}</p>
        </div>
        <div className={`w-12 h-12 ${c.icon} rounded-xl flex items-center justify-center shadow-lg`}>
          <Icon className="w-6 h-6 text-white" />
        </div>
      </div>
      {trend && (
        <div className="mt-4 pt-4 border-t border-slate-100">
          <span className="text-xs font-medium text-emerald-600">{trend}</span>
        </div>
      )}
    </motion.div>
  )
}
