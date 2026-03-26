import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  FlaskConical,
  Calendar,
  Clock,
  MapPin,
  ChevronRight,
  ChevronLeft,
  Check,
  Search,
  Star,
  Building2,
  User,
  Phone,
  Loader2,
  ArrowRight,
  Sparkles,
  AlertCircle,
  Microscope,
  Heart,
  Activity,
  Droplets,
  Brain,
  Shield,
  Crown,
  PackageSearch,
} from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { getStoredUser } from '../lib/auth'
import { getOrders, saveOrders } from './Orders'

// --- Types ---
interface TestPackage {
  id: string
  name: string
  category: string
  description: string
  includes: string[]
  price: number
  originalPrice: number
  turnaround: string
  icon: any
  color: string
  bg: string
  popular?: boolean
}

interface LabCenter {
  id: string
  name: string
  address: string
  distance: string
  rating: number
  reviews: number
  homeCollection: boolean
}

interface AppointmentForm {
  name: string
  phone: string
  date: string
  timeSlot: string
  mode: 'walk-in' | 'home'
  labId: string
}

// --- Static Data ---
const TEST_PACKAGES: TestPackage[] = [
  {
    id: 'cbc',
    name: 'Complete Blood Count (CBC)',
    category: 'Hematology',
    description: 'Measures different components of your blood including RBC, WBC, hemoglobin, and platelets.',
    includes: ['Red Blood Cells', 'White Blood Cells', 'Hemoglobin', 'Hematocrit', 'Platelets', 'MCV/MCH/MCHC'],
    price: 12.99,
    originalPrice: 22.00,
    turnaround: '24 hours',
    icon: Droplets,
    color: 'text-red-500',
    bg: 'bg-red-50',
    popular: true,
  },
  {
    id: 'metabolic',
    name: 'Comprehensive Metabolic Panel',
    category: 'Chemistry',
    description: 'Checks kidney & liver function, blood sugar, electrolytes, and calcium.',
    includes: ['Glucose', 'Calcium', 'Sodium', 'Potassium', 'CO2', 'Creatinine', 'BUN', 'ALT', 'AST', 'Albumin'],
    price: 19.99,
    originalPrice: 38.00,
    turnaround: '24–48 hours',
    icon: Activity,
    color: 'text-blue-500',
    bg: 'bg-blue-50',
  },
  {
    id: 'lipid',
    name: 'Lipid Profile',
    category: 'Cardiology',
    description: 'Measures cholesterol levels to assess heart disease risk.',
    includes: ['Total Cholesterol', 'LDL', 'HDL', 'VLDL', 'Triglycerides', 'Non-HDL Cholesterol'],
    price: 14.99,
    originalPrice: 28.00,
    turnaround: '24 hours',
    icon: Heart,
    color: 'text-pink-500',
    bg: 'bg-pink-50',
  },
  {
    id: 'thyroid',
    name: 'Thyroid Function (TSH + T3 + T4)',
    category: 'Endocrinology',
    description: 'Evaluates thyroid gland function and screens for hypothyroidism/hyperthyroidism.',
    includes: ['TSH', 'Free T3', 'Free T4', 'Total T3', 'Total T4'],
    price: 24.99,
    originalPrice: 45.00,
    turnaround: '24–48 hours',
    icon: Brain,
    color: 'text-indigo-500',
    bg: 'bg-indigo-50',
  },
  {
    id: 'diabetes',
    name: 'Diabetes Screening (HbA1c + FBS)',
    category: 'Endocrinology',
    description: 'Screens for diabetes and pre-diabetes with long-term blood sugar monitoring.',
    includes: ['HbA1c', 'Fasting Blood Sugar', 'Post-prandial Blood Sugar', 'Insulin Level'],
    price: 17.99,
    originalPrice: 32.00,
    turnaround: '24 hours',
    icon: FlaskConical,
    color: 'text-amber-500',
    bg: 'bg-amber-50',
    popular: true,
  },
  {
    id: 'wellness',
    name: 'Full Body Wellness Panel',
    category: 'Preventive',
    description: 'Comprehensive preventive health checkup covering 60+ parameters.',
    includes: ['CBC', 'Metabolic Panel', 'Lipid Profile', 'Thyroid', 'Liver Function', 'Kidney Function', 'Urine Analysis', 'Vitamin D & B12'],
    price: 49.99,
    originalPrice: 120.00,
    turnaround: '48 hours',
    icon: Microscope,
    color: 'text-teal-500',
    bg: 'bg-teal-50',
    popular: true,
  },
]

