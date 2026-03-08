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
} from 'lucide-react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import ChatMessage from '../components/ChatMessage'
import ChatInput from '../components/ChatInput'
import { sendChatMessage, uploadReportInChat, checkBackendHealth, type ChatResponse } from '../lib/api'

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

  // Auto-send query from Header search bar (?q=...)
  useEffect(() => {
    const q = searchParams.get('q')
    if (q && !hasSentQueryRef.current && backendOnline !== null) {
      hasSentQueryRef.current = true
      setSearchParams({}, { replace: true }) // clear the query param
      handleSend(q)
    }
  }, [searchParams, backendOnline])

  const handleFileUpload = async (file: File) => {
    const uploadMsg: Message = {
      role: 'user',
      content: `📄 Uploading report: ${file.name}`,
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
        content: `✅ ${result.message} (${result.chunks_indexed} chunks indexed)${analysisText}\n\nYou can now ask me questions about this report, and I'll use it for context.`,
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
        content: `⚠️ Upload failed: ${err.message || 'Could not process the file. Make sure the backend is running.'}`,
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

      const response: ChatResponse = await sendChatMessage(text, history, userLocation || undefined)

      const aiMsg: Message = {
        role: 'ai',
        content: response.reply,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        analysis: response.analysis || undefined,
        sources: response.sources,
      }
      setMessages((prev) => [...prev, aiMsg])
    } catch (err: any) {
      const errorMsg: Message = {
        role: 'ai',
        content: `⚠️ ${err.message || 'Failed to get response. Make sure the backend is running.'}`,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      }
      setMessages((prev) => [...prev, errorMsg])
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="flex h-full">
      <div className="flex-1 flex flex-col">
        {backendOnline === false && (
          <div className="bg-red-50 border-b border-red-200 px-4 py-2 flex items-center gap-2 text-xs text-red-700">
            <WifiOff className="w-3.5 h-3.5" />
            Backend offline — run <code className="bg-red-100 px-1 rounded">cd server && python main.py</code>
          </div>
        )}

        {/* Location indicator */}
        {userLocation && (
          <div className="bg-blue-50 border-b border-blue-200 px-4 py-1.5 flex items-center gap-2 text-xs text-blue-700">
            <MapPinned className="w-3.5 h-3.5" />
            Location detected: <span className="font-medium">{userLocation}</span> — hospitals will be recommended near you
          </div>
        )}

        <div className="flex-1 overflow-y-auto p-6 space-y-4">
          {messages.map((msg, i) => (
            <div key={i}>
              <ChatMessage role={msg.role} content={msg.content} timestamp={msg.timestamp} />
              {msg.analysis && (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="ml-11 mt-3 space-y-3"
                >
                  {/* Medical Analysis Grid */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    {msg.analysis.conditions && msg.analysis.conditions.length > 0 && (
                      <AnalysisPanel icon={AlertCircle} title="Possible Conditions" items={msg.analysis.conditions} color="amber" />
                    )}
                    {msg.analysis.specialists && msg.analysis.specialists.length > 0 && (
                      <AnalysisPanel icon={Stethoscope} title="Recommended Specialists" items={msg.analysis.specialists} color="blue" />
                    )}
                    {msg.analysis.riskLevel && (
                      <AnalysisPanel icon={Shield} title="Risk Level" items={[msg.analysis.riskLevel]} color="emerald" />
                    )}
                    {msg.analysis.tests && msg.analysis.tests.length > 0 && (
                      <AnalysisPanel icon={FlaskConical} title="Suggested Tests" items={msg.analysis.tests} color="purple" />
                    )}
                  </div>

                  {/* Nearby Hospitals */}
                  {msg.analysis.hospitals && msg.analysis.hospitals.length > 0 && (
                    <div className="rounded-xl border border-blue-100 bg-blue-50/50 p-4">
                      <div className="flex items-center gap-2 mb-3">
                        <Building2 className="w-4 h-4 text-blue-600" />
                        <p className="text-xs font-semibold text-blue-800">
                          Recommended Hospitals {userLocation ? `near ${userLocation}` : ''}
                        </p>
                      </div>
                      <div className="space-y-2">
                        {msg.analysis.hospitals.map((h, idx) => (
                          <div key={idx} className="flex items-center justify-between bg-white rounded-lg px-3 py-2 border border-blue-100">
                            <span className="text-xs font-medium text-slate-700">{h.name}</span>
                            <div className="flex items-center gap-2">
                              <a
                                href={h.mapLink}
                                target="_blank"
                                rel="noreferrer"
                                className="flex items-center gap-1 text-[10px] font-medium text-blue-600 hover:text-blue-800 bg-blue-50 px-2 py-1 rounded-md transition-colors"
                              >
                                <MapPin className="w-3 h-3" /> Directions
                              </a>
                              <a
                                href={`https://www.practo.com/search?q=${encodeURIComponent(h.name)}&city=${encodeURIComponent(userLocation || '')}`}
                                target="_blank"
                                rel="noreferrer"
                                className="flex items-center gap-1 text-[10px] font-medium text-white bg-emerald-600 hover:bg-emerald-700 px-2 py-1 rounded-md transition-colors"
                              >
                                <Calendar className="w-3 h-3" /> Practo
                              </a>
                              <a
                                href={`https://www.google.com/search?q=${encodeURIComponent(h.name + (userLocation ? ' ' + userLocation : '') + ' book appointment')}`}
                                target="_blank"
                                rel="noreferrer"
                                className="flex items-center gap-1 text-[10px] font-medium text-white bg-blue-600 hover:bg-blue-700 px-2 py-1 rounded-md transition-colors"
                              >
                                <ExternalLink className="w-3 h-3" /> Book
                              </a>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Recommended Medicines */}
                  {msg.analysis.medicines && msg.analysis.medicines.length > 0 && (
                    <div className="rounded-xl border border-emerald-100 bg-emerald-50/50 p-4">
                      <div className="flex items-center gap-2 mb-3">
                        <Pill className="w-4 h-4 text-emerald-600" />
                        <p className="text-xs font-semibold text-emerald-800">Recommended Medicines</p>
                      </div>
                      <div className="space-y-2">
                        {msg.analysis.medicines.map((m, idx) => (
                          <div key={idx} className="flex items-center justify-between bg-white rounded-lg px-3 py-2 border border-emerald-100">
                            <div>
                              <span className="text-xs font-medium text-slate-700">{m.name}</span>
                              <p className="text-[10px] text-slate-400">{m.dosage}</p>
                            </div>
                            <div className="flex items-center gap-2">
                              <a
                                href={m.buyLink || `https://www.1mg.com/search/all?name=${encodeURIComponent(m.name)}`}
                                target="_blank"
                                rel="noreferrer"
                                className="flex items-center gap-1 text-[10px] font-medium text-emerald-600 hover:text-emerald-800 bg-emerald-50 px-2 py-1 rounded-md transition-colors"
                              >
                                <ExternalLink className="w-3 h-3" /> 1mg
                              </a>
                              <a
                                href={`https://pharmeasy.in/search/all?name=${encodeURIComponent(m.name)}`}
                                target="_blank"
                                rel="noreferrer"
                                className="flex items-center gap-1 text-[10px] font-medium text-white bg-emerald-600 hover:bg-emerald-700 px-2 py-1 rounded-md transition-colors"
                              >
                                <ExternalLink className="w-3 h-3" /> PharmEasy
                              </a>
                            </div>
                          </div>
                        ))}
                      </div>
                      <p className="text-[10px] text-emerald-600 mt-2 italic">⚠️ Always consult a doctor before taking any medicine.</p>
                    </div>
                  )}
                </motion.div>
              )}
              {msg.sources && msg.sources.length > 0 && (
                <div className="ml-11 mt-2">
                  <p className="text-[10px] text-blue-500">📄 Sources: {msg.sources.join(', ')}</p>
                </div>
              )}
            </div>
          ))}

          <AnimatePresence>
            {(isLoading || isUploading) && (
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="flex items-center gap-3 ml-11">
                <Loader2 className="w-4 h-4 text-blue-500 animate-spin" />
                <span className="text-xs text-slate-400">
                  {isUploading ? 'Uploading and analyzing your report...' : 'MedAI is analyzing your symptoms...'}
                </span>
              </motion.div>
            )}
          </AnimatePresence>

          <div ref={bottomRef} />
        </div>
        <ChatInput
          onSend={handleSend}
          onFileUpload={handleFileUpload}
          disabled={isLoading || isUploading}
          uploading={isUploading}
        />
      </div>

      {/* Right Insights Panel */}
      <div className="w-80 border-l border-slate-200 bg-white p-6 hidden xl:block overflow-y-auto">
        <div className="flex items-center gap-2 mb-6">
          <Sparkles className="w-5 h-5 text-blue-600" />
          <h3 className="font-semibold text-slate-900">AI Insights</h3>
        </div>
        <div className="space-y-4">
          <InsightCard title="Powered By" description="GPT-4o + LangChain + LangGraph + RAG (FAISS)" />
          <InsightCard title="Session" description={`${messages.filter((m) => m.role === 'user').length} messages sent`} />
          <InsightCard title="Features" description="Hospitals, medicines, 1mg links, map directions, appointments" />
          {userLocation && (
            <InsightCard title="📍 Your Location" description={userLocation} />
          )}
        </div>
        <div className="mt-6 p-4 bg-gradient-to-br from-blue-50 to-indigo-50 rounded-xl">
          <p className="text-xs font-semibold text-blue-900 mb-1">Architecture</p>
          <div className="space-y-1.5 mt-2 flex flex-wrap gap-1">
            {['OpenAI GPT-4o', 'LangChain', 'LangGraph', 'FAISS RAG', 'FastAPI'].map((t) => (
              <span key={t} className="inline-block text-[10px] font-medium bg-white/70 text-blue-700 px-2 py-0.5 rounded-md">{t}</span>
            ))}
          </div>
        </div>
        <div className="mt-4 p-4 bg-gradient-to-br from-emerald-50 to-teal-50 rounded-xl">
          <p className="text-xs font-semibold text-emerald-900 mb-1">Quick Actions</p>
          <div className="space-y-2 mt-3">
            <button onClick={() => navigate('/reports')} className="w-full text-left text-xs text-emerald-700 hover:text-emerald-900 py-1.5 px-3 bg-white/60 rounded-lg transition-colors">📋 Upload a lab report</button>
            <button onClick={() => navigate('/hospitals')} className="w-full text-left text-xs text-emerald-700 hover:text-emerald-900 py-1.5 px-3 bg-white/60 rounded-lg transition-colors">🏥 Find nearby hospitals</button>
            <button onClick={() => navigate('/medicines')} className="w-full text-left text-xs text-emerald-700 hover:text-emerald-900 py-1.5 px-3 bg-white/60 rounded-lg transition-colors">💊 Search medicines</button>
          </div>
        </div>
      </div>
    </div>
  )
}

function AnalysisPanel({ icon: Icon, title, items, color }: { icon: any; title: string; items: string[]; color: string }) {
  const bgMap: Record<string, string> = { amber: 'bg-amber-50 border-amber-100', blue: 'bg-blue-50 border-blue-100', emerald: 'bg-emerald-50 border-emerald-100', purple: 'bg-purple-50 border-purple-100' }
  const iconMap: Record<string, string> = { amber: 'text-amber-600', blue: 'text-blue-600', emerald: 'text-emerald-600', purple: 'text-purple-600' }
  return (
    <div className={`rounded-xl border p-4 ${bgMap[color] || 'bg-slate-50 border-slate-100'}`}>
      <div className="flex items-center gap-2 mb-2">
        <Icon className={`w-4 h-4 ${iconMap[color] || 'text-slate-500'}`} />
        <p className="text-xs font-semibold text-slate-700">{title}</p>
      </div>
      <ul className="space-y-1">
        {items.map((item, idx) => (
          <li key={idx} className="text-xs text-slate-600 flex items-center gap-1.5">
            <span className="w-1 h-1 rounded-full bg-slate-400" />{item}
          </li>
        ))}
      </ul>
    </div>
  )
}

function InsightCard({ title, description }: { title: string; description: string }) {
  return (
    <div className="bg-slate-50 rounded-xl p-4">
      <p className="text-xs font-semibold text-slate-700">{title}</p>
      <p className="text-xs text-slate-500 mt-1">{description}</p>
    </div>
  )
}
