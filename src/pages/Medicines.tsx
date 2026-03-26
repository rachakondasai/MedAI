import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Search, Pill, ExternalLink, Info, ShoppingCart, Loader2, AlertCircle, Stethoscope, Brain, Sparkles, Star, Shield } from 'lucide-react'
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
    <div className="min-h-full relative">
      {/* Ambient mesh background */}
      <div className="fixed inset-0 pointer-events-none -z-10">
        <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-gradient-to-bl from-emerald-100/25 via-teal-50/10 to-transparent rounded-full blur-3xl" />
        <div className="absolute bottom-0 left-0 w-[400px] h-[400px] bg-gradient-to-tr from-green-100/20 via-cyan-50/10 to-transparent rounded-full blur-3xl" />
      </div>
    <div className="p-6 space-y-6 max-w-7xl mx-auto pb-12">
      {/* Header — Premium */}
      <motion.div
        initial={{ opacity: 0, y: -15 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex items-center gap-3"
      >
        <motion.div
          animate={{ y: [0, -3, 0] }}
          transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut' }}
          className="w-12 h-12 rounded-2xl bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center shadow-xl shadow-emerald-500/25"
        >
          <Pill className="w-6 h-6 text-white" />
        </motion.div>
        <div>
          <h2 className="text-xl font-bold text-slate-900">Medicine Recommendations</h2>
          <p className="text-sm text-slate-500 mt-0.5">
            Describe your symptoms and get AI-powered medicine recommendations with 1mg & PharmEasy links
          </p>
        </div>
      </motion.div>

      {/* Search — Premium Glassmorphism */}
      <motion.form
        onSubmit={handleSearch}
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.05 }}
        className="flex gap-3"
      >
        <div className="flex-1 relative group">
          <Search className="w-4 h-4 absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-emerald-500 transition-colors" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Describe your symptoms (e.g., fever with headache, sore throat, stomach ache)..."
            className="w-full pl-11 pr-4 py-3.5 text-sm glass border border-white/60 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-400 transition-all shadow-sm"
          />
        </div>
        <motion.button
          type="submit"
          disabled={loading || !searchQuery.trim()}
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          className="flex items-center gap-2 px-6 py-3.5 bg-gradient-to-r from-emerald-500 to-emerald-600 hover:from-emerald-600 hover:to-emerald-700 disabled:from-emerald-300 disabled:to-emerald-300 text-white text-sm font-semibold rounded-xl transition-all shadow-lg shadow-emerald-500/20"
        >
          {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Search className="w-4 h-4" />}
          Search
        </motion.button>
      </motion.form>

      {/* Quick Symptom Tags — Premium */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.1 }}
        className="flex gap-2 flex-wrap"
      >
        {quickSearches.map((tag, i) => (
          <motion.button
            key={tag}
            initial={{ opacity: 0, y: 5 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 + i * 0.03 }}
            whileHover={{ scale: 1.05, y: -1 }}
            onClick={() => {
              setSearchQuery(tag)
              setTimeout(() => {
                const form = document.querySelector('form')
                form?.requestSubmit()
              }, 100)
            }}
            className="px-4 py-1.5 text-xs font-medium rounded-full glass border border-white/60 text-slate-500 hover:bg-emerald-50 hover:border-emerald-200 hover:text-emerald-600 transition-all shadow-sm"
          >
            {tag}
          </motion.button>
        ))}
      </motion.div>

      {/* Error */}
      <AnimatePresence>
        {error && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="bg-red-50 border border-red-200 rounded-xl p-4 text-xs text-red-700 flex items-center gap-2"
          >
            <AlertCircle className="w-4 h-4 shrink-0" /> {error}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Loading — Premium */}
      {loading && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="flex flex-col items-center justify-center py-20"
        >
          <div className="relative mb-4">
            <div className="w-16 h-16 rounded-full border-4 border-slate-200" />
            <div className="absolute inset-0 w-16 h-16 rounded-full border-4 border-transparent border-t-emerald-500 animate-spin" />
            <Pill className="absolute inset-0 w-6 h-6 m-auto text-emerald-500" />
          </div>
          <span className="text-sm text-slate-600 font-medium">Analyzing symptoms and finding medicines...</span>
          <div className="flex gap-1 mt-3">
            {[0, 1, 2].map((i) => (
              <motion.div
                key={i}
                className="w-2 h-2 rounded-full bg-emerald-400"
                animate={{ opacity: [0.3, 1, 0.3] }}
                transition={{ duration: 0.8, repeat: Infinity, delay: i * 0.2 }}
              />
            ))}
          </div>
        </motion.div>
      )}

      {/* AI Analysis Summary — Premium */}
      {!loading && hasSearched && (conditions.length > 0 || riskLevel || aiReply) && (
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-4">
          {aiReply && (
            <div className="glass border border-white/60 rounded-xl p-5 relative overflow-hidden">
              <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-emerald-50/50 to-transparent rounded-full -translate-y-1/2 translate-x-1/2" />
              <div className="flex items-center gap-2 mb-3 relative z-10">
                <div className="w-6 h-6 rounded-lg bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center">
                  <Brain className="w-3.5 h-3.5 text-white" />
                </div>
                <p className="text-xs font-bold text-slate-700">AI Analysis</p>
              </div>
              <p className="text-sm text-slate-600 leading-relaxed whitespace-pre-line relative z-10">{aiReply.slice(0, 500)}{aiReply.length > 500 ? '…' : ''}</p>
            </div>
          )}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {conditions.length > 0 && (
              <motion.div
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                className="bg-gradient-to-br from-amber-50 to-orange-50/50 border border-amber-100/50 rounded-xl p-4"
              >
                <div className="flex items-center gap-2 mb-3">
                  <div className="w-6 h-6 rounded-lg bg-gradient-to-br from-amber-500 to-orange-600 flex items-center justify-center">
                    <AlertCircle className="w-3.5 h-3.5 text-white" />
                  </div>
                  <p className="text-xs font-bold text-amber-800">Identified Conditions</p>
                </div>
                <div className="flex flex-wrap gap-1.5">
                  {conditions.map((c, i) => (
                    <motion.span
                      key={i}
                      initial={{ opacity: 0, scale: 0.9 }}
                      animate={{ opacity: 1, scale: 1 }}
                      transition={{ delay: i * 0.04 }}
                      className="text-[10px] bg-white/80 backdrop-blur-sm text-amber-700 px-2.5 py-0.5 rounded-full font-semibold border border-amber-200/50"
                    >
                      {c}
                    </motion.span>
                  ))}
                </div>
              </motion.div>
            )}
            {riskLevel && (
              <motion.div
                initial={{ opacity: 0, x: 10 }}
                animate={{ opacity: 1, x: 0 }}
                className={`border rounded-xl p-4 ${
                  riskLevel.toLowerCase().includes('high') || riskLevel.toLowerCase().includes('critical')
                    ? 'bg-gradient-to-br from-red-50 to-rose-50/50 border-red-100/50'
                    : riskLevel.toLowerCase().includes('moderate')
                    ? 'bg-gradient-to-br from-amber-50 to-orange-50/50 border-amber-100/50'
                    : 'bg-gradient-to-br from-emerald-50 to-teal-50/50 border-emerald-100/50'
                }`}
              >
                <div className="flex items-center gap-2 mb-2">
                  <div className={`w-6 h-6 rounded-lg flex items-center justify-center bg-gradient-to-br ${
                    riskLevel.toLowerCase().includes('high') ? 'from-red-500 to-rose-600' :
                    riskLevel.toLowerCase().includes('moderate') ? 'from-amber-500 to-orange-600' :
                    'from-emerald-500 to-teal-600'
                  }`}>
                    <Shield className="w-3.5 h-3.5 text-white" />
                  </div>
                  <p className="text-xs font-bold text-slate-700">
                    Risk Level: <span className="uppercase">{riskLevel}</span>
                  </p>
                </div>
              </motion.div>
            )}
          </div>
        </motion.div>
      )}

      {/* Medicine Results Count */}
      {!loading && hasSearched && (
        <div className="flex items-center gap-2">
          <div className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
          <p className="text-xs text-slate-400 font-medium">
            Found <span className="text-slate-600 font-bold">{medicines.length}</span> medicine{medicines.length !== 1 ? 's' : ''} for your symptoms
          </p>
        </div>
      )}

      {/* Medicine Cards — Premium */}
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
                whileHover={{ y: -4 }}
              >
                <div className="glass rounded-2xl border border-white/60 p-5 hover:shadow-xl hover:shadow-emerald-500/10 transition-all duration-300 group h-full flex flex-col relative overflow-hidden">
                  <div className="absolute top-0 right-0 w-20 h-20 bg-gradient-to-br from-emerald-50/50 to-transparent rounded-full -translate-y-1/2 translate-x-1/2" />
                  <div className="flex items-start justify-between mb-3 relative z-10">
                    <div className="w-12 h-12 bg-gradient-to-br from-emerald-500 to-teal-600 rounded-xl flex items-center justify-center group-hover:scale-110 group-hover:rotate-3 transition-all duration-300 shadow-lg shadow-emerald-500/20">
                      <Pill className="w-6 h-6 text-white" />
                    </div>
                    <span className="flex items-center gap-1 text-[9px] font-bold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-100/50">
                      <Sparkles className="w-2.5 h-2.5" /> AI Pick
                    </span>
                  </div>
                  <h3 className="font-bold text-slate-900 text-sm relative z-10">{m.name}</h3>
                  <div className="mt-3 space-y-1.5 relative z-10">
                    <div className="flex items-start gap-2">
                      <Info className="w-3 h-3 text-slate-400 shrink-0 mt-0.5" />
                      <span className="text-xs text-slate-500 leading-relaxed">{m.dosage}</span>
                    </div>
                  </div>
                  <div className="flex-1" />
                  <div className="mt-4 pt-4 border-t border-slate-100/80 space-y-3 relative z-10">
                    <div className="flex gap-2">
                      <a
                        href={m.buyLink || `https://www.1mg.com/search/all?name=${encodeURIComponent(m.name)}`}
                        target="_blank"
                        rel="noreferrer"
                        className="flex-1 flex items-center justify-center gap-1.5 py-2.5 text-xs font-semibold text-emerald-700 bg-emerald-50 hover:bg-emerald-100 rounded-xl transition-all hover:shadow-sm"
                      >
                        <ExternalLink className="w-3 h-3" /> 1mg
                      </a>
                      <a
                        href={`https://pharmeasy.in/search/all?name=${encodeURIComponent(m.name)}`}
                        target="_blank"
                        rel="noreferrer"
                        className="flex-1 flex items-center justify-center gap-1.5 py-2.5 text-xs font-semibold text-blue-700 bg-blue-50 hover:bg-blue-100 rounded-xl transition-all hover:shadow-sm"
                      >
                        <ExternalLink className="w-3 h-3" /> PharmEasy
                      </a>
                      <a
                        href={`https://www.netmeds.com/catalogsearch/result?q=${encodeURIComponent(m.name)}`}
                        target="_blank"
                        rel="noreferrer"
                        className="flex-1 flex items-center justify-center gap-1.5 py-2.5 text-xs font-semibold text-white bg-gradient-to-r from-blue-500 to-blue-600 rounded-xl transition-all hover:shadow-lg hover:shadow-blue-500/20"
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
            <div className="w-16 h-16 rounded-2xl bg-slate-100 flex items-center justify-center mx-auto mb-3">
              <Pill className="w-8 h-8 text-slate-300" />
            </div>
            <p className="text-sm text-slate-500 font-medium">No medicines found. Try a different symptom description.</p>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Initial state — Premium */}
      {!hasSearched && !loading && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center py-16"
        >
          <motion.div
            animate={{ y: [0, -8, 0] }}
            transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut' }}
            className="w-20 h-20 rounded-2xl bg-gradient-to-br from-emerald-100 to-teal-100 flex items-center justify-center mx-auto mb-5 shadow-lg shadow-emerald-500/10"
          >
            <Pill className="w-10 h-10 text-emerald-500" />
          </motion.div>
          <h3 className="text-lg font-bold text-slate-900 mb-2">AI-Powered Medicine Finder</h3>
          <p className="text-sm text-slate-500 max-w-md mx-auto leading-relaxed">
            Describe your symptoms above, and our AI will recommend specific medicines
            with dosage instructions and direct purchase links to 1mg, PharmEasy, and Netmeds.
          </p>
        </motion.div>
      )}

      {/* Disclaimer — Premium */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.3 }}
        className="bg-gradient-to-r from-amber-50 to-orange-50/50 border border-amber-200/50 rounded-xl p-4 flex items-start gap-3"
      >
        <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-amber-500 to-orange-600 flex items-center justify-center shrink-0">
          <AlertCircle className="w-4 h-4 text-white" />
        </div>
        <div>
          <p className="text-xs font-bold text-amber-800">Disclaimer</p>
          <p className="text-xs text-amber-700 leading-relaxed mt-0.5">
            Always consult a qualified healthcare professional before
            taking any medicine. The information provided here is for educational purposes only.
            Prescription medicines should only be taken as prescribed by a doctor.
          </p>
        </div>
      </motion.div>
    </div>
    </div>
  )
}