const LAB_CENTERS: LabCenter[] = [
  { id: 'lab1', name: 'HealthFirst Diagnostics', address: '12 Park Lane, Sector 5', distance: '1.2 km', rating: 4.8, reviews: 1241, homeCollection: true },
  { id: 'lab2', name: 'MediScan Labs', address: '34 Green Street, Block A', distance: '2.8 km', rating: 4.6, reviews: 876, homeCollection: true },
  { id: 'lab3', name: 'Apollo Diagnostics', address: '56 Main Road, City Center', distance: '3.5 km', rating: 4.9, reviews: 3422, homeCollection: false },
  { id: 'lab4', name: 'Dr. Lal PathLabs', address: '78 Ring Road, Suburb', distance: '4.1 km', rating: 4.7, reviews: 5100, homeCollection: true },
]

const TIME_SLOTS = ['07:00 AM', '08:00 AM', '09:00 AM', '10:00 AM', '11:00 AM', '12:00 PM', '02:00 PM', '03:00 PM', '04:00 PM', '05:00 PM']

export default function Appointments() {
  const user = getStoredUser()
  const navigate = useNavigate()
  const [step, setStep] = useState(1)
  const [search, setSearch] = useState('')
  const [selectedTest, setSelectedTest] = useState<TestPackage | null>(null)
  const [form, setForm] = useState<AppointmentForm>({
    name: user?.name || '',
    phone: '',
    date: '',
    timeSlot: '',
    mode: 'walk-in',
    labId: '',
  })
  const [submitting, setSubmitting] = useState(false)
  const [submitted, setSubmitted] = useState(false)

  const isPro = true // All users can book tests

  const filteredTests = TEST_PACKAGES.filter(
    (t) =>
      t.name.toLowerCase().includes(search.toLowerCase()) ||
      t.category.toLowerCase().includes(search.toLowerCase())
  )

  const handleSelectTest = (test: TestPackage) => {
    setSelectedTest(test)
    setStep(2)
  }

  const handleSubmit = async () => {
    if (!selectedTest) return
    setSubmitting(true)
    await new Promise((r) => setTimeout(r, 1200))

    // Save order to localStorage
    const selectedLab = LAB_CENTERS.find((l) => l.id === form.labId)
    const txnRef = `MEDAI-${selectedTest.id.toUpperCase()}-${Date.now().toString().slice(-6)}`
    const newOrder = {
      id: `ORD-${Date.now()}`,
      testName: selectedTest.name,
      labName: selectedLab?.name || '',
      labAddress: selectedLab?.address || '',
      labPhone: '',
      amount: Math.round(selectedTest.price * 83), // USD → INR approximate
      status: 'pending_payment' as const,
      paymentStatus: 'pending' as const,
      orderedAt: new Date().toISOString(),
      collectionMode: form.mode,
      txnRef,
      userId: user?.id,
    }
    const existing = getOrders()
    saveOrders([newOrder, ...existing])

    setSubmitting(false)
    setSubmitted(true)
  }

  const tomorrowStr = () => {
    const d = new Date()
    d.setDate(d.getDate() + 1)
    return d.toISOString().split('T')[0]
  }

  const maxDateStr = () => {
    const d = new Date()
    d.setDate(d.getDate() + 30)
    return d.toISOString().split('T')[0]
  }

  if (!isPro) {
    return (
      <div className="min-h-screen flex items-center justify-center px-4 py-16">
        <motion.div
          initial={{ opacity: 0, y: 30, scale: 0.95 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          transition={{ duration: 0.45 }}
          className="max-w-md w-full bg-white rounded-3xl border border-slate-100 shadow-2xl p-10 text-center"
        >
          <div className="w-16 h-16 bg-gradient-to-br from-violet-400 to-purple-600 rounded-2xl flex items-center justify-center mx-auto mb-5 shadow-xl shadow-violet-500/25">
            <Crown className="w-8 h-8 text-white" />
          </div>
          <h2 className="text-2xl font-bold text-slate-900 mb-2">Pro Feature</h2>
          <p className="text-sm text-slate-500 mb-6 leading-relaxed">
            Blood test booking is available on the <strong>MedAI Pro</strong> and <strong>Elite</strong> plans. Upgrade to book diagnostic tests and get results delivered in-app.
          </p>
          <div className="space-y-3">
            <motion.button
              whileHover={{ scale: 1.02, y: -1 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => navigate('/subscriptions')}
              className="w-full py-3.5 rounded-xl bg-gradient-to-r from-violet-600 to-purple-700 text-white text-sm font-bold shadow-lg flex items-center justify-center gap-2"
            >
              <Sparkles className="w-4 h-4" />
              Upgrade to Pro
              <ArrowRight className="w-4 h-4" />
            </motion.button>
            <button
              onClick={() => navigate('/')}
              className="w-full py-2.5 text-sm text-slate-400 hover:text-slate-600 transition-colors"
            >
              Maybe later
            </button>
          </div>
        </motion.div>
      </div>
    )
  }

  // --- Submitted confirmation screen ---
  if (submitted) {
    return (
      <div className="min-h-screen flex items-center justify-center px-4">
        <motion.div
          initial={{ scale: 0.85, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ type: 'spring', stiffness: 200, damping: 18 }}
          className="max-w-md w-full bg-white rounded-3xl border border-emerald-100 shadow-2xl p-10 text-center"
        >
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ type: 'spring', stiffness: 300, damping: 18, delay: 0.2 }}
            className="w-16 h-16 bg-gradient-to-br from-emerald-400 to-teal-600 rounded-full flex items-center justify-center mx-auto mb-5 shadow-xl shadow-emerald-500/30"
          >
            <Check className="w-8 h-8 text-white" />
          </motion.div>
          <h2 className="text-2xl font-bold text-slate-900 mb-2">Appointment Confirmed!</h2>
          <p className="text-sm text-slate-500 mb-2">
            Your <strong>{selectedTest?.name}</strong> test has been booked.
          </p>
          <p className="text-xs text-slate-400 mb-6">
            {form.date} at {form.timeSlot} • {form.mode === 'home' ? 'Home collection' : 'Walk-in'}
          </p>
          <div className="bg-emerald-50 rounded-xl p-4 text-xs text-emerald-700 mb-6">
            📲 A confirmation SMS will be sent to <strong>{form.phone}</strong>. Complete payment via UPI to confirm your slot. Track your order in <strong>My Orders</strong>.
          </div>
          <div className="flex flex-col gap-2">
            <button onClick={() => navigate('/orders')} className="w-full py-3 rounded-xl bg-emerald-600 text-white text-sm font-bold flex items-center justify-center gap-2">
              <PackageSearch className="w-4 h-4" /> View My Orders
            </button>
            <button onClick={() => navigate('/payments')} className="w-full py-3 rounded-xl bg-blue-600 text-white text-sm font-bold">
              Pay via UPI
            </button>
            <button onClick={() => { setStep(1); setSubmitted(false); setSelectedTest(null) }} className="w-full py-2.5 text-sm text-slate-400 hover:text-slate-600 transition-colors">
              Book Another Test
            </button>
          </div>
        </motion.div>
      </div>
    )
  }

  return (
    <div className="min-h-screen px-4 py-8 sm:px-6 lg:px-10 max-w-5xl mx-auto">
      {/* Header */}
      <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }} className="mb-8">
        <div className="flex items-center gap-3 mb-2">
          <div className="w-10 h-10 bg-gradient-to-br from-teal-500 to-cyan-600 rounded-xl flex items-center justify-center shadow-lg shadow-teal-500/20">
            <FlaskConical className="w-5 h-5 text-white" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-slate-900">Blood Test Booking</h1>
            <p className="text-sm text-slate-500">Book a certified lab test near you</p>
          </div>
        </div>

        {/* Stepper */}
        <div className="flex items-center gap-2 mt-5">
          {['Select Test', 'Choose Lab & Slot', 'Confirm'].map((s, i) => (
            <div key={s} className="flex items-center gap-2">
              <div className={`flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-semibold transition-all ${step > i + 1 ? 'bg-emerald-100 text-emerald-700' : step === i + 1 ? 'bg-teal-600 text-white shadow' : 'bg-slate-100 text-slate-400'}`}>
                {step > i + 1 ? <Check className="w-3 h-3" /> : <span>{i + 1}</span>}
                {s}
              </div>
              {i < 2 && <ChevronRight className="w-3.5 h-3.5 text-slate-300" />}
            </div>
          ))}
        </div>
      </motion.div>

      {/* Step 1: Select Test */}
      <AnimatePresence mode="wait">
        {step === 1 && (
          <motion.div key="step1" initial={{ opacity: 0, x: 30 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -30 }} transition={{ duration: 0.3 }}>
            <div className="relative mb-5">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search test by name or category…"
                className="w-full pl-10 pr-4 py-3 rounded-2xl border border-slate-200 bg-white text-sm focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-400 shadow-sm"
              />
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredTests.map((test, i) => (
                <motion.button
                  key={test.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.05 }}
                  whileHover={{ y: -3, scale: 1.01 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => handleSelectTest(test)}
                  className="text-left bg-white rounded-2xl border border-slate-100 p-5 shadow-sm hover:shadow-md transition-all group relative overflow-hidden"
                >
                  {test.popular && (
                    <span className="absolute top-3 right-3 text-[10px] font-bold bg-amber-100 text-amber-600 px-2 py-0.5 rounded-full">Popular</span>
                  )}
                  <div className={`w-10 h-10 ${test.bg} rounded-xl flex items-center justify-center mb-3`}>
                    <test.icon className={`w-5 h-5 ${test.color}`} />
                  </div>
                  <h3 className="text-sm font-bold text-slate-900 mb-0.5 pr-12">{test.name}</h3>
                  <p className="text-[11px] text-slate-400 mb-3 font-medium uppercase tracking-wide">{test.category}</p>
                  <p className="text-xs text-slate-500 mb-3 leading-relaxed line-clamp-2">{test.description}</p>
                  <div className="flex items-center justify-between">
                    <div>
                      <span className="text-base font-bold text-teal-600">${test.price}</span>
                      <span className="ml-1.5 text-xs text-slate-400 line-through">${test.originalPrice}</span>
                    </div>
                    <span className="text-[11px] text-slate-400">{test.turnaround}</span>
                  </div>
                  <div className="mt-2.5 flex items-center gap-1 text-teal-600 text-xs font-semibold opacity-0 group-hover:opacity-100 transition-opacity">
                    Book Now <ArrowRight className="w-3 h-3" />
                  </div>
                </motion.button>
              ))}
            </div>
          </motion.div>
        )}

        {/* Step 2: Lab + Slot */}
        {step === 2 && selectedTest && (
          <motion.div key="step2" initial={{ opacity: 0, x: 30 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -30 }} transition={{ duration: 0.3 }}>
            <button onClick={() => setStep(1)} className="flex items-center gap-1.5 text-sm text-slate-400 hover:text-slate-700 mb-6 transition-colors">
              <ChevronLeft className="w-4 h-4" /> Back to tests
            </button>

            {/* Selected test summary */}
            <div className="bg-gradient-to-r from-teal-50 to-cyan-50 border border-teal-100 rounded-2xl p-4 flex items-center gap-4 mb-6">
              <div className={`w-10 h-10 ${selectedTest.bg} rounded-xl flex items-center justify-center shrink-0`}>
                <selectedTest.icon className={`w-5 h-5 ${selectedTest.color}`} />
              </div>
              <div className="flex-1">
                <p className="text-sm font-bold text-slate-900">{selectedTest.name}</p>
                <p className="text-xs text-slate-500">{selectedTest.includes.length} parameters • {selectedTest.turnaround}</p>
              </div>
              <p className="text-lg font-extrabold text-teal-600">${selectedTest.price}</p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Lab Selection */}
              <div>
                <h3 className="text-sm font-bold text-slate-900 mb-3 flex items-center gap-2">
                  <Building2 className="w-4 h-4 text-teal-500" /> Nearby Labs
                </h3>
                <div className="space-y-3">
                  {LAB_CENTERS.map((lab) => (
                    <button
                      key={lab.id}
                      onClick={() => setForm((f) => ({ ...f, labId: lab.id }))}
                      className={`w-full text-left p-4 rounded-2xl border transition-all ${form.labId === lab.id ? 'border-teal-400 bg-teal-50 shadow-md' : 'border-slate-100 bg-white hover:border-slate-200 shadow-sm'}`}
                    >
                      <div className="flex items-start justify-between gap-2 mb-1">
                        <p className="text-sm font-semibold text-slate-900">{lab.name}</p>
                        {form.labId === lab.id && <Check className="w-4 h-4 text-teal-500 shrink-0 mt-0.5" />}
                      </div>
                      <p className="text-xs text-slate-400 flex items-center gap-1 mb-1.5">
                        <MapPin className="w-3 h-3" /> {lab.address}
                      </p>
                      <div className="flex items-center gap-3 text-xs">
                        <span className="flex items-center gap-0.5 text-amber-500">
                          <Star className="w-3 h-3 fill-amber-500" /> {lab.rating} ({lab.reviews.toLocaleString()})
                        </span>
                        <span className="text-slate-400">{lab.distance}</span>
                        {lab.homeCollection && <span className="text-emerald-600 font-medium">Home collection ✓</span>}
                      </div>
                    </button>
                  ))}
                </div>
              </div>

              {/* Date, Time, Details */}
              <div className="space-y-5">
                {/* Collection mode */}
                <div>
                  <h3 className="text-sm font-bold text-slate-900 mb-2.5">Collection Mode</h3>
                  <div className="flex gap-3">
                    {(['walk-in', 'home'] as const).map((m) => (
                      <button
                        key={m}
                        onClick={() => setForm((f) => ({ ...f, mode: m }))}
                        className={`flex-1 py-3 rounded-xl text-sm font-semibold border transition-all ${form.mode === m ? 'border-teal-400 bg-teal-50 text-teal-700' : 'border-slate-200 text-slate-500 hover:border-slate-300'}`}
                      >
                        {m === 'walk-in' ? '🏥 Walk-in' : '🏠 Home Collection'}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Date */}
                <div>
                  <label className="block text-sm font-bold text-slate-900 mb-2">
                    <Calendar className="inline w-4 h-4 text-teal-500 mr-1.5 mb-0.5" />
                    Date
                  </label>
                  <input
                    type="date"
                    min={tomorrowStr()}
                    max={maxDateStr()}
                    value={form.date}
                    onChange={(e) => setForm((f) => ({ ...f, date: e.target.value, timeSlot: '' }))}
                    className="w-full px-4 py-3 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-400 bg-white"
                  />
                </div>

                {/* Time Slots */}
                {form.date && (
                  <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
                    <label className="block text-sm font-bold text-slate-900 mb-2">
                      <Clock className="inline w-4 h-4 text-teal-500 mr-1.5 mb-0.5" />
                      Time Slot
                    </label>
                    <div className="grid grid-cols-3 gap-2">
                      {TIME_SLOTS.map((slot) => (
                        <button
                          key={slot}
                          onClick={() => setForm((f) => ({ ...f, timeSlot: slot }))}
                          className={`py-2 rounded-xl text-xs font-semibold transition-all ${form.timeSlot === slot ? 'bg-teal-600 text-white shadow' : 'bg-slate-50 text-slate-600 hover:bg-teal-50 border border-slate-100'}`}
                        >
                          {slot}
                        </button>
                      ))}
                    </div>
                  </motion.div>
                )}

                {/* Patient info */}
                <div className="space-y-3">
                  <h3 className="text-sm font-bold text-slate-900">Patient Details</h3>
                  <div className="relative">
                    <User className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                    <input
                      type="text"
                      placeholder="Full name"
                      value={form.name}
                      onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
                      className="w-full pl-10 pr-4 py-3 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-400 bg-white"
                    />
                  </div>
                  <div className="relative">
                    <Phone className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                    <input
                      type="tel"
                      placeholder="Phone number"
                      value={form.phone}
                      onChange={(e) => setForm((f) => ({ ...f, phone: e.target.value }))}
                      className="w-full pl-10 pr-4 py-3 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-400 bg-white"
                    />
                  </div>
                </div>

                <motion.button
                  whileHover={{ scale: 1.01, y: -1 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => setStep(3)}
                  disabled={!form.labId || !form.date || !form.timeSlot || !form.name || !form.phone}
                  className="w-full py-3.5 rounded-xl bg-gradient-to-r from-teal-600 to-cyan-600 text-white text-sm font-bold flex items-center justify-center gap-2 shadow-lg disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Continue to Confirm
                  <ArrowRight className="w-4 h-4" />
                </motion.button>
              </div>
            </div>
          </motion.div>
        )}

        {/* Step 3: Confirm */}
        {step === 3 && selectedTest && (
          <motion.div key="step3" initial={{ opacity: 0, x: 30 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -30 }} transition={{ duration: 0.3 }}>
            <button onClick={() => setStep(2)} className="flex items-center gap-1.5 text-sm text-slate-400 hover:text-slate-700 mb-6 transition-colors">
              <ChevronLeft className="w-4 h-4" /> Back
            </button>

            <div className="max-w-lg mx-auto">
              <div className="bg-white rounded-3xl border border-slate-100 shadow-xl overflow-hidden">
                {/* Header */}
                <div className="bg-gradient-to-r from-teal-600 to-cyan-600 p-6 text-white">
                  <p className="text-xs font-semibold uppercase tracking-wider text-teal-200 mb-1">Order Summary</p>
                  <h2 className="text-lg font-bold">{selectedTest.name}</h2>
                </div>

                {/* Details */}
                <div className="p-6 space-y-4">
                  {[
                    { label: 'Lab', value: LAB_CENTERS.find((l) => l.id === form.labId)?.name || '' },
                    { label: 'Date', value: form.date },
                    { label: 'Time', value: form.timeSlot },
                    { label: 'Mode', value: form.mode === 'home' ? '🏠 Home Collection' : '🏥 Walk-in' },
                    { label: 'Patient', value: form.name },
                    { label: 'Phone', value: form.phone },
                  ].map((row) => (
                    <div key={row.label} className="flex items-center justify-between py-1.5 border-b border-slate-50 last:border-0">
                      <span className="text-sm text-slate-500">{row.label}</span>
                      <span className="text-sm font-semibold text-slate-900">{row.value}</span>
                    </div>
                  ))}
                </div>

                {/* Price */}
                <div className="mx-6 mb-4 bg-teal-50 rounded-xl p-4 flex items-center justify-between">
                  <span className="text-sm font-semibold text-slate-700">Total Payable</span>
                  <span className="text-2xl font-extrabold text-teal-600">${selectedTest.price}</span>
                </div>

                <div className="p-6 pt-0">
                  <motion.button
                    whileHover={{ scale: 1.01 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={handleSubmit}
                    disabled={submitting}
                    className="w-full py-4 rounded-xl bg-gradient-to-r from-teal-600 to-cyan-600 text-white text-sm font-bold flex items-center justify-center gap-2 shadow-lg"
                  >
                    {submitting ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <>
                        <Check className="w-4 h-4" />
                        Confirm Booking
                      </>
                    )}
                  </motion.button>
                  <p className="text-[11px] text-slate-400 text-center mt-3">
                    By confirming, you agree to our{' '}
                    <span className="underline cursor-pointer hover:text-slate-600">Terms of Service</span>
                  </p>
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
