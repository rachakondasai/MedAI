/**
 * Appointments.tsx — Lab Test Booking with GPS-based Nearby Lab Discovery
 *
 * Flow:
 *  1. User selects a test
 *  2. App requests GPS → searches OpenStreetMap Overpass API for real nearby labs
 *  3. User picks a lab, date, time slot and fills patient details
 *  4. On confirm → order saved + admin auto-notified on WhatsApp with full details
 */

import { useState, useEffect, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  FlaskConical, Calendar, Clock, MapPin, ChevronRight, ChevronLeft,
  Check, Search, Building2, User, Phone, Loader2, ArrowRight,
  Microscope, Heart, Activity, Droplets, Brain, PackageSearch,
  Navigation, AlertCircle, RefreshCw, Zap,
} from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { getStoredUser } from '../lib/auth'
import { getOrders, saveOrders } from './Orders'
import { toast } from '../components/Toast'

// ─────────────────────────────────────────────────────────────
// ADMIN WHATSAPP — auto-notified on every new order
// Set VITE_WHATSAPP_NO in your .env / Render environment.
// ─────────────────────────────────────────────────────────────
const ADMIN_WA = import.meta.env.VITE_WHATSAPP_NO || '916303089945'

// ─────────────────────────────────────────────────────────────
// TYPES
// ─────────────────────────────────────────────────────────────
interface TestPackage {
  id: string; name: string; category: string; description: string
  includes: string[]; price: number; originalPrice: number
  turnaround: string; icon: any; color: string; bg: string; popular?: boolean
}

interface NearbyLab {
  id: string; name: string; address: string
  distance: string; distanceM: number
  lat: number; lon: number; phone?: string
  homeCollection: boolean
}

interface BookingForm {
  name: string; phone: string; date: string
  timeSlot: string; mode: 'walk-in' | 'home'; labId: string
}

// ─────────────────────────────────────────────────────────────
// TEST CATALOGUE  (prices in INR)
// ─────────────────────────────────────────────────────────────
const TEST_PACKAGES: TestPackage[] = [
  { id:'cbc',       name:'Complete Blood Count (CBC)',           category:'Hematology',    description:'Measures RBC, WBC, hemoglobin, hematocrit and platelets.',                         includes:['Red Blood Cells','White Blood Cells','Hemoglobin','Hematocrit','Platelets','MCV/MCH/MCHC'], price:249,  originalPrice:450,  turnaround:'24 hours',    icon:Droplets,   color:'text-red-500',    bg:'bg-red-50',    popular:true },
  { id:'metabolic', name:'Comprehensive Metabolic Panel',        category:'Chemistry',     description:'Kidney & liver function, blood sugar, electrolytes and calcium.',                  includes:['Glucose','Calcium','Sodium','Potassium','Creatinine','BUN','ALT','AST','Albumin'],          price:649,  originalPrice:1200, turnaround:'24–48 hours', icon:Activity,   color:'text-blue-500',   bg:'bg-blue-50' },
  { id:'lipid',     name:'Lipid Profile',                        category:'Cardiology',    description:'Cholesterol levels to assess heart disease risk.',                                  includes:['Total Cholesterol','LDL','HDL','VLDL','Triglycerides','Non-HDL'],                           price:399,  originalPrice:750,  turnaround:'24 hours',    icon:Heart,      color:'text-pink-500',   bg:'bg-pink-50' },
  { id:'thyroid',   name:'Thyroid Function (TSH + T3 + T4)',     category:'Endocrinology', description:'Evaluates thyroid function and screens for hypo/hyperthyroidism.',                 includes:['TSH','Free T3','Free T4','Total T3','Total T4'],                                            price:549,  originalPrice:950,  turnaround:'24–48 hours', icon:Brain,      color:'text-indigo-500', bg:'bg-indigo-50' },
  { id:'diabetes',  name:'Diabetes Screening (HbA1c + FBS)',     category:'Endocrinology', description:'Screens for diabetes and pre-diabetes.',                                            includes:['HbA1c','Fasting Blood Sugar','Post-prandial Blood Sugar','Insulin Level'],                  price:349,  originalPrice:650,  turnaround:'24 hours',    icon:FlaskConical,color:'text-amber-500',  bg:'bg-amber-50',  popular:true },
  { id:'wellness',  name:'Full Body Wellness Panel',              category:'Preventive',    description:'Comprehensive preventive checkup — 60+ parameters.',                              includes:['CBC','Metabolic Panel','Lipid Profile','Thyroid','Liver Function','Kidney Function','Urine Analysis','Vitamin D & B12'], price:1299, originalPrice:3500, turnaround:'48 hours', icon:Microscope, color:'text-teal-500',   bg:'bg-teal-50',   popular:true },
  { id:'vitamin',   name:'Vitamin Panel (D, B12, Folate)',        category:'Nutrition',     description:'Checks for common nutritional deficiencies.',                                      includes:['Vitamin D3 (25-OH)','Vitamin B12','Folate (Folic Acid)','Iron Studies'],                    price:799,  originalPrice:1400, turnaround:'24–48 hours', icon:Zap,        color:'text-yellow-500', bg:'bg-yellow-50' },
]

