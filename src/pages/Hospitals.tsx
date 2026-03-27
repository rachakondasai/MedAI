import { useState, useEffect, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Search, MapPin, Building2, Navigation, Calendar, ExternalLink,
  Loader2, MapPinned, Sparkles, AlertCircle, Stethoscope, Brain,
  Star, ChevronRight, Map,
} from 'lucide-react'
import { searchHospitals, type ChatResponse } from '../lib/api'

interface Hospital { name: string; mapLink: string }

export default function Hospitals({ userLocation = '' }: { userLocation?: string }) {
  const [searchQuery, setSearchQuery] = useState('')
  const [hospitals, setHospitals] = useState<Hospital[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [hasSearched, setHasSearched] = useState(false)
  const [conditions, setConditions] = useState<string[]>([])
  const [specialists, setSpecialists] = useState<string[]>([])
  const [aiReply, setAiReply] = useState('')
  const autoSearchedRef = useRef(false)

  useEffect(() => {
    if (userLocation && !hasSearched && !autoSearchedRef.current) {
      autoSearchedRef.current = true
      setSearchQuery(`General hospitals near ${userLocation}`)
      autoLoadNearby(userLocation)
    }
  }, [userLocation])

  const autoLoadNearby = async (city: string) => {
    setLoading(true); setHasSearched(true)
    try {
      const res: ChatResponse = await searchHospitals(`Find the best multi-specialty hospitals near ${city}. I am located in ${city}.`, city)
      setHospitals(res.analysis?.hospitals || [])
      setConditions(res.analysis?.conditions || [])
      setSpecialists(res.analysis?.specialists || [])
      setAiReply(res.reply || '')
    } catch (e: any) { setError(e.message || 'Failed to load nearby hospitals.') }
    finally { setLoading(false) }
  }

  const handleSearch = async (e?: React.FormEvent) => {
    if (e) e.preventDefault()
    if (!searchQuery.trim()) return
    setLoading(true); setError(''); setHasSearched(true)
    try {
      const q = userLocation ? `${searchQuery}. I am located in ${userLocation}.` : searchQuery
      const res: ChatResponse = await searchHospitals(q, userLocation || undefined)
      setHospitals(res.analysis?.hospitals || [])
      setConditions(res.analysis?.conditions || [])
      setSpecialists(res.analysis?.specialists || [])
      setAiReply(res.reply || '')
    } catch (e: any) { setError(e.message || 'Failed to search. Make sure backend is running.') }
    finally { setLoading(false) }
  }

  const quickSearches = [
    'Fever & cold', 'Heart problems', 'Orthopedics', 'Eye specialist',
    'Skin & dermatology', 'Dental care', 'Pregnancy care', 'Mental health',
  ]

  return (
    <div className="min-h-full">
      <div className="p-4 space-y-4 max-w-2xl mx-auto pb-8">

        {/* ── Header ─────────────────────────────────────────────── */}
        <div className="flex items-center gap-3 pt-1">
          <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center shadow-lg shadow-blue-500/25 flex-shrink-0">
            <Building2 className="w-5 h-5 text-white" />
          </div>
          <div>
            <h2 className="text-lg font-extrabold text-slate-900">Find Hospitals</h2>
            <p className="text-xs text-slate-400 flex items-center gap-1">
              {userLocation
                ? <><MapPinned className="w-3 h-3 text-blue-500" /> Near <span className="text-blue-600 font-semibold">{userLocation}</span></>
                : 'AI-powered hospital recommendations'}
            </p>
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
              placeholder="Describe symptoms (e.g., chest pain, knee injury…)"
              className="w-full pl-10 pr-3 py-3 text-sm border border-slate-200 bg-white rounded-2xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-400 shadow-sm"
            />
          </div>
          <motion.button type="submit" disabled={loading || !searchQuery.trim()}
            whileTap={{ scale: 0.95 }}
            className="px-4 py-3 bg-gradient-to-r from-blue-500 to-blue-600 disabled:opacity-40 text-white text-sm font-bold rounded-2xl shadow-md shadow-blue-500/20 flex-shrink-0">
            {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Search className="w-4 h-4" />}
          </motion.button>
          <motion.button type="button" whileTap={{ scale: 0.95 }}
            onClick={() => window.open('https://www.google.com/maps/search/hospitals+near+me', '_blank')}
            className="px-3 py-3 bg-slate-100 text-slate-600 text-sm font-medium rounded-2xl flex-shrink-0 flex items-center gap-1">
            <Map className="w-4 h-4" />
          </motion.button>
        </form>

        {/* ── Quick search pills ──────────────────────────────────── */}
        <div className="flex gap-2 overflow-x-auto no-scrollbar -mx-4 px-4 pb-1">
          {quickSearches.map(tag => (
            <motion.button key={tag} whileTap={{ scale: 0.94 }}
              onClick={() => { setSearchQuery(tag); setTimeout(() => handleSearch(), 50) }}
              className="flex-shrink-0 px-3 py-1.5 text-xs font-semibold rounded-full bg-blue-50 text-blue-600 border border-blue-100 whitespace-nowrap">
              {tag}
            </motion.button>
          ))}
        </div>

        {/* ── Error ───────────────────────────────────────────────── */}
        <AnimatePresence>
          {error && (
            <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }}
              className="bg-red-50 border border-red-200 rounded-xl p-3.5 text-xs text-red-700 flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" /> {error}
            </motion.div>
          )}
        </AnimatePresence>

        {/* ── Loading ─────────────────────────────────────────────── */}
        {loading && (
          <div className="flex flex-col items-center justify-center py-16 gap-3">
            <div className="w-14 h-14 rounded-2xl bg-blue-50 flex items-center justify-center">
              <div className="w-8 h-8 rounded-full border-3 border-blue-100 border-t-blue-500 animate-spin" style={{ borderWidth: 3 }} />
            </div>
            <p className="text-sm font-semibold text-slate-600">Finding hospitals near you…</p>
            <div className="flex gap-1">
              {[0,1,2].map(i => (
                <motion.div key={i} className="w-1.5 h-1.5 rounded-full bg-blue-400"
                  animate={{ opacity: [0.3,1,0.3] }} transition={{ duration: 0.8, repeat: Infinity, delay: i*0.2 }} />
              ))}
            </div>
          </div>
        )}

        {/* ── AI Analysis ─────────────────────────────────────────── */}
        {!loading && hasSearched && (aiReply || conditions.length > 0 || specialists.length > 0) && (
          <motion.div initial={{ opacity:0, y:8 }} animate={{ opacity:1, y:0 }} className="space-y-3">
            {aiReply && (
              <div className="bg-gradient-to-br from-blue-50 to-indigo-50 border border-blue-100 rounded-2xl p-4">
                <div className="flex items-center gap-2 mb-2">
                  <div className="w-6 h-6 rounded-lg bg-blue-600 flex items-center justify-center">
                    <Brain className="w-3.5 h-3.5 text-white" />
                  </div>
                  <p className="text-xs font-bold text-blue-800">AI Analysis</p>
                </div>
                <p className="text-xs text-slate-600 leading-relaxed">{aiReply.slice(0,400)}{aiReply.length>400?'…':''}</p>
              </div>
            )}
            <div className="grid grid-cols-2 gap-3">
              {conditions.length > 0 && (
                <div className="bg-amber-50 border border-amber-100 rounded-2xl p-3.5">
                  <p className="text-[10px] font-bold text-amber-700 uppercase tracking-wider mb-2">Possible Conditions</p>
                  <div className="flex flex-wrap gap-1">
                    {conditions.slice(0,4).map((c,i) => (
                      <span key={i} className="text-[10px] bg-white text-amber-700 px-2 py-0.5 rounded-full font-semibold border border-amber-200">{c}</span>
                    ))}
                  </div>
                </div>
              )}
              {specialists.length > 0 && (
                <div className="bg-blue-50 border border-blue-100 rounded-2xl p-3.5">
                  <p className="text-[10px] font-bold text-blue-700 uppercase tracking-wider mb-2">Recommended Specialists</p>
                  <div className="flex flex-wrap gap-1">
                    {specialists.slice(0,4).map((s,i) => (
                      <span key={i} className="text-[10px] bg-white text-blue-700 px-2 py-0.5 rounded-full font-semibold border border-blue-200">{s}</span>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </motion.div>
        )}

        {/* ── Results count ────────────────────────────────────────── */}
        {!loading && hasSearched && hospitals.length > 0 && (
          <div className="flex items-center justify-between">
            <p className="text-xs font-semibold text-slate-500">
              <span className="text-slate-900 font-extrabold">{hospitals.length}</span> hospitals found
              {userLocation && <> near <span className="text-blue-600">{userLocation}</span></>}
            </p>
            <span className="flex items-center gap-1 text-[10px] text-emerald-600 font-bold">
              <Sparkles className="w-3 h-3" /> AI Recommended
            </span>
          </div>
        )}

        {/* ── Hospital Cards ───────────────────────────────────────── */}
        <AnimatePresence mode="popLayout">
          {!loading && hospitals.length > 0 && (
            <div className="space-y-3">
              {hospitals.map((h, i) => (
                <motion.div key={i} layout
                  initial={{ opacity:0, y:16 }} animate={{ opacity:1, y:0 }} exit={{ opacity:0, scale:0.95 }}
                  transition={{ delay: i*0.04 }}
                  className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden"
                >
                  <div className="flex items-center gap-4 p-4">
                    <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-blue-100 to-indigo-100 flex items-center justify-center flex-shrink-0">
                      <Building2 className="w-6 h-6 text-blue-600" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-2">
                        <h3 className="text-sm font-bold text-slate-900 leading-snug">{h.name}</h3>
                        <span className="flex-shrink-0 flex items-center gap-0.5 text-[10px] font-bold text-amber-600 bg-amber-50 px-2 py-0.5 rounded-full border border-amber-100">
                          <Star className="w-2.5 h-2.5 fill-amber-400 text-amber-400" /> AI Pick
                        </span>
                      </div>
                      {userLocation && (
                        <p className="text-[11px] text-slate-400 mt-0.5 flex items-center gap-1">
                          <MapPin className="w-2.5 h-2.5" /> {userLocation}
                        </p>
                      )}
                    </div>
                  </div>
                  <div className="px-4 pb-4 grid grid-cols-3 gap-2">
                    <a href={h.mapLink} target="_blank" rel="noreferrer"
                      className="flex flex-col items-center gap-1 py-2.5 bg-blue-50 rounded-xl text-blue-700 hover:bg-blue-100 transition-colors">
                      <Navigation className="w-4 h-4" />
                      <span className="text-[10px] font-bold">Directions</span>
                    </a>
                    <a href={`https://www.practo.com/search?q=${encodeURIComponent(h.name)}&city=${encodeURIComponent(userLocation)}`}
                      target="_blank" rel="noreferrer"
                      className="flex flex-col items-center gap-1 py-2.5 bg-emerald-50 rounded-xl text-emerald-700 hover:bg-emerald-100 transition-colors">
                      <Calendar className="w-4 h-4" />
                      <span className="text-[10px] font-bold">Practo</span>
                    </a>
                    <a href={`https://www.google.com/search?q=${encodeURIComponent(h.name+' '+userLocation+' book appointment')}`}
                      target="_blank" rel="noreferrer"
                      className="flex flex-col items-center gap-1 py-2.5 bg-slate-50 rounded-xl text-slate-600 hover:bg-slate-100 transition-colors">
                      <ExternalLink className="w-4 h-4" />
                      <span className="text-[10px] font-bold">Book</span>
                    </a>
                  </div>
                </motion.div>
              ))}
            </div>
          )}

          {!loading && hasSearched && hospitals.length === 0 && !error && (
            <motion.div initial={{ opacity:0 }} animate={{ opacity:1 }} className="text-center py-14">
              <div className="w-14 h-14 rounded-2xl bg-slate-100 flex items-center justify-center mx-auto mb-3">
                <Building2 className="w-7 h-7 text-slate-300" />
              </div>
              <p className="text-sm font-semibold text-slate-500">No hospitals found.</p>
              <p className="text-xs text-slate-400 mt-1">Try a different symptom or condition.</p>
            </motion.div>
          )}
        </AnimatePresence>

        {/* ── Initial empty state ──────────────────────────────────── */}
        {!hasSearched && !loading && (
          <motion.div initial={{ opacity:0, y:10 }} animate={{ opacity:1, y:0 }} className="text-center py-14">
            <motion.div animate={{ y:[0,-6,0] }} transition={{ duration:3, repeat:Infinity, ease:'easeInOut' }}
              className="w-16 h-16 rounded-2xl bg-gradient-to-br from-blue-100 to-indigo-100 flex items-center justify-center mx-auto mb-4 shadow-lg shadow-blue-100">
              <Building2 className="w-8 h-8 text-blue-500" />
            </motion.div>
            <h3 className="text-base font-bold text-slate-800 mb-1">AI Hospital Finder</h3>
            <p className="text-xs text-slate-500 max-w-xs mx-auto leading-relaxed">
              Describe your symptoms and get AI-recommended hospitals
              {userLocation ? ` near ${userLocation}` : ''} with directions & booking links.
            </p>
          </motion.div>
        )}

      </div>
    </div>
  )
}
