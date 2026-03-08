import { motion } from 'framer-motion'
import { ShoppingCart, Info } from 'lucide-react'

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
      whileHover={{ y: -4 }}
      className="bg-white rounded-2xl border border-slate-200 p-5 hover:shadow-xl hover:shadow-slate-200/50 transition-all duration-300"
    >
      <div className="flex items-start justify-between mb-3">
        <div className="w-12 h-12 bg-gradient-to-br from-emerald-100 to-teal-100 rounded-xl flex items-center justify-center">
          <span className="text-2xl">💊</span>
        </div>
        <span className="text-[10px] bg-blue-50 text-blue-600 font-medium px-2 py-0.5 rounded-full">{category}</span>
      </div>
      <h3 className="font-semibold text-slate-900 text-sm">{name}</h3>
      <p className="text-xs text-slate-400 mt-1">{usage}</p>
      <div className="mt-3 space-y-1.5">
        <div className="flex items-center gap-2">
          <Info className="w-3 h-3 text-slate-400" />
          <span className="text-xs text-slate-500">Dosage: {dosage}</span>
        </div>
      </div>
      <div className="flex items-center justify-between mt-4 pt-4 border-t border-slate-100">
        <span className="text-lg font-bold text-slate-900">{price}</span>
        <button className="flex items-center gap-1.5 px-4 py-2 text-xs font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors">
          <ShoppingCart className="w-3.5 h-3.5" /> Buy Now
        </button>
      </div>
    </motion.div>
  )
}
