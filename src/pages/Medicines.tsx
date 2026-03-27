import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Search, Pill, ExternalLink, Info, ShoppingCart, Loader2,
  AlertCircle, Brain, Sparkles, Shield,
} from 'lucide-react'
import { searchMedicines, type ChatResponse } from '../lib/api'

interface Medicine { name: string; buyLink: string; dosage: string }

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
    setLoading(true); setError(''); setHasSearched(true)
    try {
      const res: ChatResponse = await searchMedicines(searchQuery)
      setMedicines(res.analysis?.medicines || [])
      setConditions(res.analysis?.conditions || [])
      setRiskLevel(res.analysis?.riskLevel || '')
      setAiReply(res.reply || '')
    } catch (e: any) { setError(e.message || 'Failed to search. Make sure backend is running.') }
    finally { setLoading(false) }
  }

  const quickSearches = [
    'Fever & body pain', 'Headache', 'Cold & cough', 'Stomach ache',
    'Allergies', 'Joint pain', 'Acid reflux', 'Skin rash',
  ]

  return (
    <div className="min-h-full">
      <div className="p-4 space-y-4 max-w-2xl mx-auto pb-8">

        {/* ── Header ─────────────────────────────────────────────── */}
        <div className="flex items-center gap-3 pt-1">
          <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center shadow-lg shadow-emerald-500/25 flex-shrink-0">
            <Pill className="w-5 h-5 text-white" />
          </div>
          <div>
            <h2 className="text-lg font-extrabold text-slate-900">Medicine Finder</h2>
            <p className="text-xs text-slate-400">Describe symptoms, get AI-powered recommendations</p>
          </div>
        </div>

        {/* ── Search bar ──────────────────────────────────────────── */}
        <form onSubmit={handleSearch} className="flex gap-2">
          <div className="flex-1 relative">
            <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              placeholder="Describe symptoms (e.g., fever with headache, sore throat…)"
              className="w-full pl-10 pr-3 py-3 text-sm border border-slate-200 bg-white rounded-2xl focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-400 shadow-sm"
            />
          </div>
          <motion.button type="submit" disabled={loading || !searchQuery.trim()} whileTap={{ scale: 0.95 }}
            className="px-4 py-3 bg-gradient-to-r from-emerald-500 to-emerald-600 disabled:opacity-40 text-white text-sm font-bold rounded-2xl shadow-md shadow-emerald-500/20 flex-shrink-0">
            {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Search className="w-4 h-4" />}
          </motion.button>
        </form>

        {/* ── Quick symptom pills ──────────────────────────────────── */}
        <div className="flex gap-2 overflow-x-auto no-scrollbar -mx-4 px-4 pb-1">
          {quickSearches.map(tag => (
            <motion.button key={tag} whileTap={{ scale: 0.94 }}
              onClick={() => { setSearchQuery(tag); setTimeout(() => handleSearch(), 50) }}
              className="flex-shrink-0 px-3 py-1.5 text-xs font-semibold rounded-full bg-emerald-50 text-emerald-700 border border-emerald-100 whitespace-nowrap">
              {tag}
            </motion.button>
          ))}
        </div>

        {/* ── Error ────────────────────────────────────────────────── */}
        <AnimatePresence>
          {error && (
            <motion.div initial={{ opacity:0, height:0 }} animate={{ opacity:1, height:'auto' }} exit={{ opacity:0, height:0 }}
              className="bg-red-50 border border-red-200 rounded-xl p-3.5 text-xs text-red-700 flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" /> {error}
            </motion.div>
          )}
        </AnimatePresence>

        {/* ── Loading ──────────────────────────────────────────────── */}
        {loading && (
          <div className="flex flex-col items-center justify-center py-16 gap-3">
            <div className="w-14 h-14 rounded-2xl bg-emerald-50 flex items-center justify-center">
              <div className="w-8 h-8 rounded-full border-t-emerald-500 border-emerald-100 animate-spin" style={{ borderWidth: 3 }} />
            </div>
            <p className="text-sm font-semibold text-slate-600">Analyzing symptoms…</p>
            <div className="flex gap-1">
              {[0,1,2].map(i => (
                <motion.div key={i} className="w-1.5 h-1.5 rounded-full bg-emerald-400"
                  animate={{ opacity:[0.3,1,0.3] }} transition={{ duration:0.8, repeat:Infinity, delay:i*0.2 }} />
              ))}
            </div>
          </div>
        )}

        {/* ── AI Analysis ─────────────────────────────────────────── */}
        {!loading && hasSearched && (aiReply || conditions.length > 0 || riskLevel) && (
          <motion.div initial={{ opacity:0, y:8 }} animate={{ opacity:1, y:0 }} className="space-y-3">
            {aiReply && (
              <div className="bg-gradient-to-br from-emerald-50 to-teal-50 border border-emerald-100 rounded-2xl p-4">
                <div className="flex items-center gap-2 mb-2">
                  <div className="w-6 h-6 rounded-lg bg-emerald-600 flex items-center justify-center">
                    <Brain className="w-3.5 h-3.5 text-white" />
                  </div>
                  <p className="text-xs font-bold text-emerald-800">AI Analysis</p>
                </div>
                <p className="text-xs text-slate-600 leading-relaxed">{aiReply.slice(0,400)}{aiReply.length>400?'…':''}</p>
              </div>
            )}
            <div className="grid grid-cols-2 gap-3">
              {conditions.length > 0 && (
                <div className="bg-amber-50 border border-amber-100 rounded-2xl p-3.5">
                  <p className="text-[10px] font-bold text-amber-700 uppercase tracking-wider mb-2">Conditions</p>
                  <div className="flex flex-wrap gap-1">
                    {conditions.slice(0,4).map((c,i) => (
                      <span key={i} className="text-[10px] bg-white text-amber-700 px-2 py-0.5 rounded-full font-semibold border border-amber-200">{c}</span>
                    ))}
                  </div>
                </div>
              )}
              {riskLevel && (
                <div className={`border rounded-2xl p-3.5 ${
                  riskLevel.toLowerCase().includes('high') ? 'bg-red-50 border-red-100' :
                  riskLevel.toLowerCase().includes('moderate') ? 'bg-amber-50 border-amber-100' :
                  'bg-emerald-50 border-emerald-100'
                }`}>
                  <p className="text-[10px] font-bold text-slate-600 uppercase tracking-wider mb-2">Risk Level</p>
                  <div className="flex items-center gap-1.5">
                    <Shield className="w-3.5 h-3.5 text-slate-500" />
                    <span className="text-sm font-extrabold text-slate-800 capitalize">{riskLevel}</span>
                  </div>
                </div>
              )}
            </div>
          </motion.div>
        )}

        {/* ── Results count ────────────────────────────────────────── */}
        {!loading && hasSearched && medicines.length > 0 && (
          <div className="flex items-center justify-between">
            <p className="text-xs font-semibold text-slate-500">
              <span className="text-slate-900 font-extrabold">{medicines.length}</span> medicines found
            </p>
            <span className="flex items-center gap-1 text-[10px] text-emerald-600 font-bold">
              <Sparkles className="w-3 h-3" /> AI Recommended
            </span>
          </div>
        )}

        {/* ── Medicine Cards ───────────────────────────────────────── */}
        <AnimatePresence mode="popLayout">
          {!loading && medicines.length > 0 && (
            <div className="space-y-3">
              {medicines.map((m, i) => (
                <motion.div key={i} layout
                  initial={{ opacity:0, y:16 }} animate={{ opacity:1, y:0 }} exit={{ opacity:0, scale:0.95 }}
                  transition={{ delay:i*0.05 }}
                  className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden"
                >
                  <div className="flex items-start gap-3 p-4 pb-3">
                    <div className="w-11 h-11 rounded-2xl bg-gradient-to-br from-emerald-100 to-teal-100 flex items-center justify-center flex-shrink-0 mt-0.5">
                      <Pill className="w-5 h-5 text-emerald-600" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-2">
                        <h3 className="text-sm font-bold text-slate-900 leading-snug">{m.name}</h3>
                        <span className="flex-shrink-0 flex items-center gap-0.5 text-[10px] font-bold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-100">
                          <Sparkles className="w-2.5 h-2.5" /> AI
                        </span>
                      </div>
                      {m.dosage && (
                        <div className="flex items-start gap-1.5 mt-1.5">
                          <Info className="w-3 h-3 text-slate-400 shrink-0 mt-0.5" />
                          <p className="text-[11px] text-slate-500 leading-relaxed">{m.dosage}</p>
                        </div>
                      )}
                    </div>
                  </div>
                  <div className="px-4 pb-4 grid grid-cols-3 gap-2">
                    <a href={m.buyLink || `https://www.1mg.com/search/all?name=${encodeURIComponent(m.name)}`}
                      target="_blank" rel="noreferrer"
                      className="flex flex-col items-center gap-1 py-2.5 bg-emerald-50 rounded-xl text-emerald-700 hover:bg-emerald-100 transition-colors">
                      <ExternalLink className="w-3.5 h-3.5" />
                      <span className="text-[10px] font-bold">1mg</span>
                    </a>
                    <a href={`https://pharmeasy.in/search/all?name=${encodeURIComponent(m.name)}`}
                      target="_blank" rel="noreferrer"
                      className="flex flex-col items-center gap-1 py-2.5 bg-blue-50 rounded-xl text-blue-700 hover:bg-blue-100 transition-colors">
                      <ExternalLink className="w-3.5 h-3.5" />
                      <span className="text-[10px] font-bold">PharmEasy</span>
                    </a>
                    <a href={`https://www.netmeds.com/catalogsearch/result?q=${encodeURIComponent(m.name)}`}
                      target="_blank" rel="noreferrer"
                      className="flex flex-col items-center gap-1 py-2.5 bg-slate-50 rounded-xl text-slate-600 hover:bg-slate-100 transition-colors">
                      <ShoppingCart className="w-3.5 h-3.5" />
                      <span className="text-[10px] font-bold">Netmeds</span>
                    </a>
                  </div>
                </motion.div>
              ))}
            </div>
          )}

          {!loading && hasSearched && medicines.length === 0 && !error && (
            <motion.div initial={{ opacity:0 }} animate={{ opacity:1 }} className="text-center py-14">
              <div className="w-14 h-14 rounded-2xl bg-slate-100 flex items-center justify-center mx-auto mb-3">
                <Pill className="w-7 h-7 text-slate-300" />
              </div>
              <p className="text-sm font-semibold text-slate-500">No medicines found.</p>
              <p className="text-xs text-slate-400 mt-1">Try describing your symptoms differently.</p>
            </motion.div>
          )}
        </AnimatePresence>

        {/* ── Initial empty state ──────────────────────────────────── */}
        {!hasSearched && !loading && (
          <motion.div initial={{ opacity:0, y:10 }} animate={{ opacity:1, y:0 }} className="text-center py-14">
            <motion.div animate={{ y:[0,-6,0] }} transition={{ duration:3, repeat:Infinity, ease:'easeInOut' }}
              className="w-16 h-16 rounded-2xl bg-gradient-to-br from-emerald-100 to-teal-100 flex items-center justify-center mx-auto mb-4 shadow-lg shadow-emerald-100">
              <Pill className="w-8 h-8 text-emerald-500" />
            </motion.div>
            <h3 className="text-base font-bold text-slate-800 mb-1">AI Medicine Finder</h3>
            <p className="text-xs text-slate-500 max-w-xs mx-auto leading-relaxed">
              Describe your symptoms to get AI-recommended medicines with dosage instructions and direct purchase links on 1mg, PharmEasy & Netmeds.
            </p>
          </motion.div>
        )}

        {/* ── Disclaimer ───────────────────────────────────────────── */}
        <div className="bg-amber-50 border border-amber-200/60 rounded-2xl p-3.5 flex items-start gap-3">
          <AlertCircle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
          <p className="text-[11px] text-amber-700 leading-relaxed">
            <strong>Disclaimer:</strong> Always consult a qualified healthcare professional before taking any medicine. This information is for educational purposes only.
          </p>
        </div>

      </div>
    </div>
  )
}
