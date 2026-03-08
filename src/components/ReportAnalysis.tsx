import { motion } from 'framer-motion'
import { Upload, FileText, AlertTriangle, CheckCircle } from 'lucide-react'

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
  normal: { bg: 'bg-emerald-50', text: 'text-emerald-700', icon: CheckCircle, border: 'border-emerald-200' },
  warning: { bg: 'bg-amber-50', text: 'text-amber-700', icon: AlertTriangle, border: 'border-amber-200' },
  critical: { bg: 'bg-red-50', text: 'text-red-700', icon: AlertTriangle, border: 'border-red-200' },
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
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.1 }}
            className={`${s.bg} border ${s.border} rounded-xl p-4`}
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-medium text-slate-500">{metric.name}</p>
                <p className={`text-2xl font-bold ${s.text} mt-1`}>
                  {metric.value} <span className="text-sm font-normal">{metric.unit}</span>
                </p>
                <p className="text-[10px] text-slate-400 mt-1">Normal: {metric.range}</p>
              </div>
              <StatusIcon className={`w-6 h-6 ${s.text}`} />
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
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="border-2 border-dashed border-slate-300 rounded-2xl p-8 text-center hover:border-blue-400 hover:bg-blue-50/30 transition-all duration-300 cursor-pointer"
      onClick={onUpload}
    >
      <div className="w-16 h-16 bg-blue-50 rounded-2xl flex items-center justify-center mx-auto mb-4">
        <Upload className="w-8 h-8 text-blue-500" />
      </div>
      <h3 className="font-semibold text-slate-700 mb-1">Upload Medical Report</h3>
      <p className="text-sm text-slate-400">
        Drop your PDF, image, or lab report here, or click to browse
      </p>
      <div className="flex items-center justify-center gap-4 mt-4">
        <span className="flex items-center gap-1 text-xs text-slate-400">
          <FileText className="w-3 h-3" /> PDF
        </span>
        <span className="flex items-center gap-1 text-xs text-slate-400">
          <FileText className="w-3 h-3" /> JPG/PNG
        </span>
        <span className="flex items-center gap-1 text-xs text-slate-400">
          <FileText className="w-3 h-3" /> DICOM
        </span>
      </div>
    </motion.div>
  )
}
