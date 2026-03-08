import { motion } from 'framer-motion'
import { Star, Phone, Navigation, Calendar } from 'lucide-react'

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
      whileHover={{ y: -4 }}
      className="bg-white rounded-2xl border border-slate-200 overflow-hidden hover:shadow-xl hover:shadow-slate-200/50 transition-all duration-300"
    >
      <div className="h-40 bg-gradient-to-br from-blue-100 to-indigo-100 flex items-center justify-center">
        <div className="w-16 h-16 bg-white/80 backdrop-blur rounded-2xl flex items-center justify-center">
          <span className="text-3xl">🏥</span>
        </div>
      </div>
      <div className="p-5">
        <div className="flex items-start justify-between">
          <h3 className="font-semibold text-slate-900 text-sm">{name}</h3>
          <div className="flex items-center gap-1 bg-amber-50 px-2 py-0.5 rounded-full">
            <Star className="w-3 h-3 text-amber-500 fill-amber-500" />
            <span className="text-xs font-medium text-amber-700">{rating}</span>
          </div>
        </div>
        <p className="text-xs text-slate-400 mt-1">{address}</p>
        <p className="text-xs text-blue-600 font-medium mt-1">{distance} away</p>
        <div className="flex flex-wrap gap-1.5 mt-3">
          {specialties.map((s) => (
            <span key={s} className="text-[10px] bg-slate-100 text-slate-600 px-2 py-0.5 rounded-full">
              {s}
            </span>
          ))}
        </div>
        <div className="flex gap-2 mt-4">
          <button className="flex-1 flex items-center justify-center gap-1.5 py-2 text-xs font-medium text-blue-600 bg-blue-50 hover:bg-blue-100 rounded-lg transition-colors">
            <Phone className="w-3.5 h-3.5" /> Call
          </button>
          <button className="flex-1 flex items-center justify-center gap-1.5 py-2 text-xs font-medium text-slate-600 bg-slate-50 hover:bg-slate-100 rounded-lg transition-colors">
            <Navigation className="w-3.5 h-3.5" /> Directions
          </button>
          <button className="flex-1 flex items-center justify-center gap-1.5 py-2 text-xs font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors">
            <Calendar className="w-3.5 h-3.5" /> Book
          </button>
        </div>
      </div>
    </motion.div>
  )
}
