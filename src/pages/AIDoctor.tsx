import { useState, useRef, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Sparkles,
  AlertCircle,
  Stethoscope,
  FlaskConical,
  Shield,
  Loader2,
  WifiOff,
  Building2,
  Pill,
  MapPin,
  Calendar,
  ExternalLink,
  MapPinned,
  Brain,
  Zap,
  MessageSquare,
  FileText,
  Activity,
  Crown,
  Verified,
  TrendingUp,
  Heart,
  Star,
  Globe,
  Lock,
  Languages,
  ChevronDown,
} from 'lucide-react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import ChatMessage from '../components/ChatMessage'
import ChatInput from '../components/ChatInput'
import { sendChatMessage, uploadReportInChat, checkBackendHealth, type ChatResponse } from '../lib/api'

// Language support
const LANGUAGES = [
  { code: 'en', label: 'English', flag: '🇺🇸' },
  { code: 'te', label: 'Telugu', flag: '🇮🇳' },
  { code: 'hi', label: 'Hindi', flag: '🇮🇳' },
  { code: 'ur', label: 'Urdu', flag: '🇵🇰' },
  { code: 'ta', label: 'Tamil', flag: '🇮🇳' },
  { code: 'kn', label: 'Kannada', flag: '🇮🇳' },
  { code: 'ml', label: 'Malayalam', flag: '🇮🇳' },
  { code: 'bn', label: 'Bengali', flag: '🇮🇳' },
  { code: 'mr', label: 'Marathi', flag: '🇮🇳' },
  { code: 'ar', label: 'Arabic', flag: '🇸🇦' },
  { code: 'fr', label: 'French', flag: '🇫🇷' },
  { code: 'es', label: 'Spanish', flag: '🇪🇸' },
  { code: 'de', label: 'German', flag: '🇩🇪' },
  { code: 'zh', label: 'Chinese', flag: '🇨🇳' },
] as const

type LangCode = typeof LANGUAGES[number]['code']

const LANGUAGE_SYSTEM_PROMPT: Record<LangCode, string> = {
  en: '',
  te: 'Please respond entirely in Telugu (తెలుగు) script. Use simple, clear Telugu that a patient can understand.',
  hi: 'Please respond entirely in Hindi (हिंदी). Use simple, clear Hindi that a patient can understand.',
  ur: 'Please respond entirely in Urdu (اردو). Use simple, clear Urdu that a patient can understand.',
  ta: 'Please respond entirely in Tamil (தமிழ்). Use simple, clear Tamil that a patient can understand.',
  kn: 'Please respond entirely in Kannada (ಕನ್ನಡ). Use simple, clear Kannada that a patient can understand.',
  ml: 'Please respond entirely in Malayalam (മലയാളം). Use simple, clear Malayalam that a patient can understand.',
  bn: 'Please respond entirely in Bengali (বাংলা). Use simple, clear Bengali that a patient can understand.',
  mr: 'Please respond entirely in Marathi (मराठी). Use simple, clear Marathi that a patient can understand.',
  ar: 'Please respond entirely in Arabic (العربية). Use simple, clear Arabic that a patient can understand.',
  fr: 'Répondez entièrement en français. Utilisez un langage simple et clair.',
  es: 'Responde completamente en español. Usa un lenguaje simple y claro.',
  de: 'Bitte antworten Sie vollständig auf Deutsch. Verwenden Sie eine einfache, klare Sprache.',
  zh: '请完全用中文（简体）回答。使用患者能理解的简洁语言。',
}

