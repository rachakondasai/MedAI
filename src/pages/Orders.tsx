/**
 * Orders.tsx — User's order tracking page
 * Shows all blood test orders: pending, processing, delivered
 * Users can see: test name, lab, location, status, payment status
 */

import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  FlaskConical, Clock, CheckCircle2, Truck, MapPin, Building2,
  Phone, Calendar, ChevronDown, ChevronUp, RefreshCw, AlertCircle,
  Loader2, FileText, ArrowRight, PackageSearch, Receipt, X,
  Download, Printer, BadgeCheck, Bell, BellOff,
} from 'lucide-react'
import { getStoredUser } from '../lib/auth'

// ─────────────────────────────────────────────────────────────────────────────
// TYPES
// ─────────────────────────────────────────────────────────────────────────────
export type OrderStatus = 'pending_payment' | 'confirmed' | 'sample_collected' | 'processing' | 'delivered'

export interface LabOrder {
  id: string
  testName: string
  labName: string
  labAddress: string
  labPhone: string
  amount: number
  status: OrderStatus
  paymentStatus: 'pending' | 'paid'
  orderedAt: string
  collectionMode: 'home' | 'walk-in'
  reportUrl?: string
  estimatedDelivery?: string
  txnRef?: string
  notes?: string
  /** userId so we can filter per-user */
  userId?: string
  /** set to true once user has seen the "report ready" notification */
  notificationSeen?: boolean
  /** patient name captured during booking */
  patientName?: string
  /** patient phone captured during booking */
  patientPhone?: string
}

// ─────────────────────────────────────────────────────────────────────────────
// STATUS CONFIG
// ─────────────────────────────────────────────────────────────────────────────
export const STATUS_CONFIG: Record<OrderStatus, { label: string; icon: any; color: string; bg: string; step: number }> = {
  pending_payment: { label: 'Pending Payment', icon: Clock,        color: 'text-amber-600',  bg: 'bg-amber-50 border-amber-200',   step: 0 },
  confirmed:       { label: 'Confirmed',       icon: CheckCircle2, color: 'text-blue-600',   bg: 'bg-blue-50 border-blue-200',     step: 1 },
  sample_collected:{ label: 'Sample Collected',icon: FlaskConical, color: 'text-indigo-600', bg: 'bg-indigo-50 border-indigo-200', step: 2 },
  processing:      { label: 'Lab Processing',  icon: Loader2,      color: 'text-purple-600', bg: 'bg-purple-50 border-purple-200', step: 3 },
  delivered:       { label: 'Report Ready',    icon: CheckCircle2, color: 'text-emerald-600',bg: 'bg-emerald-50 border-emerald-200',step: 4 },
}

const STEPS: OrderStatus[] = ['pending_payment', 'confirmed', 'sample_collected', 'processing', 'delivered']

// ─────────────────────────────────────────────────────────────────────────────
// LOCAL STORAGE HELPERS — shared with AdminOrders
// ─────────────────────────────────────────────────────────────────────────────
export function getOrders(): LabOrder[] {
  try {
    return JSON.parse(localStorage.getItem('medai_orders') || '[]')
  } catch { return [] }
}

export function saveOrders(orders: LabOrder[]) {
  localStorage.setItem('medai_orders', JSON.stringify(orders))
}

/** Returns count of delivered orders where notificationSeen is false */
export function getUnseenReportCount(userId?: string): number {
  const orders = getOrders()
  return orders.filter(o =>
    o.status === 'delivered' &&
    !o.notificationSeen &&
    (!userId || o.userId === userId || !o.userId)
  ).length
}

