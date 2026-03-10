import { useState, useRef, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Brain,
  Cpu,
  Database,
  GitBranch,
  Play,
  ChevronRight,
  Clock,
  Hash,
  Zap,
  FileText,
  Search,
  MessageSquare,
  ArrowRight,
  CheckCircle2,
  Loader2,
  Code2,
  Layers,
  Sparkles,
  BookOpen,
  Copy,
  Check,
} from 'lucide-react'

const API_BASE = 'http://localhost:8000'

function getApiKey(): string {
  return localStorage.getItem('medai_api_key') || ''
}

function authHeaders(): Record<string, string> {
  const token = localStorage.getItem('medai_token') || ''
  return token ? { Authorization: `Bearer ${token}` } : {}
}

// ─── Step Definitions ──────────────────────────────────────────────
interface StepDef {
  id: string
  endpoint: string
  title: string
  subtitle: string
  icon: typeof Brain
  color: string
  gradient: string
  description: string
  concepts: string[]
  flowNodes?: string[]
}

const STEPS: StepDef[] = [
  {
    id: 'step1',
    endpoint: '/api/learn/step1-llm',
    title: 'Step 1: Raw LLM Call',
    subtitle: 'GPT-4o-mini',
    icon: Cpu,
    color: 'blue',
    gradient: 'from-blue-500 to-indigo-600',
    description:
      'Send a plain text message to the OpenAI LLM and get a raw response. This is the simplest building block — a single API call to the model.',
    concepts: ['OpenAI Chat API', 'HumanMessage', 'Token counting', 'Latency measurement'],
  },
  {
    id: 'step2',
    endpoint: '/api/learn/step2-langchain',
    title: 'Step 2: LangChain Messages',
    subtitle: 'System + Human + AI',
    icon: MessageSquare,
    color: 'emerald',
    gradient: 'from-emerald-500 to-teal-600',
    description:
      'LangChain structures conversations using typed messages: SystemMessage (persona), HumanMessage (user input), AIMessage (model reply). This enables multi-turn conversations with memory.',
    concepts: ['SystemMessage', 'HumanMessage', 'AIMessage', 'Multi-turn memory', 'Prompt engineering'],
  },
  {
    id: 'step3',
    endpoint: '/api/learn/step3-structured',
    title: 'Step 3: Structured Output',
    subtitle: 'JSON Schema',
    icon: Code2,
    color: 'violet',
    gradient: 'from-violet-500 to-purple-600',
    description:
      'Force the LLM to output structured JSON using carefully crafted system prompts. Low temperature (0.1) makes the output deterministic and parseable.',
    concepts: ['JSON output parsing', 'Low temperature', 'Deterministic responses', 'Schema enforcement'],
  },
  {
    id: 'step4',
    endpoint: '/api/learn/step4-rag',
    title: 'Step 4: RAG Pipeline',
    subtitle: 'Chunking + Embedding + FAISS',
    icon: Database,
    color: 'amber',
    gradient: 'from-amber-500 to-orange-600',
    description:
      'Retrieval-Augmented Generation: chunk a medical report into pieces, embed each chunk into vectors, build a FAISS index, then search by semantic similarity.',
    concepts: [
      'Text chunking (RecursiveCharacterTextSplitter)',
      'Embeddings (text-embedding-3-small)',
      'FAISS vector store',
      'Similarity search',
    ],
    flowNodes: ['Document', 'Chunking', 'Embedding', 'FAISS Index', 'Similarity Search'],
  },
  {
    id: 'step5',
    endpoint: '/api/learn/step5-rag-llm',
    title: 'Step 5: RAG + LLM',
    subtitle: 'Generic vs Personalized',
    icon: Sparkles,
    color: 'rose',
    gradient: 'from-rose-500 to-pink-600',
    description:
      'Compare an LLM answer without context vs. with RAG-retrieved patient data. See how RAG transforms a generic response into a personalized, actionable medical insight.',
    concepts: ['Context injection', 'RAG grounding', 'Answer quality comparison', 'Hallucination reduction'],
  },
  {
    id: 'step6',
    endpoint: '/api/learn/step6-langgraph',
    title: 'Step 6: LangGraph Agent',
    subtitle: '3-Node Workflow',
    icon: GitBranch,
    color: 'cyan',
    gradient: 'from-cyan-500 to-sky-600',
    description:
      'LangGraph builds a stateful, multi-step agent graph. Three nodes execute in sequence: generate_reply → generate_analysis → generate_enrichment. Each node has a distinct role and temperature.',
    concepts: ['StateGraph', 'Node functions', 'Sequential execution', 'State passing', 'Multi-step agents'],
    flowNodes: ['generate_reply', 'generate_analysis', 'generate_enrichment', 'END'],
  },
]

