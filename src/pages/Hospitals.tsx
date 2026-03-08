import { useState, useEffect, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Search, MapPin, Building2, Navigation, Calendar, ExternalLink, Loader2, MapPinned } from 'lucide-react'
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
    <div className="p-6 space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <div>
        <h2 className="text-xl font-bold text-slate-900">Find Hospitals</h2>
        <p className="text-sm text-slate-500 mt-1">
          Describe your symptoms and we'll recommend the best hospitals
          {userLocation && (
            <span className="inline-flex items-center gap-1 ml-2 text-blue-600 font-medium">
              <MapPinned className="w-3.5 h-3.5" /> near {userLocation}
            </span>
          )}
        </p>
      </div>

      {/* Search Bar */}
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
            placeholder="Describe your symptoms or condition (e.g., severe headache, chest pain, knee injury)..."
            className="w-full pl-11 pr-4 py-3 text-sm bg-white border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-400 transition-all"
          />
        </div>
        <button
          type="submit"
          disabled={loading || !searchQuery.trim()}
          className="flex items-center gap-2 px-5 py-3 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-300 text-white text-sm font-medium rounded-xl transition-colors"
        >
          {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Search className="w-4 h-4" />}
          Search
        </button>
        <button
          type="button"
          onClick={() => window.open('https://www.google.com/maps/search/hospitals+near+me', '_blank')}
          className="flex items-center gap-2 px-5 py-3 bg-slate-100 hover:bg-slate-200 text-slate-700 text-sm font-medium rounded-xl transition-colors"
        >
          <MapPin className="w-4 h-4" /> Maps
        </button>
      </motion.form>

      {/* Quick Search Tags */}
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
            className="px-4 py-1.5 text-xs font-medium rounded-full bg-white border border-slate-200 text-slate-500 hover:bg-blue-50 hover:border-blue-300 hover:text-blue-600 transition-colors"
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
          <Loader2 className="w-6 h-6 text-blue-500 animate-spin" />
          <span className="ml-2 text-sm text-slate-500">Finding hospitals based on your symptoms...</span>
        </div>
      )}

      {/* AI Analysis */}
      {!loading && hasSearched && (conditions.length > 0 || specialists.length > 0 || aiReply) && (
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
              <p className="text-xs font-semibold text-amber-800 mb-2">🔍 Possible Conditions</p>
              <div className="flex flex-wrap gap-1.5">
                {conditions.map((c, i) => (
                  <span key={i} className="text-[10px] bg-white text-amber-700 px-2 py-0.5 rounded-full font-medium border border-amber-200">{c}</span>
                ))}
              </div>
            </div>
          )}
          {specialists.length > 0 && (
            <div className="bg-blue-50 border border-blue-200 rounded-xl p-4">
              <p className="text-xs font-semibold text-blue-800 mb-2">👨‍⚕️ Recommended Specialists</p>
              <div className="flex flex-wrap gap-1.5">
                {specialists.map((s, i) => (
                  <span key={i} className="text-[10px] bg-white text-blue-700 px-2 py-0.5 rounded-full font-medium border border-blue-200">{s}</span>
                ))}
              </div>
            </div>
          )}
          </div>
        </motion.div>
      )}

      {/* Hospital Results */}
      {!loading && hasSearched && (
        <div>
          <p className="text-xs text-slate-400 mb-4">
            Found {hospitals.length} hospital{hospitals.length !== 1 ? 's' : ''} for your condition
            {userLocation && ` near ${userLocation}`}
          </p>
        </div>
      )}

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
              >
                <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden hover:shadow-xl hover:shadow-slate-200/50 transition-all duration-300 group">
                  <div className="h-32 bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center relative overflow-hidden">
                    <div className="w-14 h-14 bg-white/90 backdrop-blur rounded-2xl flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform">
                      <Building2 className="w-7 h-7 text-blue-600" />
                    </div>
                  </div>
                  <div className="p-5">
                    <h3 className="font-semibold text-slate-900 text-sm">{h.name}</h3>
                    <div className="flex gap-2 mt-4">
                      <a
                        href={h.mapLink}
                        target="_blank"
                        rel="noreferrer"
                        className="flex-1 flex items-center justify-center gap-1.5 py-2 text-xs font-medium text-blue-600 bg-blue-50 hover:bg-blue-100 rounded-lg transition-colors"
                      >
                        <Navigation className="w-3.5 h-3.5" /> Directions
                      </a>
                      <a
                        href={`https://www.practo.com/search?q=${encodeURIComponent(h.name)}&city=${encodeURIComponent(userLocation || '')}`}
                        target="_blank"
                        rel="noreferrer"
                        className="flex-1 flex items-center justify-center gap-1.5 py-2 text-xs font-medium text-white bg-emerald-600 hover:bg-emerald-700 rounded-lg transition-colors"
                      >
                        <Calendar className="w-3.5 h-3.5" /> Practo
                      </a>
                      <a
                        href={`https://www.google.com/search?q=${encodeURIComponent(h.name + (userLocation ? ' ' + userLocation : '') + ' book appointment')}`}
                        target="_blank"
                        rel="noreferrer"
                        className="flex-1 flex items-center justify-center gap-1.5 py-2 text-xs font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors"
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
            <Building2 className="w-12 h-12 text-slate-200 mx-auto mb-3" />
            <p className="text-sm text-slate-400">No hospitals found. Try a different search.</p>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Initial state — no search yet */}
      {!hasSearched && !loading && (
        <div className="text-center py-16">
          <Building2 className="w-16 h-16 text-blue-100 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-slate-900 mb-2">AI-Powered Hospital Finder</h3>
          <p className="text-sm text-slate-500 max-w-md mx-auto">
            Describe your symptoms or condition above, and our AI will recommend the best hospitals
            {userLocation ? ` near ${userLocation}` : ''} with Google Maps directions and appointment booking.
          </p>
        </div>
      )}
    </div>
  )
}
