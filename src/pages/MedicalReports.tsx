import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts'
import { Upload, FileText, Loader2, CheckCircle, AlertTriangle, Pill, RefreshCw } from 'lucide-react'
import { uploadReport } from '../lib/api'
import { isAuthenticated, getUserReports } from '../lib/auth'

interface ReportMetric {
  name: string
  value: string
  unit: string
  status: 'normal' | 'warning' | 'critical'
  range: string
}

const statusColors = {
  normal: { bg: 'bg-emerald-50', text: 'text-emerald-700', icon: CheckCircle, border: 'border-emerald-200' },
  warning: { bg: 'bg-amber-50', text: 'text-amber-700', icon: AlertTriangle, border: 'border-amber-200' },
  critical: { bg: 'bg-red-50', text: 'text-red-700', icon: AlertTriangle, border: 'border-red-200' },
}

export default function MedicalReports() {
  const [uploading, setUploading] = useState(false)
  const [uploadResult, setUploadResult] = useState<any>(null)
  const [metrics, setMetrics] = useState<ReportMetric[]>([])
  const [summary, setSummary] = useState('')
  const [recommendations, setRecommendations] = useState<string[]>([])
  const [pastReports, setPastReports] = useState<any[]>([])
  const [loadingHistory, setLoadingHistory] = useState(false)

  useEffect(() => {
    loadPastReports()
  }, [])

  const loadPastReports = async () => {
    if (!isAuthenticated()) return
    setLoadingHistory(true)
    try {
      const reports = await getUserReports(20)
      setPastReports(reports)
    } catch {
      // ignore
    } finally {
      setLoadingHistory(false)
    }
  }

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    setUploading(true)
    setUploadResult(null)
    try {
      const result = await uploadReport(file)
      setUploadResult(result)
      setSummary(result.analysis?.summary || '')
      setRecommendations(result.analysis?.recommendations || [])

      // Update metrics from AI analysis if available
      if (result.analysis?.metrics?.length) {
        const parsed = result.analysis.metrics.map((m: any) => ({
          name: m.name,
          value: String(m.value),
          unit: m.unit || '',
          status: m.status || 'normal',
          range: m.range || 'N/A',
        }))
        setMetrics(parsed)
      }
      // Reload reports list
      loadPastReports()
    } catch (err: any) {
      setUploadResult({ error: err.message })
    } finally {
      setUploading(false)
    }
  }

  // Prepare chart data from metrics (only if we have metrics)
  const chartData = metrics.length > 0
    ? metrics.map((m) => ({
        name: m.name.length > 12 ? m.name.slice(0, 12) + '…' : m.name,
        value: parseFloat(m.value) || 0,
      }))
    : []

  return (
    <div className="p-6 space-y-6 max-w-6xl mx-auto">
      {/* Upload Zone */}
      <label className="block cursor-pointer">
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className={`border-2 border-dashed rounded-2xl p-8 text-center transition-all duration-300 ${
            uploading ? 'border-blue-400 bg-blue-50/30' : 'border-slate-300 hover:border-blue-400 hover:bg-blue-50/30'
          }`}
        >
          {uploading ? (
            <div className="flex flex-col items-center">
              <Loader2 className="w-10 h-10 text-blue-500 animate-spin mb-3" />
              <p className="text-sm text-blue-600 font-medium">Uploading & analyzing with AI...</p>
              <p className="text-xs text-slate-400 mt-1">LangChain RAG is indexing your document</p>
            </div>
          ) : (
            <>
              <div className="w-16 h-16 bg-blue-50 rounded-2xl flex items-center justify-center mx-auto mb-4">
                <Upload className="w-8 h-8 text-blue-500" />
              </div>
              <h3 className="font-semibold text-slate-700 mb-1">Upload Medical Report</h3>
              <p className="text-sm text-slate-400">Drop your PDF here — AI will analyze it with RAG + GPT-4o</p>
              <div className="flex items-center justify-center gap-4 mt-4">
                <span className="flex items-center gap-1 text-xs text-slate-400"><FileText className="w-3 h-3" /> PDF only, max 10MB</span>
              </div>
            </>
          )}
        </motion.div>
        <input type="file" accept=".pdf" onChange={handleUpload} className="hidden" disabled={uploading} />
      </label>

      {/* Upload Result */}
      {uploadResult && (
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className={`rounded-xl p-4 ${uploadResult.error ? 'bg-red-50 border border-red-200' : 'bg-emerald-50 border border-emerald-200'}`}>
          {uploadResult.error ? (
            <p className="text-sm text-red-700">❌ {uploadResult.error}</p>
          ) : (
            <div>
              <p className="text-sm text-emerald-700 font-medium">✅ {uploadResult.message}</p>
              <p className="text-xs text-emerald-600 mt-1">{uploadResult.chunks_indexed} chunks indexed in FAISS vector store</p>
              {summary && <p className="text-xs text-slate-600 mt-2">{summary}</p>}
              {recommendations.length > 0 && (
                <div className="mt-3">
                  <p className="text-xs font-semibold text-emerald-800 mb-1">AI Recommendations:</p>
                  <ul className="space-y-1">
                    {recommendations.map((r, i) => (
                      <li key={i} className="text-xs text-slate-600 flex items-start gap-2">
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 shrink-0 mt-1" />
                        {r}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          )}
        </motion.div>
      )}

      {/* Analysis Results — only shown after a report is analyzed */}
      {metrics.length > 0 && (
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
          <h2 className="text-lg font-semibold text-slate-900 mb-4">AI Report Analysis</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {metrics.map((metric, i) => {
              const s = statusColors[metric.status] || statusColors.normal
              const StatusIcon = s.icon
              return (
                <motion.div key={metric.name} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.1 }} className={`${s.bg} border ${s.border} rounded-xl p-4`}>
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-xs font-medium text-slate-500">{metric.name}</p>
                      <p className={`text-2xl font-bold ${s.text} mt-1`}>{metric.value} <span className="text-sm font-normal">{metric.unit}</span></p>
                      <p className="text-[10px] text-slate-400 mt-1">Normal: {metric.range}</p>
                    </div>
                    <StatusIcon className={`w-6 h-6 ${s.text}`} />
                  </div>
                </motion.div>
              )
            })}
          </div>
        </motion.div>
      )}

      {/* Chart — only shown when we have real data */}
      {chartData.length > 0 && (
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }} className="bg-white rounded-2xl border border-slate-200 p-6">
          <h3 className="font-semibold text-slate-900 mb-1">Lab Values</h3>
          <p className="text-xs text-slate-400 mb-6">Extracted from your uploaded report</p>
          <ResponsiveContainer width="100%" height={280}>
            <BarChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
              <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: '#94a3b8' }} />
              <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#94a3b8' }} />
              <Tooltip contentStyle={{ background: '#fff', border: '1px solid #e2e8f0', borderRadius: '12px', boxShadow: '0 4px 12px rgba(0,0,0,0.05)', fontSize: '12px' }} />
              <Bar dataKey="value" fill="#3b82f6" radius={[4, 4, 0, 0]} name="Value" />
            </BarChart>
          </ResponsiveContainer>
        </motion.div>
      )}

      {/* Empty state when no report has been uploaded yet */}
      {metrics.length === 0 && !uploadResult && (
        <div className="text-center py-12">
          <FileText className="w-16 h-16 text-slate-200 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-slate-900 mb-2">No Reports Analyzed Yet</h3>
          <p className="text-sm text-slate-500 max-w-md mx-auto">
            Upload a medical report (PDF) above and our AI will extract key metrics, flag abnormalities, and provide personalized health recommendations.
          </p>
        </div>
      )}

      {/* Past Report Uploads */}
      {pastReports.length > 0 && (
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}>
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold text-slate-900">Upload History</h3>
            <button onClick={loadPastReports} className="flex items-center gap-1 text-xs text-slate-500 hover:text-blue-600 transition-colors">
              <RefreshCw className="w-3 h-3" /> Refresh
            </button>
          </div>
          <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden">
            <div className="divide-y divide-slate-50">
              {pastReports.map((r, i) => (
                <div key={r.id || i} className="flex items-center gap-3 px-5 py-3 hover:bg-slate-50 transition-colors">
                  <div className="w-9 h-9 bg-blue-50 rounded-lg flex items-center justify-center">
                    <FileText className="w-4 h-4 text-blue-600" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-slate-900 truncate">{r.filename}</p>
                    <p className="text-[10px] text-slate-400">{r.chunks_indexed} chunks indexed</p>
                  </div>
                  <span className="text-[10px] text-slate-400 shrink-0">
                    {new Date(r.created_at).toLocaleDateString()}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </motion.div>
      )}
    </div>
  )
}
