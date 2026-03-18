import { useState, useEffect, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Search, MapPin, Building2, Navigation, Calendar, ExternalLink, Loader2, MapPinned, Sparkles, AlertCircle, Stethoscope, Brain, Star } from 'lucide-react'
import { searchHospitals, type ChatResponse } from '../lib/api'

interface Hospital {
  name: string
  mapLink: string
}

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

  // Auto-load nearby hospitals when location is available
  useEffect(() => {
    if (userLocation && !hasSearched && !autoSearchedRef.current) {
      autoSearchedRef.current = true
      setSearchQuery(`General hospitals near ${userLocation}`)
      autoLoadNearby(userLocation)
    }
  }, [userLocation])

  const autoLoadNearby = async (city: string) => {
    setLoading(true)
    setHasSearched(true)
    try {
      const response: ChatResponse = await searchHospitals(
        `Find the best multi-specialty hospitals near ${city}. I am located in ${city}.`,
        city
      )
      setHospitals(response.analysis?.hospitals || [])
      setConditions(response.analysis?.conditions || [])
      setSpecialists(response.analysis?.specialists || [])
      setAiReply(response.reply || '')
    } catch (err: any) {
      setError(err.message || 'Failed to load nearby hospitals.')
    } finally {
      setLoading(false)
    }
  }

  const handleSearch = async (e?: React.FormEvent) => {
    if (e) e.preventDefault()
    if (!searchQuery.trim()) return
    setLoading(true)
    setError('')
    setHasSearched(true)
    try {
      const query = userLocation
        ? `${searchQuery}. I am located in ${userLocation}. Recommend hospitals near my location.`
        : searchQuery
      const response: ChatResponse = await searchHospitals(query, userLocation || undefined)
      setHospitals(response.analysis?.hospitals || [])
      setConditions(response.analysis?.conditions || [])
      setSpecialists(response.analysis?.specialists || [])
      setAiReply(response.reply || '')
    } catch (err: any) {
      setError(err.message || 'Failed to search hospitals. Make sure the backend is running.')
    } finally {
      setLoading(false)
    }
  }

  const quickSearches = [
    'Fever and cold',
    'Heart problems',
    'Orthopedic issues',
    'Eye specialist',
    'Skin problems',
    'Dental care',
    'Pregnancy care',
    'Mental health',
  ]

  return (
    <div className="h-full overflow-y-auto relative">
      {/* Ambient mesh background */}
      <div className="fixed inset-0 pointer-events-none -z-10">
        <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-gradient-to-bl from-blue-100/30 via-indigo-50/15 to-transparent rounded-full blur-3xl" />
        <div className="absolute bottom-0 left-0 w-[400px] h-[400px] bg-gradient-to-tr from-cyan-100/20 via-sky-50/10 to-transparent rounded-full blur-3xl" />
      </div>
    <div className="p-3 sm:p-6 space-y-6 max-w-4xl mx-auto relative min-h-[100svh] md:min-h-0">
      {/* Header — Premium */}
      <motion.div
        initial={{ opacity: 0, y: -15 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex items-center gap-3"
      >
        <motion.div
          animate={{ y: [0, -3, 0] }}
          transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut' }}
          className="w-12 h-12 rounded-2xl bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center shadow-xl shadow-blue-500/25"
        >
          <Building2 className="w-6 h-6 text-white" />
        </motion.div>
        <div>
          <h2 className="text-xl font-bold text-slate-900">Find Hospitals</h2>
          <p className="text-sm text-slate-500 mt-0.5">
            Describe your symptoms and we'll recommend the best hospitals
            {userLocation && (
              <span className="inline-flex items-center gap-1 ml-2 text-blue-600 font-semibold">
                <MapPinned className="w-3.5 h-3.5" /> near {userLocation}
              </span>
            )}
          </p>
        </div>
      </motion.div>

      {/* Search Bar — Premium Glassmorphism */}
      <motion.form
        onSubmit={handleSearch}
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.05 }}
        className="flex gap-3"
      >
        <div className="flex-1 relative group">
          <Search className="w-4 h-4 absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-blue-500 transition-colors" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Describe your symptoms or condition (e.g., severe headache, chest pain, knee injury)..."
            className="w-full pl-11 pr-4 py-3.5 text-sm glass border border-white/60 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-400 transition-all shadow-sm"
          />
        </div>
        <motion.button
          type="submit"
          disabled={loading || !searchQuery.trim()}
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          className="flex items-center gap-2 px-6 py-3.5 bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 disabled:from-blue-300 disabled:to-blue-300 text-white text-sm font-semibold rounded-xl transition-all shadow-lg shadow-blue-500/20"
        >
          {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Search className="w-4 h-4" />}
          Search
        </motion.button>
        <motion.button
          type="button"
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          onClick={() => window.open('https://www.google.com/maps/search/hospitals+near+me', '_blank')}
          className="flex items-center gap-2 px-5 py-3.5 glass border border-white/60 text-slate-700 text-sm font-medium rounded-xl hover:shadow-md transition-all"
        >
          <MapPin className="w-4 h-4" /> Maps
        </motion.button>
      </motion.form>

      {/* Quick Search Tags — Premium */}
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
            className="px-4 py-1.5 text-xs font-medium rounded-full glass border border-white/60 text-slate-500 hover:bg-blue-50 hover:border-blue-200 hover:text-blue-600 transition-all shadow-sm"
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
            <div className="absolute inset-0 w-16 h-16 rounded-full border-4 border-transparent border-t-blue-500 animate-spin" />
            <Building2 className="absolute inset-0 w-6 h-6 m-auto text-blue-500" />
          </div>
          <span className="text-sm text-slate-600 font-medium">Finding hospitals based on your symptoms...</span>
          <div className="flex gap-1 mt-3">
            {[0, 1, 2].map((i) => (
              <motion.div
                key={i}
                className="w-2 h-2 rounded-full bg-blue-400"
                animate={{ opacity: [0.3, 1, 0.3] }}
                transition={{ duration: 0.8, repeat: Infinity, delay: i * 0.2 }}
              />
            ))}
          </div>
        </motion.div>
      )}

      {/* AI Analysis — Premium Glassmorphism */}
      {!loading && hasSearched && (conditions.length > 0 || specialists.length > 0 || aiReply) && (
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-4">
          {/* AI Reply */}
          {aiReply && (
            <div className="glass border border-white/60 rounded-xl p-5 relative overflow-hidden">
              <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-blue-50/50 to-transparent rounded-full -translate-y-1/2 translate-x-1/2" />
              <div className="flex items-center gap-2 mb-3 relative z-10">
                <div className="w-6 h-6 rounded-lg bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center">
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
                <p className="text-xs font-bold text-amber-800">Possible Conditions</p>
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
          {specialists.length > 0 && (
            <motion.div
              initial={{ opacity: 0, x: 10 }}
              animate={{ opacity: 1, x: 0 }}
              className="bg-gradient-to-br from-blue-50 to-indigo-50/50 border border-blue-100/50 rounded-xl p-4"
            >
              <div className="flex items-center gap-2 mb-3">
                <div className="w-6 h-6 rounded-lg bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center">
                  <Stethoscope className="w-3.5 h-3.5 text-white" />
                </div>
                <p className="text-xs font-bold text-blue-800">Recommended Specialists</p>
              </div>
              <div className="flex flex-wrap gap-1.5">
                {specialists.map((s, i) => (
                  <motion.span
                    key={i}
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: i * 0.04 }}
                    className="text-[10px] bg-white/80 backdrop-blur-sm text-blue-700 px-2.5 py-0.5 rounded-full font-semibold border border-blue-200/50"
                  >
                    {s}
                  </motion.span>
                ))}
              </div>
            </motion.div>
          )}
          </div>
        </motion.div>
      )}

      {/* Hospital Results Count */}
      {!loading && hasSearched && (
        <div className="flex items-center gap-2">
          <div className="w-1.5 h-1.5 rounded-full bg-blue-500" />
          <p className="text-xs text-slate-400 font-medium">
            Found <span className="text-slate-600 font-bold">{hospitals.length}</span> hospital{hospitals.length !== 1 ? 's' : ''} for your condition
            {userLocation && <span> near <span className="text-blue-600 font-semibold">{userLocation}</span></span>}
          </p>
        </div>
      )}

      {/* Hospital Cards — Premium */}
      <AnimatePresence mode="popLayout">
        {!loading && hospitals.length > 0 && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {hospitals.map((h, i) => (
              <motion.div
                key={i}
                layout
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95 }}
                transition={{ delay: i * 0.05 }}
                whileHover={{ y: -4 }}
              >
                <div className="glass rounded-2xl border border-white/60 overflow-hidden hover:shadow-xl hover:shadow-blue-500/10 transition-all duration-300 group">
                  <div className="h-36 bg-gradient-to-br from-blue-50 via-indigo-50 to-blue-100 flex items-center justify-center relative overflow-hidden">
                    <div className="absolute inset-0 dot-pattern opacity-10" />
                    {/* Floating orb */}
                    <motion.div
                      className="absolute w-20 h-20 rounded-full bg-blue-200/30 blur-xl"
                      animate={{ x: [0, 20, 0], y: [0, -10, 0] }}
                      transition={{ duration: 5, repeat: Infinity }}
                    />
                    <motion.div
                      whileHover={{ scale: 1.1, rotate: 3 }}
                      className="w-16 h-16 bg-white/90 backdrop-blur-sm rounded-2xl flex items-center justify-center shadow-lg relative z-10"
                    >
                      <Building2 className="w-7 h-7 text-blue-600" />
                    </motion.div>
                    {/* Premium badge */}
                    <div className="absolute top-3 right-3 flex items-center gap-1 bg-white/80 backdrop-blur-sm rounded-full px-2 py-0.5 text-[9px] font-bold text-blue-600 border border-blue-100/50">
                      <Star className="w-2.5 h-2.5 fill-blue-500 text-blue-500" />
                      AI Recommended
                    </div>
                  </div>
                  <div className="p-5">
                    <h3 className="font-bold text-slate-900 text-sm leading-tight">{h.name}</h3>
                    <div className="flex gap-2 mt-4">
                      <a
                        href={h.mapLink}
                        target="_blank"
                        rel="noreferrer"
                        className="flex-1 flex items-center justify-center gap-1.5 py-2.5 text-xs font-semibold text-blue-600 bg-blue-50 hover:bg-blue-100 rounded-xl transition-all hover:shadow-sm"
                      >
                        <Navigation className="w-3.5 h-3.5" /> Directions
                      </a>
                      <a
                        href={`https://www.practo.com/search?q=${encodeURIComponent(h.name)}&city=${encodeURIComponent(userLocation || '')}`}
                        target="_blank"
                        rel="noreferrer"
                        className="flex-1 flex items-center justify-center gap-1.5 py-2.5 text-xs font-semibold text-white bg-gradient-to-r from-emerald-500 to-emerald-600 rounded-xl transition-all hover:shadow-lg hover:shadow-emerald-500/20"
                      >
                        <Calendar className="w-3.5 h-3.5" /> Practo
                      </a>
                      <a
                        href={`https://www.google.com/search?q=${encodeURIComponent(h.name + (userLocation ? ' ' + userLocation : '') + ' book appointment')}`}
                        target="_blank"
                        rel="noreferrer"
                        className="flex-1 flex items-center justify-center gap-1.5 py-2.5 text-xs font-semibold text-white bg-gradient-to-r from-blue-500 to-blue-600 rounded-xl transition-all hover:shadow-lg hover:shadow-blue-500/20"
                      >
                        <ExternalLink className="w-3.5 h-3.5" /> Book
                      </a>
                    </div>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        )}

        {!loading && hasSearched && hospitals.length === 0 && !error && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-center py-20">
            <div className="w-16 h-16 rounded-2xl bg-slate-100 flex items-center justify-center mx-auto mb-3">
              <Building2 className="w-8 h-8 text-slate-300" />
            </div>
            <p className="text-sm text-slate-500 font-medium">No hospitals found. Try a different search.</p>
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
            className="w-20 h-20 rounded-2xl bg-gradient-to-br from-blue-100 to-indigo-100 flex items-center justify-center mx-auto mb-5 shadow-lg shadow-blue-500/10"
          >
            <Building2 className="w-10 h-10 text-blue-500" />
          </motion.div>
          <h3 className="text-lg font-bold text-slate-900 mb-2">AI-Powered Hospital Finder</h3>
          <p className="text-sm text-slate-500 max-w-md mx-auto leading-relaxed">
            Describe your symptoms or condition above, and our AI will recommend the best hospitals
            {userLocation ? ` near ${userLocation}` : ''} with Google Maps directions and appointment booking.
          </p>
        </motion.div>
      )}
    </div>
    </div>
  )
}
