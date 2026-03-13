import { motion } from 'framer-motion'
import { Star, Phone, Navigation, Calendar, MapPin, Clock, Sparkles, Building2 } from 'lucide-react'

interface HospitalCardProps {
  name: string
  rating: number
  distance: string
  address: string
  specialties: string[]
  image?: string
}

export default function HospitalCard({ name, rating, distance, address, specialties }: HospitalCardProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      whileHover={{ y: -6, scale: 1.01 }}
      className="bg-white/80 backdrop-blur-sm rounded-2xl border border-slate-200/60 overflow-hidden hover:shadow-xl hover:shadow-blue-500/10 transition-all duration-500 group"
    >
      {/* Premium header with animated gradient */}
      <div className="h-40 bg-gradient-to-br from-blue-100 via-indigo-50 to-purple-100 flex items-center justify-center relative overflow-hidden">
        {/* Animated floating orbs */}
        <motion.div
          className="absolute w-24 h-24 rounded-full bg-blue-200/40 blur-2xl"
          animate={{ x: [-20, 20, -20], y: [-10, 10, -10] }}
          transition={{ duration: 6, repeat: Infinity, ease: 'easeInOut' }}
          style={{ top: '10%', left: '15%' }}
        />
        <motion.div
          className="absolute w-20 h-20 rounded-full bg-purple-200/30 blur-2xl"
          animate={{ x: [15, -15, 15], y: [10, -10, 10] }}
          transition={{ duration: 8, repeat: Infinity, ease: 'easeInOut' }}
          style={{ bottom: '10%', right: '15%' }}
        />

        {/* Hospital icon with glow */}
        <motion.div
          whileHover={{ scale: 1.1, rotate: [0, -5, 5, 0] }}
          className="relative w-16 h-16 bg-white/90 backdrop-blur-sm rounded-2xl flex items-center justify-center shadow-lg shadow-blue-500/10 z-10"
        >
          <span className="text-3xl"><Building2 className="w-7 h-7 text-blue-600" /></span>
          <motion.div
            className="absolute inset-0 rounded-2xl border-2 border-blue-300/50"
            animate={{ scale: [1, 1.15, 1], opacity: [0.5, 0, 0.5] }}
            transition={{ duration: 2.5, repeat: Infinity }}
          />
        </motion.div>

        {/* Premium badge */}
        <div className="absolute top-3 right-3 flex items-center gap-1 bg-white/80 backdrop-blur-sm px-2 py-1 rounded-full border border-white/50 shadow-sm">
          <Sparkles className="w-3 h-3 text-amber-500" />
          <span className="text-[10px] font-bold text-amber-600">Verified</span>
        </div>
      </div>

      <div className="p-5">
        <div className="flex items-start justify-between">
          <h3 className="font-bold text-slate-900 text-sm group-hover:text-blue-700 transition-colors">{name}</h3>
          <motion.div
            whileHover={{ scale: 1.15 }}
            className="flex items-center gap-1 bg-gradient-to-r from-amber-50 to-orange-50 px-2.5 py-1 rounded-full border border-amber-100/50"
          >
            <Star className="w-3 h-3 text-amber-500 fill-amber-500" />
            <span className="text-xs font-bold text-amber-700">{rating}</span>
          </motion.div>
        </div>

        <div className="flex items-center gap-1.5 mt-1.5">
          <MapPin className="w-3 h-3 text-slate-400" />
          <p className="text-xs text-slate-400">{address}</p>
        </div>

        <div className="flex items-center gap-1.5 mt-1">
          <Clock className="w-3 h-3 text-blue-500" />
          <p className="text-xs text-blue-600 font-semibold">{distance} away</p>
        </div>

        <div className="flex flex-wrap gap-1.5 mt-3">
          {specialties.map((s) => (
            <motion.span
              key={s}
              whileHover={{ scale: 1.05 }}
              className="text-[10px] bg-gradient-to-r from-slate-50 to-slate-100 text-slate-600 font-medium px-2.5 py-0.5 rounded-full border border-slate-200/60"
            >
              {s}
            </motion.span>
          ))}
        </div>

        <div className="flex gap-2 mt-4 pt-4 border-t border-slate-100/80">
          <motion.button
            whileHover={{ scale: 1.04 }}
            whileTap={{ scale: 0.97 }}
            className="flex-1 flex items-center justify-center gap-1.5 py-2.5 text-xs font-semibold text-blue-600 bg-blue-50/80 hover:bg-blue-100 rounded-xl transition-all border border-blue-100/50"
          >
            <Phone className="w-3.5 h-3.5" /> Call
          </motion.button>
          <motion.button
            whileHover={{ scale: 1.04 }}
            whileTap={{ scale: 0.97 }}
            className="flex-1 flex items-center justify-center gap-1.5 py-2.5 text-xs font-semibold text-slate-600 bg-slate-50/80 hover:bg-slate-100 rounded-xl transition-all border border-slate-200/50"
          >
            <Navigation className="w-3.5 h-3.5" /> Directions
          </motion.button>
          <motion.button
            whileHover={{ scale: 1.04 }}
            whileTap={{ scale: 0.97 }}
            className="flex-1 flex items-center justify-center gap-1.5 py-2.5 text-xs font-semibold text-white bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 rounded-xl shadow-lg shadow-blue-500/20 transition-all"
          >
            <Calendar className="w-3.5 h-3.5" /> Book
          </motion.button>
        </div>
      </div>
    </motion.div>
  )
}