function LanguageSelector({
  value,
  onChange,
}: {
  value: LangCode
  onChange: (lang: LangCode) => void
}) {
  const [open, setOpen] = useState(false)
  const current = LANGUAGES.find(l => l.code === value)!

  return (
    <div className="relative">
      <motion.button
        whileHover={{ scale: 1.02 }}
        whileTap={{ scale: 0.97 }}
        onClick={() => setOpen(o => !o)}
        className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white/80 border border-slate-200/60 text-xs font-semibold text-slate-700 hover:bg-white transition-all shadow-sm backdrop-blur-sm"
      >
        <Languages className="w-3.5 h-3.5 text-blue-500" />
        <span>{current.flag}</span>
        <span>{current.label}</span>
        <ChevronDown className={`w-3 h-3 text-slate-400 transition-transform ${open ? 'rotate-180' : ''}`} />
      </motion.button>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: -8, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -8, scale: 0.95 }}
            transition={{ duration: 0.15 }}
            className="absolute right-0 top-full mt-2 w-44 bg-white rounded-2xl border border-slate-200/60 shadow-xl shadow-slate-200/60 z-50 overflow-hidden"
            onMouseLeave={() => setOpen(false)}
          >
            <div className="p-1.5 max-h-72 overflow-y-auto">
              {LANGUAGES.map(lang => (
                <button
                  key={lang.code}
                  onClick={() => { onChange(lang.code); setOpen(false) }}
                  className={`w-full flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-xs font-medium transition-all ${
                    value === lang.code
                      ? 'bg-blue-50 text-blue-700 font-bold'
                      : 'text-slate-700 hover:bg-slate-50'
                  }`}
                >
                  <span className="text-base">{lang.flag}</span>
                  <span>{lang.label}</span>
                  {value === lang.code && (
                    <span className="ml-auto text-[10px] bg-blue-100 text-blue-600 px-1.5 py-0.5 rounded-full font-bold">Active</span>
                  )}
                </button>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
interface Message {
  role: 'user' | 'ai'
  content: string
  timestamp: string
  analysis?: {
    conditions: string[]
    specialists: string[]
    riskLevel: string
    tests: string[]
    hospitals?: { name: string; mapLink: string }[]
    medicines?: { name: string; buyLink: string; dosage: string }[]
  }
  sources?: string[]
}

const initialMessages: Message[] = [
  {
    role: 'ai',
    content:
      "Hello! I'm MedAI, your AI health assistant powered by GPT-4o, LangChain, and RAG. Describe your symptoms, upload a report, or ask any health question. I'll analyze your condition, recommend hospitals nearby, suggest medicines with buy links, and help you book doctor appointments.",
    timestamp: 'Just now',
  },
]

export default function AIDoctor({ userLocation = '' }: { userLocation?: string }) {
  const [messages, setMessages] = useState<Message[]>(initialMessages)
  const [isLoading, setIsLoading] = useState(false)
  const [isUploading, setIsUploading] = useState(false)
  const [backendOnline, setBackendOnline] = useState<boolean | null>(null)
  const [selectedModel, setSelectedModel] = useState('gpt-4o')
  const [selectedLanguage, setSelectedLanguage] = useState<LangCode>('en')
  const bottomRef = useRef<HTMLDivElement>(null)
  const navigate = useNavigate()
  const [searchParams, setSearchParams] = useSearchParams()
  const hasSentQueryRef = useRef(false)

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  useEffect(() => {
    checkBackendHealth().then(setBackendOnline)
  }, [])

  useEffect(() => {
    const q = searchParams.get('q')
    if (q && !hasSentQueryRef.current && backendOnline !== null) {
      hasSentQueryRef.current = true
      setSearchParams({}, { replace: true })
      handleSend(q)
    }
  }, [searchParams, backendOnline])

  const handleFileUpload = async (file: File) => {
    const uploadMsg: Message = {
      role: 'user',
      content: `Uploading report: ${file.name}`,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    }
    setMessages((prev) => [...prev, uploadMsg])
    setIsUploading(true)

    try {
      const result = await uploadReportInChat(file)
      const analysisText = result.analysis
        ? `\n\n**Report Analysis:**\n${result.analysis.summary || JSON.stringify(result.analysis, null, 2)}`
        : ''
      const aiMsg: Message = {
        role: 'ai',
        content: `${result.message} (${result.chunks_indexed} chunks indexed)${analysisText}\n\nYou can now ask me questions about this report, and I'll use it for context.`,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        analysis: result.analysis?.metrics
          ? {
              conditions: result.analysis.recommendations || [],
              specialists: [],
              riskLevel: result.analysis.riskLevel || 'Unknown',
              tests: [],
            }
          : undefined,
      }
      setMessages((prev) => [...prev, aiMsg])
    } catch (err: any) {
      const errorMsg: Message = {
        role: 'ai',
        content: `Upload failed: ${err.message || 'Could not process the file. Make sure the backend is running.'}`,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      }
      setMessages((prev) => [...prev, errorMsg])
    } finally {
      setIsUploading(false)
    }
  }

  const handleSend = async (text: string) => {
    const userMsg: Message = {
      role: 'user',
      content: text,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    }
    setMessages((prev) => [...prev, userMsg])
    setIsLoading(true)

    try {
      const history = messages
        .filter((m) => m.role === 'user' || m.role === 'ai')
        .map((m) => ({ role: m.role === 'ai' ? 'assistant' : 'user', content: m.content }))

      // Prepend language instruction as a system message if not English
      const langPrompt = LANGUAGE_SYSTEM_PROMPT[selectedLanguage]
      const fullHistory = langPrompt
        ? [{ role: 'system', content: langPrompt }, ...history]
        : history

      const response: ChatResponse = await sendChatMessage(text, fullHistory, userLocation || undefined, selectedModel)

      const aiMsg: Message = {
        role: 'ai',
        content: response.reply,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        analysis: response.analysis || undefined,
        sources: response.sources,
      }
      setMessages((prev) => [...prev, aiMsg])
    } catch (err: any) {
      const msg = err.message || ''
      let friendlyError = msg
      if (msg.includes('timed out') || msg.includes('timeout')) {
        friendlyError = 'The request timed out. The OpenAI API may be unresponsive or overloaded. Please try again in a moment.'
      } else if (msg.includes('API key')) {
        friendlyError = 'OpenAI API key is not configured or invalid. Go to Settings to add your API key, or set OPENAI_API_KEY in server/.env.'
      } else if (msg.includes('Failed to fetch') || msg.includes('NetworkError') || msg.includes('fetch')) {
        friendlyError = 'Could not reach the backend server. Make sure it is running: cd server && python main.py'
      } else if (!friendlyError) {
        friendlyError = 'Failed to get a response. Make sure the backend is running and your OpenAI API key is configured.'
      }
      const errorMsg: Message = {
        role: 'ai',
        content: friendlyError,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      }
      setMessages((prev) => [...prev, errorMsg])
    } finally {
      setIsLoading(false)
    }
  }

  const userMsgCount = messages.filter((m) => m.role === 'user').length
  const aiMsgCount = messages.filter((m) => m.role === 'ai').length

  return (
    <div className="flex" style={{ height: 'calc(100dvh - 120px)', minHeight: 320 }}>
      {/* Main Chat Area */}
      <div className="flex-1 flex flex-col relative">
        {/* Ambient background mesh */}
        <div className="absolute inset-0 pointer-events-none overflow-hidden">
          <div className="absolute top-0 right-1/4 w-96 h-96 bg-blue-100/20 rounded-full blur-3xl" />
          <div className="absolute bottom-1/4 left-0 w-80 h-80 bg-emerald-100/15 rounded-full blur-3xl" />
          <div className="absolute top-1/2 right-0 w-64 h-64 bg-purple-100/10 rounded-full blur-3xl" />
        </div>

        {/* Status bars — Premium */}
        <AnimatePresence>
          {backendOnline === false && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="relative bg-gradient-to-r from-red-50 via-red-50/90 to-rose-50 border-b border-red-200/60 px-4 py-2.5 flex items-center gap-3 text-xs text-red-700 backdrop-blur-xl"
            >
              <div className="relative">
                <WifiOff className="w-4 h-4" />
                <motion.div
                  className="absolute inset-0 rounded-full"
                  animate={{ scale: [1, 1.5, 1], opacity: [0.3, 0, 0.3] }}
                  transition={{ duration: 2, repeat: Infinity }}
                  style={{ boxShadow: '0 0 8px rgba(239,68,68,0.3)' }}
                />
              </div>
              <span className="font-medium">Backend offline</span>
              <code className="bg-red-100/80 px-2 py-0.5 rounded-md font-mono text-[10px] border border-red-200/50">cd server && python main.py</code>
            </motion.div>
          )}
        </AnimatePresence>

        {userLocation && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-gradient-to-r from-blue-50/90 via-indigo-50/80 to-blue-50/70 border-b border-blue-100/50 px-4 py-2.5 flex items-center gap-2 text-xs text-blue-700 backdrop-blur-xl"
          >
            <div className="w-5 h-5 rounded-lg bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center">
              <MapPinned className="w-3 h-3 text-white" />
            </div>
            <span className="font-medium">Location active:</span>
            <span className="font-bold text-blue-800">{userLocation}</span>
            <span className="text-blue-400">—</span>
            <span className="text-blue-600">hospitals will be personalized to your area</span>
            <motion.div
              className="w-1.5 h-1.5 rounded-full bg-emerald-400 ml-auto"
              animate={{ scale: [1, 1.3, 1] }}
              transition={{ duration: 2, repeat: Infinity }}
            />
          </motion.div>
        )}

        {/* Chat messages area — Premium Scroll */}
        <div className="flex-1 overflow-y-auto p-6 space-y-4 relative">
          {/* Welcome watermark (visible only when few messages) */}
          {messages.length <= 2 && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="absolute inset-0 flex items-center justify-center pointer-events-none"
            >
              <div className="text-center opacity-[0.03]">
                <Brain className="w-32 h-32 mx-auto text-blue-500" />
                <p className="text-4xl font-black text-blue-500 mt-4">MedAI</p>
              </div>
            </motion.div>
          )}

          {messages.map((msg, i) => (
            <div key={i}>
              <ChatMessage role={msg.role} content={msg.content} timestamp={msg.timestamp} />
              {msg.analysis && (
                <motion.div
                  initial={{ opacity: 0, y: 15 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.5, ease: [0.25, 0.46, 0.45, 0.94] }}
                  className="ml-11 mt-4 space-y-4"
                >
                  {/* Analysis Header Badge */}
                  <motion.div
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    className="flex items-center gap-2"
                  >
                    <div className="flex items-center gap-1.5 bg-gradient-to-r from-blue-500/10 to-indigo-500/10 backdrop-blur-sm px-3 py-1.5 rounded-full border border-blue-200/30">
                      <motion.div animate={{ rotate: [0, 360] }} transition={{ duration: 8, repeat: Infinity, ease: 'linear' }}>
                        <Sparkles className="w-3 h-3 text-blue-500" />
                      </motion.div>
                      <span className="text-[10px] font-bold text-blue-700 uppercase tracking-wider">Medical Analysis</span>
                      <Verified className="w-3 h-3 text-blue-500" />
                    </div>
                  </motion.div>

                  {/* Medical Analysis Grid — Premium Glassmorphism */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    {msg.analysis.conditions && msg.analysis.conditions.length > 0 && (
                      <AnalysisPanel icon={AlertCircle} title="Possible Conditions" items={msg.analysis.conditions} color="amber" delay={0} />
                    )}
                    {msg.analysis.specialists && msg.analysis.specialists.length > 0 && (
                      <AnalysisPanel icon={Stethoscope} title="Recommended Specialists" items={msg.analysis.specialists} color="blue" delay={0.05} />
                    )}
                    {msg.analysis.riskLevel && (
                      <AnalysisPanel icon={Shield} title="Risk Level" items={[msg.analysis.riskLevel]} color="emerald" delay={0.1} />
                    )}
                    {msg.analysis.tests && msg.analysis.tests.length > 0 && (
                      <AnalysisPanel icon={FlaskConical} title="Suggested Tests" items={msg.analysis.tests} color="purple" delay={0.15} />
                    )}
                  </div>

                  {/* Nearby Hospitals — Extreme Premium */}
                  {msg.analysis.hospitals && msg.analysis.hospitals.length > 0 && (
                    <motion.div
                      initial={{ opacity: 0, y: 8 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.2 }}
                      className="rounded-2xl border border-blue-100/60 bg-gradient-to-br from-blue-50/80 via-white/40 to-indigo-50/50 p-5 backdrop-blur-xl relative overflow-hidden shadow-sm hover:shadow-lg hover:shadow-blue-100/40 transition-all duration-500"
                    >
                      {/* Decorative orb */}
                      <div className="absolute -top-8 -right-8 w-24 h-24 bg-blue-200/20 rounded-full blur-2xl" />
                      <div className="absolute bottom-0 left-0 w-16 h-16 bg-indigo-200/10 rounded-full blur-xl" />

                      <div className="flex items-center justify-between mb-4 relative z-10">
                        <div className="flex items-center gap-2.5">
                          <motion.div
                            whileHover={{ scale: 1.1, rotate: -5 }}
                            className="w-8 h-8 rounded-xl bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center shadow-lg shadow-blue-500/25"
                          >
                            <Building2 className="w-4 h-4 text-white" />
                          </motion.div>
                          <div>
                            <p className="text-xs font-bold text-blue-900">Recommended Hospitals</p>
                            {userLocation && <p className="text-[10px] text-blue-500 font-medium">Near {userLocation}</p>}
                          </div>
                        </div>
                        <div className="flex items-center gap-1 text-[9px] font-semibold text-blue-500 bg-blue-50 px-2 py-1 rounded-full border border-blue-100/50">
                          <Globe className="w-2.5 h-2.5" />
                          {msg.analysis.hospitals.length} found
                        </div>
                      </div>
                      <div className="space-y-2.5 relative z-10">
                        {msg.analysis.hospitals.map((h, idx) => (
                          <motion.div
                            key={idx}
                            initial={{ opacity: 0, x: -15 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ delay: idx * 0.06, type: 'spring', stiffness: 200 }}
                            whileHover={{ x: 4, scale: 1.01 }}
                            className="flex items-center justify-between bg-white/80 backdrop-blur-sm rounded-xl px-4 py-3 border border-blue-100/40 hover:border-blue-200/60 hover:shadow-md transition-all duration-300 group"
                          >
                            <div className="flex items-center gap-3">
                              <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-blue-100 to-indigo-100 flex items-center justify-center group-hover:from-blue-200 group-hover:to-indigo-200 transition-all">
                                <Building2 className="w-4 h-4 text-blue-600" />
                              </div>
                              <span className="text-xs font-bold text-slate-800 group-hover:text-blue-700 transition-colors">{h.name}</span>
                            </div>
                            <div className="flex items-center gap-1.5">
                              <a href={h.mapLink} target="_blank" rel="noreferrer" className="flex items-center gap-1 text-[10px] font-bold text-blue-600 hover:text-blue-800 bg-blue-50 hover:bg-blue-100 px-3 py-1.5 rounded-lg transition-all border border-blue-100/50">
                                <MapPin className="w-3 h-3" /> Directions
                              </a>
                              <a href={`https://www.practo.com/search?q=${encodeURIComponent(h.name)}&city=${encodeURIComponent(userLocation || '')}`} target="_blank" rel="noreferrer" className="flex items-center gap-1 text-[10px] font-bold text-white bg-gradient-to-r from-emerald-500 to-emerald-600 hover:from-emerald-600 hover:to-emerald-700 px-3 py-1.5 rounded-lg transition-all shadow-sm hover:shadow-md">
                                <Calendar className="w-3 h-3" /> Practo
                              </a>
                              <a href={`https://www.google.com/search?q=${encodeURIComponent(h.name + (userLocation ? ' ' + userLocation : '') + ' book appointment')}`} target="_blank" rel="noreferrer" className="flex items-center gap-1 text-[10px] font-bold text-white bg-gradient-to-r from-blue-500 to-indigo-600 hover:from-blue-600 hover:to-indigo-700 px-3 py-1.5 rounded-lg transition-all shadow-sm hover:shadow-md">
                                <ExternalLink className="w-3 h-3" /> Book
                              </a>
                            </div>
                          </motion.div>
                        ))}
                      </div>
                    </motion.div>
                  )}

                  {/* Recommended Medicines — Extreme Premium */}
                  {msg.analysis.medicines && msg.analysis.medicines.length > 0 && (
                    <motion.div
                      initial={{ opacity: 0, y: 8 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.3 }}
                      className="rounded-2xl border border-emerald-100/60 bg-gradient-to-br from-emerald-50/80 via-white/40 to-teal-50/50 p-5 backdrop-blur-xl relative overflow-hidden shadow-sm hover:shadow-lg hover:shadow-emerald-100/40 transition-all duration-500"
                    >
                      <div className="absolute -top-8 -right-8 w-24 h-24 bg-emerald-200/20 rounded-full blur-2xl" />

                      <div className="flex items-center justify-between mb-4 relative z-10">
                        <div className="flex items-center gap-2.5">
                          <motion.div
                            whileHover={{ scale: 1.1, rotate: 5 }}
                            className="w-8 h-8 rounded-xl bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center shadow-lg shadow-emerald-500/25"
                          >
                            <Pill className="w-4 h-4 text-white" />
                          </motion.div>
                          <div>
                            <p className="text-xs font-bold text-emerald-900">Recommended Medicines</p>
                            <p className="text-[10px] text-emerald-500 font-medium">AI-verified suggestions</p>
                          </div>
                        </div>
                        <div className="flex items-center gap-1 text-[9px] font-semibold text-emerald-500 bg-emerald-50 px-2 py-1 rounded-full border border-emerald-100/50">
                          <Shield className="w-2.5 h-2.5" />
                          {msg.analysis.medicines.length} medicines
                        </div>
                      </div>
                      <div className="space-y-2.5 relative z-10">
                        {msg.analysis.medicines.map((m, idx) => (
                          <motion.div
                            key={idx}
                            initial={{ opacity: 0, x: -15 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ delay: idx * 0.06, type: 'spring', stiffness: 200 }}
                            whileHover={{ x: 4, scale: 1.01 }}
                            className="flex items-center justify-between bg-white/80 backdrop-blur-sm rounded-xl px-4 py-3 border border-emerald-100/40 hover:border-emerald-200/60 hover:shadow-md transition-all duration-300 group"
                          >
                            <div className="flex items-center gap-3">
                              <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-emerald-100 to-teal-100 flex items-center justify-center group-hover:from-emerald-200 group-hover:to-teal-200 transition-all">
                                <Pill className="w-4 h-4 text-emerald-600" />
                              </div>
                              <div>
                                <span className="text-xs font-bold text-slate-800 group-hover:text-emerald-700 transition-colors">{m.name}</span>
                                <p className="text-[10px] text-slate-400 font-medium">{m.dosage}</p>
                              </div>
                            </div>
                            <div className="flex items-center gap-1.5">
                              <a href={m.buyLink || `https://www.1mg.com/search/all?name=${encodeURIComponent(m.name)}`} target="_blank" rel="noreferrer" className="flex items-center gap-1 text-[10px] font-bold text-emerald-600 hover:text-emerald-800 bg-emerald-50 hover:bg-emerald-100 px-3 py-1.5 rounded-lg transition-all border border-emerald-100/50">
                                <ExternalLink className="w-3 h-3" /> 1mg
                              </a>
                              <a href={`https://pharmeasy.in/search/all?name=${encodeURIComponent(m.name)}`} target="_blank" rel="noreferrer" className="flex items-center gap-1 text-[10px] font-bold text-white bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 px-3 py-1.5 rounded-lg transition-all shadow-sm hover:shadow-md">
                                <ExternalLink className="w-3 h-3" /> PharmEasy
                              </a>
                            </div>
                          </motion.div>
                        ))}
                      </div>
                      <div className="mt-4 pt-3 border-t border-emerald-100/50 relative z-10">
                        <p className="text-[10px] text-emerald-600 font-medium flex items-center gap-1.5">
                          <AlertCircle className="w-3 h-3" /> Always consult a doctor before taking any medicine. Prices may vary.
                        </p>
                      </div>
                    </motion.div>
                  )}
                </motion.div>
              )}
              {msg.sources && msg.sources.length > 0 && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="ml-11 mt-2"
                >
                  <div className="flex items-center gap-1.5 bg-blue-50/50 backdrop-blur-sm px-3 py-1.5 rounded-lg border border-blue-100/30 w-fit">
                    <FileText className="w-3 h-3 text-blue-400" />
                    <p className="text-[10px] text-blue-500 font-medium">Sources: {msg.sources.join(', ')}</p>
                  </div>
                </motion.div>
              )}
            </div>
          ))}

          {/* Loading State — Extreme Premium */}
          <AnimatePresence>
            {(isLoading || isUploading) && (
              <motion.div
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="flex items-center gap-4 ml-11 p-4 bg-gradient-to-r from-blue-50/80 via-white/60 to-indigo-50/50 backdrop-blur-xl rounded-2xl border border-blue-100/40 shadow-sm"
              >
                <div className="relative">
                  <motion.div
                    animate={{ rotate: 360 }}
                    transition={{ duration: 2, repeat: Infinity, ease: 'linear' }}
                  >
                    <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center shadow-lg shadow-blue-500/20">
                      <Brain className="w-5 h-5 text-white" />
                    </div>
                  </motion.div>
                  <motion.div
                    className="absolute -inset-1 rounded-xl border-2 border-blue-300/40"
                    animate={{ scale: [1, 1.15, 1], opacity: [0.3, 0, 0.3] }}
                    transition={{ duration: 1.5, repeat: Infinity }}
                  />
                </div>
                <div>
                  <span className="text-xs text-slate-700 font-bold">
                    {isUploading ? 'Analyzing your medical report...' : 'MedAI is thinking...'}
                  </span>
                  <div className="flex items-center gap-3 mt-1.5">
                    <div className="flex gap-1">
                      {[0, 1, 2, 3].map((i) => (
                        <motion.div
                          key={i}
                          className="w-1.5 h-1.5 rounded-full bg-blue-400"
                          animate={{ opacity: [0.2, 1, 0.2], y: [0, -3, 0] }}
                          transition={{ duration: 0.8, repeat: Infinity, delay: i * 0.15 }}
                        />
                      ))}
                    </div>
                    <span className="text-[10px] text-blue-400 font-medium">
                      {isUploading ? 'Parsing PDF → RAG indexing → AI analysis' : 'GPT-4o + LangChain + RAG'}
                    </span>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          <div ref={bottomRef} />
        </div>

        {/* Chat Input */}
        <div className="px-6 py-2 flex items-center justify-between gap-3 border-t border-slate-100/60 bg-white/50 backdrop-blur-sm">
          {/* Language selector */}
          <div className="flex items-center gap-2">
            <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider">Reply in:</span>
            <LanguageSelector value={selectedLanguage} onChange={setSelectedLanguage} />
          </div>
          {selectedLanguage !== 'en' && (
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              className="flex items-center gap-1.5 text-[10px] font-semibold text-blue-600 bg-blue-50 px-2.5 py-1 rounded-full border border-blue-100"
            >
              <Globe className="w-3 h-3" />
              AI will reply in {LANGUAGES.find(l => l.code === selectedLanguage)?.label}
            </motion.div>
          )}
        </div>
        <ChatInput
          onSend={handleSend}
          onFileUpload={handleFileUpload}
          disabled={isLoading || isUploading}
          uploading={isUploading}
          selectedModel={selectedModel}
          onModelChange={setSelectedModel}
        />
      </div>

      {/* Right Insights Panel — Ultra Premium Glassmorphism */}
      <div className="w-80 border-l border-slate-200/30 bg-gradient-to-b from-white/90 via-slate-50/80 to-white/70 backdrop-blur-2xl p-5 hidden xl:flex flex-col overflow-y-auto relative">
        {/* Ambient background */}
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute top-20 right-0 w-32 h-32 bg-blue-100/30 rounded-full blur-3xl" />
          <div className="absolute bottom-40 left-0 w-24 h-24 bg-emerald-100/20 rounded-full blur-2xl" />
          <div className="absolute top-1/2 right-4 w-20 h-20 bg-purple-100/15 rounded-full blur-2xl" />
        </div>

        {/* Panel Header */}
        <div className="flex items-center gap-3 mb-6 relative z-10">
          <motion.div
            whileHover={{ scale: 1.1, rotate: -5 }}
            className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-500 via-indigo-500 to-purple-600 flex items-center justify-center shadow-xl shadow-blue-500/25"
          >
            <Sparkles className="w-5 h-5 text-white" />
          </motion.div>
          <div>
            <h3 className="font-bold text-slate-900 text-sm flex items-center gap-1.5">
              AI Insights
              <span className="flex items-center gap-0.5 text-[8px] font-bold bg-gradient-to-r from-amber-100 to-orange-100 text-amber-700 px-1.5 py-0.5 rounded-full border border-amber-200/50">
                <Crown className="w-2 h-2" /> PRO
              </span>
            </h3>
            <p className="text-[10px] text-slate-400">Real-time analysis powered by AI</p>
          </div>
        </div>

        <div className="space-y-3 relative z-10 flex-1">
          {/* Session Stats — Premium Animated */}
          <div className="grid grid-cols-2 gap-2">
            <motion.div
              whileHover={{ y: -2, scale: 1.02 }}
              className="bg-gradient-to-br from-blue-50/90 to-indigo-50/70 backdrop-blur-sm rounded-xl p-3.5 border border-blue-100/40 shadow-sm hover:shadow-md transition-all"
            >
              <div className="flex items-center justify-between mb-2">
                <MessageSquare className="w-4 h-4 text-blue-500" />
                <motion.div
                  className="w-1.5 h-1.5 rounded-full bg-blue-400"
                  animate={{ scale: [1, 1.3, 1] }}
                  transition={{ duration: 2, repeat: Infinity }}
                />
              </div>
              <p className="text-xl font-black text-slate-900">{userMsgCount}</p>
              <p className="text-[10px] text-slate-400 font-semibold">Messages</p>
            </motion.div>
            <motion.div
              whileHover={{ y: -2, scale: 1.02 }}
              className="bg-gradient-to-br from-emerald-50/90 to-teal-50/70 backdrop-blur-sm rounded-xl p-3.5 border border-emerald-100/40 shadow-sm hover:shadow-md transition-all"
            >
              <div className="flex items-center justify-between mb-2">
                <Activity className="w-4 h-4 text-emerald-500" />
                <span className={`w-2 h-2 rounded-full ${backendOnline ? 'bg-emerald-400' : 'bg-red-400'}`} />
              </div>
              <p className="text-xl font-black text-slate-900">{backendOnline ? 'Live' : 'Off'}</p>
              <p className="text-[10px] text-slate-400 font-semibold">Backend</p>
            </motion.div>
          </div>

          {/* AI Analysis Count */}
          <motion.div
            whileHover={{ y: -1 }}
            className="bg-gradient-to-r from-purple-50/90 to-violet-50/70 backdrop-blur-sm rounded-xl p-3.5 border border-purple-100/40 flex items-center gap-3"
          >
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-purple-500 to-violet-600 flex items-center justify-center shadow-lg shadow-purple-500/20">
              <Brain className="w-5 h-5 text-white" />
            </div>
            <div>
              <p className="text-lg font-black text-slate-900">{aiMsgCount}</p>
              <p className="text-[10px] text-slate-400 font-semibold">AI Analyses</p>
            </div>
          </motion.div>

          {/* Insight Cards — Premium */}
          <InsightCard title="Powered By" description="GPT-4o + LangChain + LangGraph + RAG (FAISS)" icon={Zap} color="amber" />
          <InsightCard title="Capabilities" description="Symptom analysis, hospital finder, medicine recommendations, report analysis" icon={Star} color="blue" />
          {userLocation && (
            <InsightCard title="Your Location" description={userLocation} icon={MapPinned} color="emerald" />
          )}
        </div>

        {/* Architecture Card — Dark Premium */}
        <div className="mt-4 p-4 bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 rounded-2xl border border-slate-700/30 relative overflow-hidden">
          <div className="absolute inset-0 dot-pattern opacity-5" />
          <motion.div
            className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-blue-500 via-purple-500 to-emerald-500"
            animate={{ backgroundPosition: ['0% 50%', '100% 50%', '0% 50%'] }}
            transition={{ duration: 5, repeat: Infinity }}
            style={{ backgroundSize: '200% 200%' }}
          />
          <p className="text-[9px] font-bold text-slate-500 uppercase tracking-[0.15em] mb-3 relative z-10">Tech Stack</p>
          <div className="flex flex-wrap gap-1.5 relative z-10">
            {[
              { name: 'GPT-4o', color: 'text-blue-300 border-blue-500/20 bg-blue-500/10' },
              { name: 'LangChain', color: 'text-emerald-300 border-emerald-500/20 bg-emerald-500/10' },
              { name: 'LangGraph', color: 'text-cyan-300 border-cyan-500/20 bg-cyan-500/10' },
              { name: 'FAISS', color: 'text-amber-300 border-amber-500/20 bg-amber-500/10' },
              { name: 'FastAPI', color: 'text-purple-300 border-purple-500/20 bg-purple-500/10' },
            ].map((t) => (
              <motion.span
                key={t.name}
                whileHover={{ scale: 1.05 }}
                className={`text-[10px] font-bold ${t.color} px-2.5 py-1 rounded-lg border backdrop-blur-sm`}
              >
                {t.name}
              </motion.span>
            ))}
          </div>
        </div>

        {/* Quick Actions — Premium */}
        <div className="mt-3 p-4 bg-gradient-to-br from-emerald-50/90 to-teal-50/70 backdrop-blur-sm rounded-2xl border border-emerald-100/40 relative z-10">
          <p className="text-[9px] font-bold text-emerald-700 uppercase tracking-[0.15em] mb-3 flex items-center gap-1.5">
            <Zap className="w-3 h-3" /> Quick Actions
          </p>
          <div className="space-y-1.5">
            {[
              { label: 'Upload a lab report', path: '/reports', hoverColor: 'hover:bg-blue-50 hover:text-blue-700' },
              { label: 'Find nearby hospitals', path: '/hospitals', hoverColor: 'hover:bg-indigo-50 hover:text-indigo-700' },
              { label: 'Search medicines', path: '/medicines', hoverColor: 'hover:bg-emerald-50 hover:text-emerald-700' },
              { label: 'View dashboard', path: '/', hoverColor: 'hover:bg-purple-50 hover:text-purple-700' },
            ].map((item) => (
              <motion.button
                key={item.path}
                whileHover={{ x: 4, scale: 1.01 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => navigate(item.path)}
                className={`w-full text-left text-xs text-emerald-700 py-2 px-3 bg-white/60 ${item.hoverColor} rounded-xl transition-all font-semibold border border-transparent hover:border-white/50 hover:shadow-sm`}
              >
                {item.label}
              </motion.button>
            ))}
          </div>
        </div>

        {/* Encryption badge */}
        <div className="mt-3 flex items-center justify-center gap-1.5 text-[9px] text-slate-400 font-medium relative z-10">
          <Lock className="w-3 h-3" />
          End-to-end encrypted · HIPAA ready
        </div>
      </div>
    </div>
  )
}

/* ═══════════════════════════════════════════════════════ */
/*  ANALYSIS PANEL — Premium Glassmorphism Component      */
/* ═══════════════════════════════════════════════════════ */
function AnalysisPanel({ icon: Icon, title, items, color, delay = 0 }: { icon: any; title: string; items: string[]; color: string; delay?: number }) {
  const bgMap: Record<string, string> = {
    amber: 'from-amber-50/90 via-white/40 to-orange-50/50 border-amber-100/40',
    blue: 'from-blue-50/90 via-white/40 to-indigo-50/50 border-blue-100/40',
    emerald: 'from-emerald-50/90 via-white/40 to-teal-50/50 border-emerald-100/40',
    purple: 'from-purple-50/90 via-white/40 to-violet-50/50 border-purple-100/40',
  }
  const iconMap: Record<string, string> = {
    amber: 'from-amber-500 to-orange-600 shadow-amber-500/20',
    blue: 'from-blue-500 to-indigo-600 shadow-blue-500/20',
    emerald: 'from-emerald-500 to-teal-600 shadow-emerald-500/20',
    purple: 'from-purple-500 to-violet-600 shadow-purple-500/20',
  }
  const dotMap: Record<string, string> = {
    amber: 'bg-amber-400',
    blue: 'bg-blue-400',
    emerald: 'bg-emerald-400',
    purple: 'bg-purple-400',
  }
  const textMap: Record<string, string> = {
    amber: 'text-amber-800',
    blue: 'text-blue-800',
    emerald: 'text-emerald-800',
    purple: 'text-purple-800',
  }

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95, y: 10 }}
      animate={{ opacity: 1, scale: 1, y: 0 }}
      transition={{ delay, type: 'spring', stiffness: 200 }}
      whileHover={{ y: -2, scale: 1.01 }}
      className={`rounded-2xl border bg-gradient-to-br backdrop-blur-xl p-4 shadow-sm hover:shadow-md transition-all duration-300 ${bgMap[color] || 'from-slate-50 to-white border-slate-100'}`}
    >
      <div className="flex items-center gap-2.5 mb-3">
        <div className={`w-7 h-7 rounded-lg bg-gradient-to-br ${iconMap[color]} flex items-center justify-center shadow-lg`}>
          <Icon className="w-3.5 h-3.5 text-white" />
        </div>
        <p className={`text-xs font-bold ${textMap[color] || 'text-slate-700'}`}>{title}</p>
      </div>
      <ul className="space-y-2">
        {items.map((item, idx) => (
          <motion.li
            key={idx}
            initial={{ opacity: 0, x: -8 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: delay + idx * 0.04 }}
            className="text-xs text-slate-600 flex items-start gap-2 leading-relaxed"
          >
            <span className={`w-1.5 h-1.5 rounded-full ${dotMap[color] || 'bg-slate-400'} shrink-0 mt-1.5`} />
            <span>{item}</span>
          </motion.li>
        ))}
      </ul>
    </motion.div>
  )
}

