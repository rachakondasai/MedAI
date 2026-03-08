import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Search, Pill, ExternalLink, Info, ShoppingCart, Loader2, AlertCircle, Stethoscope } from 'lucide-react'
import { searchMedicines, type ChatResponse } from '../lib/api'

interface Medicine {
  name: string
  buyLink: string
  dosage: string
}

export default function Medicines() {
  const [searchQuery, setSearchQuery] = useState('')
  const [medicines, setMedicines] = useState<Medicine[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [hasSearched, setHasSearched] = useState(false)
  const [conditions, setConditions] = useState<string[]>([])
  const [riskLevel, setRiskLevel] = useState('')
  const [aiReply, setAiReply] = useState('')

  const handleSearch = async (e?: React.FormEvent) => {
    if (e) e.preventDefault()
    if (!searchQuery.trim()) return
    setLoading(true)
    setError('')
    setHasSearched(true)
    try {
      const response: ChatResponse = await searchMedicines(searchQuery)
      setMedicines(response.analysis?.medicines || [])
      setConditions(response.analysis?.conditions || [])
      setRiskLevel(response.analysis?.riskLevel || '')
      setAiReply(response.reply || '')
    } catch (err: any) {
      setError(err.message || 'Failed to search medicines. Make sure the backend is running.')
    } finally {
      setLoading(false)
    }
  }

  const quickSearches = [
    'Fever and body pain',
    'Headache and migraine',
    'Cold and cough',
    'Stomach pain',
    'Allergies',
    'Joint pain',
    'Acid reflux',
    'Skin rash',
    'Diabetes management',
    'Blood pressure',
  ]

  return (
    <div className="p-6 space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <div>
        <h2 className="text-xl font-bold text-slate-900">Medicine Recommendations</h2>
        <p className="text-sm text-slate-500 mt-1">
          Describe your symptoms and get AI-powered medicine recommendations with 1mg & PharmEasy links
        </p>
      </div>

      {/* Search */}
      <motion.form
        onSubmit={handleSearch}
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex gap-3"
      >
        <div className="flex-1 relative">
          <Search className="w-4 h-4 absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Describe your symptoms (e.g., fever with headache, sore throat, stomach ache)..."
            className="w-full pl-11 pr-4 py-3 text-sm bg-white border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-400 transition-all"
          />
        </div>
        <button
          type="submit"
          disabled={loading || !searchQuery.trim()}
          className="flex items-center gap-2 px-5 py-3 bg-emerald-600 hover:bg-emerald-700 disabled:bg-emerald-300 text-white text-sm font-medium rounded-xl transition-colors"
        >
          {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Search className="w-4 h-4" />}
          Search
        </button>
      </motion.form>

      {/* Quick Symptom Tags */}
      <div className="flex gap-2 flex-wrap">
        {quickSearches.map((tag) => (
          <button
            key={tag}
            onClick={() => {
              setSearchQuery(tag)
              setTimeout(() => {
                const form = document.querySelector('form')
                form?.requestSubmit()
              }, 100)
            }}
            className="px-4 py-1.5 text-xs font-medium rounded-full bg-white border border-slate-200 text-slate-500 hover:bg-emerald-50 hover:border-emerald-300 hover:text-emerald-600 transition-colors"
          >
            {tag}
          </button>
        ))}
      </div>

      {/* Error */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-xl p-4 text-xs text-red-700">{error}</div>
      )}

      {/* Loading */}
      {loading && (
        <div className="flex items-center justify-center py-20">
          <Loader2 className="w-6 h-6 text-emerald-500 animate-spin" />
          <span className="ml-2 text-sm text-slate-500">Analyzing symptoms and finding medicines...</span>
        </div>
      )}

      {/* AI Analysis Summary */}
      {!loading && hasSearched && (conditions.length > 0 || riskLevel || aiReply) && (
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-4">
          {/* AI Reply */}
          {aiReply && (
            <div className="bg-white border border-slate-200 rounded-xl p-4">
              <p className="text-xs font-semibold text-slate-700 mb-2">🤖 AI Analysis</p>
              <p className="text-sm text-slate-600 leading-relaxed whitespace-pre-line">{aiReply.slice(0, 500)}{aiReply.length > 500 ? '…' : ''}</p>
            </div>
          )}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {conditions.length > 0 && (
            <div className="bg-amber-50 border border-amber-200 rounded-xl p-4">
              <p className="text-xs font-semibold text-amber-800 mb-2">🔍 Identified Conditions</p>
              <div className="flex flex-wrap gap-1.5">
                {conditions.map((c, i) => (
                  <span key={i} className="text-[10px] bg-white text-amber-700 px-2 py-0.5 rounded-full font-medium border border-amber-200">{c}</span>
                ))}
              </div>
            </div>
          )}
          {riskLevel && (
            <div className={`border rounded-xl p-4 ${
              riskLevel.toLowerCase().includes('high') || riskLevel.toLowerCase().includes('critical')
                ? 'bg-red-50 border-red-200'
                : riskLevel.toLowerCase().includes('moderate')
                ? 'bg-amber-50 border-amber-200'
                : 'bg-emerald-50 border-emerald-200'
            }`}>
              <p className="text-xs font-semibold mb-2" style={{ color: 'inherit' }}>
                <Stethoscope className="w-3.5 h-3.5 inline mr-1" />
                Risk Level: {riskLevel}
              </p>
            </div>
          )}
          </div>
        </motion.div>
      )}

      {/* Medicine Results */}
      {!loading && hasSearched && (
        <p className="text-xs text-slate-400">
          Found {medicines.length} medicine{medicines.length !== 1 ? 's' : ''} for your symptoms
        </p>
      )}

      <AnimatePresence mode="popLayout">
        {!loading && medicines.length > 0 && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
            {medicines.map((m, i) => (
              <motion.div
                key={i}
                layout
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95 }}
                transition={{ delay: i * 0.04 }}
              >
                <div className="bg-white rounded-2xl border border-slate-200 p-5 hover:shadow-xl hover:shadow-slate-200/50 transition-all duration-300 group h-full flex flex-col">
                  <div className="flex items-start justify-between mb-3">
                    <div className="w-12 h-12 bg-gradient-to-br from-emerald-50 to-teal-100 rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform">
                      <Pill className="w-6 h-6 text-emerald-600" />
                    </div>
                  </div>
                  <h3 className="font-semibold text-slate-900 text-sm">{m.name}</h3>
                  <div className="mt-3 space-y-1.5">
                    <div className="flex items-start gap-2">
                      <Info className="w-3 h-3 text-slate-400 shrink-0 mt-0.5" />
                      <span className="text-xs text-slate-500">{m.dosage}</span>
                    </div>
                  </div>
                  <div className="flex-1" />
                  <div className="mt-4 pt-4 border-t border-slate-100 space-y-3">
                    <div className="flex gap-2">
                      <a
                        href={m.buyLink || `https://www.1mg.com/search/all?name=${encodeURIComponent(m.name)}`}
                        target="_blank"
                        rel="noreferrer"
                        className="flex-1 flex items-center justify-center gap-1.5 py-2 text-xs font-medium text-emerald-700 bg-emerald-50 hover:bg-emerald-100 rounded-lg transition-colors"
                      >
                        <ExternalLink className="w-3 h-3" /> 1mg
                      </a>
                      <a
                        href={`https://pharmeasy.in/search/all?name=${encodeURIComponent(m.name)}`}
                        target="_blank"
                        rel="noreferrer"
                        className="flex-1 flex items-center justify-center gap-1.5 py-2 text-xs font-medium text-blue-700 bg-blue-50 hover:bg-blue-100 rounded-lg transition-colors"
                      >
                        <ExternalLink className="w-3 h-3" /> PharmEasy
                      </a>
                      <a
                        href={`https://www.netmeds.com/catalogsearch/result?q=${encodeURIComponent(m.name)}`}
                        target="_blank"
                        rel="noreferrer"
                        className="flex-1 flex items-center justify-center gap-1.5 py-2 text-xs font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors"
                      >
                        <ShoppingCart className="w-3 h-3" /> Netmeds
                      </a>
                    </div>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        )}

        {!loading && hasSearched && medicines.length === 0 && !error && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-center py-20">
            <Pill className="w-12 h-12 text-slate-200 mx-auto mb-3" />
            <p className="text-sm text-slate-400">No medicines found. Try a different symptom description.</p>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Initial state — no search yet */}
      {!hasSearched && !loading && (
        <div className="text-center py-16">
          <Pill className="w-16 h-16 text-emerald-100 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-slate-900 mb-2">AI-Powered Medicine Finder</h3>
          <p className="text-sm text-slate-500 max-w-md mx-auto">
            Describe your symptoms above, and our AI will recommend specific medicines
            with dosage instructions and direct purchase links to 1mg, PharmEasy, and Netmeds.
          </p>
        </div>
      )}

      {/* Disclaimer */}
      <div className="bg-amber-50 border border-amber-200 rounded-xl p-4">
        <p className="text-xs text-amber-800 leading-relaxed">
          ⚠️ <strong>Disclaimer:</strong> Always consult a qualified healthcare professional before
          taking any medicine. The information provided here is for educational purposes only.
          Prescription medicines should only be taken as prescribed by a doctor.
        </p>
      </div>
    </div>
  )
}
