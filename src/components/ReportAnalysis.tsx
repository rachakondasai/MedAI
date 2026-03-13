import { motion, AnimatePresence } from 'framer-motion'
import { Upload, FileText, AlertTriangle, CheckCircle, TrendingUp, TrendingDown, Activity, Image, Shield } from 'lucide-react'

interface ReportMetric {
  name: string
  value: string
  unit: string
  status: 'normal' | 'warning' | 'critical'
  range: string
}

interface ReportAnalysisProps {
  metrics: ReportMetric[]
}

const statusColors = {
  normal: {
    bg: 'bg-emerald-50/80',
    text: 'text-emerald-700',
    icon: CheckCircle,
    border: 'border-emerald-200/60',
    gradient: 'from-emerald-500 to-teal-600',
    glow: 'shadow-emerald-500/10',
    badge: 'bg-emerald-100 text-emerald-700',
    bar: 'bg-emerald-500',
  },
  warning: {
    bg: 'bg-amber-50/80',
    text: 'text-amber-700',
    icon: AlertTriangle,
    border: 'border-amber-200/60',
    gradient: 'from-amber-500 to-orange-600',
    glow: 'shadow-amber-500/10',
    badge: 'bg-amber-100 text-amber-700',
    bar: 'bg-amber-500',
  },
  critical: {
    bg: 'bg-red-50/80',
    text: 'text-red-700',
    icon: AlertTriangle,
    border: 'border-red-200/60',
    gradient: 'from-red-500 to-rose-600',
    glow: 'shadow-red-500/10',
    badge: 'bg-red-100 text-red-700',
    bar: 'bg-red-500',
  },
}

export default function ReportAnalysis({ metrics }: ReportAnalysisProps) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      {metrics.map((metric, i) => {
        const s = statusColors[metric.status]
        const StatusIcon = s.icon
        return (
          <motion.div
            key={metric.name}
            initial={{ opacity: 0, y: 20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            transition={{ delay: i * 0.1, type: 'spring', stiffness: 200 }}
            whileHover={{ y: -2, scale: 1.01 }}
            className={`${s.bg} backdrop-blur-sm border ${s.border} rounded-xl p-4 hover:shadow-lg ${s.glow} transition-all duration-300 relative overflow-hidden group`}
          >
            {/* Gradient accent line at top */}
            <div className={`absolute top-0 left-0 right-0 h-0.5 bg-gradient-to-r ${s.gradient} opacity-60`} />

            <div className="flex items-center justify-between">
              <div className="flex-1">
                <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide">{metric.name}</p>
                <div className="flex items-baseline gap-1.5 mt-1.5">
                  <motion.p
                    className={`text-2xl font-bold ${s.text}`}
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: i * 0.1 + 0.2 }}
                  >
                    {metric.value}
                  </motion.p>
                  <span className="text-sm font-medium text-slate-400">{metric.unit}</span>
                </div>
                <div className="flex items-center gap-2 mt-1.5">
                  <span className="text-[10px] text-slate-400 font-medium">Normal: {metric.range}</span>
                  <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded-full ${s.badge} inline-flex items-center gap-0.5`}>
                    {metric.status === 'normal' ? <><CheckCircle className="w-2.5 h-2.5" /> Normal</> : metric.status === 'warning' ? <><AlertTriangle className="w-2.5 h-2.5" /> Warning</> : <><AlertTriangle className="w-2.5 h-2.5" /> Critical</>}
                  </span>
                </div>
              </div>
              <motion.div
                whileHover={{ rotate: [0, -10, 10, 0] }}
                className={`w-10 h-10 rounded-xl bg-gradient-to-br ${s.gradient} flex items-center justify-center shadow-lg`}
              >
                <StatusIcon className="w-5 h-5 text-white" />
              </motion.div>
            </div>
          </motion.div>
        )
      })}
    </div>
  )
}

export function UploadReport({ onUpload }: { onUpload?: () => void }) {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.98 }}
      animate={{ opacity: 1, scale: 1 }}
      whileHover={{ scale: 1.01 }}
      className="relative border-2 border-dashed border-slate-300/60 rounded-2xl p-8 text-center hover:border-blue-400/60 hover:bg-blue-50/20 transition-all duration-500 cursor-pointer group overflow-hidden"
      onClick={onUpload}
    >
      {/* Animated background gradient */}
      <div className="absolute inset-0 bg-gradient-to-br from-blue-50/0 to-indigo-50/0 group-hover:from-blue-50/40 group-hover:to-indigo-50/40 transition-all duration-700 rounded-2xl" />

      {/* Floating particles */}
      <motion.div
        className="absolute top-1/4 left-1/4 w-2 h-2 rounded-full bg-blue-300/20"
        animate={{ y: [-10, 10, -10], x: [-5, 5, -5] }}
        transition={{ duration: 4, repeat: Infinity, ease: 'easeInOut' }}
      />
      <motion.div
        className="absolute bottom-1/3 right-1/4 w-1.5 h-1.5 rounded-full bg-indigo-300/20"
        animate={{ y: [8, -8, 8], x: [4, -4, 4] }}
        transition={{ duration: 5, repeat: Infinity, ease: 'easeInOut' }}
      />

      <div className="relative z-10">
        <motion.div
          animate={{ y: [0, -4, 0] }}
          transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
          className="w-16 h-16 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-lg shadow-blue-500/20"
        >
          <Upload className="w-8 h-8 text-white" />
        </motion.div>
        <h3 className="font-bold text-slate-700 mb-1 text-base">Upload Medical Report</h3>
        <p className="text-sm text-slate-400">
          Drop your PDF, image, or lab report here, or click to browse
        </p>
        <div className="flex items-center justify-center gap-4 mt-4">
          {[
            { label: 'PDF', icon: FileText },
            { label: 'JPG/PNG', icon: Image },
            { label: 'DICOM', icon: Shield },
          ].map(({ label, icon: FIcon }) => (
            <motion.span
              key={label}
              whileHover={{ scale: 1.1 }}
              className="flex items-center gap-1.5 text-xs text-slate-400 bg-slate-50 px-2.5 py-1 rounded-full border border-slate-200/60"
            >
              <FIcon className="w-3 h-3" /> {label}
            </motion.span>
          ))}
        </div>
        <p className="text-[10px] text-slate-300 mt-3">Max 10MB · AI-powered analysis</p>
      </div>
    </motion.div>
  )
}