// ─── Color Map ─────────────────────────────────────────────────────
const colorMap: Record<string, { bg: string; text: string; border: string; badge: string; ring: string }> = {
  blue: { bg: 'bg-blue-50', text: 'text-blue-700', border: 'border-blue-200', badge: 'bg-blue-100 text-blue-700', ring: 'ring-blue-500/20' },
  emerald: { bg: 'bg-emerald-50', text: 'text-emerald-700', border: 'border-emerald-200', badge: 'bg-emerald-100 text-emerald-700', ring: 'ring-emerald-500/20' },
  violet: { bg: 'bg-violet-50', text: 'text-violet-700', border: 'border-violet-200', badge: 'bg-violet-100 text-violet-700', ring: 'ring-violet-500/20' },
  amber: { bg: 'bg-amber-50', text: 'text-amber-700', border: 'border-amber-200', badge: 'bg-amber-100 text-amber-700', ring: 'ring-amber-500/20' },
  rose: { bg: 'bg-rose-50', text: 'text-rose-700', border: 'border-rose-200', badge: 'bg-rose-100 text-rose-700', ring: 'ring-rose-500/20' },
  cyan: { bg: 'bg-cyan-50', text: 'text-cyan-700', border: 'border-cyan-200', badge: 'bg-cyan-100 text-cyan-700', ring: 'ring-cyan-500/20' },
}

// ─── Flow Diagram Component ───────────────────────────────────────
function FlowDiagram({ nodes, activeIndex }: { nodes: string[]; activeIndex: number }) {
  return (
    <div className="flex items-center gap-1 flex-wrap py-3">
      {nodes.map((node, i) => (
        <div key={i} className="flex items-center gap-1">
          <motion.div
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ delay: i * 0.12 }}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold border transition-all duration-500 ${
              i <= activeIndex
                ? 'bg-emerald-500 text-white border-emerald-600 shadow-lg shadow-emerald-500/25'
                : 'bg-slate-100 text-slate-500 border-slate-200'
            }`}
          >
            {node}
          </motion.div>
          {i < nodes.length - 1 && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: i * 0.12 + 0.06 }}
            >
              <ChevronRight className={`w-4 h-4 ${i < activeIndex ? 'text-emerald-400' : 'text-slate-300'}`} />
            </motion.div>
          )}
        </div>
      ))}
    </div>
  )
}

// ─── JSON Viewer ──────────────────────────────────────────────────
function JsonViewer({ data, maxHeight = 320 }: { data: unknown; maxHeight?: number }) {
  const [copied, setCopied] = useState(false)
  const json = JSON.stringify(data, null, 2)

  const handleCopy = () => {
    navigator.clipboard.writeText(json)
    setCopied(true)
    setTimeout(() => setCopied(false), 1500)
  }

  return (
    <div className="relative group">
      <button
        onClick={handleCopy}
        className="absolute top-2 right-2 p-1.5 rounded-md bg-slate-700 hover:bg-slate-600 text-slate-300 opacity-0 group-hover:opacity-100 transition-opacity z-10"
      >
        {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
      </button>
      <pre
        className="bg-slate-900 text-slate-100 p-4 rounded-xl text-xs font-mono overflow-auto leading-relaxed"
        style={{ maxHeight }}
      >
        {json}
      </pre>
    </div>
  )
}

// ─── Stat Card ────────────────────────────────────────────────────
function StatBadge({ icon: Icon, label, value, color = 'slate' }: { icon: typeof Clock; label: string; value: string | number; color?: string }) {
  const colors: Record<string, string> = {
    slate: 'bg-slate-100 text-slate-700',
    blue: 'bg-blue-100 text-blue-700',
    emerald: 'bg-emerald-100 text-emerald-700',
    amber: 'bg-amber-100 text-amber-700',
    rose: 'bg-rose-100 text-rose-700',
  }
  return (
    <div className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-medium ${colors[color] || colors.slate}`}>
      <Icon className="w-3.5 h-3.5" />
      <span className="opacity-70">{label}</span>
      <span className="font-bold">{value}</span>
    </div>
  )
}

