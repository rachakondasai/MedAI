import { motion } from 'framer-motion'
import { ShoppingCart, Info, Shield, Pill } from 'lucide-react'

interface MedicineCardProps {
  name: string
  usage: string
  dosage: string
  price: string
  category: string
}

export default function MedicineCard({ name, usage, dosage, price, category }: MedicineCardProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      whileHover={{ y: -6, scale: 1.01 }}
      className="bg-white/80 backdrop-blur-sm rounded-2xl border border-slate-200/60 p-5 hover:shadow-xl hover:shadow-emerald-500/10 transition-all duration-500 group relative overflow-hidden"
    >
      {/* Subtle background gradient on hover */}
      <div className="absolute inset-0 bg-gradient-to-br from-emerald-50/0 to-teal-50/0 group-hover:from-emerald-50/30 group-hover:to-teal-50/30 transition-all duration-500 rounded-2xl" />

      {/* Floating accent */}
      <motion.div
        className="absolute top-8 right-8 w-16 h-16 rounded-full bg-emerald-100/0 group-hover:bg-emerald-100/30 blur-2xl transition-all duration-700"
      />

      <div className="relative z-10">
        <div className="flex items-start justify-between mb-3">
          <motion.div
            whileHover={{ rotate: [0, -10, 10, 0], scale: 1.1 }}
            className="w-12 h-12 bg-gradient-to-br from-emerald-400 to-teal-500 rounded-xl flex items-center justify-center shadow-lg shadow-emerald-500/20 relative"
          >
            <span className="text-2xl"><Pill className="w-6 h-6 text-white" /></span>
            {/* Pulse ring */}
            <motion.div
              className="absolute inset-0 rounded-xl border-2 border-emerald-300/50"
              animate={{ scale: [1, 1.2, 1], opacity: [0.3, 0, 0.3] }}
              transition={{ duration: 2.5, repeat: Infinity }}
            />
          </motion.div>

          <div className="flex items-center gap-1.5">
            <span className="text-[10px] bg-gradient-to-r from-blue-50 to-indigo-50 text-blue-600 font-bold px-2.5 py-0.5 rounded-full border border-blue-100/50">
              {category}
            </span>
            <motion.div
              whileHover={{ scale: 1.2 }}
              className="w-6 h-6 bg-emerald-50 rounded-full flex items-center justify-center border border-emerald-100/50"
              title="AI Verified"
            >
              <Shield className="w-3 h-3 text-emerald-500" />
            </motion.div>
          </div>
        </div>

        <h3 className="font-bold text-slate-900 text-sm group-hover:text-emerald-700 transition-colors">{name}</h3>
        <p className="text-xs text-slate-400 mt-1 leading-relaxed">{usage}</p>

        <div className="mt-3 space-y-1.5">
          <div className="flex items-center gap-2 bg-slate-50/80 rounded-lg px-2.5 py-1.5 border border-slate-100/60">
            <Info className="w-3 h-3 text-slate-400" />
            <span className="text-xs text-slate-500">Dosage: <span className="font-semibold text-slate-700">{dosage}</span></span>
          </div>
        </div>

        <div className="flex items-center justify-between mt-4 pt-4 border-t border-slate-100/80">
          <div>
            <span className="text-lg font-bold bg-gradient-to-r from-slate-900 to-slate-700 bg-clip-text text-transparent">{price}</span>
            <p className="text-[10px] text-slate-400">incl. taxes</p>
          </div>
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            className="flex items-center gap-1.5 px-4 py-2.5 text-xs font-bold text-white bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 rounded-xl shadow-lg shadow-blue-500/20 transition-all"
          >
            <ShoppingCart className="w-3.5 h-3.5" /> Buy Now
          </motion.button>
        </div>
      </div>
    </motion.div>
  )
}