const TIME_SLOTS = ['07:00 AM','08:00 AM','09:00 AM','10:00 AM','11:00 AM','12:00 PM','02:00 PM','03:00 PM','04:00 PM','05:00 PM','06:00 PM']

// ─────────────────────────────────────────────────────────────
// HELPERS
// ─────────────────────────────────────────────────────────────
function haversineM(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371000
  const dLat = (lat2 - lat1) * Math.PI / 180
  const dLon = (lon2 - lon1) * Math.PI / 180
  const a = Math.sin(dLat/2)**2 + Math.cos(lat1*Math.PI/180)*Math.cos(lat2*Math.PI/180)*Math.sin(dLon/2)**2
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a))
}
function fmtDist(m: number) { return m < 1000 ? `${Math.round(m)} m` : `${(m/1000).toFixed(1)} km` }

async function fetchNearbyLabs(lat: number, lon: number, radiusM = 6000): Promise<NearbyLab[]> {
  const query = `
    [out:json][timeout:25];
    (
      node["amenity"="clinic"](around:${radiusM},${lat},${lon});
      node["amenity"="hospital"](around:${radiusM},${lat},${lon});
      node["healthcare"="laboratory"](around:${radiusM},${lat},${lon});
      node["healthcare"="clinic"](around:${radiusM},${lat},${lon});
      node["name"~"diagnostic|lab|path|health|medic|clinic|hospital",i](around:${radiusM},${lat},${lon});
      way["amenity"="clinic"](around:${radiusM},${lat},${lon});
      way["amenity"="hospital"](around:${radiusM},${lat},${lon});
      way["healthcare"="laboratory"](around:${radiusM},${lat},${lon});
    );
    out center tags;
  `
  const res = await fetch('https://overpass-api.de/api/interpreter', { method:'POST', body:query })
  const data = await res.json()
  const seen = new Set<string>()
  const labs: NearbyLab[] = []
  for (const el of data.elements ?? []) {
    const name: string = el.tags?.name || el.tags?.['name:en'] || ''
    if (!name || name.trim().length < 3) continue
    const elLat = el.lat ?? el.center?.lat
    const elLon = el.lon ?? el.center?.lon
    if (!elLat || !elLon) continue
    const key = name.toLowerCase().trim()
    if (seen.has(key)) continue
    seen.add(key)
    const distM = haversineM(lat, lon, elLat, elLon)
    const addr = [el.tags?.['addr:housenumber'], el.tags?.['addr:street'], el.tags?.['addr:suburb']||el.tags?.['addr:city']]
      .filter(Boolean).join(', ') || el.tags?.['addr:full'] || ''
    labs.push({ id:String(el.id), name:name.trim(), address:addr, distance:fmtDist(distM), distanceM:distM, lat:elLat, lon:elLon, phone:el.tags?.phone||el.tags?.['contact:phone']||'', homeCollection:false })
  }
  return labs.sort((a,b)=>a.distanceM-b.distanceM).slice(0,15)
}