// ─── Result Renderers ─────────────────────────────────────────────
function Step1Result({ data }: { data: any }) {
  return (
    <div className="space-y-4">
      <div className="flex flex-wrap gap-2">
        <StatBadge icon={Clock} label="Time:" value={`${data.time_seconds}s`} color="blue" />
        <StatBadge icon={Hash} label="Tokens:" value={data.total_tokens || '?'} color="emerald" />
        <StatBadge icon={Cpu} label="Model:" value={data.model} color="slate" />
      </div>
      <div>
        <p className="text-xs font-semibold text-slate-500 mb-1.5">INPUT</p>
        <p className="text-sm bg-blue-50 border border-blue-100 rounded-lg p-3 text-blue-900">{data.input}</p>
      </div>
      <div>
        <p className="text-xs font-semibold text-slate-500 mb-1.5">LLM OUTPUT</p>
        <p className="text-sm bg-slate-50 border border-slate-100 rounded-lg p-3 text-slate-800 leading-relaxed">{data.output}</p>
      </div>
      <div>
        <p className="text-xs font-semibold text-slate-500 mb-1.5">TOKEN USAGE</p>
        <div className="flex gap-3">
          <div className="flex-1 text-center p-2 bg-blue-50 rounded-lg">
            <p className="text-lg font-bold text-blue-700">{data.prompt_tokens || '–'}</p>
            <p className="text-[10px] text-blue-500">Prompt</p>
          </div>
          <div className="flex-1 text-center p-2 bg-emerald-50 rounded-lg">
            <p className="text-lg font-bold text-emerald-700">{data.completion_tokens || '–'}</p>
            <p className="text-[10px] text-emerald-500">Completion</p>
          </div>
          <div className="flex-1 text-center p-2 bg-violet-50 rounded-lg">
            <p className="text-lg font-bold text-violet-700">{data.total_tokens || '–'}</p>
            <p className="text-[10px] text-violet-500">Total</p>
          </div>
        </div>
      </div>
    </div>
  )
}

function Step2Result({ data }: { data: any }) {
  return (
    <div className="space-y-4">
      <div className="flex flex-wrap gap-2">
        <StatBadge icon={Clock} label="Round 1:" value={`${data.time_round1}s`} color="emerald" />
        <StatBadge icon={Clock} label="Round 2:" value={`${data.time_round2}s`} color="blue" />
      </div>
      <div>
        <p className="text-xs font-semibold text-emerald-600 mb-1.5">ROUND 1 — Single message</p>
        <div className="space-y-1.5 mb-2">
          {data.messages_round1?.map((m: any, i: number) => (
            <div key={i} className={`text-xs px-3 py-1.5 rounded-lg ${m.role === 'system' ? 'bg-amber-50 text-amber-800' : 'bg-blue-50 text-blue-800'}`}>
              <span className="font-bold uppercase mr-1.5">{m.role}:</span> {m.content}
            </div>
          ))}
        </div>
        <p className="text-sm bg-emerald-50 border border-emerald-100 rounded-lg p-3 text-emerald-900">{data.reply_round1}</p>
      </div>
      <div>
        <p className="text-xs font-semibold text-blue-600 mb-1.5">ROUND 2 — With conversation history</p>
        <div className="space-y-1.5 mb-2">
          {data.messages_round2?.map((m: any, i: number) => (
            <div key={i} className={`text-xs px-3 py-1.5 rounded-lg ${
              m.role === 'system' ? 'bg-amber-50 text-amber-800' :
              m.role === 'ai' ? 'bg-emerald-50 text-emerald-800' :
              'bg-blue-50 text-blue-800'
            }`}>
              <span className="font-bold uppercase mr-1.5">{m.role}:</span> {m.content}
            </div>
          ))}
        </div>
        <p className="text-sm bg-blue-50 border border-blue-100 rounded-lg p-3 text-blue-900">{data.reply_round2}</p>
      </div>
    </div>
  )
}