/* ═══════════════════════════════════════════════════════ */
/*  INSIGHT CARD — Premium Glassmorphism Component        */
/* ═══════════════════════════════════════════════════════ */
function InsightCard({ title, description, icon: Icon, color = 'blue' }: { title: string; description: string; icon?: any; color?: string }) {
  const colorMap: Record<string, { bg: string; iconColor: string; border: string }> = {
    blue: { bg: 'from-blue-50/80 to-indigo-50/50', iconColor: 'text-blue-500', border: 'border-blue-100/40' },
    amber: { bg: 'from-amber-50/80 to-orange-50/50', iconColor: 'text-amber-500', border: 'border-amber-100/40' },
    emerald: { bg: 'from-emerald-50/80 to-teal-50/50', iconColor: 'text-emerald-500', border: 'border-emerald-100/40' },
    purple: { bg: 'from-purple-50/80 to-violet-50/50', iconColor: 'text-purple-500', border: 'border-purple-100/40' },
  }
  const c = colorMap[color] || colorMap.blue

  return (
    <motion.div
      whileHover={{ y: -1, scale: 1.01 }}
      className={`bg-gradient-to-br ${c.bg} backdrop-blur-sm rounded-xl p-3.5 border ${c.border} hover:shadow-md transition-all duration-300`}
    >
      <div className="flex items-center gap-2 mb-1.5">
        {Icon && <Icon className={`w-3.5 h-3.5 ${c.iconColor}`} />}
        <p className="text-xs font-bold text-slate-700">{title}</p>
      </div>
      <p className="text-[11px] text-slate-500 leading-relaxed">{description}</p>
    </motion.div>
  )
}