// ─────────────────────────────────────────────────────────────
// COMPONENT
// ─────────────────────────────────────────────────────────────
export default function Appointments() {
  const user = getStoredUser()
  const navigate = useNavigate()
  const [step, setStep] = useState<1|2|3>(1)
  const [search, setSearch] = useState('')
  const [selectedTest, setSelectedTest] = useState<TestPackage|null>(null)
  const [form, setForm] = useState<BookingForm>({ name:user?.name||'', phone:'', date:'', timeSlot:'', mode:'walk-in', labId:'' })
  const [submitting, setSubmitting] = useState(false)
  const [submitted, setSubmitted] = useState(false)

  // Location
  const [locState, setLocState] = useState<'idle'|'requesting'|'ok'|'error'>('idle')
  const [coords, setCoords] = useState<{lat:number;lon:number}|null>(null)
  const [cityName, setCityName] = useState('')
  const [locError, setLocError] = useState('')

  // Nearby labs
  const [labsLoading, setLabsLoading] = useState(false)
  const [nearbyLabs, setNearbyLabs] = useState<NearbyLab[]>([])
  const [labError, setLabError] = useState('')
  const [labSearch, setLabSearch] = useState('')

  const requestLocation = useCallback(() => {
    setLocState('requesting')
    setLocError('')
    setLabError('')
    setNearbyLabs([])
    if (!navigator.geolocation) {
      setLocState('error')
      setLocError('Geolocation is not supported by your browser.')
      return
    }
    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        const { latitude: lat, longitude: lon } = pos.coords
        setCoords({ lat, lon })
        setLocState('ok')
        try {
          const r = await fetch(`https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lon}&format=json`, { headers:{ 'Accept-Language':'en' } })
          const d = await r.json()
          setCityName(d.address?.city||d.address?.town||d.address?.suburb||d.address?.village||d.address?.state_district||'')
        } catch { /* ignore */ }
        setLabsLoading(true)
        try {
          const labs = await fetchNearbyLabs(lat, lon)
          setNearbyLabs(labs)
          if (labs.length === 0) setLabError('No labs found within 6 km. Try again or search manually.')
        } catch {
          setLabError('Could not load nearby labs. Please check your connection and try again.')
        } finally {
          setLabsLoading(false)
        }
      },
      (err) => {
        setLocState('error')
        setLocError(err.code === 1
          ? 'Location access denied. Please allow location in your browser settings and try again.'
          : 'Could not get your location. Please try again.')
      },
      { enableHighAccuracy: true, timeout: 15000, maximumAge: 300000 }
    )
  }, [])

  useEffect(() => {
    if (step === 2 && locState === 'idle') requestLocation()
  }, [step, locState, requestLocation])

  const filteredTests = TEST_PACKAGES.filter(t =>
    t.name.toLowerCase().includes(search.toLowerCase()) ||
    t.category.toLowerCase().includes(search.toLowerCase()))

  const filteredLabs = nearbyLabs.filter(l =>
    l.name.toLowerCase().includes(labSearch.toLowerCase()) ||
    l.address.toLowerCase().includes(labSearch.toLowerCase()))

  const selectedLab = nearbyLabs.find(l => l.id === form.labId)

  const tomorrowStr = () => { const d=new Date(); d.setDate(d.getDate()+1); return d.toISOString().split('T')[0] }
  const maxDateStr  = () => { const d=new Date(); d.setDate(d.getDate()+30); return d.toISOString().split('T')[0] }

  const handleSubmit = async () => {
    if (!selectedTest) return
    setSubmitting(true)
    await new Promise(r => setTimeout(r, 900))

    const txnRef = `MEDAI-${selectedTest.id.toUpperCase()}-${Date.now().toString().slice(-6)}`
    const newOrder = {
      id: `ORD-${Date.now()}`,
      testName: selectedTest.name,
      labName: selectedLab?.name || 'Lab TBD',
      labAddress: selectedLab?.address || '',
      labPhone: selectedLab?.phone || '',
      amount: selectedTest.price,
      status: 'pending_payment' as const,
      paymentStatus: 'pending' as const,
      orderedAt: new Date().toISOString(),
      collectionMode: form.mode,
      txnRef,
      userId: user?.id,
      patientName: form.name,
      patientPhone: form.phone,
    }
    saveOrders([newOrder, ...getOrders()])

    // ── Auto-notify admin on WhatsApp ──
    const mapsLink = selectedLab ? `https://maps.google.com/?q=${selectedLab.lat},${selectedLab.lon}` : ''
    const msg = encodeURIComponent(
      `🔔 *New Lab Test Order — MedAI*\n\n` +
      `🧪 *Test:* ${newOrder.testName}\n` +
      `💰 *Amount:* ₹${newOrder.amount}\n` +
      `🆔 *Order ID:* ${newOrder.id}\n` +
      `🔑 *Ref:* ${txnRef}\n\n` +
      `👤 *Patient:* ${form.name||'Not provided'}\n` +
      `📱 *Patient Phone:* ${form.phone||'Not provided'}\n` +
      `📧 *Account:* ${user?.email||'N/A'}\n\n` +
      `🏥 *Selected Lab:* ${selectedLab?.name||'Not selected'}\n` +
      `📍 *Lab Address:* ${selectedLab?.address||'N/A'}\n` +
      (mapsLink ? `🗺️ *Map:* ${mapsLink}\n` : '') +
      (selectedLab?.phone ? `📞 *Lab Phone:* ${selectedLab.phone}\n` : '') +
      `📏 *Distance:* ${selectedLab?.distance||'N/A'}\n` +
      `🚗 *Collection:* ${form.mode==='home'?'Home Collection':'Walk-in'}\n` +
      `📅 *Date:* ${form.date||'Not set'}\n` +
      `⏰ *Time:* ${form.timeSlot||'Not set'}\n\n` +
      `💳 *Payment:* Pending\n` +
      `🕐 *Placed At:* ${new Date().toLocaleString('en-IN')}\n\n` +
      `Please confirm the order, contact the lab and arrange ${form.mode==='home'?'home collection':'the walk-in visit'} for the patient. 🙏`
    )
    window.open(`https://wa.me/${ADMIN_WA}?text=${msg}`, '_blank')

    setSubmitting(false)
    setSubmitted(true)
    toast.success('Booking confirmed! Admin notified on WhatsApp. 🎉')
  }

  // ── Success screen ──
  if (submitted) {
    return (
      <div className="min-h-screen flex items-center justify-center px-4 py-8">
        <motion.div
          initial={{ scale: 0.85, opacity: 0, y: 20 }}
          animate={{ scale: 1, opacity: 1, y: 0 }}
          transition={{ type: 'spring', stiffness: 220, damping: 20 }}
          className="max-w-sm w-full bg-white rounded-3xl border border-slate-100 shadow-2xl overflow-hidden"
        >
          {/* Header gradient */}
          <div className="bg-gradient-to-br from-emerald-500 to-teal-600 p-8 text-center relative overflow-hidden">
            <div className="absolute -top-10 -right-10 w-32 h-32 bg-white/10 rounded-full pointer-events-none" />
            <div className="absolute -bottom-8 -left-8 w-24 h-24 bg-white/5 rounded-full pointer-events-none" />
            <motion.div
              initial={{ scale: 0, rotate: -20 }}
              animate={{ scale: 1, rotate: 0 }}
              transition={{ type: 'spring', stiffness: 300, damping: 18, delay: 0.2 }}
              className="w-20 h-20 bg-white/20 backdrop-blur-sm rounded-full flex items-center justify-center mx-auto mb-4 border-4 border-white/30"
            >
              <Check className="w-10 h-10 text-white" />
            </motion.div>
            <motion.h2
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              className="text-2xl font-extrabold text-white mb-1"
            >
              Booking Confirmed! 🎉
            </motion.h2>
            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.4 }}
              className="text-sm text-emerald-100"
            >
              Admin has been notified on WhatsApp
            </motion.p>
          </div>

          <div className="p-5 space-y-4">
            {/* Order details */}
            <motion.div
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.35 }}
              className="bg-slate-50 rounded-2xl p-4 space-y-2.5"
            >
              {[
                { label: 'Test',        value: selectedTest?.name },
                { label: 'Lab',         value: selectedLab?.name || 'TBD' },
                { label: 'Date & Time', value: form.date ? `${form.date} · ${form.timeSlot}` : 'TBD' },
                { label: 'Collection',  value: form.mode === 'home' ? '🏠 Home Collection' : '🏥 Walk-in' },
                { label: 'Amount',      value: `₹${selectedTest?.price}` },
              ].map(({ label, value }) => (
                <div key={label} className="flex items-start justify-between gap-3">
                  <span className="text-xs text-slate-400 font-medium">{label}</span>
                  <span className="text-xs font-bold text-slate-800 text-right">{value}</span>
                </div>
              ))}
            </motion.div>

            {/* Next steps */}
            <motion.div
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.45 }}
              className="bg-emerald-50 border border-emerald-100 rounded-2xl p-4 space-y-2"
            >
              <p className="text-xs font-bold text-emerald-800 mb-2">What happens next?</p>
              {[
                '✅ Admin notified via WhatsApp with full order details',
                '📞 Admin will confirm your appointment with the lab',
                `🚗 Lab arranges ${form.mode === 'home' ? 'home sample collection' : 'your walk-in visit'}`,
                '📊 Report appears in My Orders when ready',
              ].map((step, i) => (
                <motion.p key={i}
                  initial={{ opacity: 0, x: -8 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.5 + i * 0.07 }}
                  className="text-xs text-emerald-700"
                >
                  {step}
                </motion.p>
              ))}
            </motion.div>

            {/* Action buttons */}
            <motion.div
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.6 }}
              className="flex flex-col gap-2.5"
            >
              <motion.button
                whileTap={{ scale: 0.97 }}
                onClick={() => navigate('/orders')}
                className="w-full py-3.5 rounded-2xl bg-gradient-to-r from-emerald-600 to-teal-600 text-white text-sm font-extrabold flex items-center justify-center gap-2 shadow-lg shadow-emerald-500/25"
              >
                <PackageSearch className="w-4 h-4" /> Track My Order
              </motion.button>
              <button
                onClick={() => {
                  setStep(1); setSubmitted(false); setSelectedTest(null)
                  setForm({ name: user?.name || '', phone: '', date: '', timeSlot: '', mode: 'walk-in', labId: '' })
                }}
                className="w-full py-2.5 text-sm text-slate-400 hover:text-slate-600 transition-colors font-medium"
              >
                Book Another Test →
              </button>
            </motion.div>
          </div>
        </motion.div>
      </div>
    )
  }

  return (
    <div className="px-4 py-5 max-w-lg mx-auto">

      {/* ── Page header ─────────────────────────────────────────── */}
      <motion.div initial={{ opacity:0, y:12 }} animate={{ opacity:1, y:0 }} className="mb-5">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-10 h-10 bg-gradient-to-br from-teal-500 to-cyan-600 rounded-2xl flex items-center justify-center shadow-lg shadow-teal-500/25 flex-shrink-0">
            <FlaskConical className="w-5 h-5 text-white"/>
          </div>
          <div>
            <h1 className="text-lg font-extrabold text-slate-900">Book Lab Test</h1>
            <p className="text-xs text-slate-400 flex items-center gap-1">
              {cityName
                ? <><MapPin className="w-3 h-3 text-teal-500"/> Labs near <span className="text-teal-600 font-semibold">{cityName}</span></>
                : 'GPS-powered nearby lab discovery'}
            </p>
          </div>
        </div>

        {/* Stepper */}
        <div className="flex items-center">
          {['Choose Test','Select Lab','Confirm'].map((s,i) => (
            <div key={s} className="flex items-center flex-1">
              <div className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[11px] font-bold transition-all whitespace-nowrap ${
                step>i+1 ? 'bg-emerald-100 text-emerald-700' :
                step===i+1 ? 'bg-teal-600 text-white shadow-md shadow-teal-500/30' :
                'bg-slate-100 text-slate-400'}`}>
                {step>i+1 ? <Check className="w-3 h-3"/> : <span className="w-3 h-3 flex items-center justify-center text-[10px]">{i+1}</span>}
                <span className="hidden xs:inline">{s}</span>
              </div>
              {i<2 && <div className={`flex-1 h-0.5 mx-1 rounded-full transition-all ${step>i+1?'bg-emerald-300':'bg-slate-200'}`}/>}
            </div>
          ))}
        </div>
      </motion.div>

      <AnimatePresence mode="wait">

        {/* ══ STEP 1 — Choose test ══════════════════════════ */}
        {step===1&&(
          <motion.div key="s1" initial={{opacity:0,x:30}} animate={{opacity:1,x:0}} exit={{opacity:0,x:-30}} transition={{duration:0.22}}>
            <div className="relative mb-4">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400"/>
              <input value={search} onChange={e=>setSearch(e.target.value)} placeholder="Search tests…"
                className="w-full pl-10 pr-4 py-3 rounded-2xl border border-slate-200 bg-white text-sm focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-400 shadow-sm"/>
            </div>

            {/* Popular tests horizontal scroll on mobile */}
            <div className="flex gap-2 overflow-x-auto no-scrollbar -mx-4 px-4 pb-1 mb-4">
              {['Popular', 'Hematology', 'Cardiology', 'Nutrition', 'Preventive'].map(cat => (
                <button key={cat}
                  onClick={() => setSearch(cat === 'Popular' ? '' : cat)}
                  className="flex-shrink-0 px-3 py-1.5 text-xs font-bold rounded-full bg-teal-50 text-teal-700 border border-teal-100 whitespace-nowrap">
                  {cat}
                </button>
              ))}
            </div>

            <div className="space-y-3">
              {filteredTests.map((test,i)=>(
                <motion.button key={test.id} initial={{opacity:0,y:16}} animate={{opacity:1,y:0}} transition={{delay:i*0.03}}
                  whileTap={{scale:0.98}}
                  onClick={()=>{setSelectedTest(test);setStep(2)}}
                  className="w-full text-left bg-white rounded-2xl border border-slate-100 p-4 shadow-sm active:shadow-md transition-all group relative overflow-hidden">
                  {test.popular && <span className="absolute top-3 right-3 text-[9px] font-bold bg-amber-100 text-amber-600 px-2 py-0.5 rounded-full">Popular</span>}
                  <div className="flex items-start gap-3">
                    <div className={`w-11 h-11 ${test.bg} rounded-2xl flex items-center justify-center flex-shrink-0`}>
                      <test.icon className={`w-5 h-5 ${test.color}`}/>
                    </div>
                    <div className="flex-1 min-w-0 pr-14">
                      <h3 className="text-sm font-bold text-slate-900 leading-snug">{test.name}</h3>
                      <p className="text-[10px] text-slate-400 font-semibold uppercase tracking-wider mt-0.5">{test.category}</p>
                      <p className="text-xs text-slate-500 mt-1 leading-relaxed line-clamp-2">{test.description}</p>
                    </div>
                  </div>
                  <div className="flex items-center justify-between mt-3 pt-3 border-t border-slate-50">
                    <div className="flex items-center gap-2">
                      <span className="text-base font-extrabold text-teal-600">₹{test.price}</span>
                      <span className="text-xs text-slate-400 line-through">₹{test.originalPrice}</span>
                      <span className="text-[10px] font-bold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full">
                        {Math.round((1-test.price/test.originalPrice)*100)}% OFF
                      </span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <span className="text-[10px] text-slate-400">{test.turnaround}</span>
                      <span className="text-teal-600 text-[11px] font-bold opacity-0 group-hover:opacity-100 transition-opacity flex items-center gap-0.5">
                        Book <ArrowRight className="w-3 h-3"/>
                      </span>
                    </div>
                  </div>
                  {/* includes preview */}
                  <div className="flex gap-1.5 mt-2 flex-wrap">
                    {test.includes.slice(0,3).map(inc => (
                      <span key={inc} className="text-[9px] font-semibold bg-slate-50 text-slate-500 px-2 py-0.5 rounded-full border border-slate-100">{inc}</span>
                    ))}
                    {test.includes.length > 3 && (
                      <span className="text-[9px] font-semibold text-slate-400">+{test.includes.length-3} more</span>
                    )}
                  </div>
                </motion.button>
              ))}
            </div>
          </motion.div>
        )}

        {/* ══ STEP 2 — Select lab + details ════════════════ */}
        {step===2&&selectedTest&&(
          <motion.div key="s2" initial={{opacity:0,x:30}} animate={{opacity:1,x:0}} exit={{opacity:0,x:-30}} transition={{duration:0.22}}>
            <button onClick={()=>setStep(1)} className="flex items-center gap-1.5 text-xs text-slate-400 hover:text-slate-700 mb-4 transition-colors font-semibold">
              <ChevronLeft className="w-3.5 h-3.5"/> Back to tests
            </button>

            {/* Selected test summary */}
            <div className="bg-gradient-to-r from-teal-50 to-cyan-50 border border-teal-100 rounded-2xl p-4 flex items-center gap-3 mb-5">
              <div className={`w-10 h-10 ${selectedTest.bg} rounded-2xl flex items-center justify-center shrink-0`}>
                <selectedTest.icon className={`w-5 h-5 ${selectedTest.color}`}/>
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-bold text-slate-900 truncate">{selectedTest.name}</p>
                <p className="text-xs text-slate-500">{selectedTest.includes.length} parameters · {selectedTest.turnaround}</p>
              </div>
              <p className="text-lg font-extrabold text-teal-600 flex-shrink-0">₹{selectedTest.price}</p>
            </div>

            {/* Stack everything in a single column on mobile */}
            <div className="space-y-5">

              {/* ── Nearby Labs ── */}
              <div>
                <div className="flex items-center justify-between mb-3">
                  <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                    <Navigation className="w-4 h-4 text-teal-500"/> Nearby Labs
                    {cityName && <span className="text-[11px] font-normal text-slate-400">· {cityName}</span>}
                  </h3>
                  {(locState==='ok'||locState==='error') && (
                    <button onClick={requestLocation} className="flex items-center gap-1 text-xs text-teal-600 font-bold">
                      <RefreshCw className="w-3 h-3"/> Refresh
                    </button>
                  )}
                </div>

                {(locState==='idle'||locState==='requesting') && (
                  <div className="rounded-2xl border border-teal-100 bg-teal-50 p-6 flex flex-col items-center gap-3 text-center">
                    {locState==='requesting' ? (
                      <>
                        <Loader2 className="w-7 h-7 text-teal-500 animate-spin"/>
                        <p className="text-sm font-bold text-teal-700">Detecting your location…</p>
                        <p className="text-xs text-teal-600/70">Allow location access when prompted.</p>
                      </>
                    ) : (
                      <>
                        <div className="w-12 h-12 rounded-2xl bg-teal-100 flex items-center justify-center">
                          <Navigation className="w-6 h-6 text-teal-500"/>
                        </div>
                        <p className="text-sm font-bold text-slate-700">Find labs near you</p>
                        <button onClick={requestLocation} className="px-5 py-2.5 bg-teal-600 text-white text-xs font-bold rounded-xl shadow-md flex items-center gap-2">
                          <Navigation className="w-3.5 h-3.5"/> Use My Location
                        </button>
                      </>
                    )}
                  </div>
                )}

                {locState==='error' && (
                  <div className="rounded-2xl border border-red-100 bg-red-50 p-4 text-center space-y-3">
                    <AlertCircle className="w-6 h-6 text-red-400 mx-auto"/>
                    <p className="text-xs font-semibold text-red-700">{locError}</p>
                    <button onClick={requestLocation} className="px-4 py-2 bg-red-600 text-white text-xs font-bold rounded-xl inline-flex items-center gap-1.5">
                      <RefreshCw className="w-3.5 h-3.5"/> Try Again
                    </button>
                  </div>
                )}

                {locState==='ok' && labsLoading && (
                  <div className="space-y-2">
                    {[0, 1, 2].map(i => (
                      <div key={i} className="rounded-2xl border border-slate-100 bg-white p-3.5 space-y-2">
                        <div className="skeleton h-4 w-3/4 rounded-lg" />
                        <div className="skeleton h-3 w-1/2 rounded-lg" />
                        <div className="flex gap-2">
                          <div className="skeleton h-3 w-16 rounded-full" />
                          <div className="skeleton h-3 w-12 rounded-full" />
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                {locState==='ok' && !labsLoading && (
                  <>
                    {nearbyLabs.length > 3 && (
                      <div className="relative mb-3">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400"/>
                        <input value={labSearch} onChange={e=>setLabSearch(e.target.value)} placeholder="Filter labs…"
                          className="w-full pl-9 pr-3 py-2.5 rounded-xl border border-slate-200 text-xs bg-white focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-400"/>
                      </div>
                    )}
                    {labError ? (
                      <div className="text-center p-4 text-xs text-slate-500 bg-slate-50 rounded-2xl border border-slate-100">{labError}</div>
                    ) : (
                      <div className="space-y-2 max-h-64 overflow-y-auto pr-1">
                        {filteredLabs.map(lab => (
                          <motion.button key={lab.id} initial={{opacity:0,y:6}} animate={{opacity:1,y:0}} whileTap={{scale:0.98}}
                            onClick={()=>setForm(f=>({...f,labId:lab.id}))}
                            className={`w-full text-left p-3.5 rounded-2xl border transition-all ${form.labId===lab.id?'border-teal-400 bg-teal-50 shadow-md shadow-teal-100':'border-slate-100 bg-white'}`}>
                            <div className="flex items-start justify-between gap-2 mb-1">
                              <p className="text-sm font-bold text-slate-900 line-clamp-1">{lab.name}</p>
                              {form.labId===lab.id && <Check className="w-4 h-4 text-teal-500 shrink-0"/>}
                            </div>
                            {lab.address && (
                              <p className="text-[11px] text-slate-400 flex items-start gap-1 mb-1.5 line-clamp-1">
                                <MapPin className="w-3 h-3 mt-0.5 shrink-0"/>{lab.address}
                              </p>
                            )}
                            <div className="flex items-center gap-3 text-xs flex-wrap">
                              <span className="text-teal-600 font-bold flex items-center gap-1">
                                <Navigation className="w-3 h-3"/>{lab.distance}
                              </span>
                              {lab.phone && <span className="text-slate-400 flex items-center gap-1"><Phone className="w-3 h-3"/>{lab.phone}</span>}
                              <a href={`https://maps.google.com/?q=${lab.lat},${lab.lon}`} target="_blank" rel="noreferrer"
                                onClick={e=>e.stopPropagation()} className="text-blue-500 text-[10px] ml-auto">
                                Map ↗
                              </a>
                            </div>
                          </motion.button>
                        ))}
                      </div>
                    )}
                  </>
                )}
              </div>

              {/* ── Collection Mode ── */}
              <div>
                <h3 className="text-sm font-bold text-slate-900 mb-2.5">Collection Mode</h3>
                <div className="flex gap-2.5">
                  {(['walk-in','home'] as const).map(m=>(
                    <button key={m} onClick={()=>setForm(f=>({...f,mode:m}))}
                      className={`flex-1 py-3 rounded-2xl text-sm font-bold border transition-all ${form.mode===m?'border-teal-400 bg-teal-50 text-teal-700 shadow-md':'border-slate-200 text-slate-500'}`}>
                      {m==='walk-in'?'🏥 Walk-in':'🏠 Home'}
                    </button>
                  ))}
                </div>
                <p className="text-[10px] text-slate-400 mt-1.5">Admin will confirm the arrangement with the lab.</p>
              </div>

              {/* ── Date ── */}
              <div>
                <label className="block text-sm font-bold text-slate-900 mb-2">
                  <Calendar className="inline w-4 h-4 text-teal-500 mr-1.5 mb-0.5"/>Date
                </label>
                <input type="date" min={tomorrowStr()} max={maxDateStr()} value={form.date}
                  onChange={e=>setForm(f=>({...f,date:e.target.value,timeSlot:''}))}
                  className="w-full px-4 py-3 rounded-2xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-400 bg-white"/>
              </div>

              {/* ── Time slot ── */}
              {form.date && (
                <motion.div initial={{opacity:0,y:8}} animate={{opacity:1,y:0}}>
                  <label className="block text-sm font-bold text-slate-900 mb-2">
                    <Clock className="inline w-4 h-4 text-teal-500 mr-1.5 mb-0.5"/>Time Slot
                  </label>
                  <div className="grid grid-cols-3 gap-2">
                    {TIME_SLOTS.map(slot=>(
                      <button key={slot} onClick={()=>setForm(f=>({...f,timeSlot:slot}))}
                        className={`py-2.5 rounded-xl text-xs font-bold transition-all ${form.timeSlot===slot?'bg-teal-600 text-white shadow-md':'bg-slate-50 text-slate-600 border border-slate-100'}`}>
                        {slot}
                      </button>
                    ))}
                  </div>
                </motion.div>
              )}

              {/* ── Patient details ── */}
              <div className="space-y-3">
                <h3 className="text-sm font-bold text-slate-900">Patient Details</h3>
                <div className="relative">
                  <User className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400"/>
                  <input type="text" placeholder="Full name" value={form.name}
                    onChange={e=>setForm(f=>({...f,name:e.target.value}))}
                    className="w-full pl-10 pr-4 py-3 rounded-2xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-400 bg-white"/>
                </div>
                <div className="relative">
                  <Phone className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400"/>
                  <input type="tel" placeholder="WhatsApp / phone number" value={form.phone}
                    onChange={e=>setForm(f=>({...f,phone:e.target.value.replace(/\D/g,'').slice(0,10)}))} maxLength={10}
                    className="w-full pl-10 pr-4 py-3 rounded-2xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-400 bg-white"/>
                </div>
              </div>

              <motion.button whileTap={{scale:0.97}}
                onClick={()=>setStep(3)}
                disabled={!form.labId||!form.date||!form.timeSlot||!form.name||!form.phone}
                className="w-full py-4 rounded-2xl bg-gradient-to-r from-teal-600 to-cyan-600 text-white text-sm font-extrabold flex items-center justify-center gap-2 shadow-xl shadow-teal-500/25 disabled:opacity-40 disabled:cursor-not-allowed">
                Continue to Review <ArrowRight className="w-4 h-4"/>
              </motion.button>
              {(!form.labId||!form.date||!form.timeSlot||!form.name||!form.phone) && (
                <p className="text-[11px] text-slate-400 text-center -mt-2">Fill all fields to continue.</p>
              )}
            </div>
          </motion.div>
        )}

        {/* ══ STEP 3 — Confirm ═════════════════════════════ */}
        {step===3&&selectedTest&&(
          <motion.div key="s3" initial={{opacity:0,x:30}} animate={{opacity:1,x:0}} exit={{opacity:0,x:-30}} transition={{duration:0.22}}>
            <button onClick={()=>setStep(2)} className="flex items-center gap-1.5 text-xs text-slate-400 hover:text-slate-700 mb-4 transition-colors font-semibold">
              <ChevronLeft className="w-3.5 h-3.5"/> Back
            </button>
            <div className="bg-white rounded-3xl border border-slate-100 shadow-xl overflow-hidden">
              {/* Header */}
              <div className="bg-gradient-to-r from-teal-600 to-cyan-600 p-5 text-white">
                <p className="text-[10px] font-bold uppercase tracking-wider text-teal-200 mb-1">Order Summary</p>
                <h2 className="text-base font-extrabold">{selectedTest.name}</h2>
                <p className="text-xs text-teal-100 mt-0.5">{selectedTest.includes.length} parameters · {selectedTest.turnaround}</p>
              </div>
              {/* Detail rows */}
              <div className="p-5 space-y-3">
                {[
                  { icon:Building2,  label:'Lab',      value:selectedLab?.name||'—' },
                  { icon:MapPin,     label:'Address',  value:selectedLab?.address||'—' },
                  { icon:Calendar,   label:'Date',     value:form.date },
                  { icon:Clock,      label:'Time',     value:form.timeSlot },
                  { icon:Navigation, label:'Mode',     value:form.mode==='home'?'🏠 Home Collection':'🏥 Walk-in' },
                  { icon:User,       label:'Patient',  value:form.name },
                  { icon:Phone,      label:'Phone',    value:form.phone },
                ].map(row=>(
                  <div key={row.label} className="flex items-start gap-3 py-1.5 border-b border-slate-50 last:border-0">
                    <row.icon className="w-4 h-4 text-slate-400 mt-0.5 shrink-0"/>
                    <span className="text-xs text-slate-500 w-16 shrink-0">{row.label}</span>
                    <span className="text-xs font-bold text-slate-900">{row.value}</span>
                  </div>
                ))}
              </div>
              {/* Price */}
              <div className="mx-5 mb-4 bg-teal-50 rounded-2xl p-4 flex items-center justify-between">
                <div>
                  <p className="text-sm font-bold text-slate-700">Total Payable</p>
                  <p className="text-[10px] text-slate-400 mt-0.5">Pay at lab or to admin</p>
                </div>
                <div className="text-right">
                  <p className="text-2xl font-extrabold text-teal-600">₹{selectedTest.price}</p>
                  <p className="text-[10px] text-slate-400 line-through">₹{selectedTest.originalPrice}</p>
                </div>
              </div>
              {/* WhatsApp note */}
              <div className="mx-5 mb-4 flex items-start gap-2.5 bg-green-50 border border-green-100 rounded-2xl p-3.5">
                <span className="text-base leading-none">💬</span>
                <p className="text-xs text-green-800 leading-relaxed">
                  Our admin will be <strong>auto-notified on WhatsApp</strong> with your complete order details. They'll coordinate everything for you.
                </p>
              </div>
              {/* CTA */}
              <div className="p-5 pt-0">
                <motion.button whileTap={{scale:0.97}}
                  onClick={handleSubmit} disabled={submitting}
                  className="w-full py-4 rounded-2xl bg-gradient-to-r from-teal-600 to-cyan-600 text-white text-sm font-extrabold flex items-center justify-center gap-2 shadow-xl shadow-teal-500/25">
                  {submitting?<Loader2 className="w-4 h-4 animate-spin"/>:<><Check className="w-4 h-4"/>Confirm & Notify Admin</>}
                </motion.button>
                <p className="text-[10px] text-slate-400 text-center mt-3">
                  By confirming, you agree to our <span className="underline cursor-pointer">Terms of Service</span>
                </p>
              </div>
            </div>
          </motion.div>
        )}

      </AnimatePresence>
    </div>
  )
}