function Step3Result({ data }: { data: any }) {
  return (
    <div className="space-y-4">
      <div className="flex flex-wrap gap-2">
        <StatBadge icon={Clock} label="Time:" value={`${data.time_seconds}s`} color="violet" />
        <StatBadge icon={Zap} label="Strategy:" value={data.prompt_strategy?.slice(0, 40) + '...'} />
      </div>
      <div>
        <p className="text-xs font-semibold text-slate-500 mb-1.5">INPUT</p>
        <p className="text-sm bg-violet-50 border border-violet-100 rounded-lg p-3 text-violet-900">{data.input}</p>
      </div>
      <div>
        <p className="text-xs font-semibold text-slate-500 mb-1.5">STRUCTURED JSON OUTPUT</p>
        <JsonViewer data={data.output} maxHeight={400} />
      </div>
    </div>
  )
}

function Step4Result({ data }: { data: any }) {
  return (
    <div className="space-y-4">
      <FlowDiagram nodes={['Document', 'Chunking', 'Embedding', 'FAISS Index', 'Search']} activeIndex={4} />
      <div className="flex flex-wrap gap-2">
        <StatBadge icon={FileText} label="Report:" value={`${data.report_length} chars`} color="amber" />
        <StatBadge icon={Layers} label="Chunks:" value={data.num_chunks} color="blue" />
        <StatBadge icon={Hash} label="Dimensions:" value={data.embedding_dimensions} color="emerald" />
        <StatBadge icon={Database} label="Vectors:" value={data.vectors_in_index} color="rose" />
      </div>
      {data.timing && (
        <div>
          <p className="text-xs font-semibold text-slate-500 mb-1.5">TIMING BREAKDOWN</p>
          <div className="grid grid-cols-4 gap-2">
            {Object.entries(data.timing).map(([k, v]) => (
              <div key={k} className="text-center p-2 bg-amber-50 rounded-lg">
                <p className="text-lg font-bold text-amber-700">{v as number}ms</p>
                <p className="text-[10px] text-amber-500 capitalize">{k.replace('_ms', '')}</p>
              </div>
            ))}
          </div>
        </div>
      )}
      {data.chunks && (
        <div>
          <p className="text-xs font-semibold text-slate-500 mb-1.5">CHUNKS</p>
          <div className="space-y-1.5">
            {data.chunks.map((c: any) => (
              <div key={c.id} className="text-xs bg-slate-50 border border-slate-100 rounded-lg p-2 text-slate-700">
                <span className="font-bold text-amber-600 mr-1.5">#{c.id}</span>
                <span className="opacity-60">({c.length} chars)</span> {c.text}
              </div>
            ))}
          </div>
        </div>
      )}
      {data.embedding_sample && (
        <div>
          <p className="text-xs font-semibold text-slate-500 mb-1.5">EMBEDDING VECTOR (first 8 of {data.embedding_dimensions})</p>
          <div className="flex gap-1.5 flex-wrap">
            {data.embedding_sample.map((v: number, i: number) => (
              <span key={i} className="px-2 py-1 bg-emerald-50 border border-emerald-200 rounded text-xs font-mono text-emerald-700">{v}</span>
            ))}
            <span className="px-2 py-1 text-xs text-slate-400">…</span>
          </div>
        </div>
      )}
      {data.search_results && (
        <div>
          <p className="text-xs font-semibold text-slate-500 mb-1.5">SIMILARITY SEARCHES</p>
          <div className="space-y-2">
            {data.search_results.map((sr: any, i: number) => (
              <div key={i} className="bg-slate-50 border border-slate-100 rounded-lg p-3">
                <p className="text-xs font-bold text-slate-700 flex items-center gap-1.5 mb-1.5">
                  <Search className="w-3.5 h-3.5 text-amber-500" /> "{sr.query}"
                </p>
                {sr.matches?.map((m: any, j: number) => (
                  <p key={j} className="text-xs text-slate-600 ml-5 mb-0.5">→ {m.text}</p>
                ))}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

function Step5Result({ data }: { data: any }) {
  return (
    <div className="space-y-4">
      <div>
        <p className="text-xs font-semibold text-slate-500 mb-1.5">QUESTION</p>
        <p className="text-sm bg-rose-50 border border-rose-100 rounded-lg p-3 text-rose-900">{data.question}</p>
      </div>
      {data.rag_context && (
        <div>
          <p className="text-xs font-semibold text-slate-500 mb-1.5">RAG CONTEXT (retrieved from patient report)</p>
          <p className="text-xs bg-amber-50 border border-amber-100 rounded-lg p-3 text-amber-800 font-mono">{data.rag_context}</p>
        </div>
      )}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        <div className="border border-slate-200 rounded-xl p-4 bg-white">
          <div className="flex items-center gap-2 mb-2">
            <div className="w-6 h-6 rounded-full bg-slate-200 flex items-center justify-center">
              <Cpu className="w-3.5 h-3.5 text-slate-500" />
            </div>
            <p className="text-xs font-bold text-slate-600">WITHOUT RAG</p>
            <span className="ml-auto text-[10px] text-slate-400">{data.without_rag?.time}s</span>
          </div>
          <p className="text-sm text-slate-700 leading-relaxed">{data.without_rag?.reply}</p>
        </div>
        <div className="border-2 border-emerald-200 rounded-xl p-4 bg-emerald-50/50 relative">
          <div className="absolute -top-2.5 right-3 px-2 py-0.5 bg-emerald-500 text-white text-[9px] font-bold rounded-full uppercase tracking-wide">
            Personalized
          </div>
          <div className="flex items-center gap-2 mb-2">
            <div className="w-6 h-6 rounded-full bg-emerald-200 flex items-center justify-center">
              <Sparkles className="w-3.5 h-3.5 text-emerald-600" />
            </div>
            <p className="text-xs font-bold text-emerald-700">WITH RAG</p>
            <span className="ml-auto text-[10px] text-emerald-500">{data.with_rag?.time}s</span>
          </div>
          <p className="text-sm text-emerald-900 leading-relaxed">{data.with_rag?.reply}</p>
        </div>
      </div>
    </div>
  )
}

function Step6Result({ data }: { data: any }) {
  return (
    <div className="space-y-4">
      <div className="flex flex-wrap gap-2">
        <StatBadge icon={Clock} label="Total:" value={`${data.time_seconds}s`} color="blue" />
        <StatBadge icon={Zap} label="Location:" value={data.location} color="amber" />
      </div>
      <FlowDiagram nodes={['generate_reply', 'generate_analysis', 'generate_enrichment', 'END']} activeIndex={3} />
      <div>
        <p className="text-xs font-semibold text-slate-500 mb-1.5">GRAPH NODES</p>
        <div className="space-y-2">
          {data.nodes?.map((n: any, i: number) => (
            <motion.div
              key={i}
              initial={{ x: -20, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              transition={{ delay: i * 0.15 }}
              className="flex items-start gap-3 bg-slate-50 border border-slate-100 rounded-lg p-3"
            >
              <div className="w-7 h-7 rounded-lg bg-cyan-100 flex items-center justify-center text-cyan-700 text-xs font-bold shrink-0">
                {i + 1}
              </div>
              <div>
                <p className="text-xs font-bold text-slate-800">{n.name}</p>
                <p className="text-[11px] text-slate-500">{n.description}</p>
                <p className="text-[10px] text-cyan-600 font-mono mt-0.5">→ {n.output_field}</p>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
      <div>
        <p className="text-xs font-semibold text-slate-500 mb-1.5">REPLY</p>
        <p className="text-sm bg-cyan-50 border border-cyan-100 rounded-lg p-3 text-cyan-900 leading-relaxed">
          {data.reply}
        </p>
      </div>
      {data.analysis && (
        <div>
          <p className="text-xs font-semibold text-slate-500 mb-1.5">STRUCTURED ANALYSIS</p>
          <JsonViewer data={data.analysis} maxHeight={300} />
        </div>
      )}
    </div>
  )
}

const resultRenderers: Record<string, (data: any) => JSX.Element> = {
  step1: (data) => <Step1Result data={data} />,
  step2: (data) => <Step2Result data={data} />,
  step3: (data) => <Step3Result data={data} />,
  step4: (data) => <Step4Result data={data} />,
  step5: (data) => <Step5Result data={data} />,
  step6: (data) => <Step6Result data={data} />,
}

// ─── Main Page ────────────────────────────────────────────────────
export default function LearningLab() {
  const [openStep, setOpenStep] = useState<string | null>(null)
  const [loading, setLoading] = useState<Record<string, boolean>>({})
  const [results, setResults] = useState<Record<string, any>>({})
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [inputs, setInputs] = useState<Record<string, string>>({
    step1: 'I have a headache and fever for 3 days',
    step2: 'I have a headache and fever for 3 days',
    step3: 'I have a headache and fever for 3 days',
    step4: 'What are my abnormal values?',
    step5: 'Am I at risk for diabetes?',
    step6: 'I have a headache and fever for 3 days',
  })
  const scrollRefs = useRef<Record<string, HTMLDivElement | null>>({})

  async function runStep(step: StepDef) {
    setLoading((p) => ({ ...p, [step.id]: true }))
    setErrors((p) => ({ ...p, [step.id]: '' }))
    setOpenStep(step.id)
    try {
      const body: Record<string, string> = { message: inputs[step.id] || 'I have a headache and fever for 3 days' }
      const apiKey = getApiKey()
      if (apiKey) body.api_key = apiKey

      const res = await fetch(`${API_BASE}${step.endpoint}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...authHeaders() },
        body: JSON.stringify(body),
      })
      if (!res.ok) {
        const err = await res.json().catch(() => ({ detail: 'Server error' }))
        throw new Error(err.detail || `HTTP ${res.status}`)
      }
      const data = await res.json()
      setResults((p) => ({ ...p, [step.id]: data }))
      setTimeout(() => {
        scrollRefs.current[step.id]?.scrollIntoView({ behavior: 'smooth', block: 'nearest' })
      }, 200)
    } catch (e: any) {
      setErrors((p) => ({ ...p, [step.id]: e.message }))
    } finally {
      setLoading((p) => ({ ...p, [step.id]: false }))
    }
  }

  return (
    <div className="h-full overflow-y-auto">
      <div className="max-w-4xl mx-auto px-6 py-8">
        {/* Header */}
        <motion.div
          initial={{ y: -20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          className="mb-8"
        >
          <div className="flex items-center gap-3 mb-2">
            <div className="w-11 h-11 rounded-2xl bg-gradient-to-br from-violet-500 to-indigo-600 flex items-center justify-center shadow-lg shadow-violet-500/25">
              <BookOpen className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-slate-900 tracking-tight">AI Learning Lab</h1>
              <p className="text-sm text-slate-500">Interactive deep-dive into LLM, LangChain, LangGraph & RAG</p>
            </div>
          </div>
          <p className="text-sm text-slate-500 mt-3 leading-relaxed max-w-2xl">
            Run each step to see exactly how MedAI's AI pipeline works — from raw LLM calls to multi-node LangGraph agents.
            Every result is <strong>live</strong>, hitting the real backend with real OpenAI API calls.
          </p>
        </motion.div>

        {/* Pipeline Overview */}
        <motion.div
          initial={{ y: 10, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.1 }}
          className="mb-8 p-4 bg-gradient-to-r from-slate-900 to-slate-800 rounded-2xl border border-slate-700"
        >
          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-3">Full Pipeline</p>
          <div className="flex items-center gap-2 flex-wrap">
            {['User Input', 'LLM', 'LangChain', 'Structured Output', 'RAG', 'RAG+LLM', 'LangGraph Agent'].map((n, i) => (
              <div key={i} className="flex items-center gap-2">
                <div className="px-3 py-1.5 bg-slate-700 rounded-lg text-xs font-semibold text-slate-200 border border-slate-600">
                  {n}
                </div>
                {i < 6 && <ArrowRight className="w-3.5 h-3.5 text-slate-500" />}
              </div>
            ))}
          </div>
        </motion.div>

        {/* Steps */}
        <div className="space-y-4">
          {STEPS.map((step, idx) => {
            const isOpen = openStep === step.id
            const isLoading = loading[step.id]
            const result = results[step.id]
            const error = errors[step.id]
            const cm = colorMap[step.color]

            return (
              <motion.div
                key={step.id}
                initial={{ y: 20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: idx * 0.06 }}
                className={`bg-white rounded-2xl border ${isOpen ? cm.border + ' ring-2 ' + cm.ring : 'border-slate-200'} shadow-sm overflow-hidden transition-all`}
              >
                {/* Card Header */}
                <div
                  className="flex items-center gap-4 px-5 py-4 cursor-pointer select-none hover:bg-slate-50/50 transition-colors"
                  onClick={() => setOpenStep(isOpen ? null : step.id)}
                >
                  <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${step.gradient} flex items-center justify-center shadow-lg shrink-0`}>
                    <step.icon className="w-5 h-5 text-white" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <h3 className="text-sm font-bold text-slate-900">{step.title}</h3>
                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${cm.badge}`}>{step.subtitle}</span>
                    </div>
                    <p className="text-xs text-slate-500 mt-0.5 line-clamp-1">{step.description}</p>
                  </div>
                  {result && !isLoading && (
                    <CheckCircle2 className="w-5 h-5 text-emerald-500 shrink-0" />
                  )}
                  <motion.div
                    animate={{ rotate: isOpen ? 90 : 0 }}
                    className="shrink-0"
                  >
                    <ChevronRight className="w-5 h-5 text-slate-400" />
                  </motion.div>
                </div>

                {/* Expanded Content */}
                <AnimatePresence>
                  {isOpen && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: 'auto', opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.3, ease: 'easeInOut' }}
                      className="overflow-hidden"
                    >
                      <div className="px-5 pb-5 border-t border-slate-100 pt-4">
                        {/* Description + Concepts */}
                        <p className="text-sm text-slate-600 leading-relaxed mb-3">{step.description}</p>
                        <div className="flex flex-wrap gap-1.5 mb-4">
                          {step.concepts.map((c) => (
                            <span key={c} className="px-2 py-0.5 bg-slate-100 text-slate-600 rounded-md text-[10px] font-medium">
                              {c}
                            </span>
                          ))}
                        </div>

                        {/* Input + Run */}
                        <div className="flex gap-2 mb-4">
                          <input
                            type="text"
                            value={inputs[step.id] || ''}
                            onChange={(e) => setInputs((p) => ({ ...p, [step.id]: e.target.value }))}
                            placeholder="Type your message…"
                            className="flex-1 px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-500/30 focus:border-emerald-400 transition-all"
                          />
                          <button
                            onClick={() => runStep(step)}
                            disabled={isLoading}
                            className={`flex items-center gap-2 px-4 py-2 bg-gradient-to-r ${step.gradient} text-white text-sm font-semibold rounded-xl shadow-lg hover:shadow-xl disabled:opacity-60 transition-all`}
                          >
                            {isLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Play className="w-4 h-4" />}
                            {isLoading ? 'Running…' : 'Run'}
                          </button>
                        </div>

                        {/* Error */}
                        {error && (
                          <motion.div
                            initial={{ opacity: 0, y: -10 }}
                            animate={{ opacity: 1, y: 0 }}
                            className="bg-red-50 border border-red-200 text-red-700 text-sm rounded-xl p-3 mb-4"
                          >
                            ❌ {error}
                          </motion.div>
                        )}

                        {/* Loading animation */}
                        {isLoading && (
                          <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            className="flex items-center gap-3 py-8 justify-center"
                          >
                            <div className="relative">
                              <div className="w-12 h-12 rounded-full border-4 border-slate-200" />
                              <div className="absolute inset-0 w-12 h-12 rounded-full border-4 border-transparent border-t-emerald-500 animate-spin" />
                            </div>
                            <div>
                              <p className="text-sm font-semibold text-slate-700">Processing…</p>
                              <p className="text-xs text-slate-400">Calling OpenAI API via backend</p>
                            </div>
                          </motion.div>
                        )}

                        {/* Result */}
                        {result && !isLoading && (
                          <motion.div
                            ref={(el) => { scrollRefs.current[step.id] = el }}
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.4 }}
                          >
                            <div className="flex items-center gap-2 mb-3">
                              <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                              <p className="text-xs font-bold text-emerald-700 uppercase tracking-wide">Result</p>
                            </div>
                            {resultRenderers[step.id]?.(result) ?? <JsonViewer data={result} />}

                            {/* Raw JSON toggle */}
                            <details className="mt-4">
                              <summary className="text-xs text-slate-400 cursor-pointer hover:text-slate-600 transition-colors">
                                View raw JSON response
                              </summary>
                              <div className="mt-2">
                                <JsonViewer data={result} maxHeight={300} />
                              </div>
                            </details>
                          </motion.div>
                        )}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </motion.div>
            )
          })}
        </div>

        {/* Footer */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5 }}
          className="mt-8 text-center text-xs text-slate-400"
        >
          <p>All calls are live — they hit your FastAPI backend → OpenAI API.</p>
          <p className="mt-1">Make sure your API key is set in <span className="font-mono bg-slate-100 px-1.5 py-0.5 rounded text-slate-500">Settings</span> or <span className="font-mono bg-slate-100 px-1.5 py-0.5 rounded text-slate-500">server/.env</span></p>
        </motion.div>
      </div>
    </div>
  )
}