// ─────────────────────────────────────────────────────────────────────────────
// INVOICE MODAL
// ─────────────────────────────────────────────────────────────────────────────
function InvoiceModal({ order, onClose }: { order: LabOrder; onClose: () => void }) {
  const invoiceNo = `INV-${order.id}-${new Date(order.orderedAt).getFullYear()}`
  const printInvoice = () => window.print()

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4"
      onClick={onClose}
    >
      <motion.div
        initial={{ scale: 0.95, y: 20 }}
        animate={{ scale: 1, y: 0 }}
        exit={{ scale: 0.95, y: 20 }}
        className="bg-white rounded-3xl shadow-2xl w-full max-w-sm overflow-hidden"
        onClick={e => e.stopPropagation()}
      >
        {/* Invoice header */}
        <div className="bg-gradient-to-r from-blue-600 to-indigo-700 p-5 text-white">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 bg-white/20 rounded-xl flex items-center justify-center">
                <Receipt className="w-4 h-4 text-white" />
              </div>
              <div>
                <p className="font-black text-sm">MedAI Labs</p>
                <p className="text-[10px] text-blue-200">Tax Invoice / Receipt</p>
              </div>
            </div>
            <button onClick={onClose} className="w-7 h-7 bg-white/20 hover:bg-white/30 rounded-xl flex items-center justify-center transition-colors">
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
          <div className="mt-3 flex justify-between text-xs">
            <div>
              <p className="text-blue-200 text-[10px]">Invoice No.</p>
              <code className="font-mono font-bold text-white">{invoiceNo}</code>
            </div>
            <div className="text-right">
              <p className="text-blue-200 text-[10px]">Date</p>
              <p className="font-semibold">{new Date(order.orderedAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}</p>
            </div>
          </div>
        </div>

        {/* Invoice body */}
        <div className="p-5 space-y-4">
          {/* Billed to */}
          <div className="bg-slate-50 rounded-2xl p-3.5 border border-slate-100">
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">Billed To</p>
            <p className="text-sm font-bold text-slate-800">{order.patientName || 'Patient'}</p>
            {order.patientPhone && <p className="text-xs text-slate-500">📞 {order.patientPhone}</p>}
          </div>

          {/* Line item */}
          <div>
            <div className="flex items-center justify-between text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-2">
              <span>Description</span>
              <span>Amount</span>
            </div>
            <div className="flex items-start justify-between py-2.5 border-b border-slate-100">
              <div>
                <p className="text-xs font-bold text-slate-800">{order.testName}</p>
                <p className="text-[10px] text-slate-400 mt-0.5">{order.labName}</p>
                {order.collectionMode === 'home' && <p className="text-[10px] text-teal-600 mt-0.5">🏠 Home Collection</p>}
              </div>
              <p className="text-sm font-black text-slate-800">₹{order.amount}</p>
            </div>
          </div>

          {/* Total */}
          <div className="bg-blue-50 rounded-2xl p-3.5 border border-blue-100 flex items-center justify-between">
            <div>
              <p className="text-[10px] font-bold text-blue-400 uppercase tracking-wider">Total Paid</p>
              <p className="text-[10px] text-slate-400 mt-0.5">Incl. all taxes</p>
            </div>
            <div className="text-right">
              <p className="text-2xl font-black text-blue-700">₹{order.amount}</p>
              <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${order.paymentStatus === 'paid' ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-700'}`}>
                {order.paymentStatus === 'paid' ? '✅ Paid' : '⏳ Pending'}
              </span>
            </div>
          </div>

          {/* Txn ref */}
          {order.txnRef && (
            <div className="text-center">
              <p className="text-[10px] text-slate-400">Transaction Reference</p>
              <code className="text-xs font-mono font-bold text-slate-600">{order.txnRef}</code>
            </div>
          )}

          {/* Actions */}
          <div className="flex gap-2 pt-1">
            <button
              onClick={printInvoice}
              className="flex-1 flex items-center justify-center gap-1.5 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-xl transition-colors"
            >
              <Printer className="w-3.5 h-3.5" /> Print
            </button>
            {order.reportUrl && order.status === 'delivered' && (
              <a
                href={order.reportUrl}
                target="_blank"
                rel="noreferrer"
                className="flex-1 flex items-center justify-center gap-1.5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-xl transition-colors"
              >
                <Download className="w-3.5 h-3.5" /> Report
              </a>
            )}
          </div>
        </div>
      </motion.div>
    </motion.div>
  )
}

// ─────────────────────────────────────────────────────────────────────────────
// ORDER CARD
// ─────────────────────────────────────────────────────────────────────────────
function OrderCard({ order, onMarkSeen }: { order: LabOrder; onMarkSeen: (id: string) => void }) {
  const [expanded, setExpanded] = useState(false)
  const [showInvoice, setShowInvoice] = useState(false)
  const cfg = STATUS_CONFIG[order.status]
  const Icon = cfg.icon
  const isReportReady = order.status === 'delivered' && !order.notificationSeen

  return (
    <>
      <AnimatePresence>
        {showInvoice && <InvoiceModal order={order} onClose={() => setShowInvoice(false)} />}
      </AnimatePresence>

      <motion.div
        layout
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        className={`bg-white rounded-2xl border shadow-sm overflow-hidden transition-all ${isReportReady ? 'border-emerald-300 shadow-emerald-100' : 'border-slate-200/60'}`}
      >
        {/* Report-ready notification banner */}
        {isReportReady && (
          <motion.div
            initial={{ height: 0 }}
            animate={{ height: 'auto' }}
            className="bg-emerald-50 border-b border-emerald-200 px-4 py-2 flex items-center justify-between"
          >
            <div className="flex items-center gap-2">
              <BadgeCheck className="w-4 h-4 text-emerald-600" />
              <span className="text-xs font-bold text-emerald-700">🎉 Your report is ready!</span>
            </div>
            <button
              onClick={() => { onMarkSeen(order.id); setExpanded(true) }}
              className="text-[10px] font-bold text-emerald-600 hover:text-emerald-800 underline"
            >
              View Now
            </button>
          </motion.div>
        )}

        {/* Header row */}
        <button
          onClick={() => {
            setExpanded(x => !x)
            if (isReportReady) onMarkSeen(order.id)
          }}
          className="w-full flex items-center gap-4 p-4 text-left hover:bg-slate-50/60 transition-colors"
        >
          <div className="w-10 h-10 rounded-xl bg-blue-50 flex items-center justify-center shrink-0">
            <FlaskConical className="w-5 h-5 text-blue-600" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="font-bold text-slate-800 text-sm truncate">{order.testName}</p>
            <p className="text-xs text-slate-500 mt-0.5">{order.labName || 'Lab pending assignment'} · {new Date(order.orderedAt).toLocaleDateString('en-IN')}</p>
          </div>
          <div className="flex flex-col items-end gap-1 shrink-0">
            <div className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full border text-xs font-semibold ${cfg.bg} ${cfg.color}`}>
              <Icon className={`w-3 h-3 ${order.status === 'processing' ? 'animate-spin' : ''}`} />
              {cfg.label}
            </div>
            <p className="text-xs font-bold text-slate-700">₹{order.amount}</p>
          </div>
          {expanded ? <ChevronUp className="w-4 h-4 text-slate-400 shrink-0" /> : <ChevronDown className="w-4 h-4 text-slate-400 shrink-0" />}
        </button>

        {/* Expanded detail */}
        <AnimatePresence>
          {expanded && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="border-t border-slate-100 overflow-hidden"
            >
              <div className="p-4 space-y-4">
                {/* Progress bar */}
                <div>
                  <div className="flex justify-between text-[10px] text-slate-400 font-medium mb-2">
                    {STEPS.map((s, i) => (
                      <span key={s} className={STATUS_CONFIG[order.status].step >= i ? 'text-blue-600 font-bold' : ''}>
                        {STATUS_CONFIG[s].label.split(' ')[0]}
                      </span>
                    ))}
                  </div>
                  <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
                    <motion.div
                      initial={{ width: 0 }}
                      animate={{ width: `${(STATUS_CONFIG[order.status].step / (STEPS.length - 1)) * 100}%` }}
                      transition={{ duration: 0.8, ease: 'easeOut' }}
                      className="h-full bg-gradient-to-r from-blue-500 to-emerald-500 rounded-full"
                    />
                  </div>
                </div>

                {/* Lab details */}
                <div className="grid grid-cols-2 gap-3">
                  <div className="flex items-start gap-2">
                    <Building2 className="w-3.5 h-3.5 text-slate-400 mt-0.5 shrink-0" />
                    <div>
                      <p className="text-[10px] text-slate-400 font-semibold uppercase tracking-wider">Lab</p>
                      <p className="text-xs font-semibold text-slate-700">{order.labName || '—'}</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-2">
                    <MapPin className="w-3.5 h-3.5 text-slate-400 mt-0.5 shrink-0" />
                    <div>
                      <p className="text-[10px] text-slate-400 font-semibold uppercase tracking-wider">Location</p>
                      <p className="text-xs font-semibold text-slate-700 leading-tight">{order.labAddress || '—'}</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-2">
                    <Phone className="w-3.5 h-3.5 text-slate-400 mt-0.5 shrink-0" />
                    <div>
                      <p className="text-[10px] text-slate-400 font-semibold uppercase tracking-wider">Lab Phone</p>
                      {order.labPhone
                        ? <a href={`tel:${order.labPhone}`} className="text-xs font-semibold text-blue-600">{order.labPhone}</a>
                        : <p className="text-xs text-slate-400">—</p>
                      }
                    </div>
                  </div>
                  <div className="flex items-start gap-2">
                    <Calendar className="w-3.5 h-3.5 text-slate-400 mt-0.5 shrink-0" />
                    <div>
                      <p className="text-[10px] text-slate-400 font-semibold uppercase tracking-wider">Collection</p>
                      <p className="text-xs font-semibold text-slate-700 capitalize">{order.collectionMode}</p>
                    </div>
                  </div>
                </div>

                {/* Payment & Ref */}
                <div className="flex items-center justify-between bg-slate-50 rounded-xl px-3 py-2.5 border border-slate-100">
                  <div>
                    <p className="text-[10px] text-slate-400 font-semibold uppercase tracking-wider">Payment</p>
                    <p className={`text-xs font-bold ${order.paymentStatus === 'paid' ? 'text-emerald-600' : 'text-amber-600'}`}>
                      {order.paymentStatus === 'paid' ? '✅ Paid' : '⏳ Pending'}
                    </p>
                  </div>
                  {order.txnRef && (
                    <div className="text-right">
                      <p className="text-[10px] text-slate-400 font-semibold uppercase tracking-wider">Ref</p>
                      <code className="text-[11px] font-mono font-bold text-slate-600">{order.txnRef}</code>
                    </div>
                  )}
                </div>

                {/* Estimated delivery */}
                {order.estimatedDelivery && (
                  <div className="flex items-center gap-2 text-xs text-slate-600">
                    <Clock className="w-3.5 h-3.5 text-blue-400" />
                    Estimated report: <strong>{order.estimatedDelivery}</strong>
                  </div>
                )}

                {/* Notes from admin */}
                {order.notes && (
                  <div className="flex items-start gap-2 text-xs text-blue-700 bg-blue-50 rounded-xl p-3 border border-blue-100">
                    <AlertCircle className="w-3.5 h-3.5 mt-0.5 shrink-0" />
                    <span>{order.notes}</span>
                  </div>
                )}

                {/* Action buttons */}
                <div className="flex gap-2">
                  {/* Report download */}
                  {order.reportUrl && order.status === 'delivered' && (
                    <a
                      href={order.reportUrl}
                      target="_blank"
                      rel="noreferrer"
                      className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-xl transition-colors"
                    >
                      <Download className="w-3.5 h-3.5" />
                      Download Report
                    </a>
                  )}

                  {/* Invoice/Receipt */}
                  {order.paymentStatus === 'paid' && (
                    <button
                      onClick={() => setShowInvoice(true)}
                      className="flex items-center justify-center gap-2 px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-xl transition-colors"
                    >
                      <Receipt className="w-3.5 h-3.5" />
                      Invoice
                    </button>
                  )}
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
    </>
  )
}

// ─────────────────────────────────────────────────────────────────────────────
// MAIN PAGE
// ─────────────────────────────────────────────────────────────────────────────
export default function Orders() {
  const user = getStoredUser()
  const [orders, setOrders] = useState<LabOrder[]>([])
  const [filter, setFilter] = useState<'all' | OrderStatus>('all')
  const [refreshKey, setRefreshKey] = useState(0)

  useEffect(() => {
    const all = getOrders()
    setOrders(all.filter(o => !user || (o as any).userId === user.id || !(o as any).userId))
  }, [refreshKey])

  const markSeen = (orderId: string) => {
    const all = getOrders()
    const updated = all.map(o => o.id === orderId ? { ...o, notificationSeen: true } : o)
    saveOrders(updated)
    setOrders(prev => prev.map(o => o.id === orderId ? { ...o, notificationSeen: true } : o))
  }

  const filtered = filter === 'all' ? orders : orders.filter(o => o.status === filter)

  const counts = {
    all: orders.length,
    pending_payment: orders.filter(o => o.status === 'pending_payment').length,
    confirmed: orders.filter(o => o.status === 'confirmed').length,
    processing: orders.filter(o => o.status === 'processing' || o.status === 'sample_collected').length,
    delivered: orders.filter(o => o.status === 'delivered').length,
  }

  const unreadReports = orders.filter(o => o.status === 'delivered' && !o.notificationSeen).length

  return (
    <div className="min-h-full bg-gradient-to-br from-slate-50 via-white to-blue-50/20 p-6">
      <div className="max-w-2xl mx-auto">

        {/* Header */}
        <motion.div initial={{ opacity: 0, y: -12 }} animate={{ opacity: 1, y: 0 }} className="mb-7">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-black text-slate-900 flex items-center gap-2">
                My Orders
                {unreadReports > 0 && (
                  <span className="flex items-center gap-1 text-xs font-bold text-emerald-700 bg-emerald-100 px-2 py-1 rounded-full animate-pulse">
                    <Bell className="w-3 h-3" /> {unreadReports} report{unreadReports > 1 ? 's' : ''} ready
                  </span>
                )}
              </h1>
              <p className="text-sm text-slate-500 mt-0.5">Track your blood tests & lab reports</p>
            </div>
            <button
              onClick={() => setRefreshKey(k => k + 1)}
              className="flex items-center gap-2 px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs font-semibold text-slate-600 hover:border-blue-300 hover:text-blue-600 transition-all shadow-sm"
            >
              <RefreshCw className="w-3.5 h-3.5" /> Refresh
            </button>
          </div>

          {/* Stat chips */}
          <div className="flex gap-2 flex-wrap mt-4">
            {[
              { key: 'all',             label: 'All',        count: counts.all,             color: 'bg-slate-100 text-slate-700' },
              { key: 'pending_payment', label: 'Unpaid',     count: counts.pending_payment, color: 'bg-amber-50 text-amber-700 border-amber-200' },
              { key: 'confirmed',       label: 'Confirmed',  count: counts.confirmed,       color: 'bg-blue-50 text-blue-700 border-blue-200' },
              { key: 'processing',      label: 'Processing', count: counts.processing,      color: 'bg-purple-50 text-purple-700 border-purple-200' },
              { key: 'delivered',       label: 'Ready',      count: counts.delivered,       color: 'bg-emerald-50 text-emerald-700 border-emerald-200' },
            ].map(f => (
              <button
                key={f.key}
                onClick={() => setFilter(f.key as any)}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold border transition-all ${
                  filter === f.key ? 'ring-2 ring-blue-400 ring-offset-1 ' + f.color : 'bg-white border-slate-200 text-slate-500 hover:border-blue-200'
                }`}
              >
                {f.label}
                <span className="w-4 h-4 rounded-full bg-white/60 flex items-center justify-center text-[10px] font-black">{f.count}</span>
              </button>
            ))}
          </div>
        </motion.div>

        {/* Order list */}
        {filtered.length === 0 ? (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="text-center py-20 bg-white rounded-3xl border border-slate-200/60"
          >
            <PackageSearch className="w-14 h-14 text-slate-200 mx-auto mb-4" />
            <p className="text-slate-500 font-semibold text-sm">No orders yet</p>
            <p className="text-slate-400 text-xs mt-1">Book a blood test to see your orders here</p>
            <a href="/appointments" className="inline-flex items-center gap-2 mt-4 px-4 py-2.5 bg-blue-600 text-white text-xs font-bold rounded-xl hover:bg-blue-700 transition-colors">
              <FlaskConical className="w-3.5 h-3.5" /> Book a Test <ArrowRight className="w-3.5 h-3.5" />
            </a>
          </motion.div>
        ) : (
          <div className="space-y-3">
            <AnimatePresence>
              {filtered.map(order => <OrderCard key={order.id} order={order} onMarkSeen={markSeen} />)}
            </AnimatePresence>
          </div>
        )}
      </div>
    </div>
  )
}
