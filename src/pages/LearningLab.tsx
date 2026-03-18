import { useState, useEffect, useCallback, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  BookOpen, Brain, Zap, Trophy, Star, Sparkles, Check, X,
  ChevronRight, ChevronLeft, ArrowRight, Flame, Target, Award,
  Clock, Lightbulb, GraduationCap, Shield, Volume2, RotateCcw,
  Lock, Crown, TrendingUp, BarChart3, Database, Network, Bot,
  Cpu, MessageSquare, FileText, Search, ArrowDown, ArrowUp,
  Layers, GitBranch, Workflow, Box, CircleDot, Binary, Hash,
  Braces, Cable, Boxes, MonitorPlay, Play, Eye, Server, Globe,
  ArrowLeftRight, Loader2, CheckCircle2, Code, Send,
  User, Monitor, Activity, HardDrive, Scissors, ScanSearch,
  FileOutput, Package, Palette, AlertTriangle, Stethoscope,
  Link, Settings2, Pill, Route, SquareFunction, ChevronDown,
} from 'lucide-react'

/* ══════════════════════════════════════════════════════════
   TYPES
   ══════════════════════════════════════════════════════════ */

interface QuizQuestion {
  id: string; question: string; options: string[]; correct: number
  explanation: string; difficulty: 'easy' | 'medium' | 'hard'; category: string
}
interface LearningModule {
  id: string; title: string; description: string; icon: any
  gradient: string; glow: string; category: string
  lessons: Lesson[]; unlocked: boolean; xpReward: number
  liveTestScenario?: LiveTestScenario
}
interface Lesson {
  id: string; title: string; content: string; keyPoints: string[]
  quiz: QuizQuestion[]; xpReward: number
  flowDiagram?: FlowStep[]
}
interface FlowStep {
  label: string; icon: any; description: string; color: string
}
interface LiveTestStep {
  id: string
  layer: 'frontend' | 'backend' | 'ai' | 'database' | 'response'
  icon: any
  label: string
  detail: string
  duration: number
  color: string
}
interface LiveTestScenario {
  title: string
  description: string
  userInput: string
  steps: LiveTestStep[]
  finalOutput: string
}
interface UserProgress {
  xp: number; level: number; streak: number
  completedLessons: string[]; completedModules: string[]
  badges: BadgeData[]; quizScores: Record<string, number>
  dailyGoalMet: boolean; totalCorrectAnswers: number; totalQuestionsAttempted: number
}
interface BadgeData {
  id: string; name: string; description: string; iconName: string
  earned: boolean; earnedAt?: string; rarity: 'common' | 'rare' | 'epic' | 'legendary'
}
type ViewState = 'home' | 'module' | 'lesson' | 'quiz' | 'results' | 'badges' | 'leaderboard' | 'architecture' | 'livetest'

/* ══════════════════════════════════════════════════════════
   GAMIFICATION ENGINE
   ══════════════════════════════════════════════════════════ */

const XP_PER_LEVEL = 500
const STREAK_BONUS = 0.1
const PASS_THRESHOLD = 75 // Minimum % to unlock next lesson
const calcLevel = (xp: number) => Math.floor(xp / XP_PER_LEVEL) + 1
const xpPercent = (xp: number) => ((xp % XP_PER_LEVEL) / XP_PER_LEVEL) * 100

/* Fisher-Yates shuffle (returns a new array) */
function shuffle<T>(arr: T[]): T[] {
  const a = [...arr]
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]]
  }
  return a
}

/* Shuffle quiz questions AND their option order (keeps correct answer mapping) */
function shuffleQuiz(questions: QuizQuestion[]): QuizQuestion[] {
  return shuffle(questions).map(q => {
    const indices = q.options.map((_, i) => i)
    const shuffled = shuffle(indices)
    return {
      ...q,
      options: shuffled.map(i => q.options[i]),
      correct: shuffled.indexOf(q.correct),
    }
  })
}

const LEVEL_TITLES: Record<number, string> = {
  1: 'AI Curious', 2: 'Prompt Rookie', 3: 'Embedding Explorer',
  4: 'RAG Builder', 5: 'Chain Architect', 6: 'Graph Thinker',
  7: 'Vector Wizard', 8: 'Agent Engineer', 9: 'AI Architect',
  10: 'LLM Legend',
}
const getLevelTitle = (l: number) => LEVEL_TITLES[Math.min(l, 10)] || 'AI Learner'

/* ══════════════════════════════════════════════════════════
   BADGES
   ══════════════════════════════════════════════════════════ */

const BADGE_ICON_MAP: Record<string, any> = {
  BookOpen, Target, Flame, Zap, Award, Star, GraduationCap, Crown, Clock, Brain, Play, Eye,
}
const ALL_BADGES: BadgeData[] = [
  { id: 'first_lesson', name: 'Hello AI', description: 'Complete your first lesson', iconName: 'BookOpen', earned: false, rarity: 'common' },
  { id: 'quiz_perfect', name: 'Perfect Recall', description: 'Score 100% on any quiz', iconName: 'Target', earned: false, rarity: 'rare' },
  { id: 'streak_3', name: 'On Fire!', description: '3-day learning streak', iconName: 'Flame', earned: false, rarity: 'common' },
  { id: 'streak_7', name: 'Unstoppable', description: '7-day learning streak', iconName: 'Zap', earned: false, rarity: 'rare' },
  { id: 'modules_3', name: 'Stack Explorer', description: 'Complete 3 modules', iconName: 'Award', earned: false, rarity: 'rare' },
  { id: 'xp_1000', name: 'Knowledge Miner', description: 'Earn 1,000 XP', iconName: 'Star', earned: false, rarity: 'common' },
  { id: 'xp_5000', name: 'AI Scholar', description: 'Earn 5,000 XP', iconName: 'GraduationCap', earned: false, rarity: 'epic' },
  { id: 'all_modules', name: 'Full-Stack AI', description: 'Complete all modules', iconName: 'Crown', earned: false, rarity: 'legendary' },
  { id: 'speed_demon', name: 'Speed Demon', description: 'Ace a quiz under 30s', iconName: 'Clock', earned: false, rarity: 'epic' },
  { id: 'correct_50', name: 'Neural Network', description: '50 correct answers', iconName: 'Brain', earned: false, rarity: 'rare' },
  { id: 'live_tester', name: 'Live Tester', description: 'Run 3 live tests', iconName: 'Play', earned: false, rarity: 'rare' },
  { id: 'architect', name: 'System Architect', description: 'View the 3D architecture', iconName: 'Eye', earned: false, rarity: 'common' },
}
const RARITY_COLORS: Record<string, { bg: string; border: string; text: string; glow: string }> = {
  common: { bg: 'bg-slate-50', border: 'border-slate-200', text: 'text-slate-600', glow: '' },
  rare: { bg: 'bg-blue-50', border: 'border-blue-200', text: 'text-blue-600', glow: 'glow-blue' },
  epic: { bg: 'bg-purple-50', border: 'border-purple-200', text: 'text-purple-600', glow: 'glow-purple' },
  legendary: { bg: 'bg-amber-50', border: 'border-amber-200', text: 'text-amber-600', glow: 'glow-amber' },
}

/* ══════════════════════════════════════════════════════════
   LIVE TEST SCENARIOS — per module
   ══════════════════════════════════════════════════════════ */

const LIVE_TESTS: Record<string, LiveTestScenario> = {
  'llm-basics': {
    title: 'LLM Live Test: Chat Message',
    description: 'Watch how your chat message travels through the LLM pipeline',
    userInput: '"I have a severe headache and fever"',
    steps: [
      { id: 's1', layer: 'frontend', icon: User, label: 'User Types Message', detail: 'You type: "I have a severe headache and fever" in the chat input', duration: 1200, color: 'from-blue-400 to-blue-600' },
      { id: 's2', layer: 'frontend', icon: Send, label: 'React Sends API Call', detail: 'fetch("/api/chat", { method: "POST", body: { message } })', duration: 1000, color: 'from-cyan-400 to-cyan-600' },
      { id: 's3', layer: 'backend', icon: Zap, label: 'FastAPI Receives Request', detail: '@app.post("/api/chat") — Python backend receives your message', duration: 900, color: 'from-green-400 to-green-600' },
      { id: 's4', layer: 'backend', icon: FileText, label: 'System Prompt Attached', detail: '"You are MedAI, an advanced healthcare assistant..." prepended', duration: 1100, color: 'from-teal-400 to-teal-600' },
      { id: 's5', layer: 'ai', icon: Scissors, label: 'Tokenizer Splits Text', detail: '"severe" → "sev" + "ere", "headache" → "head" + "ache" → 23 tokens', duration: 1000, color: 'from-violet-400 to-violet-600' },
      { id: 's6', layer: 'ai', icon: Brain, label: 'GPT-4 Processes Tokens', detail: 'Transformer layers process all tokens in parallel, attention mechanism weighs each token', duration: 1500, color: 'from-purple-400 to-purple-600' },
      { id: 's7', layer: 'ai', icon: Target, label: 'Token Prediction Loop', detail: 'Predicts next token → "Based" → "on" → "your" → "symptoms" → ... (temperature=0.3)', duration: 1400, color: 'from-pink-400 to-pink-600' },
      { id: 's8', layer: 'backend', icon: Package, label: 'FastAPI Packages Response', detail: 'Wraps AI response in JSON: { response, analysis, timestamp }', duration: 800, color: 'from-green-400 to-emerald-600' },
      { id: 's9', layer: 'frontend', icon: MessageSquare, label: 'React Renders Chat Bubble', detail: 'ChatMessage component renders with typing animation', duration: 1000, color: 'from-blue-400 to-indigo-600' },
      { id: 's10', layer: 'response', icon: CheckCircle2, label: 'User Sees AI Response', detail: '"Based on your symptoms of headache and fever, here are some possible causes..."', duration: 1200, color: 'from-emerald-400 to-emerald-600' },
    ],
    finalOutput: '"Based on your symptoms of headache and fever, this could indicate a viral infection, tension headache, or sinusitis. I recommend rest, hydration, and consulting a doctor if symptoms persist for more than 48 hours."',
  },
  'rag-pipeline': {
    title: 'RAG Live Test: Report Analysis',
    description: 'Watch how your uploaded PDF gets processed and queried through the RAG pipeline',
    userInput: 'Upload "blood_report.pdf" then ask "What is my sugar level?"',
    steps: [
      { id: 'r1', layer: 'frontend', icon: FileText, label: 'User Uploads PDF', detail: 'File picker selects blood_report.pdf (245 KB)', duration: 1000, color: 'from-blue-400 to-blue-600' },
      { id: 'r2', layer: 'frontend', icon: Send, label: 'React Sends File', detail: 'FormData POST to /api/reports/upload with multipart/form-data', duration: 900, color: 'from-cyan-400 to-cyan-600' },
      { id: 'r3', layer: 'backend', icon: Zap, label: 'FastAPI Receives File', detail: 'Saves to temp storage, triggers RAG pipeline', duration: 800, color: 'from-green-400 to-green-600' },
      { id: 'r4', layer: 'backend', icon: BookOpen, label: 'PyPDF Extracts Text', detail: 'PyPDFLoader reads 3 pages → 4,200 characters of raw text', duration: 1200, color: 'from-teal-400 to-teal-600' },
      { id: 'r5', layer: 'backend', icon: Scissors, label: 'Text Splitter Chunks', detail: 'RecursiveCharacterTextSplitter → 5 chunks × 1000 chars (200 overlap)', duration: 1100, color: 'from-emerald-400 to-emerald-600' },
      { id: 'r6', layer: 'ai', icon: Binary, label: 'OpenAI Creates Embeddings', detail: 'text-embedding-3-small converts each chunk → [1536 numbers]', duration: 1300, color: 'from-violet-400 to-violet-600' },
      { id: 'r7', layer: 'database', icon: HardDrive, label: 'FAISS Stores Vectors', detail: '5 vectors stored in FAISS index with metadata (page, chunk_id)', duration: 1000, color: 'from-indigo-400 to-indigo-600' },
      { id: 'r8', layer: 'frontend', icon: Search, label: 'User Asks Question', detail: 'You type: "What is my sugar level?"', duration: 1000, color: 'from-blue-400 to-blue-600' },
      { id: 'r9', layer: 'ai', icon: Binary, label: 'Query Embedded', detail: '"What is my sugar level?" → [0.34, -0.12, 0.89, ...] (1536-dim)', duration: 1100, color: 'from-violet-400 to-violet-600' },
      { id: 'r10', layer: 'database', icon: ScanSearch, label: 'FAISS Similarity Search', detail: 'Cosine similarity finds top 3 chunks: scores [0.92, 0.85, 0.71]', duration: 1200, color: 'from-indigo-400 to-indigo-600' },
      { id: 'r11', layer: 'ai', icon: Brain, label: 'GPT-4 + Context', detail: 'System prompt + retrieved chunks + question → GPT-4 generates answer', duration: 1500, color: 'from-purple-400 to-purple-600' },
      { id: 'r12', layer: 'frontend', icon: MessageSquare, label: 'Answer Displayed', detail: 'React renders the personalized response with report data', duration: 1000, color: 'from-blue-400 to-blue-600' },
      { id: 'r13', layer: 'response', icon: CheckCircle2, label: 'User Sees Personalized Answer', detail: '"Your fasting blood sugar is 126 mg/dL (slightly elevated)..."', duration: 1200, color: 'from-emerald-400 to-emerald-600' },
    ],
    finalOutput: '"Based on your uploaded blood report, your fasting blood sugar is 126 mg/dL, which is slightly above the normal range (70-100 mg/dL). This falls in the pre-diabetic range. Your HbA1c is 6.2%, confirming pre-diabetic status."',
  },
  'vector-db': {
    title: 'VectorDB Live Test: Similarity Search',
    description: 'See how FAISS finds the most relevant information using vector math',
    userInput: '"Does my report show any heart issues?"',
    steps: [
      { id: 'v1', layer: 'frontend', icon: Search, label: 'User Asks Question', detail: '"Does my report show any heart issues?"', duration: 1000, color: 'from-blue-400 to-blue-600' },
      { id: 'v2', layer: 'backend', icon: Zap, label: 'Backend Receives Query', detail: 'FastAPI routes to RAG query endpoint', duration: 800, color: 'from-green-400 to-green-600' },
      { id: 'v3', layer: 'ai', icon: Binary, label: 'Query → Vector', detail: '"heart issues" → [0.45, -0.23, 0.78, 0.12, ...] (1536 dimensions)', duration: 1200, color: 'from-violet-400 to-violet-600' },
      { id: 'v4', layer: 'database', icon: BarChart3, label: 'FAISS Loads Index', detail: 'In-memory index with 127 stored vectors from all uploaded reports', duration: 900, color: 'from-indigo-400 to-indigo-600' },
      { id: 'v5', layer: 'database', icon: Activity, label: 'Cosine Similarity Calc', detail: 'Compares query vector against all 127 vectors → angle measurement', duration: 1300, color: 'from-blue-400 to-indigo-600' },
      { id: 'v6', layer: 'database', icon: Trophy, label: 'Top-K Results Ranked', detail: '#1: "Cholesterol: 245mg..." (0.94)\n#2: "ECG results normal..." (0.89)\n#3: "Blood pressure 140/90..." (0.83)', duration: 1400, color: 'from-amber-400 to-amber-600' },
      { id: 'v7', layer: 'backend', icon: FileText, label: 'Context Built', detail: 'Top 3 chunks concatenated as context for the LLM prompt', duration: 900, color: 'from-green-400 to-green-600' },
      { id: 'v8', layer: 'ai', icon: Brain, label: 'GPT-4 Reads Context', detail: 'LLM sees: system prompt + "CONTEXT: [3 chunks]" + your question', duration: 1400, color: 'from-purple-400 to-purple-600' },
      { id: 'v9', layer: 'frontend', icon: MessageSquare, label: 'Answer Rendered', detail: 'Response includes specific values from YOUR reports', duration: 1000, color: 'from-blue-400 to-blue-600' },
      { id: 'v10', layer: 'response', icon: CheckCircle2, label: 'Personalized Heart Report', detail: '"Your cholesterol is 245 mg/dL (elevated). ECG is normal. BP 140/90 (stage 1 hypertension)."', duration: 1200, color: 'from-emerald-400 to-emerald-600' },
    ],
    finalOutput: '"Your cholesterol is 245 mg/dL (above normal 200). ECG results are normal. Blood pressure is 140/90 mmHg, indicating Stage 1 hypertension. I recommend consulting a cardiologist for further evaluation."',
  },
  'langchain': {
    title: 'LangChain Live Test: The AI Glue',
    description: 'See how LangChain connects all the pieces into one working pipeline',
    userInput: 'User sends "Analyze my symptoms: chest tightness and shortness of breath"',
    steps: [
      { id: 'lc1', layer: 'frontend', icon: MessageSquare, label: 'User Sends Message', detail: '"Analyze my symptoms: chest tightness and shortness of breath"', duration: 1000, color: 'from-blue-400 to-blue-600' },
      { id: 'lc2', layer: 'backend', icon: Zap, label: 'FastAPI → LangChain', detail: 'medical_agent.py initializes LangChain components', duration: 900, color: 'from-green-400 to-green-600' },
      { id: 'lc3', layer: 'ai', icon: Settings2, label: 'ChatOpenAI Initialized', detail: 'ChatOpenAI(model="gpt-4", temperature=0.3, max_tokens=2000)', duration: 1000, color: 'from-teal-400 to-teal-600' },
      { id: 'lc4', layer: 'ai', icon: FileText, label: 'PromptTemplate Built', detail: 'SystemMessage("You are MedAI...") + HumanMessage(user_input)', duration: 1100, color: 'from-cyan-400 to-cyan-600' },
      { id: 'lc5', layer: 'ai', icon: Binary, label: 'OpenAIEmbeddings Called', detail: 'Embeds query for RAG: text-embedding-3-small → 1536-dim vector', duration: 1200, color: 'from-violet-400 to-violet-600' },
      { id: 'lc6', layer: 'database', icon: HardDrive, label: 'FAISS.similarity_search()', detail: 'LangChain\'s FAISS wrapper finds k=4 relevant document chunks', duration: 1100, color: 'from-indigo-400 to-indigo-600' },
      { id: 'lc7', layer: 'ai', icon: Link, label: 'Chain Assembled', detail: 'prompt | llm | output_parser — LangChain pipes data through', duration: 1000, color: 'from-teal-400 to-teal-600' },
      { id: 'lc8', layer: 'ai', icon: Brain, label: 'LLM Chain Executes', detail: 'ChatOpenAI.invoke() sends to OpenAI API, receives response stream', duration: 1500, color: 'from-purple-400 to-purple-600' },
      { id: 'lc9', layer: 'backend', icon: Package, label: 'Output Parser Structures', detail: 'JSON output parser extracts: conditions, risk_level, recommendations', duration: 1000, color: 'from-green-400 to-green-600' },
      { id: 'lc10', layer: 'frontend', icon: Palette, label: 'React Renders Response', detail: 'Structured data → HealthCards, risk badges, recommendation list', duration: 1000, color: 'from-blue-400 to-blue-600' },
      { id: 'lc11', layer: 'response', icon: CheckCircle2, label: 'Complete Structured Output', detail: 'Cards show: conditions, severity, specialists, and action items', duration: 1200, color: 'from-emerald-400 to-emerald-600' },
    ],
    finalOutput: '{ "conditions": ["Possible angina", "Asthma/COPD", "Anxiety"], "risk_level": "moderate", "specialists": ["Cardiologist", "Pulmonologist"], "recommendations": ["ECG test", "Chest X-ray", "Spirometry"] }',
  },
  'langgraph': {
    title: 'LangGraph Live Test: Multi-Node Workflow',
    description: 'Watch data flow through the 3-node graph: Analyze → Enrich → Respond',
    userInput: '"I\'ve been having persistent stomach pain and nausea for 3 days"',
    steps: [
      { id: 'lg1', layer: 'frontend', icon: Stethoscope, label: 'User Describes Symptoms', detail: '"Persistent stomach pain and nausea for 3 days"', duration: 1000, color: 'from-blue-400 to-blue-600' },
      { id: 'lg2', layer: 'backend', icon: Zap, label: 'FastAPI Triggers Agent', detail: 'medical_agent.run_workflow(message, user_location)', duration: 900, color: 'from-green-400 to-green-600' },
      { id: 'lg3', layer: 'ai', icon: BarChart3, label: 'StateGraph Initialized', detail: 'State = { message, analysis: null, enrichment: null, response: null }', duration: 1100, color: 'from-orange-400 to-orange-600' },
      { id: 'lg4', layer: 'ai', icon: Search, label: '→ NODE 1: Analyze', detail: 'GPT-4 with ANALYSIS_PROMPT → identifies gastritis, food poisoning, peptic ulcer', duration: 1800, color: 'from-orange-500 to-red-500' },
      { id: 'lg5', layer: 'ai', icon: FileText, label: 'Analysis JSON Output', detail: '{ conditions: [...], risk: "moderate", specialists: ["Gastroenterologist"] }', duration: 1000, color: 'from-orange-400 to-orange-600' },
      { id: 'lg6', layer: 'ai', icon: ArrowRight, label: 'Edge: analyze → enrich', detail: 'State updated. Analysis result flows to next node via state object', duration: 800, color: 'from-amber-400 to-amber-600' },
      { id: 'lg7', layer: 'ai', icon: Globe, label: '→ NODE 2: Enrich', detail: 'GPT-4 with ENRICHMENT_PROMPT → finds hospitals near user + medicines', duration: 1800, color: 'from-red-500 to-rose-600' },
      { id: 'lg8', layer: 'ai', icon: Pill, label: 'Enrichment Output', detail: 'Hospitals: [Apollo, AIIMS] with Maps links. Medicines: [Pantoprazole, Domperidone]', duration: 1200, color: 'from-red-400 to-red-600' },
      { id: 'lg9', layer: 'ai', icon: ArrowRight, label: 'Edge: enrich → respond', detail: 'State now has analysis + enrichment. Flows to final node.', duration: 800, color: 'from-amber-400 to-amber-600' },
      { id: 'lg10', layer: 'ai', icon: MessageSquare, label: '→ NODE 3: Respond', detail: 'GPT-4 with RESPONSE_PROMPT → generates empathetic, comprehensive reply', duration: 1600, color: 'from-emerald-500 to-green-600' },
      { id: 'lg11', layer: 'backend', icon: Package, label: 'Final State Returned', detail: 'Complete state object with all 3 node outputs sent to frontend', duration: 900, color: 'from-green-400 to-green-600' },
      { id: 'lg12', layer: 'frontend', icon: Palette, label: 'React Renders All Data', detail: 'Chat message + Hospital cards + Medicine cards + Risk badge', duration: 1000, color: 'from-blue-400 to-blue-600' },
      { id: 'lg13', layer: 'response', icon: CheckCircle2, label: 'Full AI Doctor Response', detail: 'Empathetic message + conditions + hospitals with maps + medicines with links', duration: 1200, color: 'from-emerald-400 to-emerald-600' },
    ],
    finalOutput: '"I understand stomach pain and nausea for 3 days is concerning. Possible causes include gastritis, food poisoning, or peptic ulcer.\n\nNearby: Apollo Hospital (2.3km), AIIMS (5.1km)\nConsider: Pantoprazole 40mg, Domperidone 10mg\n\nPlease see a Gastroenterologist within 24-48 hours."',
  },
  'prompt-engineering': {
    title: 'Prompt Engineering Live Test: 3 System Prompts',
    description: 'See how 3 different prompts produce 3 different outputs from the SAME model',
    userInput: 'Same input → 3 different system prompts → 3 different outputs',
    steps: [
      { id: 'pe1', layer: 'frontend', icon: MessageSquare, label: 'User Input (Same for All)', detail: '"I have been coughing for a week"', duration: 1000, color: 'from-blue-400 to-blue-600' },
      { id: 'pe2', layer: 'backend', icon: FileText, label: 'Prompt 1: MEDICAL_CHAT', detail: '"You are MedAI, an empathetic healthcare assistant. Be warm, helpful..."', duration: 1100, color: 'from-pink-400 to-pink-600' },
      { id: 'pe3', layer: 'ai', icon: Brain, label: 'GPT-4 Response (Chat)', detail: '"I\'m sorry to hear about your cough. A week-long cough could be..." — warm, conversational', duration: 1400, color: 'from-pink-500 to-rose-600' },
      { id: 'pe4', layer: 'backend', icon: FileText, label: 'Prompt 2: ANALYSIS_JSON', detail: '"Respond with ONLY a valid JSON object. Analyze symptoms..."', duration: 1100, color: 'from-orange-400 to-orange-600' },
      { id: 'pe5', layer: 'ai', icon: Brain, label: 'GPT-4 Response (JSON)', detail: '{"conditions": ["bronchitis","post-nasal drip"], "risk": "low"} — structured data', duration: 1400, color: 'from-orange-500 to-amber-600' },
      { id: 'pe6', layer: 'backend', icon: FileText, label: 'Prompt 3: ENRICHMENT', detail: '"Suggest hospitals near the user and medicines. Include Google Maps links..."', duration: 1100, color: 'from-teal-400 to-teal-600' },
      { id: 'pe7', layer: 'ai', icon: Brain, label: 'GPT-4 Response (Enriched)', detail: '{"hospitals": [...], "medicines": [...]} — actionable recommendations with links', duration: 1400, color: 'from-teal-500 to-cyan-600' },
      { id: 'pe8', layer: 'backend', icon: Link, label: 'All 3 Outputs Combined', detail: 'Chat + Analysis + Enrichment merged into one comprehensive response', duration: 1000, color: 'from-green-400 to-green-600' },
      { id: 'pe9', layer: 'frontend', icon: Palette, label: 'React Renders Combined', detail: 'Empathetic message + structured cards + hospital/medicine links', duration: 1000, color: 'from-blue-400 to-blue-600' },
      { id: 'pe10', layer: 'response', icon: CheckCircle2, label: 'Prompt Engineering Magic', detail: 'Same model, same input → 3 different outputs, all useful!', duration: 1200, color: 'from-emerald-400 to-emerald-600' },
    ],
    finalOutput: 'SAME model + SAME input, but:\n• Chat prompt → warm empathetic response\n• JSON prompt → structured analysis data\n• Enrichment prompt → hospitals & medicines with links\n\nThe prompt IS the program!',
  },
  'full-architecture': {
    title: 'Full Architecture Live Test: End-to-End Flow',
    description: 'Watch the complete journey from user click to AI response — every component',
    userInput: '"What does my latest blood report say about my kidney function?"',
    steps: [
      { id: 'a1', layer: 'frontend', icon: Monitor, label: 'React: User Types Message', detail: 'ChatInput.tsx captures text, validates, shows typing indicator', duration: 1000, color: 'from-cyan-400 to-cyan-600' },
      { id: 'a2', layer: 'frontend', icon: Globe, label: 'React: API Call Sent', detail: 'api.ts → fetch(VITE_API_URL + "/api/chat") with JWT auth token', duration: 900, color: 'from-blue-400 to-blue-600' },
      { id: 'a3', layer: 'backend', icon: Zap, label: 'FastAPI: Route Handler', detail: 'main.py: @app.post("/api/chat") — validates auth, extracts user', duration: 900, color: 'from-green-400 to-green-600' },
      { id: 'a4', layer: 'backend', icon: Database, label: 'SQLite: Load History', detail: 'database.py fetches last 10 messages for conversation context', duration: 800, color: 'from-green-500 to-emerald-600' },
      { id: 'a5', layer: 'backend', icon: FileText, label: 'RAG Engine: Check Reports', detail: 'rag_engine.py checks if user has uploaded medical reports', duration: 900, color: 'from-teal-400 to-teal-600' },
      { id: 'a6', layer: 'ai', icon: Binary, label: 'OpenAI: Embed Query', detail: 'text-embedding-3-small embeds "kidney function" query', duration: 1100, color: 'from-violet-400 to-violet-600' },
      { id: 'a7', layer: 'database', icon: ScanSearch, label: 'FAISS: Vector Search', detail: 'Finds chunks about creatinine, BUN, eGFR from blood report', duration: 1200, color: 'from-indigo-400 to-indigo-600' },
      { id: 'a8', layer: 'ai', icon: BarChart3, label: 'LangGraph: Node 1 (Analyze)', detail: 'Analyzes kidney values from retrieved chunks → JSON output', duration: 1500, color: 'from-orange-400 to-orange-600' },
      { id: 'a9', layer: 'ai', icon: Globe, label: 'LangGraph: Node 2 (Enrich)', detail: 'Finds nephrologists nearby + relevant supplements/medicines', duration: 1500, color: 'from-red-400 to-red-600' },
      { id: 'a10', layer: 'ai', icon: MessageSquare, label: 'LangGraph: Node 3 (Respond)', detail: 'Generates friendly response combining analysis + enrichment + context', duration: 1500, color: 'from-emerald-400 to-emerald-600' },
      { id: 'a11', layer: 'backend', icon: HardDrive, label: 'SQLite: Save to History', detail: 'database.py saves both user message and AI response', duration: 800, color: 'from-green-400 to-green-600' },
      { id: 'a12', layer: 'backend', icon: Globe, label: 'FastAPI: JSON Response', detail: 'Returns { response, analysis, hospitals, medicines, sources }', duration: 800, color: 'from-green-500 to-emerald-600' },
      { id: 'a13', layer: 'frontend', icon: Palette, label: 'React: Render Response', detail: 'ChatMessage + HealthCard + HospitalCard + MedicineCard components', duration: 1000, color: 'from-blue-400 to-blue-600' },
      { id: 'a14', layer: 'response', icon: CheckCircle2, label: 'Complete AI Doctor Response', detail: 'Personalized kidney analysis with hospitals, medicines, and recommendations', duration: 1200, color: 'from-emerald-400 to-emerald-600' },
    ],
    finalOutput: '"Your creatinine is 1.4 mg/dL (slightly elevated, normal: 0.7-1.3). eGFR is 58 mL/min (mild decrease). BUN is 24 mg/dL (normal).\n\nNearby Nephrologists: Apollo Nephrology (1.8km)\nRecommend: Increase water intake, reduce sodium\nFollow-up kidney function test in 3 months."',
  },
}

/* ══════════════════════════════════════════════════════════
   LEARNING MODULES — AI / ML TECH STACK
   ══════════════════════════════════════════════════════════ */

const MODULES: LearningModule[] = [
  {
    id: 'llm-basics', title: 'What are LLMs?',
    description: 'Large Language Models — the brain behind ChatGPT, GPT-4, and this app.',
    icon: Brain, gradient: 'from-violet-500 to-purple-600', glow: 'shadow-violet-500/20',
    category: 'Foundation', unlocked: true, xpReward: 200,
    liveTestScenario: LIVE_TESTS['llm-basics'],
    lessons: [
      {
        id: 'llm-intro', title: 'LLMs Explained Simply',
        content: `Imagine a super-smart autocomplete that has read the entire internet. That's basically what a Large Language Model (LLM) is!\n\nAn LLM is a type of AI trained on massive amounts of text data — books, websites, code, conversations — to understand and generate human-like text. Models like GPT-4, Claude, and LLaMA are all LLMs.\n\n**How does it work?** During training, the model learns patterns in language: grammar, facts, reasoning patterns, and even coding. When you ask it a question, it doesn't "look up" an answer — it predicts the most likely next words based on patterns it learned.\n\n**Key concept: Tokens.** LLMs don't read words — they read "tokens" (word pieces). "Healthcare" might be split into "Health" + "care". GPT-4 can handle ~128,000 tokens in one conversation (its "context window").\n\n**In this app:** When you chat with the AI Doctor, your message goes to GPT-4 (an LLM) via the OpenAI API. The LLM generates a medical response based on your symptoms.`,
        keyPoints: ['LLMs are AI models trained on massive text data', 'They predict the next most likely token (word piece)', 'GPT-4, Claude, LLaMA are examples of LLMs', 'Context window = how much text the LLM can "see" at once', 'This app uses GPT-4 via OpenAI API as its LLM'],
        xpReward: 60,
        flowDiagram: [
          { label: 'Your Message', icon: MessageSquare, description: '"I have a headache"', color: 'from-blue-400 to-blue-600' },
          { label: 'Tokenizer', icon: Scissors, description: 'Splits into tokens', color: 'from-violet-400 to-violet-600' },
          { label: 'LLM (GPT-4)', icon: Brain, description: 'Predicts best response', color: 'from-purple-400 to-purple-600' },
          { label: 'AI Response', icon: Bot, description: 'Generated text output', color: 'from-emerald-400 to-emerald-600' },
        ],
        quiz: [
          { id: 'llm-q1', question: 'What does LLM stand for?', options: ['Large Learning Machine', 'Large Language Model', 'Linear Logic Module', 'Language Learning Method'], correct: 1, explanation: 'LLM stands for Large Language Model — a type of AI that understands and generates human language.', difficulty: 'easy', category: 'LLM' },
          { id: 'llm-q2', question: 'What are "tokens" in the context of LLMs?', options: ['Cryptocurrency coins', 'Word pieces the model reads', 'API keys', 'Training examples'], correct: 1, explanation: 'Tokens are word pieces. LLMs split text into tokens before processing.', difficulty: 'easy', category: 'LLM' },
          { id: 'llm-q3', question: 'What is a "context window"?', options: ['The screen size', 'Maximum tokens the LLM can process at once', 'The training dataset size', 'A browser window'], correct: 1, explanation: 'The context window is the maximum number of tokens an LLM can handle in a single conversation.', difficulty: 'medium', category: 'LLM' },
        ],
      },
      {
        id: 'llm-temperature', title: 'Temperature, Prompts & Parameters',
        content: `When you send a message to an LLM, you can control HOW it responds using parameters.\n\n**Temperature (0.0 – 2.0):** Controls randomness. Temperature 0 = very focused, deterministic answers (good for medical advice). Temperature 1+ = creative, varied answers (good for brainstorming). This app uses low temperature for accurate medical responses.\n\n**System Prompt:** A hidden instruction that sets the AI's personality and rules. In this app, the system prompt tells the AI: "You are MedAI, an advanced healthcare assistant. Never diagnose definitively. Always recommend seeing a real doctor."\n\n**Max Tokens:** Limits how long the response can be.\n\n**Top-P (Nucleus Sampling):** Another way to control randomness — limits which tokens the model considers.`,
        keyPoints: ['Temperature controls randomness (0 = focused, 1+ = creative)', 'System Prompt defines the AI\'s role and rules', 'Max Tokens limits response length', 'This app uses low temperature for medical accuracy'],
        xpReward: 50,
        quiz: [
          { id: 'llm-t1', question: 'What does a temperature of 0 produce?', options: ['Random creative text', 'Focused deterministic answers', 'No output', 'Only code'], correct: 1, explanation: 'Temperature 0 makes the model very deterministic.', difficulty: 'easy', category: 'LLM' },
          { id: 'llm-t2', question: 'What is a System Prompt?', options: ['The user\'s question', 'Hidden instructions defining AI behavior', 'The model\'s training data', 'An error message'], correct: 1, explanation: 'A System Prompt is a hidden instruction sent before the user\'s message.', difficulty: 'medium', category: 'LLM' },
        ],
      },
    ],
  },
  {
    id: 'rag-pipeline', title: 'RAG — Retrieval Augmented Generation',
    description: 'How the app reads your medical reports and gives personalized answers.',
    icon: Search, gradient: 'from-emerald-500 to-teal-600', glow: 'shadow-emerald-500/20',
    category: 'Core Architecture', unlocked: true, xpReward: 300,
    liveTestScenario: LIVE_TESTS['rag-pipeline'],
    lessons: [{
      id: 'rag-intro', title: 'What is RAG & Why We Need It',
      content: `LLMs are smart, but they have a big limitation: they only know what they were trained on. They can't read YOUR medical report.\n\n**RAG (Retrieval Augmented Generation)** solves this. It's a technique where you first RETRIEVE relevant documents, then feed them to the LLM to GENERATE a response.\n\n**In this app:** When you upload a medical report (PDF), the RAG engine:\n1. Extracts text from the PDF\n2. Splits it into small chunks (1000 characters each)\n3. Converts chunks into vector embeddings\n4. Stores them in a FAISS vector database\n5. When you ask a question, it finds the most relevant chunks\n6. Sends those chunks + your question to GPT-4`,
      keyPoints: ['RAG = Retrieve relevant docs → Feed to LLM → Generate answer', 'Solves the problem of LLMs not knowing your private data', 'Only retrieves RELEVANT chunks, not entire documents', 'This app uses RAG to analyze your uploaded medical reports'],
      xpReward: 70,
      flowDiagram: [
        { label: 'Upload PDF', icon: FileText, description: 'Your medical report', color: 'from-blue-400 to-blue-600' },
        { label: 'Extract Text', icon: FileText, description: 'PyPDF reads pages', color: 'from-cyan-400 to-cyan-600' },
        { label: 'Split Chunks', icon: Scissors, description: '1000-char pieces', color: 'from-teal-400 to-teal-600' },
        { label: 'Embed Vectors', icon: Binary, description: 'Convert to numbers', color: 'from-emerald-400 to-emerald-600' },
        { label: 'Store in FAISS', icon: HardDrive, description: 'Vector database', color: 'from-green-400 to-green-600' },
        { label: 'User Question', icon: Search, description: '"What\'s my sugar level?"', color: 'from-amber-400 to-amber-600' },
        { label: 'Retrieve Top Chunks', icon: ScanSearch, description: 'Find relevant info', color: 'from-orange-400 to-orange-600' },
        { label: 'LLM + Context', icon: Brain, description: 'GPT-4 generates answer', color: 'from-purple-400 to-purple-600' },
      ],
      quiz: [
        { id: 'rag-q1', question: 'What does RAG stand for?', options: ['Random Access Generation', 'Retrieval Augmented Generation', 'Rapid AI Growth', 'Recursive Algorithm Graph'], correct: 1, explanation: 'RAG = Retrieval Augmented Generation.', difficulty: 'easy', category: 'RAG' },
        { id: 'rag-q2', question: 'Why do we need RAG instead of pasting entire documents?', options: ['It\'s faster to type', 'Documents may be too large for the context window', 'LLMs can\'t read PDFs', 'For fun'], correct: 1, explanation: 'Documents can be too large for the LLM\'s context window.', difficulty: 'medium', category: 'RAG' },
        { id: 'rag-q3', question: 'In this app, what happens first when you upload a medical report?', options: ['It sends to GPT-4 directly', 'Text is extracted, chunked, embedded, and stored in FAISS', 'It prints the PDF', 'Nothing happens'], correct: 1, explanation: 'The RAG pipeline extracts text → splits into chunks → embeds → stores in FAISS.', difficulty: 'medium', category: 'RAG' },
      ],
    }],
  },
  {
    id: 'vector-db', title: 'Vector Database & Embeddings',
    description: 'How text becomes numbers and how FAISS finds similar content instantly.',
    icon: Database, gradient: 'from-blue-500 to-indigo-600', glow: 'shadow-blue-500/20',
    category: 'Data Layer', unlocked: true, xpReward: 300,
    liveTestScenario: LIVE_TESTS['vector-db'],
    lessons: [
      {
        id: 'embeddings-explained', title: 'Embeddings — Turning Words into Numbers',
        content: `Computers can't understand words directly. They need numbers. **Embeddings** convert text into arrays of numbers (vectors) that capture meaning.\n\n**How it works:** "I have chest pain" might become [0.23, -0.87, 0.45, ...] — a list of 1536 numbers. Similar meanings produce similar vectors:\n\n• "chest pain" → [0.23, -0.87, 0.45, ...]\n• "heart ache" → [0.25, -0.85, 0.44, ...] (very similar!)\n• "pizza recipe" → [-0.91, 0.12, 0.78, ...] (very different!)\n\n**In this app:** We use OpenAI's "text-embedding-3-small" model. Each chunk becomes a 1536-dimensional vector.`,
        keyPoints: ['Embeddings convert text to numerical vectors', 'Similar meanings → similar vectors', 'OpenAI\'s model produces 1536-dimensional vectors', 'This app uses "text-embedding-3-small"'],
        xpReward: 70,
        flowDiagram: [
          { label: 'Text Input', icon: FileText, description: '"chest pain symptoms"', color: 'from-blue-400 to-blue-600' },
          { label: 'Embedding Model', icon: RotateCcw, description: 'text-embedding-3-small', color: 'from-indigo-400 to-indigo-600' },
          { label: 'Vector Output', icon: Binary, description: '[0.23, -0.87, 0.45, ...]', color: 'from-violet-400 to-violet-600' },
          { label: 'Store in DB', icon: HardDrive, description: 'FAISS vector store', color: 'from-purple-400 to-purple-600' },
        ],
        quiz: [
          { id: 'emb-q1', question: 'What are embeddings?', options: ['Images of text', 'Numerical vectors representing meaning', 'Compressed ZIP files', 'Database tables'], correct: 1, explanation: 'Embeddings are numerical vectors that capture semantic meaning.', difficulty: 'easy', category: 'Embeddings' },
          { id: 'emb-q2', question: 'If "chest pain" and "heart ache" have similar embeddings, what does that mean?', options: ['They\'re the same word', 'They have similar meaning', 'It\'s a bug', 'They were written by the same person'], correct: 1, explanation: 'Similar embeddings mean similar semantic meaning.', difficulty: 'easy', category: 'Embeddings' },
          { id: 'emb-q3', question: 'How many dimensions does OpenAI\'s text-embedding-3-small produce?', options: ['3', '256', '1536', '10000'], correct: 2, explanation: 'OpenAI\'s text-embedding-3-small produces 1536 dimensions.', difficulty: 'medium', category: 'Embeddings' },
        ],
      },
      {
        id: 'faiss-vectordb', title: 'FAISS — The Lightning-Fast Vector Database',
        content: `Now that we have vectors, we need to SEARCH them fast. **FAISS** (Facebook AI Similarity Search) — a vector database built by Meta.\n\n**The problem:** 10,000 chunks. A user asks a question. Find the 5 most relevant in milliseconds.\n\n**How FAISS works:** Your question is converted to a vector, then FAISS finds the stored vectors closest to it using cosine similarity.\n\n**Cosine Similarity:** Measures the angle between two vectors. Same direction = similar (score ~1.0). Opposite = dissimilar (~-1.0).`,
        keyPoints: ['FAISS = Facebook AI Similarity Search', 'Finds similar vectors blazingly fast', 'Uses cosine similarity', 'This app stores report embeddings in FAISS'],
        xpReward: 60,
        flowDiagram: [
          { label: 'Question', icon: Search, description: '"My blood sugar?"', color: 'from-amber-400 to-amber-600' },
          { label: 'Embed Query', icon: Binary, description: 'Convert to vector', color: 'from-blue-400 to-blue-600' },
          { label: 'FAISS Search', icon: Zap, description: 'Find nearest vectors', color: 'from-indigo-400 to-indigo-600' },
          { label: 'Top-K Results', icon: Target, description: 'Most relevant chunks', color: 'from-emerald-400 to-emerald-600' },
        ],
        quiz: [
          { id: 'faiss-q1', question: 'What does FAISS stand for?', options: ['Fast AI Search System', 'Facebook AI Similarity Search', 'File Access Index Storage', 'Federated AI Search Service'], correct: 1, explanation: 'FAISS = Facebook AI Similarity Search.', difficulty: 'easy', category: 'VectorDB' },
          { id: 'faiss-q2', question: 'What does cosine similarity measure?', options: ['File size', 'The angle between two vectors', 'Processing speed', 'Token count'], correct: 1, explanation: 'Cosine similarity measures the angle between two vectors.', difficulty: 'medium', category: 'VectorDB' },
        ],
      },
    ],
  },
  {
    id: 'langchain', title: 'LangChain — The AI Framework',
    description: 'The glue that connects LLMs, tools, memory, and data sources together.',
    icon: Layers, gradient: 'from-teal-500 to-cyan-600', glow: 'shadow-teal-500/20',
    category: 'Framework', unlocked: true, xpReward: 250,
    liveTestScenario: LIVE_TESTS['langchain'],
    lessons: [{
      id: 'langchain-intro', title: 'LangChain — Building Blocks of AI Apps',
      content: `Building an AI app isn't just "call GPT-4." You need prompts, chains, memory, databases. That's what **LangChain** does.\n\n**LangChain** provides:\n• **Chat Models:** ChatOpenAI, ChatAnthropic\n• **Prompts:** Templates for messages\n• **Output Parsers:** AI output → structured JSON\n• **Text Splitters:** Break docs into chunks\n• **Embeddings:** Text → vectors\n• **Vector Stores:** FAISS, Pinecone, Chroma\n• **Chains:** Connect steps together\n• **Memory:** Remember conversation history\n\n**In this app:** LangChain connects everything — ChatOpenAI talks to GPT-4, RecursiveCharacterTextSplitter chunks PDFs, OpenAIEmbeddings creates vectors, FAISS stores them.`,
      keyPoints: ['LangChain = framework for building AI applications', 'Provides: Chat Models, Prompts, Splitters, Embeddings, VectorStores', 'Like LEGO blocks for AI', 'This app uses LangChain for the entire pipeline'],
      xpReward: 60,
      flowDiagram: [
        { label: 'ChatOpenAI', icon: MessageSquare, description: 'Talks to GPT-4', color: 'from-teal-400 to-teal-600' },
        { label: 'TextSplitter', icon: Scissors, description: 'Chunks documents', color: 'from-cyan-400 to-cyan-600' },
        { label: 'Embeddings', icon: Binary, description: 'Text → Vectors', color: 'from-blue-400 to-blue-600' },
        { label: 'FAISS Store', icon: HardDrive, description: 'Vector search', color: 'from-indigo-400 to-indigo-600' },
      ],
      quiz: [
        { id: 'lc-q1', question: 'What is LangChain?', options: ['A blockchain protocol', 'A framework for building AI applications', 'A programming language', 'A chat app'], correct: 1, explanation: 'LangChain is a Python/JS framework for building AI applications.', difficulty: 'easy', category: 'LangChain' },
        { id: 'lc-q2', question: 'Which LangChain component splits documents into chunks?', options: ['ChatOpenAI', 'RecursiveCharacterTextSplitter', 'FAISS', 'OutputParser'], correct: 1, explanation: 'RecursiveCharacterTextSplitter breaks documents into chunks.', difficulty: 'medium', category: 'LangChain' },
        { id: 'lc-q3', question: 'What does ChatOpenAI do in LangChain?', options: ['Stores vectors', 'Wraps the OpenAI API to talk to GPT models', 'Splits text', 'Creates embeddings'], correct: 1, explanation: 'ChatOpenAI wraps the OpenAI API.', difficulty: 'easy', category: 'LangChain' },
      ],
    }],
  },
  {
    id: 'langgraph', title: 'LangGraph — AI Workflows & Agents',
    description: 'How the app uses multi-step reasoning with stateful AI workflows.',
    icon: GitBranch, gradient: 'from-orange-500 to-red-600', glow: 'shadow-orange-500/20',
    category: 'Orchestration', unlocked: true, xpReward: 350,
    liveTestScenario: LIVE_TESTS['langgraph'],
    lessons: [{
      id: 'langgraph-intro', title: 'LangGraph — Thinking in Graphs',
      content: `Sometimes one LLM call isn't enough. This app runs a **multi-step workflow**:\n\n1. **Analyze symptoms** → Identify possible conditions\n2. **Enrich with context** → Find hospitals, medicines, links\n3. **Generate response** → Combine everything\n\n**LangGraph** builds **stateful, multi-step AI workflows** as graphs.\n\n**Graph = Nodes + Edges**\n• **Nodes** = Processing steps (each can call an LLM)\n• **Edges** = Connections between nodes\n• **State** = Shared data flowing through all nodes\n\n**In this app:** Node 1 (Analyze) → Node 2 (Enrich) → Node 3 (Respond)`,
      keyPoints: ['LangGraph builds multi-step AI workflows as graphs', 'Nodes = processing steps, Edges = connections, State = shared data', 'This app uses 3 nodes: Analyze → Enrich → Respond', 'Each node can call GPT-4 independently'],
      xpReward: 80,
      flowDiagram: [
        { label: 'User Symptoms', icon: Stethoscope, description: '"I have headaches"', color: 'from-blue-400 to-blue-600' },
        { label: 'Node 1: Analyze', icon: Search, description: 'Identify conditions', color: 'from-orange-400 to-orange-600' },
        { label: 'Node 2: Enrich', icon: Globe, description: 'Hospitals + medicines', color: 'from-red-400 to-red-600' },
        { label: 'Node 3: Respond', icon: MessageSquare, description: 'Friendly final answer', color: 'from-emerald-400 to-emerald-600' },
        { label: 'State Output', icon: CheckCircle2, description: 'Complete AI response', color: 'from-green-400 to-green-600' },
      ],
      quiz: [
        { id: 'lg-q1', question: 'What is LangGraph used for?', options: ['Drawing charts', 'Building multi-step AI workflows', 'Database management', 'CSS styling'], correct: 1, explanation: 'LangGraph builds stateful multi-step AI workflows.', difficulty: 'easy', category: 'LangGraph' },
        { id: 'lg-q2', question: 'In a LangGraph workflow, what are "nodes"?', options: ['Server computers', 'Processing steps (can call LLMs or run code)', 'Database tables', 'API endpoints'], correct: 1, explanation: 'Nodes are individual processing steps.', difficulty: 'medium', category: 'LangGraph' },
        { id: 'lg-q3', question: 'How many nodes does this app\'s medical agent have?', options: ['1', '2', '3', '5'], correct: 2, explanation: 'The medical agent has 3 nodes: Analyze, Enrich, Respond.', difficulty: 'medium', category: 'LangGraph' },
      ],
    }],
  },
  {
    id: 'prompt-engineering', title: 'Prompt Engineering Masterclass',
    description: 'The #1 skill in AI — master system prompts, few-shot, CoT, and output control.',
    icon: MessageSquare, gradient: 'from-pink-500 to-rose-600', glow: 'shadow-pink-500/20',
    category: 'Technique', unlocked: true, xpReward: 400,
    liveTestScenario: LIVE_TESTS['prompt-engineering'],
    lessons: [
      {
        id: 'pe-fundamentals', title: 'Prompt Fundamentals — The Basics',
        content: `**Prompt engineering** is the art and science of writing instructions that guide an AI model to produce exactly the output you need. It is the single most important skill in modern AI development.\n\n**Why does it matter?** The same model (GPT-4) can give wildly different responses depending on how you ask. A vague prompt gets a vague answer. A precise prompt gets a precise answer.\n\n**The anatomy of a good prompt:**\n1. **Role Assignment** — Tell the AI who it is: "You are a board-certified cardiologist."\n2. **Task Description** — Clearly state what you want: "Analyze the following symptoms."\n3. **Constraints** — Set boundaries: "Never diagnose definitively. Always recommend a doctor visit."\n4. **Output Format** — Specify how to respond: "Respond in bullet points" or "Return valid JSON."\n5. **Context** — Provide relevant background: "The patient is 45 years old with a history of hypertension."\n\n**In this app:** Every AI response uses carefully crafted prompts. The MEDICAL_SYSTEM_PROMPT tells the AI to be empathetic, medically knowledgeable, and to always add disclaimers.`,
        keyPoints: [
          'Prompt engineering = writing effective instructions for AI models',
          'Same model + different prompt = completely different output',
          'Five elements: Role, Task, Constraints, Format, Context',
          'Clear and specific prompts produce better, more reliable results',
          'This app uses carefully designed prompts for every AI interaction',
        ],
        xpReward: 60,
        flowDiagram: [
          { label: 'Role', icon: User, description: '"You are MedAI..."', color: 'from-pink-400 to-pink-600' },
          { label: 'Task', icon: Target, description: '"Analyze these symptoms"', color: 'from-rose-400 to-rose-600' },
          { label: 'Constraints', icon: Shield, description: '"Never diagnose definitively"', color: 'from-red-400 to-red-600' },
          { label: 'Format', icon: Braces, description: '"Respond as valid JSON"', color: 'from-orange-400 to-orange-600' },
          { label: 'Context', icon: FileText, description: 'Patient reports + history', color: 'from-amber-400 to-amber-600' },
          { label: 'AI Output', icon: Bot, description: 'Precise, structured answer', color: 'from-emerald-400 to-emerald-600' },
        ],
        quiz: [
          { id: 'pe-f1', question: 'What is prompt engineering?', options: ['Building physical hardware', 'Writing effective instructions for AI models', 'Training a model from scratch on new data', 'Debugging Python code'], correct: 1, explanation: 'Prompt engineering is the art of writing instructions that guide AI models to produce desired outputs.', difficulty: 'easy', category: 'Prompts' },
          { id: 'pe-f2', question: 'Why does the same AI model give different answers to different prompts?', options: ['It has multiple personalities', 'The prompt shapes the context window the model uses to generate tokens', 'It randomly changes behavior', 'Different prompts use different models'], correct: 1, explanation: 'The prompt defines the context, and the model generates tokens conditioned on that context.', difficulty: 'medium', category: 'Prompts' },
          { id: 'pe-f3', question: 'Which of these is NOT one of the five prompt elements?', options: ['Role Assignment', 'Output Format', 'Training Data', 'Constraints'], correct: 2, explanation: 'The five elements are Role, Task, Constraints, Format, and Context. Training data is not part of prompt engineering.', difficulty: 'medium', category: 'Prompts' },
          { id: 'pe-f4', question: 'In this app, what does the MEDICAL_SYSTEM_PROMPT do?', options: ['Trains GPT-4 on medical data', 'Tells the AI its role, rules, and response style', 'Encrypts patient data', 'Runs database queries'], correct: 1, explanation: 'The system prompt defines the AI\'s personality (MedAI), rules (never diagnose definitively), and style (empathetic, accurate).', difficulty: 'easy', category: 'Prompts' },
        ],
      },
      {
        id: 'pe-system-prompts', title: 'System Prompts — Programming the AI',
        content: `A **System Prompt** is a special instruction sent before the user's message. It's invisible to the user but shapes every response the AI gives. Think of it as "programming" the AI's behavior.\n\n**This app uses 3 different system prompts for 3 different tasks:**\n\n**1. MEDICAL_SYSTEM_PROMPT (Chat):**\n"You are MedAI, an advanced AI healthcare assistant. Be empathetic and medically knowledgeable. Never diagnose definitively — always say 'possible' or 'may indicate'. Always include a disclaimer."\nResult: Warm, conversational, safe medical responses.\n\n**2. ANALYSIS_SYSTEM_PROMPT (JSON):**\n"Respond with ONLY a valid JSON object with this exact structure: { conditions: [...], specialists: [...], riskLevel: '...', tests: [...] }"\nResult: Structured data the frontend can parse and render as cards.\n\n**3. ENRICHMENT_SYSTEM_PROMPT (Links):**\n"Suggest hospitals near the user's city with Google Maps links. Suggest medicines with 1mg.com buy links and dosage instructions."\nResult: Actionable recommendations with real links.\n\n**Key insight:** Same model, same user input — but 3 completely different outputs. The system prompt IS the program.`,
        keyPoints: [
          'System prompts are invisible instructions that shape all AI responses',
          'This app uses 3 system prompts: Chat, Analysis (JSON), Enrichment (Links)',
          'Same model + same input + different system prompt = different output',
          'System prompts can enforce output format (JSON, bullet points, etc.)',
          'The system prompt is essentially the "program" for the AI',
        ],
        xpReward: 70,
        flowDiagram: [
          { label: 'User Input', icon: MessageSquare, description: '"I have chest pain"', color: 'from-blue-400 to-blue-600' },
          { label: 'Prompt 1: Chat', icon: Stethoscope, description: 'Empathetic medical reply', color: 'from-pink-400 to-pink-600' },
          { label: 'Prompt 2: JSON', icon: Braces, description: 'Structured analysis data', color: 'from-orange-400 to-orange-600' },
          { label: 'Prompt 3: Enrich', icon: Globe, description: 'Hospitals + medicines', color: 'from-teal-400 to-teal-600' },
          { label: 'Combined Output', icon: CheckCircle2, description: 'Complete AI doctor response', color: 'from-emerald-400 to-emerald-600' },
        ],
        quiz: [
          { id: 'pe-s1', question: 'What is a System Prompt?', options: ['The user\'s typed message', 'Hidden instructions that define AI behavior before the user\'s message', 'A system error message', 'The model\'s training data'], correct: 1, explanation: 'A System Prompt is a hidden instruction sent before the user\'s message to shape the AI\'s behavior.', difficulty: 'easy', category: 'Prompts' },
          { id: 'pe-s2', question: 'How many system prompts does this app use?', options: ['1', '2', '3', '7'], correct: 2, explanation: 'This app uses 3: MEDICAL (chat), ANALYSIS (JSON output), and ENRICHMENT (hospitals/medicines with links).', difficulty: 'medium', category: 'Prompts' },
          { id: 'pe-s3', question: 'Why does the ANALYSIS_SYSTEM_PROMPT say "Respond with ONLY a valid JSON object"?', options: ['To confuse the model', 'To force structured, machine-parseable output the frontend can render as cards', 'JSON is faster than text', 'It doesn\'t actually work'], correct: 1, explanation: 'Forcing JSON output ensures the frontend can programmatically parse the response and render structured UI cards.', difficulty: 'medium', category: 'Prompts' },
          { id: 'pe-s4', question: 'If you send the same user message with 3 different system prompts, what happens?', options: ['The AI ignores the system prompt', 'You get 3 completely different types of responses', 'Only the first prompt works', 'The model crashes'], correct: 1, explanation: 'Different system prompts produce fundamentally different outputs — that\'s the power of prompt engineering.', difficulty: 'easy', category: 'Prompts' },
        ],
      },
      {
        id: 'pe-advanced-techniques', title: 'Advanced Techniques — CoT, Few-Shot, and More',
        content: `Beyond basic prompts, there are powerful techniques that dramatically improve AI output quality.\n\n**1. Chain of Thought (CoT):**\nAdd "Think step by step" or "Reason through this carefully" to your prompt. This makes the model show its reasoning, which improves accuracy — especially for complex medical analysis.\n\nExample: "A patient has high cholesterol and pre-diabetic sugar levels. Think step by step about the risks and recommend a care plan."\n\n**2. Few-Shot Prompting:**\nProvide examples of desired input/output pairs IN the prompt. The AI learns the pattern and follows it.\n\nExample:\nInput: "headache, fever" → Output: { "conditions": ["viral infection", "flu"], "risk": "low" }\nInput: "chest pain, shortness of breath" → Output: { "conditions": ["angina", "anxiety"], "risk": "high" }\nNow analyze: "persistent cough, weight loss"\n\n**3. Negative Prompting (Constraints):**\n"Do NOT include disclaimers in the JSON output." "Never use medical jargon without explaining it." Telling the AI what NOT to do is just as powerful as telling it what to do.\n\n**4. Output Delimiters:**\nUse markers like \`\`\`json ... \`\`\` or XML tags to clearly separate structured output from natural language.\n\n**5. Persona Stacking:**\nCombine multiple roles: "You are both a cardiologist and a data analyst. Provide medical insights AND statistical analysis of the report values."`,
        keyPoints: [
          'Chain of Thought (CoT): "Think step by step" improves accuracy on complex tasks',
          'Few-Shot: Provide input/output examples for the AI to follow the pattern',
          'Negative Prompting: Tell the AI what NOT to do for cleaner output',
          'Output Delimiters: Use markers (JSON, XML) to separate structured data',
          'Persona Stacking: Combine multiple roles for multi-dimensional analysis',
        ],
        xpReward: 80,
        flowDiagram: [
          { label: 'Zero-Shot', icon: Zap, description: 'Just ask the question', color: 'from-blue-400 to-blue-600' },
          { label: 'Few-Shot', icon: Lightbulb, description: 'Provide examples first', color: 'from-amber-400 to-amber-600' },
          { label: 'Chain of Thought', icon: Route, description: '"Think step by step"', color: 'from-purple-400 to-purple-600' },
          { label: 'Constraints', icon: Shield, description: '"Never do X, always do Y"', color: 'from-red-400 to-red-600' },
          { label: 'Better Output', icon: Star, description: 'More accurate, structured', color: 'from-emerald-400 to-emerald-600' },
        ],
        quiz: [
          { id: 'pe-a1', question: 'What does "Chain of Thought" prompting do?', options: ['Creates a blockchain', 'Makes the AI reason step-by-step before answering', 'Links multiple AI models together', 'Generates a chain of API calls'], correct: 1, explanation: 'Chain of Thought (CoT) prompting asks the model to reason step-by-step, which improves accuracy on complex problems.', difficulty: 'easy', category: 'Prompts' },
          { id: 'pe-a2', question: 'In few-shot prompting, what do you provide the AI?', options: ['A smaller model', 'Example input/output pairs so it learns the pattern', 'A few seconds of compute time', 'A few random words'], correct: 1, explanation: 'Few-shot prompting provides examples of desired input/output pairs in the prompt itself.', difficulty: 'medium', category: 'Prompts' },
          { id: 'pe-a3', question: 'What is "negative prompting"?', options: ['Telling the AI to be pessimistic', 'Telling the AI what NOT to do for cleaner output', 'Using negative numbers in the prompt', 'Sending empty prompts'], correct: 1, explanation: 'Negative prompting sets constraints by telling the AI what to avoid — e.g., "Do NOT include disclaimers in JSON."', difficulty: 'medium', category: 'Prompts' },
          { id: 'pe-a4', question: 'Which technique would you use to get a consistent JSON schema from every response?', options: ['Chain of Thought', 'Few-Shot prompting with example JSON outputs', 'Negative prompting', 'Asking nicely'], correct: 1, explanation: 'Few-shot examples with the desired JSON structure teach the model to consistently return that format.', difficulty: 'hard', category: 'Prompts' },
        ],
      },
      {
        id: 'pe-real-world', title: 'Real-World Prompt Patterns in This App',
        content: `Let's look at the actual prompts used in this healthcare app and understand why each design choice was made.\n\n**Pattern 1: Role + Guardrails (MEDICAL_SYSTEM_PROMPT)**\n"You are MedAI, an advanced AI healthcare assistant. You are helpful, empathetic, and medically knowledgeable."\nThen guardrails: "Never diagnose definitively — always say 'possible' or 'may indicate'."\nWhy: Liability protection + user safety. The AI must not pretend to be a real doctor.\n\n**Pattern 2: Schema Enforcement (ANALYSIS_SYSTEM_PROMPT)**\n"You MUST respond with ONLY a valid JSON object (no markdown, no extra text) with this exact structure: { conditions: [...], specialists: [...], riskLevel: '...', tests: [...] }"\nWhy: The frontend NEEDS predictable JSON to render HealthCards. If the AI returns natural text, JSON.parse() fails and the app breaks.\n\n**Pattern 3: Actionable Output (ENRICHMENT_SYSTEM_PROMPT
        keyPoints: [
          'Role + Guardrails pattern: safety and liability protection',
          'Schema Enforcement: predictable JSON for frontend parsing',
          'Actionable Output: real URLs and links the user can click',
          'Context Injection: RAG data grounds the AI in patient-specific information',
          'Every production prompt serves an engineering purpose, not just style',
        ],
        xpReward: 90,
        flowDiagram: [
          { label: 'Pattern 1: Role', icon: User, description: 'MedAI persona + guardrails', color: 'from-pink-400 to-pink-600' },
          { label: 'Pattern 2: Schema', icon: Braces, description: 'Force exact JSON structure', color: 'from-orange-400 to-orange-600' },
          { label: 'Pattern 3: Action', icon: Globe, description: 'Real URLs and links', color: 'from-teal-400 to-teal-600' },
          { label: 'Pattern 4: Context', icon: Database, description: 'RAG injects patient data', color: 'from-indigo-400 to-indigo-600' },
          { label: 'Production AI', icon: CheckCircle2, description: 'Safe, parseable, actionable', color: 'from-emerald-400 to-emerald-600' },
        ],
        quiz: [
          { id: 'pe-r1', question: 'Why does the MEDICAL_SYSTEM_PROMPT say "never diagnose definitively"?', options: ['To make the AI less useful', 'For liability protection and user safety — the AI is not a real doctor', 'Because GPT-4 cannot diagnose', 'To reduce token usage'], correct: 1, explanation: 'The guardrail protects users and avoids liability by ensuring the AI never claims to be making a definitive medical diagnosis.', difficulty: 'easy', category: 'Prompts' },
          { id: 'pe-r2', question: 'What happens if the ANALYSIS prompt does NOT enforce JSON output?', options: ['Nothing changes', 'The AI returns natural text, which JSON.parse() cannot handle, breaking the frontend', 'The response is faster', 'The AI refuses to respond'], correct: 1, explanation: 'Without schema enforcement, the AI returns free-form text that the frontend cannot parse into structured HealthCards.', difficulty: 'hard', category: 'Prompts' },
          { id: 'pe-r3', question: 'Why does the ENRICHMENT prompt specify exact URL formats like "google.com/maps/search/"?', options: ['For SEO', 'So the app renders clickable, valid links users can actually use', 'To track users', 'It doesn\'t matter'], correct: 1, explanation: 'Specifying URL patterns ensures the AI generates valid, functional links that the frontend renders as clickable buttons.', difficulty: 'medium', category: 'Prompts' },
          { id: 'pe-r4', question: 'What is "context injection" in RAG-based prompts?', options: ['Injecting malicious code', 'Inserting retrieved document chunks into the prompt so the AI can use patient-specific data', 'Adding more system prompts', 'Increasing the context window size'], correct: 1, explanation: 'Context injection places retrieved RAG chunks into the prompt, grounding the AI response in actual patient data.', difficulty: 'medium', category: 'Prompts' },
          { id: 'pe-r5', question: 'Which prompt pattern in this app handles temperature=0.1?', options: ['MEDICAL_SYSTEM_PROMPT (chat)', 'ANALYSIS_SYSTEM_PROMPT (JSON) — low temperature for deterministic structured output', 'ENRICHMENT_SYSTEM_PROMPT (links)', 'None of them'], correct: 1, explanation: 'The analysis prompt uses temperature=0.1 because structured JSON output requires high determinism — creative randomness would break the schema.', difficulty: 'hard', category: 'Prompts' },
        ],
      },
    ],
  },
  {
    id: 'full-architecture', title: 'Full App Architecture',
    description: 'How React, FastAPI, LangChain, LangGraph, and FAISS all connect.',
    icon: Workflow, gradient: 'from-indigo-500 to-blue-700', glow: 'shadow-indigo-500/20',
    category: 'System Design', unlocked: true, xpReward: 400,
    liveTestScenario: LIVE_TESTS['full-architecture'],
    lessons: [{
      id: 'arch-overview', title: 'The Complete Picture',
      content: `**Frontend (React + TypeScript + Vite):** The UI you're using now.\n\n**Backend (FastAPI + Python):** Handles auth, chat, report uploads, AI processing.\n\n**AI Pipeline:**\n1. User sends message → FastAPI receives it\n2. RAG retrieves relevant chunks from FAISS\n3. LangGraph orchestrates: Analyze → Enrich → Respond\n4. Each node uses LangChain's ChatOpenAI\n5. Response flows back to React`,
      keyPoints: ['Frontend: React + TypeScript + Vite', 'Backend: FastAPI + Python', 'AI: LangChain + LangGraph + GPT-4', 'Data: FAISS vector DB + OpenAI embeddings'],
      xpReward: 80,
      flowDiagram: [
        { label: 'React UI', icon: Monitor, description: 'User interface', color: 'from-cyan-400 to-cyan-600' },
        { label: 'FastAPI', icon: Zap, description: 'Python backend', color: 'from-green-400 to-green-600' },
        { label: 'LangChain', icon: Link, description: 'AI framework', color: 'from-teal-400 to-teal-600' },
        { label: 'LangGraph', icon: BarChart3, description: 'Workflow engine', color: 'from-orange-400 to-orange-600' },
        { label: 'FAISS', icon: HardDrive, description: 'Vector search', color: 'from-indigo-400 to-indigo-600' },
        { label: 'GPT-4', icon: Brain, description: 'Language model', color: 'from-purple-400 to-purple-600' },
      ],
      quiz: [
        { id: 'arch-q1', question: 'What does the React frontend do?', options: ['Runs AI models', 'Displays UI and sends API requests', 'Stores vectors', 'Trains the model'], correct: 1, explanation: 'React handles the UI and sends HTTP requests to FastAPI.', difficulty: 'easy', category: 'Architecture' },
        { id: 'arch-q2', question: 'What connects all the AI components?', options: ['React Router', 'LangChain', 'Tailwind CSS', 'Vite'], correct: 1, explanation: 'LangChain connects GPT-4, embeddings, FAISS, and prompts.', difficulty: 'medium', category: 'Architecture' },
        { id: 'arch-q3', question: 'Which component orchestrates multi-step analysis?', options: ['React', 'FAISS', 'LangGraph', 'CSS'], correct: 2, explanation: 'LangGraph orchestrates Analyze → Enrich → Respond.', difficulty: 'medium', category: 'Architecture' },
      ],
    }],
  },
]

/* ══════════════════════════════════════════════════════════
   3D ARCHITECTURE DIAGRAM DATA
   ══════════════════════════════════════════════════════════ */

interface ArchNode {
  id: string; label: string; icon: any; x: number; y: number
  color: string; description: string; layer: string; techDetail: string
}
interface ArchConnection {
  from: string; to: string; label: string; color: string
}

const ARCH_NODES: ArchNode[] = [
  // Layer 1: Client (top)
  { id: 'user', label: 'User / Patient', icon: User, x: 50, y: 6, color: 'from-sky-400 to-blue-600', description: 'The patient interacting with the system', layer: 'Client', techDetail: 'Browser (Chrome / Safari / Edge)' },
  // Layer 2: Presentation
  { id: 'react', label: 'React UI', icon: Monitor, x: 30, y: 19, color: 'from-cyan-400 to-cyan-600', description: 'Single-page application', layer: 'Frontend', techDetail: 'React 18 + TypeScript + Vite + Tailwind CSS + Framer Motion' },
  { id: 'auth-ui', label: 'Auth Layer', icon: Shield, x: 70, y: 19, color: 'from-amber-400 to-amber-600', description: 'Client-side authentication', layer: 'Frontend', techDetail: 'JWT Token Management + Protected Routes + Session Storage' },
  // Layer 3: API / Backend
  { id: 'fastapi', label: 'FastAPI', icon: Zap, x: 50, y: 34, color: 'from-emerald-400 to-green-600', description: 'High-performance Python backend', layer: 'Backend', techDetail: 'FastAPI + Uvicorn + Pydantic + CORS + JWT Auth Middleware' },
  // Layer 4: Orchestration
  { id: 'langgraph', label: 'LangGraph', icon: GitBranch, x: 22, y: 50, color: 'from-orange-400 to-orange-600', description: 'Multi-step AI Workflow', layer: 'Orchestration', techDetail: '3-Node StateGraph: Analyze → Enrich → Respond' },
  { id: 'ragengine', label: 'RAG Engine', icon: Search, x: 78, y: 50, color: 'from-teal-400 to-teal-600', description: 'Context retrieval pipeline', layer: 'Pipeline', techDetail: 'PyPDF2 + RecursiveCharacterTextSplitter + FAISS Retriever' },
  // Layer 5: AI Framework
  { id: 'langchain', label: 'LangChain', icon: Link, x: 50, y: 65, color: 'from-teal-500 to-cyan-600', description: 'AI orchestration framework', layer: 'Framework', techDetail: 'ChatOpenAI + PromptTemplates + OutputParsers + Chains' },
  // Layer 6: AI Models
  { id: 'gpt4', label: 'GPT-4o', icon: Brain, x: 22, y: 80, color: 'from-purple-500 to-violet-600', description: 'Large language model', layer: 'AI', techDetail: 'OpenAI GPT-4o API  |  temperature=0.3  |  Structured JSON output' },
  { id: 'embeddings', label: 'Embeddings', icon: Binary, x: 78, y: 80, color: 'from-violet-400 to-purple-600', description: 'Semantic vector encoder', layer: 'AI', techDetail: 'text-embedding-3-small  |  1 536 dimensions  |  Cosine similarity' },
  // Layer 7: Storage
  { id: 'faiss', label: 'FAISS', icon: HardDrive, x: 35, y: 93, color: 'from-indigo-500 to-indigo-700', description: 'Vector similarity store', layer: 'Storage', techDetail: 'Facebook AI Similarity Search  |  In-memory index  |  Flat L2' },
  { id: 'sqlite', label: 'SQLite', icon: Database, x: 65, y: 93, color: 'from-slate-500 to-slate-700', description: 'Relational database', layer: 'Storage', techDetail: 'SQLite3  |  Users, Reports, Chat history, Sessions' },
]

const ARCH_CONNECTIONS: ArchConnection[] = [
  { from: 'user', to: 'react', label: 'Enters symptoms / uploads report', color: '#3b82f6' },
  { from: 'user', to: 'auth-ui', label: 'Authenticates', color: '#f59e0b' },
  { from: 'react', to: 'fastapi', label: 'HTTP POST /api/chat', color: '#06b6d4' },
  { from: 'auth-ui', to: 'fastapi', label: 'JWT Bearer token', color: '#f59e0b' },
  { from: 'fastapi', to: 'langgraph', label: 'Triggers AI workflow', color: '#22c55e' },
  { from: 'fastapi', to: 'ragengine', label: 'Queries relevant docs', color: '#14b8a6' },
  { from: 'langgraph', to: 'langchain', label: 'Invokes chain nodes', color: '#f97316' },
  { from: 'ragengine', to: 'langchain', label: 'Retrieves context', color: '#14b8a6' },
  { from: 'langchain', to: 'gpt4', label: 'ChatOpenAI.invoke()', color: '#8b5cf6' },
  { from: 'langchain', to: 'embeddings', label: 'embed_documents()', color: '#7c3aed' },
  { from: 'embeddings', to: 'faiss', label: 'Store / query vectors', color: '#6366f1' },
  { from: 'faiss', to: 'ragengine', label: 'Returns top-k chunks', color: '#6366f1' },
  { from: 'fastapi', to: 'sqlite', label: 'CRUD operations', color: '#64748b' },
  { from: 'fastapi', to: 'react', label: 'Streaming JSON response', color: '#22c55e' },
  { from: 'react', to: 'user', label: 'Renders rich answer', color: '#3b82f6' },
]

/* ══════════════════════════════════════════════════════════
   LEADERBOARD & AVATAR MESSAGES
   ══════════════════════════════════════════════════════════ */

const LEADERBOARD = [
  { name: 'AI_Architect', xp: 8420, level: 17, avatar: 'AA' },
  { name: 'VectorQueen', xp: 7150, level: 15, avatar: 'VQ' },
  { name: 'RAG_Master', xp: 6300, level: 13, avatar: 'RM' },
  { name: 'ChainBuilder', xp: 5890, level: 12, avatar: 'CB' },
  { name: 'PromptNinja', xp: 4200, level: 9, avatar: 'PN' },
]

const AVATAR_MSG: Record<string, string[]> = {
  welcome: ["Welcome! Ready to understand the AI powering this app?", "Hey! Let's demystify LLMs, RAG, and Vector DBs today!", "Great to see you! Let's level up your AI knowledge!"],
  correct: ["Brilliant! You're getting this!", "Exactly right! You think like an AI engineer!", "Perfect! You could build this stack yourself!"],
  incorrect: ["Not quite — but that's how neural networks learn too.", "Good try! This concept clicks with practice.", "Almost! Even GPT-4 needed billions of examples to learn."],
  encouragement: ["You're doing amazing! Every lesson builds your AI intuition!", "Fun fact: this app uses all the concepts you're learning!", "Knowledge is the best algorithm! Keep going!"],
  levelUp: ["LEVEL UP! Your AI knowledge just upgraded!", "New level unlocked! You're becoming an AI architect!"],
  livetest: ["Watch carefully! Data is flowing through the system!", "Live test running — see how each component works!", "Real-time simulation — this is EXACTLY how the app works!"],
}
const pickMsg = (cat: keyof typeof AVATAR_MSG) => { const a = AVATAR_MSG[cat]; return a[Math.floor(Math.random() * a.length)] }

/* ══════════════════════════════════════════════════════════
   ANIMATED FLOW DIAGRAM
   ══════════════════════════════════════════════════════════ */

function AnimatedFlowDiagram({ steps }: { steps: FlowStep[] }) {
  return (
    <div className="my-8 relative">
      <h3 className="font-semibold text-slate-700 mb-4 flex items-center gap-2"><Workflow className="w-5 h-5 text-blue-500" />How It Works — Animated Flow</h3>
      <div className="relative flex flex-col gap-1">
        {steps.map((step, i) => (
          <motion.div key={i} initial={{ opacity: 0, x: -30 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.3 + i * 0.2, type: 'spring', stiffness: 200 }}>
            <div className="flex items-center gap-3">
              <motion.div className={`relative flex-shrink-0 w-14 h-14 rounded-2xl bg-gradient-to-br ${step.color} flex items-center justify-center shadow-lg`} whileHover={{ scale: 1.1, rotate: 3 }} animate={{ boxShadow: ['0 0 0px rgba(99,102,241,0)', '0 0 20px rgba(99,102,241,0.3)', '0 0 0px rgba(99,102,241,0)'] }} transition={{ boxShadow: { repeat: Infinity, duration: 2, delay: i * 0.3 } }}>{step.icon && <step.icon className="w-6 h-6 text-white" />}</motion.div>
              <div className="flex-1 bg-white/80 backdrop-blur-sm border border-slate-200/60 rounded-xl px-4 py-3 shadow-sm">
                <p className="font-semibold text-sm text-slate-800">{step.label}</p>
                <p className="text-xs text-slate-500">{step.description}</p>
              </div>
            </div>
            {i < steps.length - 1 && (<motion.div className="ml-7 flex items-center justify-center h-6" initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.5 + i * 0.2 }}><motion.div animate={{ y: [0, 4, 0] }} transition={{ repeat: Infinity, duration: 1.2, delay: i * 0.15 }}><ArrowDown className="w-4 h-4 text-slate-300" /></motion.div></motion.div>)}
          </motion.div>
        ))}
        <motion.div className="absolute left-7 top-0 bottom-0 w-0.5 bg-gradient-to-b from-blue-400 via-purple-400 to-emerald-400 opacity-20 rounded-full" animate={{ opacity: [0.1, 0.3, 0.1] }} transition={{ repeat: Infinity, duration: 3 }} />
      </div>
    </div>
  )
}

/* ══════════════════════════════════════════════════════════
   3D INTERACTIVE ARCHITECTURE DIAGRAM — PROFESSIONAL
   ══════════════════════════════════════════════════════════ */

/* Traveling dot particle along an SVG path */
function TravelingDot({ pathId, color, duration = 2, delay = 0 }: { pathId: string; color: string; duration?: number; delay?: number }) {
  return (
    <>
      {/* Outer glow circle traveling along path */}
      <circle r="10" fill={color} opacity="0.25" filter="url(#glow)">
        <animateMotion dur={`${duration}s`} repeatCount="indefinite" begin={`${delay}s`}>
          <mpath href={`#${pathId}`} />
        </animateMotion>
      </circle>
      {/* Bright core dot */}
      <circle r="5" fill={color} opacity="0.9">
        <animateMotion dur={`${duration}s`} repeatCount="indefinite" begin={`${delay}s`}>
          <mpath href={`#${pathId}`} />
        </animateMotion>
      </circle>
      {/* Inner bright point */}
      <circle r="2.5" fill="white" opacity="0.8">
        <animateMotion dur={`${duration}s`} repeatCount="indefinite" begin={`${delay}s`}>
          <mpath href={`#${pathId}`} />
        </animateMotion>
      </circle>
      {/* Trail dot (smaller, offset) */}
      <circle r="3" fill={color} opacity="0.2">
        <animateMotion dur={`${duration}s`} repeatCount="indefinite" begin={`${delay + 0.15}s`}>
          <mpath href={`#${pathId}`} />
        </animateMotion>
      </circle>
      <circle r="2" fill={color} opacity="0.1">
        <animateMotion dur={`${duration}s`} repeatCount="indefinite" begin={`${delay + 0.3}s`}>
          <mpath href={`#${pathId}`} />
        </animateMotion>
      </circle>
    </>
  )
}

function ArchitectureDiagram3D({ onClose }: { onClose: () => void }) {
  const [activeNode, setActiveNode] = useState<ArchNode | null>(null)
  const [hoveredNode, setHoveredNode] = useState<string | null>(null)
  const [flowActive, setFlowActive] = useState(false)
  const [flowStep, setFlowStep] = useState(0)
  const [completedSteps, setCompletedSteps] = useState<number[]>([])
  const [flowFinished, setFlowFinished] = useState(false)
  const [showStats, setShowStats] = useState(true)
  const flowTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  const nx = (pct: number) => (pct / 100) * 1200
  const ny = (pct: number) => (pct / 100) * 800

  const buildPath = (conn: ArchConnection) => {
    const from = ARCH_NODES.find(n => n.id === conn.from)!
    const to = ARCH_NODES.find(n => n.id === conn.to)!
    const x1 = nx(from.x), y1 = ny(from.y) + 24
    const x2 = nx(to.x), y2 = ny(to.y) - 4
    const dy = y2 - y1
    const cx1 = x1, cy1 = y1 + dy * 0.35
    const cx2 = x2, cy2 = y2 - dy * 0.35
    return `M ${x1} ${y1} C ${cx1} ${cy1} ${cx2} ${cy2} ${x2} ${y2}`
  }

  /* Determine if a node is connected to hovered node */
  const isConnectedToHovered = (nodeId: string) => {
    if (!hoveredNode) return false
    return ARCH_CONNECTIONS.some(c => (c.from === hoveredNode && c.to === nodeId) || (c.to === hoveredNode && c.from === nodeId))
  }
  const isConnectionRelatedToHover = (conn: ArchConnection) => {
    if (!hoveredNode) return false
    return conn.from === hoveredNode || conn.to === hoveredNode
  }

  const startFlow = () => {
    setFlowActive(true); setFlowStep(0); setCompletedSteps([]); setFlowFinished(false)
    let step = 0
    const tick = () => {
      if (step >= ARCH_CONNECTIONS.length) {
        setFlowFinished(true)
        flowTimerRef.current = setTimeout(() => { setFlowActive(false); setFlowFinished(false) }, 4000)
        return
      }
      setFlowStep(step)
      setCompletedSteps(prev => [...prev, step])
      step++
      flowTimerRef.current = setTimeout(tick, 1200)
    }
    tick()
  }

  useEffect(() => { return () => { if (flowTimerRef.current) clearTimeout(flowTimerRef.current) } }, [])

  /* Layer config for bands */
  const LAYERS = [
    { y: 0, h: 100, label: 'PRESENTATION', sublabel: 'Client Layer', color: 'rgba(59,130,246,0.06)', accent: '#3b82f6' },
    { y: 100, h: 90, label: 'INTERFACE', sublabel: 'Frontend', color: 'rgba(6,182,212,0.05)', accent: '#06b6d4' },
    { y: 190, h: 100, label: 'API GATEWAY', sublabel: 'Backend', color: 'rgba(34,197,94,0.05)', accent: '#22c55e' },
    { y: 290, h: 130, label: 'ORCHESTRATION', sublabel: 'Pipeline', color: 'rgba(249,115,22,0.04)', accent: '#f97316' },
    { y: 420, h: 110, label: 'AI FRAMEWORK', sublabel: 'Inference', color: 'rgba(20,184,166,0.04)', accent: '#14b8a6' },
    { y: 530, h: 130, label: 'MODEL LAYER', sublabel: 'AI/ML', color: 'rgba(139,92,246,0.05)', accent: '#8b5cf6' },
    { y: 660, h: 140, label: 'PERSISTENCE', sublabel: 'Storage', color: 'rgba(99,102,241,0.05)', accent: '#6366f1' },
  ]

  const STATS = [
    { label: 'Components', value: ARCH_NODES.length, icon: Box },
    { label: 'Connections', value: ARCH_CONNECTIONS.length, icon: Cable },
    { label: 'Layers', value: '7', icon: Layers },
    { label: 'Latency', value: '<2s', icon: Activity },
  ]

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="mt-6">
      {/* ── Premium Header ── */}
      <div className="flex items-center justify-between mb-5">
        <div className="flex items-center gap-4">
          <div className="relative">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-indigo-500 via-purple-500 to-pink-500 flex items-center justify-center shadow-xl shadow-indigo-500/25">
              <Workflow className="w-6 h-6 text-white" />
            </div>
            <motion.div className="absolute -inset-1 rounded-2xl bg-gradient-to-br from-indigo-500 via-purple-500 to-pink-500 opacity-20 blur-md" animate={{ opacity: [0.15, 0.3, 0.15] }} transition={{ duration: 3, repeat: Infinity }} />
          </div>
          <div>
            <h2 className="text-2xl font-extrabold text-slate-800 tracking-tight">System Architecture</h2>
            <p className="text-sm text-slate-500 font-medium">MedAI Healthcare Platform — Full-Stack Overview</p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <motion.button whileHover={{ scale: 1.04 }} whileTap={{ scale: 0.96 }}
            onClick={() => setShowStats(!showStats)}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold bg-white border border-slate-200 text-slate-600 hover:bg-slate-50 shadow-sm transition-all">
            <BarChart3 className="w-4 h-4" />{showStats ? 'Hide Stats' : 'Show Stats'}
          </motion.button>
          <motion.button whileHover={{ scale: 1.04 }} whileTap={{ scale: 0.96 }} onClick={startFlow} disabled={flowActive}
            className={`flex items-center gap-2 px-6 py-2.5 rounded-xl font-semibold text-sm shadow-lg transition-all ${flowActive ? 'bg-slate-200 text-slate-400 cursor-wait' : 'bg-gradient-to-r from-emerald-500 to-teal-600 text-white shadow-emerald-500/25 hover:shadow-xl hover:shadow-emerald-500/30'}`}>
            {flowActive && !flowFinished ? <><Loader2 className="w-4 h-4 animate-spin" />Simulating...</> : flowFinished ? <><CheckCircle2 className="w-4 h-4" />Complete</> : <><Play className="w-4 h-4" />Run Data Flow</>}
          </motion.button>
        </div>
      </div>

      {/* ── Stats KPI Bar ── */}
      <AnimatePresence>
        {showStats && (
          <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="overflow-hidden mb-5">
            <div className="grid grid-cols-4 gap-3">
              {STATS.map((s, i) => (
                <motion.div key={s.label} initial={{ y: 20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ delay: i * 0.08 }}
                  className="bg-white rounded-xl border border-slate-200/80 p-4 flex items-center gap-3 shadow-sm hover:shadow-md transition-shadow">
                  <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-slate-100 to-slate-200 flex items-center justify-center">
                    <s.icon className="w-5 h-5 text-slate-600" />
                  </div>
                  <div>
                    <p className="text-2xl font-extrabold text-slate-800 leading-none">{s.value}</p>
                    <p className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider mt-0.5">{s.label}</p>
                  </div>
                </motion.div>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ───── PREMIUM ARCHITECTURE CANVAS ───── */}
      <div className="relative rounded-3xl overflow-hidden shadow-2xl shadow-slate-900/10 border border-slate-200/60" style={{ minHeight: 780 }}>
        {/* Background — dark premium gradient */}
        <div className="absolute inset-0 bg-gradient-to-b from-[#0a0e27] via-[#0f1634] to-[#080c1f]" />
        {/* Mesh overlay */}
        <div className="absolute inset-0 opacity-[0.03]" style={{ backgroundImage: 'radial-gradient(circle at 1px 1px, rgba(148,163,184,0.4) 1px, transparent 0)', backgroundSize: '32px 32px' }} />
        {/* Radial spotlight from top */}
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_80%_50%_at_50%_-5%,rgba(99,102,241,0.15)_0%,transparent_60%)]" />
        {/* Radial spotlight from bottom */}
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_60%_40%_at_50%_105%,rgba(99,102,241,0.08)_0%,transparent_60%)]" />
        {/* Subtle side gradients */}
        <div className="absolute inset-y-0 left-0 w-32 bg-gradient-to-r from-[rgba(99,102,241,0.04)] to-transparent" />
        <div className="absolute inset-y-0 right-0 w-32 bg-gradient-to-l from-[rgba(99,102,241,0.04)] to-transparent" />

        {/* ── SVG Layer ── */}
        <svg className="absolute inset-0 w-full h-full" viewBox="0 0 1200 800" preserveAspectRatio="xMidYMid meet" style={{ zIndex: 2 }}>
          <defs>
            {/* Premium glow filters */}
            <filter id="nodeGlow" x="-100%" y="-100%" width="300%" height="300%">
              <feGaussianBlur stdDeviation="6" result="blur" />
              <feComposite in="SourceGraphic" in2="blur" operator="over" />
            </filter>
            <filter id="lineGlow" x="-30%" y="-30%" width="160%" height="160%">
              <feGaussianBlur stdDeviation="4" result="blur" />
              <feComposite in="SourceGraphic" in2="blur" operator="over" />
            </filter>
            <filter id="softGlow" x="-50%" y="-50%" width="200%" height="200%">
              <feGaussianBlur stdDeviation="8" />
            </filter>

            {/* Gradient definitions for connections */}
            {ARCH_CONNECTIONS.map((conn, i) => {
              const from = ARCH_NODES.find(n => n.id === conn.from)!
              const to = ARCH_NODES.find(n => n.id === conn.to)!
              return (
                <linearGradient key={`grad-${i}`} id={`connGrad-${i}`} x1={nx(from.x)} y1={ny(from.y)} x2={nx(to.x)} y2={ny(to.y)} gradientUnits="userSpaceOnUse">
                  <stop offset="0%" stopColor={conn.color} stopOpacity="0.8" />
                  <stop offset="100%" stopColor={conn.color} stopOpacity="0.3" />
                </linearGradient>
              )
            })}

            {/* Arrowhead markers */}
            {ARCH_CONNECTIONS.map((conn, i) => (
              <marker key={`arrow-${i}`} id={`arrowhead-${i}`} markerWidth="12" markerHeight="10" refX="10" refY="5" orient="auto" markerUnits="userSpaceOnUse">
                <path d="M 0 0 L 12 5 L 0 10 L 3 5 Z" fill={conn.color} opacity="0.9" />
              </marker>
            ))}
            <marker id="arrowhead-dim" markerWidth="8" markerHeight="6" refX="7" refY="3" orient="auto" markerUnits="userSpaceOnUse">
              <path d="M 0 0 L 8 3 L 0 6 L 1.5 3 Z" fill="rgba(148,163,184,0.2)" />
            </marker>
          </defs>

          {/* ── Layer bands with premium styling ── */}
          {LAYERS.map((band, i) => (
            <g key={`band-${i}`}>
              <rect x="0" y={band.y} width="1200" height={band.h} fill={band.color} />
              {/* Subtle top border line */}
              <line x1="0" y1={band.y} x2="1200" y2={band.y} stroke={band.accent} strokeWidth="0.5" opacity="0.15" />
              {/* Layer label */}
              <text x="20" y={band.y + 18} fontSize="9" fill={band.accent} fontWeight="800" letterSpacing="3" opacity="0.4">{band.label}</text>
              <text x="20" y={band.y + 32} fontSize="7.5" fill="rgba(148,163,184,0.3)" fontWeight="500" letterSpacing="1">{band.sublabel}</text>
            </g>
          ))}

          {/* ── Connection paths ── */}
          {ARCH_CONNECTIONS.map((conn, i) => {
            const pathD = buildPath(conn)
            const pathId = `conn-path-${i}`
            const isActive = flowActive && flowStep === i
            const isPast = completedSteps.includes(i)
            const isIdle = !flowActive
            const isHoverHighlighted = isConnectionRelatedToHover(conn)

            return (
              <g key={i}>
                <path id={pathId} d={pathD} fill="none" stroke="none" />

                {/* Base line */}
                <path d={pathD} fill="none"
                  stroke={isPast ? conn.color : isHoverHighlighted ? conn.color : 'rgba(148,163,184,0.08)'}
                  strokeWidth={isPast ? 2 : isHoverHighlighted ? 2.5 : 1}
                  strokeLinecap="round"
                  opacity={isPast ? 0.5 : isHoverHighlighted ? 0.7 : 1}
                  markerEnd={isPast || isHoverHighlighted ? `url(#arrowhead-${i})` : 'url(#arrowhead-dim)'}
                  strokeDasharray={isPast || isActive || isHoverHighlighted ? 'none' : '4 6'}
                  className="transition-all duration-500"
                />

                {/* Active glow */}
                {isActive && (
                  <>
                    <path d={pathD} fill="none" stroke={conn.color} strokeWidth={4} strokeLinecap="round" filter="url(#lineGlow)" opacity="0.6" markerEnd={`url(#arrowhead-${i})`}>
                      <animate attributeName="opacity" values="0.3;0.8;0.3" dur="1s" repeatCount="indefinite" />
                    </path>
                    <TravelingDot pathId={pathId} color={conn.color} duration={1.2} delay={0} />
                  </>
                )}

                {/* Past: subtle traveling particles */}
                {isPast && !isActive && (
                  <>
                    <circle r="3" fill={conn.color} opacity="0.35">
                      <animateMotion dur="3s" repeatCount="indefinite"><mpath href={`#${pathId}`} /></animateMotion>
                    </circle>
                    <circle r="1.5" fill="white" opacity="0.15">
                      <animateMotion dur="3s" repeatCount="indefinite" begin="0.5s"><mpath href={`#${pathId}`} /></animateMotion>
                    </circle>
                  </>
                )}

                {/* Hover highlight: show label */}
                {isHoverHighlighted && !flowActive && (
                  <>
                    <path d={pathD} fill="none" stroke={conn.color} strokeWidth={3} strokeLinecap="round" filter="url(#lineGlow)" opacity="0.4" />
                    <circle r="3.5" fill={conn.color} opacity="0.6">
                      <animateMotion dur="2s" repeatCount="indefinite"><mpath href={`#${pathId}`} /></animateMotion>
                    </circle>
                    <circle r="1.5" fill="white" opacity="0.5">
                      <animateMotion dur="2s" repeatCount="indefinite"><mpath href={`#${pathId}`} /></animateMotion>
                    </circle>
                    {/* Connection label on hover */}
                    {(() => {
                      const from = ARCH_NODES.find(n => n.id === conn.from)!
                      const to = ARCH_NODES.find(n => n.id === conn.to)!
                      const mx = (nx(from.x) + nx(to.x)) / 2
                      const my = (ny(from.y) + ny(to.y)) / 2 + 4
                      return (
                        <g>
                          <rect x={mx - 60} y={my - 10} width="120" height="18" rx="9" fill="rgba(0,0,0,0.75)" />
                          <text x={mx} y={my + 3} textAnchor="middle" fontSize="8" fill="white" fontWeight="600">{conn.label}</text>
                        </g>
                      )
                    })()}
                  </>
                )}

                {/* Idle: very subtle ambient dots */}
                {isIdle && !isHoverHighlighted && (
                  <circle r="1.5" fill="rgba(148,163,184,0.2)" opacity="0.3">
                    <animateMotion dur={`${5 + i * 0.7}s`} repeatCount="indefinite"><mpath href={`#${pathId}`} /></animateMotion>
                  </circle>
                )}

                {/* Active step label */}
                {isActive && (() => {
                  const from = ARCH_NODES.find(n => n.id === conn.from)!
                  const to = ARCH_NODES.find(n => n.id === conn.to)!
                  const mx = (nx(from.x) + nx(to.x)) / 2
                  const my = (ny(from.y) + ny(to.y)) / 2 + 4
                  return (
                    <g>
                      <rect x={mx - 70} y={my - 12} width="140" height="22" rx="11" fill="rgba(0,0,0,0.85)" stroke={conn.color} strokeWidth="1" opacity="0.9" />
                      <text x={mx} y={my + 4} textAnchor="middle" fontSize="9" fill="white" fontWeight="700">{conn.label}</text>
                    </g>
                  )
                })()}
              </g>
            )
          })}

          {/* Celebration overlay particles */}
          {flowFinished && ARCH_CONNECTIONS.map((conn, i) => {
            const pathId = `conn-path-${i}`
            return (
              <g key={`finish-${i}`}>
                <circle r="4" fill={conn.color} opacity="0.5">
                  <animateMotion dur="1.8s" repeatCount="indefinite" begin={`${i * 0.12}s`}><mpath href={`#${pathId}`} /></animateMotion>
                </circle>
                <circle r="2" fill="white" opacity="0.4">
                  <animateMotion dur="2.2s" repeatCount="indefinite" begin={`${i * 0.15}s`}><mpath href={`#${pathId}`} /></animateMotion>
                </circle>
              </g>
            )
          })}
        </svg>

        {/* ── Nodes ── */}
        {ARCH_NODES.map((node, idx) => {
          const isFlowActive = flowActive && (ARCH_CONNECTIONS[flowStep]?.from === node.id || ARCH_CONNECTIONS[flowStep]?.to === node.id)
          const isSource = flowActive && ARCH_CONNECTIONS[flowStep]?.from === node.id
          const isTarget = flowActive && ARCH_CONNECTIONS[flowStep]?.to === node.id
          const wasActive = completedSteps.some(s => ARCH_CONNECTIONS[s]?.from === node.id || ARCH_CONNECTIONS[s]?.to === node.id)
          const isHovered = hoveredNode === node.id
          const isRelatedToHover = isConnectedToHovered(node.id)
          const isDimmed = hoveredNode && !isHovered && !isRelatedToHover

          return (
            <motion.div key={node.id} className="absolute" style={{ left: `${node.x}%`, top: `${node.y}%`, transform: 'translate(-50%, -50%)', zIndex: isHovered || isFlowActive ? 20 : 10 }}
              initial={{ scale: 0, opacity: 0 }} animate={{ scale: 1, opacity: isDimmed ? 0.25 : 1 }} transition={{ delay: 0.1 + idx * 0.04, type: 'spring', stiffness: 300, damping: 22, opacity: { duration: 0.3 } }}
              whileHover={{ scale: 1.15, zIndex: 25 }}
              onMouseEnter={() => setHoveredNode(node.id)} onMouseLeave={() => setHoveredNode(null)}
              onClick={() => setActiveNode(activeNode?.id === node.id ? null : node)}>

              {/* Ambient glow behind node */}
              <motion.div className="absolute rounded-full" style={{ width: 100, height: 100, left: '50%', top: '50%', transform: 'translate(-50%, -50%)', background: `radial-gradient(circle, ${isHovered ? 'rgba(99,102,241,0.25)' : 'rgba(99,102,241,0.06)'} 0%, transparent 70%)` }}
                animate={isFlowActive ? { scale: [1, 1.4, 1], opacity: [0.3, 0.6, 0.3] } : isHovered ? { scale: 1.3 } : {}}
                transition={isFlowActive ? { duration: 1, repeat: Infinity } : { duration: 0.3 }} />

              {/* Source / target pulse ring */}
              {isFlowActive && (
                <motion.div className="absolute -inset-3 rounded-[22px]"
                  animate={{ opacity: [0.2, 0.6, 0.2], scale: [1, 1.1, 1] }}
                  transition={{ duration: 0.8, repeat: Infinity }}
                  style={{ border: `2px solid ${isSource ? '#10b981' : '#818cf8'}`, borderRadius: 18 }} />
              )}

              {/* The node card */}
              <motion.div
                animate={isFlowActive ? {
                  boxShadow: isSource
                    ? ['0 0 0 0 rgba(16,185,129,0)', '0 0 40px 8px rgba(16,185,129,0.35)', '0 0 0 0 rgba(16,185,129,0)']
                    : ['0 0 0 0 rgba(129,140,248,0)', '0 0 40px 8px rgba(129,140,248,0.35)', '0 0 0 0 rgba(129,140,248,0)']
                } : {}}
                transition={{ duration: 0.8, repeat: isFlowActive ? Infinity : 0 }}
                className="relative cursor-pointer group">
                <div className={`relative w-[84px] h-[84px] rounded-2xl overflow-hidden border-2 transition-all duration-300 ${
                  activeNode?.id === node.id ? 'border-white shadow-2xl shadow-white/20' : isHovered ? 'border-white/50 shadow-xl' : isFlowActive ? 'border-white/40' : wasActive ? 'border-white/20' : 'border-white/[0.08]'
                }`}>
                  {/* Glassmorphism background */}
                  <div className={`absolute inset-0 bg-gradient-to-br ${node.color} opacity-90`} />
                  <div className="absolute inset-0 backdrop-blur-[2px] bg-white/[0.05]" />
                  {/* Inner shine */}
                  <div className="absolute inset-0 bg-gradient-to-b from-white/20 via-transparent to-black/10" />
                  {/* Content */}
                  <div className="relative h-full flex flex-col items-center justify-center p-1.5">
                    <node.icon className="w-6 h-6 text-white mb-1 drop-shadow-md" />
                    <span className="text-[9.5px] font-bold text-white text-center leading-tight drop-shadow-sm">{node.label}</span>
                  </div>
                </div>
                {/* Status indicators */}
                {isSource && (
                  <motion.div className="absolute -top-1.5 -right-1.5 w-4 h-4 rounded-full bg-emerald-400 border-2 border-[#0f172a] shadow-lg shadow-emerald-400/50"
                    animate={{ scale: [1, 1.5, 1] }} transition={{ duration: 0.5, repeat: Infinity }} />
                )}
                {isTarget && (
                  <motion.div className="absolute -top-1.5 -right-1.5 w-4 h-4 rounded-full bg-indigo-400 border-2 border-[#0f172a] shadow-lg shadow-indigo-400/50"
                    animate={{ scale: [1, 1.5, 1] }} transition={{ duration: 0.5, repeat: Infinity }} />
                )}
              </motion.div>

              {/* Layer badge */}
              <div className="absolute -bottom-6 left-1/2 -translate-x-1/2 whitespace-nowrap">
                <span className={`text-[8px] font-bold px-2.5 py-1 rounded-full transition-all duration-300 ${
                  isFlowActive ? 'text-white bg-indigo-600/90 border border-indigo-400/40 shadow-lg shadow-indigo-500/20' : isHovered ? 'text-indigo-200 bg-indigo-900/80 border border-indigo-500/30' : 'text-slate-500 bg-slate-900/60 border border-slate-700/30'
                }`} style={{ letterSpacing: '0.06em' }}>{node.layer}</span>
              </div>
            </motion.div>
          )
        })}

        {/* ── Node Detail Panel (premium slide-up) ── */}
        <AnimatePresence>
          {activeNode && (
            <motion.div initial={{ opacity: 0, y: 30, scale: 0.95 }} animate={{ opacity: 1, y: 0, scale: 1 }} exit={{ opacity: 0, y: 30, scale: 0.95 }}
              transition={{ type: 'spring', stiffness: 350, damping: 28 }}
              className="absolute bottom-5 left-5 right-5 backdrop-blur-xl rounded-2xl border border-white/15 shadow-2xl overflow-hidden" style={{ zIndex: 35, background: 'rgba(15,23,42,0.92)' }}>
              {/* Top accent bar */}
              <div className={`h-1 w-full bg-gradient-to-r ${activeNode.color}`} />
              <div className="p-5">
                <button onClick={(e) => { e.stopPropagation(); setActiveNode(null) }} className="absolute top-4 right-4 w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center transition-colors"><X className="w-4 h-4 text-white/70" /></button>
                <div className="flex items-center gap-4 mb-4">
                  <div className={`w-14 h-14 rounded-2xl bg-gradient-to-br ${activeNode.color} flex items-center justify-center shadow-xl`}>
                    <activeNode.icon className="w-7 h-7 text-white" />
                  </div>
                  <div>
                    <h3 className="font-extrabold text-white text-lg tracking-tight">{activeNode.label}</h3>
                    <p className="text-sm text-slate-400">{activeNode.description}
                      <span className="ml-2 text-xs font-bold text-indigo-400 bg-indigo-500/10 px-2 py-0.5 rounded-full">{activeNode.layer}</span>
                    </p>
                  </div>
                </div>
                <div className="bg-white/5 rounded-xl p-4 border border-white/10 mb-4">
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1.5">Technology Stack</p>
                  <p className="text-sm text-slate-200 font-mono leading-relaxed">{activeNode.techDetail}</p>
                </div>
                <div>
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2">Data Connections</p>
                  <div className="flex flex-wrap gap-2">
                    {ARCH_CONNECTIONS.filter(c => c.from === activeNode.id || c.to === activeNode.id).map((c, i) => {
                      const target = c.from === activeNode.id ? ARCH_NODES.find(n => n.id === c.to) : ARCH_NODES.find(n => n.id === c.from)
                      const direction = c.from === activeNode.id ? 'to' : 'from'
                      return (
                        <span key={i} className="text-xs text-slate-300 px-3 py-1.5 rounded-full border border-white/10 bg-white/5 font-medium flex items-center gap-1.5">
                          <ArrowRight className={`w-3 h-3 ${direction === 'to' ? 'text-emerald-400' : 'text-blue-400 rotate-180'}`} />
                          <span className="text-slate-400">{c.label}</span>
                          <span className="text-white font-semibold">{target?.label}</span>
                        </span>
                      )
                    })}
                  </div>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* ── Flow HUD (top-center) ── */}
        {flowActive && (
          <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }}
            className="absolute top-4 left-1/2 -translate-x-1/2 flex items-center gap-3" style={{ zIndex: 30 }}>
            <div className="bg-black/70 backdrop-blur-xl rounded-full px-5 py-2.5 flex items-center gap-2.5 border border-white/10 shadow-2xl">
              {ARCH_CONNECTIONS.map((_, i) => (
                <motion.div key={i}
                  className={`w-2 h-2 rounded-full transition-all duration-300 ${completedSteps.includes(i) ? 'bg-emerald-400 shadow-emerald-400/50 shadow-sm' : flowStep === i ? 'bg-white shadow-white/50 shadow-sm' : 'bg-white/15'}`}
                  animate={flowStep === i ? { scale: [1, 1.6, 1] } : {}}
                  transition={{ duration: 0.5, repeat: flowStep === i ? Infinity : 0 }}
                />
              ))}
            </div>
            <motion.div className="bg-black/70 backdrop-blur-xl rounded-full px-5 py-2.5 border border-white/10 shadow-2xl"
              key={flowStep} initial={{ opacity: 0, x: 10 }} animate={{ opacity: 1, x: 0 }}>
              <span className="text-sm font-bold text-white flex items-center gap-2">
                <ArrowRight className="w-4 h-4 text-emerald-300" />
                {ARCH_CONNECTIONS[flowStep]?.label}
              </span>
            </motion.div>
          </motion.div>
        )}

        {/* ── Flow completion overlay ── */}
        {flowFinished && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="absolute inset-0 flex items-center justify-center pointer-events-none" style={{ zIndex: 25 }}>
            <motion.div initial={{ scale: 0.5, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} transition={{ type: 'spring', stiffness: 200 }}
              className="bg-black/60 backdrop-blur-xl rounded-2xl px-10 py-6 border border-emerald-500/20 shadow-2xl text-center">
              <motion.div animate={{ rotate: [0, 10, -10, 0] }} transition={{ duration: 0.5 }}>
                <CheckCircle2 className="w-10 h-10 text-emerald-400 mx-auto mb-3" />
              </motion.div>
              <p className="text-xl font-extrabold text-white tracking-tight">Data Flow Complete</p>
              <p className="text-sm text-emerald-300/80 mt-1 font-medium">All {ARCH_CONNECTIONS.length} connections verified</p>
            </motion.div>
          </motion.div>
        )}

        {/* ── Bottom right: Interaction hint ── */}
        {!flowActive && !activeNode && (
          <motion.div className="absolute bottom-4 right-4 flex items-center gap-2 text-white/25 text-xs font-medium" style={{ zIndex: 15 }}
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 1.5 }}>
            <Eye className="w-3.5 h-3.5" />
            <span>Hover nodes to trace connections. Click for details.</span>
          </motion.div>
        )}
      </div>

      {/* ── Premium Legend ── */}
      <div className="mt-6 grid grid-cols-2 md:grid-cols-4 gap-3">
        {[
          { layer: 'Frontend', filter: (n: ArchNode) => n.layer === 'Client' || n.layer === 'Frontend', color: 'from-blue-500 to-cyan-500', icon: Monitor, accent: 'border-blue-200/50' },
          { layer: 'Backend', filter: (n: ArchNode) => n.layer === 'Backend', color: 'from-green-500 to-emerald-500', icon: Server, accent: 'border-green-200/50' },
          { layer: 'AI / Pipeline', filter: (n: ArchNode) => ['AI', 'Orchestration', 'Framework', 'Pipeline'].includes(n.layer), color: 'from-purple-500 to-violet-500', icon: Brain, accent: 'border-purple-200/50' },
          { layer: 'Storage', filter: (n: ArchNode) => n.layer === 'Storage', color: 'from-indigo-500 to-slate-500', icon: HardDrive, accent: 'border-indigo-200/50' },
        ].map(({ layer, filter, color, icon: LayerIcon, accent }) => {
          const nodes = ARCH_NODES.filter(filter)
          return (
            <div key={layer} className={`bg-white rounded-xl p-3.5 border ${accent} shadow-sm hover:shadow-md transition-shadow`}>
              <div className="flex items-center gap-2 mb-2.5">
                <div className={`w-7 h-7 rounded-lg bg-gradient-to-br ${color} flex items-center justify-center shadow-md`}>
                  <LayerIcon className="w-3.5 h-3.5 text-white" />
                </div>
                <p className="text-[11px] font-extrabold text-slate-600 uppercase tracking-wider">{layer}</p>
                <span className="ml-auto text-[10px] font-bold text-slate-300 bg-slate-100 px-1.5 py-0.5 rounded-full">{nodes.length}</span>
              </div>
              <div className="space-y-1.5">{nodes.map(n => (
                <div key={n.id} className="flex items-center gap-2 text-xs text-slate-600 group/item cursor-pointer hover:text-slate-800 transition-colors"
                  onClick={() => setActiveNode(activeNode?.id === n.id ? null : n)}>
                  <div className={`w-5 h-5 rounded-md bg-gradient-to-br ${n.color} flex items-center justify-center shadow-sm`}>
                    <n.icon className="w-2.5 h-2.5 text-white" />
                  </div>
                  <span className="font-semibold">{n.label}</span>
                  <ChevronRight className="w-3 h-3 text-slate-300 ml-auto opacity-0 group-hover/item:opacity-100 transition-opacity" />
                </div>
              ))}</div>
            </div>
          )
        })}
      </div>

      {/* ── Data Flow Steps ── */}
      <div className="mt-5 bg-gradient-to-br from-slate-50 to-white rounded-2xl border border-slate-200/60 p-5 shadow-sm">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center shadow-md">
            <Route className="w-4 h-4 text-white" />
          </div>
          <div>
            <h3 className="text-sm font-extrabold text-slate-700 tracking-tight">End-to-End Request Lifecycle</h3>
            <p className="text-[11px] text-slate-400 font-medium">How a single chat message flows through the entire system</p>
          </div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          {[
            { step: '01', title: 'User Input', desc: 'Patient describes symptoms or uploads a medical report (PDF/image) through the React UI.', color: 'text-blue-600 bg-blue-50 border-blue-100', icon: User },
            { step: '02', title: 'API Gateway', desc: 'React sends an authenticated HTTP POST to FastAPI with the message, chat history, and geolocation.', color: 'text-cyan-600 bg-cyan-50 border-cyan-100', icon: Zap },
            { step: '03', title: 'AI Orchestration', desc: 'LangGraph triggers a 3-node StateGraph: Analyze symptoms, Enrich with context, Generate response.', color: 'text-orange-600 bg-orange-50 border-orange-100', icon: GitBranch },
            { step: '04', title: 'RAG Retrieval', desc: 'The RAG engine queries the FAISS vector store for the most relevant document chunks using cosine similarity.', color: 'text-teal-600 bg-teal-50 border-teal-100', icon: Search },
            { step: '05', title: 'LLM Inference', desc: 'LangChain sends the assembled prompt + retrieved context to GPT-4o and parses structured JSON output.', color: 'text-purple-600 bg-purple-50 border-purple-100', icon: Brain },
            { step: '06', title: 'Rich Response', desc: 'Streaming JSON with analysis, nearby hospitals, medicine info, and recommendations rendered in real-time.', color: 'text-emerald-600 bg-emerald-50 border-emerald-100', icon: Monitor },
          ].map((item) => (
            <div key={item.step} className={`flex items-start gap-3 rounded-xl p-3.5 border ${item.color} hover:shadow-md transition-shadow`}>
              <div className={`w-9 h-9 rounded-lg flex items-center justify-center shrink-0 ${item.color}`}>
                <item.icon className="w-4 h-4" />
              </div>
              <div>
                <div className="flex items-center gap-2 mb-0.5">
                  <span className="text-[10px] font-black opacity-40">{item.step}</span>
                  <p className="text-xs font-bold">{item.title}</p>
                </div>
                <p className="text-[10.5px] text-slate-500 leading-relaxed">{item.desc}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </motion.div>
  )
}

/* ══════════════════════════════════════════════════════════
   LIVE TEST SIMULATOR
   ══════════════════════════════════════════════════════════ */

const LAYER_CONFIG: Record<string, { bg: string; border: string; text: string; icon: any; label: string }> = {
  frontend: { bg: 'bg-blue-50', border: 'border-blue-200', text: 'text-blue-700', icon: Globe, label: 'FRONTEND (React)' },
  backend: { bg: 'bg-green-50', border: 'border-green-200', text: 'text-green-700', icon: Server, label: 'BACKEND (FastAPI)' },
  ai: { bg: 'bg-purple-50', border: 'border-purple-200', text: 'text-purple-700', icon: Brain, label: 'AI LAYER (LangChain/GPT-4)' },
  database: { bg: 'bg-indigo-50', border: 'border-indigo-200', text: 'text-indigo-700', icon: Database, label: 'DATABASE (FAISS/SQLite)' },
  response: { bg: 'bg-emerald-50', border: 'border-emerald-200', text: 'text-emerald-700', icon: CheckCircle2, label: 'RESPONSE' },
}

function LiveTestSimulator({ scenario, onClose, onComplete }: { scenario: LiveTestScenario; onClose: () => void; onComplete: () => void }) {
  const [running, setRunning] = useState(false)
  const [currentStep, setCurrentStep] = useState(-1)
  const [completedSteps, setCompletedSteps] = useState<number[]>([])
  const [finished, setFinished] = useState(false)
  const [transitDots, setTransitDots] = useState<{ id: number; fromIdx: number; toIdx: number; color: string }[]>([])
  const containerRef = useRef<HTMLDivElement>(null)
  const stepRefs = useRef<(HTMLDivElement | null)[]>([])
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const dotId = useRef(0)

  /* Layer color mapping for the vertical timeline rail */
  const layerRailColor: Record<string, string> = {
    frontend: '#3b82f6', backend: '#22c55e', ai: '#8b5cf6', database: '#6366f1', response: '#10b981',
  }

  /* Auto-scroll to current step */
  useEffect(() => {
    if (currentStep >= 0 && stepRefs.current[currentStep]) {
      stepRefs.current[currentStep]?.scrollIntoView({ behavior: 'smooth', block: 'center' })
    }
  }, [currentStep])

  const runTest = () => {
    setRunning(true); setCurrentStep(0); setCompletedSteps([]); setFinished(false); setTransitDots([])
    let step = 0
    const tick = () => {
      if (step >= scenario.steps.length) { setFinished(true); setRunning(false); onComplete(); return }
      setCurrentStep(step)
      setCompletedSteps(prev => [...prev, step])
      // Launch traveling dot to next step
      const nextStep = step + 1
      if (nextStep < scenario.steps.length) {
        const id = dotId.current++
        const color = layerRailColor[scenario.steps[step].layer] || '#6366f1'
        setTransitDots(prev => [...prev, { id, fromIdx: step, toIdx: nextStep, color }])
        setTimeout(() => setTransitDots(prev => prev.filter(e => e.id !== id)), 1400)
      }
      step++
      timerRef.current = setTimeout(tick, scenario.steps[step - 1]?.duration || 1000)
    }
    tick()
  }

  useEffect(() => { return () => { if (timerRef.current) clearTimeout(timerRef.current) } }, [])

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="mt-6" ref={containerRef}>
      {/* Header Card */}
      <div className="glass-card rounded-2xl p-6 border border-white/60 mb-6 relative overflow-hidden">
        <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-emerald-500 via-blue-500 to-purple-500" />
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-xl font-bold text-slate-800 flex items-center gap-2"><MonitorPlay className="w-5 h-5 text-emerald-500" />{scenario.title}</h2>
            <p className="text-sm text-slate-500 mt-1">{scenario.description}</p>
          </div>
          <motion.button whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }} onClick={runTest} disabled={running}
            className={`flex items-center gap-2 px-6 py-3 rounded-xl font-semibold text-sm shadow-lg transition-all ${running ? 'bg-slate-200 text-slate-400 cursor-wait' : 'bg-gradient-to-r from-emerald-500 to-teal-600 text-white shadow-emerald-500/20 hover:shadow-xl'}`}>
            {running ? <><Loader2 className="w-4 h-4 animate-spin" />Running…</> : finished ? <><RotateCcw className="w-4 h-4" />Re-Run Test</> : <><Play className="w-4 h-4" />Start Live Test</>}
          </motion.button>
        </div>
        <div className="bg-slate-50 rounded-xl p-4 border border-slate-200 flex items-center gap-3">
          <Send className="w-5 h-5 text-blue-500 flex-shrink-0" />
          <div>
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">User Input</p>
            <p className="text-sm text-slate-700 font-mono mt-0.5">{scenario.userInput}</p>
          </div>
        </div>
      </div>

      {/* Progress Bar */}
      {(running || finished) && (
        <div className="mb-6">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-semibold text-slate-500">Progress</span>
            <span className="text-xs font-bold text-blue-600">{completedSteps.length}/{scenario.steps.length} steps</span>
          </div>
          <div className="w-full h-2.5 bg-slate-100 rounded-full overflow-hidden">
            <motion.div className="h-full bg-gradient-to-r from-emerald-500 via-blue-500 to-purple-500 rounded-full" animate={{ width: `${(completedSteps.length / scenario.steps.length) * 100}%` }} transition={{ duration: 0.4, ease: 'easeOut' }} />
          </div>
          {/* Layer summary mini-bar */}
          <div className="flex gap-3 mt-2">
            {Object.entries(LAYER_CONFIG).map(([key, cfg]) => {
              const count = scenario.steps.filter(s => s.layer === key).length
              const done = scenario.steps.filter((s, i) => s.layer === key && completedSteps.includes(i)).length
              if (count === 0) return null
              return (
                <div key={key} className="flex items-center gap-1.5 text-[10px]">
                  <div className={`w-1.5 h-1.5 rounded-full`} style={{ backgroundColor: layerRailColor[key] }} />
                  <span className={`font-medium ${done === count ? 'text-emerald-600' : 'text-slate-400'}`}>{cfg.label.split(' ')[0]} {done}/{count}</span>
                </div>
              )
            })}
          </div>
        </div>
      )}

      {/* Steps Timeline — professional vertical rail */}
      <div className="relative pl-8">
        {/* Vertical rail line */}
        <div className="absolute left-[23px] top-0 bottom-0 w-[2px] bg-slate-200 rounded-full" />
        {/* Animated fill of rail */}
        {(running || finished) && (
          <motion.div className="absolute left-[23px] top-0 w-[2px] rounded-full bg-gradient-to-b from-emerald-500 via-blue-500 to-purple-500"
            animate={{ height: `${(completedSteps.length / scenario.steps.length) * 100}%` }}
            transition={{ duration: 0.5, ease: 'easeOut' }} />
        )}

        <div className="space-y-1">
          {scenario.steps.map((step, i) => {
            const isActive = currentStep === i && running
            const isDone = completedSteps.includes(i)
            const isFuture = !isDone && !isActive
            const layerCfg = LAYER_CONFIG[step.layer]
            const isLayerChange = i === 0 || scenario.steps[i - 1].layer !== step.layer

            return (
              <div key={step.id} ref={el => { stepRefs.current[i] = el }}>
                {/* Layer transition banner */}
                {isLayerChange && (
                  <motion.div initial={{ opacity: 0, x: -10 }} animate={{ opacity: isDone || isActive ? 1 : 0.4, x: 0 }} transition={{ duration: 0.3 }}
                    className={`ml-6 mb-2 mt-${i === 0 ? '0' : '4'}`}>
                    <div className={`inline-flex items-center gap-2 ${layerCfg.bg} ${layerCfg.border} border rounded-lg px-3 py-1.5`}>
                      <div className="w-2 h-2 rounded-full" style={{ backgroundColor: layerRailColor[step.layer] }} />
                      <span className="text-xs font-bold">{layerCfg.label}</span>
                      {isActive && (
                        <motion.span className="text-xs" animate={{ opacity: [1, 0.4, 1] }} transition={{ repeat: Infinity, duration: 1 }}>●</motion.span>
                      )}
                    </div>
                    {/* Layer transition animation */}
                    {i > 0 && isDone && (
                      <motion.div className="ml-2 inline-block" initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }}>
                        <span className="text-xs text-slate-400">↓ data flows to {step.layer}</span>
                      </motion.div>
                    )}
                  </motion.div>
                )}

                <motion.div
                  initial={{ opacity: 0.2 }}
                  animate={{ opacity: isDone || isActive ? 1 : 0.25 }}
                  transition={{ duration: 0.35 }}
                  className="flex items-start gap-3 relative"
                >
                  {/* Timeline node on the rail */}
                  <div className="absolute left-[-32px] mt-3.5 flex flex-col items-center">
                    <motion.div
                      animate={isActive ? { scale: [1, 1.4, 1], boxShadow: [`0 0 0px ${layerRailColor[step.layer]}00`, `0 0 12px ${layerRailColor[step.layer]}80`, `0 0 0px ${layerRailColor[step.layer]}00`] } : {}}
                      transition={{ duration: 0.8, repeat: isActive ? Infinity : 0 }}
                      className={`w-5 h-5 rounded-full border-2 flex items-center justify-center transition-all duration-300 ${
                        isDone ? 'border-emerald-500 bg-emerald-500' : isActive ? 'border-white bg-white' : 'border-slate-300 bg-white'
                      }`}
                      style={isActive ? { borderColor: layerRailColor[step.layer], backgroundColor: layerRailColor[step.layer] } : {}}>
                      {isDone && !isActive && <Check className="w-3 h-3 text-white" />}
                      {isActive && <motion.div className="w-2 h-2 bg-white rounded-full" animate={{ scale: [0.8, 1.2, 0.8] }} transition={{ repeat: Infinity, duration: 0.8 }} />}
                    </motion.div>
                  </div>

                  {/* Step icon */}
                  <motion.div
                    animate={isActive ? { scale: [1, 1.1, 1], rotate: [0, 3, -3, 0] } : {}}
                    transition={{ repeat: isActive ? Infinity : 0, duration: 1.2 }}
                    className={`relative flex-shrink-0 w-11 h-11 rounded-xl flex items-center justify-center shadow-md transition-all duration-300 ${
                      isDone ? `bg-gradient-to-br ${step.color} shadow-lg` : isActive ? `bg-gradient-to-br ${step.color} shadow-xl ring-2 ring-offset-1 ring-emerald-400` : 'bg-slate-100 text-slate-400'
                    }`}>
                    {step.icon && <step.icon className={`w-5 h-5 ${isDone || isActive ? 'text-white' : 'text-slate-400'}`} />}
                    {isActive && (
                      <motion.div className="absolute -inset-0.5 rounded-xl"
                        style={{ border: `2px solid ${layerRailColor[step.layer]}` }}
                        animate={{ opacity: [0.8, 0, 0.8], scale: [1, 1.15, 1] }}
                        transition={{ repeat: Infinity, duration: 1.2 }} />
                    )}
                  </motion.div>

                  {/* Content card */}
                  <div className={`flex-1 rounded-xl px-4 py-3 border transition-all duration-300 ${
                    isActive ? `${layerCfg.bg} ${layerCfg.border} shadow-md ring-1 ring-emerald-200 ring-offset-1` : isDone ? `${layerCfg.bg} ${layerCfg.border}` : 'bg-slate-50/80 border-slate-200'
                  }`}>
                    <div className="flex items-center gap-2 mb-1">
                      <span className={`font-semibold text-sm ${isDone || isActive ? layerCfg.text : 'text-slate-300'}`}>{step.label}</span>
                      {isDone && !isActive && <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />}
                      {isActive && <motion.div animate={{ rotate: 360 }} transition={{ repeat: Infinity, duration: 1, ease: 'linear' }}><Loader2 className="w-3.5 h-3.5 text-emerald-500" /></motion.div>}
                      <span className={`ml-auto text-[10px] font-mono ${isDone || isActive ? 'text-slate-400' : 'text-slate-200'}`}>Step {i + 1}</span>
                    </div>
                    <p className={`text-xs font-mono leading-relaxed ${isDone || isActive ? 'text-slate-600' : 'text-slate-300'}`}>{step.detail}</p>
                  </div>
                </motion.div>

                {/* Flowing dots between steps */}
                {i < scenario.steps.length - 1 && isDone && (
                  <div className="ml-6 py-1 flex items-center gap-2">
                    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 0.6 }} className="flex items-center gap-1">
                      <motion.div className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: layerRailColor[step.layer] }} animate={{ opacity: [0.3, 1, 0.3] }} transition={{ repeat: Infinity, duration: 0.8, delay: 0 }} />
                      <motion.div className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: layerRailColor[step.layer] }} animate={{ opacity: [0.3, 1, 0.3] }} transition={{ repeat: Infinity, duration: 0.8, delay: 0.15 }} />
                      <motion.div className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: layerRailColor[step.layer] }} animate={{ opacity: [0.3, 1, 0.3] }} transition={{ repeat: Infinity, duration: 0.8, delay: 0.3 }} />
                      <ArrowDown className="w-3.5 h-3.5 text-slate-400" />
                      <motion.div className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: layerRailColor[scenario.steps[i + 1]?.layer || step.layer] }} animate={{ opacity: [0.3, 1, 0.3] }} transition={{ repeat: Infinity, duration: 0.8, delay: 0.45 }} />
                      <motion.div className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: layerRailColor[scenario.steps[i + 1]?.layer || step.layer] }} animate={{ opacity: [0.3, 1, 0.3] }} transition={{ repeat: Infinity, duration: 0.8, delay: 0.6 }} />
                    </motion.div>
                    {/* Show layer transition label if layer changes */}
                    {scenario.steps[i + 1] && step.layer !== scenario.steps[i + 1].layer && (
                      <motion.span initial={{ opacity: 0, x: -5 }} animate={{ opacity: 1, x: 0 }} className="text-[10px] text-slate-400 font-medium bg-slate-100 px-2 py-0.5 rounded-full">
                        {step.layer} → {scenario.steps[i + 1].layer}
                      </motion.span>
                    )}
                  </div>
                )}
              </div>
            )
          })}
        </div>
      </div>

      {/* Floating transit dots (between steps, animated glow) */}
      <AnimatePresence>
        {transitDots.map(fd => (
          <motion.div key={fd.id} className="fixed z-50 pointer-events-none" style={{ left: '52%', top: '50%' }}
            initial={{ opacity: 0, scale: 0.3, y: 0 }}
            animate={{ opacity: [0, 1, 1, 0.3, 0], scale: [0.3, 1.4, 1.2, 1, 0.3], y: [0, -15, -30, -50, -70], x: [0, 8, -5, 3, 0] }}
            exit={{ opacity: 0 }}
            transition={{ duration: 1.3, ease: 'easeOut' }}>
            <div className="w-4 h-4 rounded-full" style={{ backgroundColor: fd.color, boxShadow: `0 0 12px ${fd.color}80, 0 0 24px ${fd.color}40` }} />
          </motion.div>
        ))}
      </AnimatePresence>

      {/* Final Output */}
      <AnimatePresence>
        {finished && (
          <motion.div initial={{ opacity: 0, y: 30, scale: 0.95 }} animate={{ opacity: 1, y: 0, scale: 1 }} transition={{ type: 'spring', stiffness: 200, damping: 20 }} className="mt-8">
            <div className="bg-gradient-to-br from-emerald-50 via-white to-teal-50 rounded-2xl p-6 border-2 border-emerald-200 shadow-xl relative overflow-hidden">
              <motion.div className="absolute inset-0 bg-gradient-to-r from-emerald-300/10 via-transparent to-emerald-300/10" animate={{ x: ['-100%', '100%'] }} transition={{ repeat: Infinity, duration: 4, ease: 'linear' }} />
              <div className="relative z-10">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center shadow-lg"><CheckCircle2 className="w-5 h-5 text-white" /></div>
                  <div>
                    <h3 className="font-bold text-emerald-800 flex items-center gap-2">Test Complete</h3>
                    <p className="text-xs text-emerald-600">Full pipeline executed — here's the final output to the user</p>
                  </div>
                </div>
                <div className="bg-white/90 rounded-xl p-4 border border-emerald-100 shadow-sm">
                  <p className="text-sm text-slate-700 whitespace-pre-wrap font-mono leading-relaxed">{scenario.finalOutput}</p>
                </div>
                <div className="mt-4 flex flex-wrap items-center gap-3">
                  {Object.entries(LAYER_CONFIG).map(([key, cfg]) => {
                    const count = scenario.steps.filter(s => s.layer === key).length
                    if (count === 0) return null
                    return (
                      <div key={key} className={`flex items-center gap-1.5 ${cfg.bg} ${cfg.border} border rounded-full px-2.5 py-1 text-[10px] font-semibold ${cfg.text}`}>
                        <div className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: layerRailColor[key] }} />
                        {cfg.label.split('(')[0].trim()} × {count}
                      </div>
                    )
                  })}
                  <span className="text-[10px] text-slate-400 font-medium">· {scenario.steps.length} total steps</span>
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  )
}

/* ══════════════════════════════════════════════════════════
   SUB-COMPONENTS
   ══════════════════════════════════════════════════════════ */

function AIAvatar({ speaking, mood }: { speaking: boolean; mood: 'happy' | 'thinking' | 'excited' | 'neutral' }) {
  const gr: Record<string, string> = { happy: 'from-emerald-400 to-teal-500', thinking: 'from-violet-400 to-purple-500', excited: 'from-amber-400 to-orange-500', neutral: 'from-blue-400 to-indigo-500' }
  const MoodIcon: Record<string, any> = { happy: Sparkles, thinking: Brain, excited: Zap, neutral: Bot }
  const Icon = MoodIcon[mood] || Bot
  return (
    <motion.div className="relative" animate={speaking ? { scale: [1, 1.05, 1] } : {}} transition={{ repeat: speaking ? Infinity : 0, duration: 1.5 }}>
      <motion.div className={`absolute -inset-2 rounded-full bg-gradient-to-r ${gr[mood]} opacity-20 blur-lg`} animate={{ scale: [1, 1.2, 1], opacity: [0.2, 0.4, 0.2] }} transition={{ repeat: Infinity, duration: 3 }} />
      <div className={`relative w-16 h-16 rounded-full bg-gradient-to-br ${gr[mood]} flex items-center justify-center shadow-lg`}>
        <Icon className="w-7 h-7 text-white" />
        {speaking && <motion.div className="absolute -bottom-1 -right-1"><motion.div className="w-5 h-5 rounded-full bg-white shadow-md flex items-center justify-center" animate={{ scale: [1, 1.3, 1] }} transition={{ repeat: Infinity, duration: 0.6 }}><Volume2 className="w-3 h-3 text-blue-500" /></motion.div></motion.div>}
      </div>
    </motion.div>
  )
}

function AIChatBubble({ message }: { message: string }) {
  return (
    <motion.div initial={{ opacity: 0, y: 10, scale: 0.9 }} animate={{ opacity: 1, y: 0, scale: 1 }} transition={{ type: 'spring', stiffness: 300, damping: 25 }} className="relative glass-card rounded-2xl px-5 py-3.5 max-w-md shadow-lg border border-white/60">
      <div className="absolute -left-2 top-4 w-4 h-4 rotate-45 glass-card border-l border-b border-white/60" />
      <p className="text-sm text-slate-700 leading-relaxed relative z-10">{message}</p>
    </motion.div>
  )
}

function XPPopup({ amount, visible }: { amount: number; visible: boolean }) {
  return <AnimatePresence>{visible && (
    <motion.div initial={{ opacity: 0, y: 20, scale: 0.5 }} animate={{ opacity: 1, y: -30, scale: 1 }} exit={{ opacity: 0, y: -60, scale: 0.5 }} className="fixed top-20 right-10 z-50 bg-gradient-to-r from-amber-400 to-yellow-500 text-white font-bold px-5 py-2.5 rounded-full shadow-2xl shadow-amber-500/30 flex items-center gap-2">
      <Star className="w-5 h-5" fill="white" /><span>+{amount} XP</span>
    </motion.div>
  )}</AnimatePresence>
}

function LevelUpModal({ level, onClose }: { level: number; onClose: () => void }) {
  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm" onClick={onClose}>
      <motion.div initial={{ scale: 0.5, rotateZ: -5 }} animate={{ scale: 1, rotateZ: 0 }} exit={{ scale: 0.5, opacity: 0 }} transition={{ type: 'spring', stiffness: 200, damping: 15 }} className="bg-gradient-to-br from-amber-50 via-white to-yellow-50 rounded-3xl p-10 shadow-2xl border border-amber-100 text-center max-w-sm mx-4 relative" onClick={(e: React.MouseEvent) => e.stopPropagation()}>
        <div className="flex items-center justify-center gap-3 mb-4"><Star className="w-10 h-10 text-amber-400" fill="#fbbf24" /><Trophy className="w-12 h-12 text-amber-500" /><Star className="w-10 h-10 text-amber-400" fill="#fbbf24" /></div>
        <h2 className="text-3xl font-bold text-gradient-gold mb-2">Level Up!</h2>
        <div className="text-6xl font-black text-amber-500 my-4">{level}</div>
        <p className="text-slate-600 text-lg mb-1">{getLevelTitle(level)}</p>
        <p className="text-slate-400 text-sm mb-6">Keep learning to unlock more!</p>
        <button onClick={onClose} className="bg-gradient-to-r from-amber-500 to-yellow-500 text-white px-8 py-3 rounded-xl font-semibold shadow-lg hover:shadow-xl transition-all hover:scale-105">Continue</button>
      </motion.div>
    </motion.div>
  )
}

function ConfettiBurst({ active }: { active: boolean }) {
  if (!active) return null
  const c = ['#10b981', '#3b82f6', '#8b5cf6', '#f59e0b', '#ef4444', '#ec4899']
  return <div className="fixed inset-0 pointer-events-none z-40">{[...Array(30)].map((_, i) => (
    <motion.div key={i} className="absolute w-3 h-3 rounded-full" style={{ backgroundColor: c[i % c.length], left: `${40 + Math.random() * 20}%`, top: '40%' }} initial={{ opacity: 1 }} animate={{ x: (Math.random() - 0.5) * 500, y: [0, -200 - Math.random() * 200, 600], rotate: Math.random() * 720, opacity: [1, 1, 0] }} transition={{ duration: 2 + Math.random(), ease: 'easeOut' }} />
  ))}</div>
}

function ProgressRing({ progress, size = 60, strokeWidth = 5, color = '#3b82f6' }: { progress: number; size?: number; strokeWidth?: number; color?: string }) {
  const r = (size - strokeWidth) / 2, circ = 2 * Math.PI * r, off = circ - (progress / 100) * circ
  return (
    <svg width={size} height={size} className="transform -rotate-90">
      <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="#e2e8f0" strokeWidth={strokeWidth} />
      <motion.circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke={color} strokeWidth={strokeWidth} strokeDasharray={circ} initial={{ strokeDashoffset: circ }} animate={{ strokeDashoffset: off }} transition={{ duration: 1 }} strokeLinecap="round" />
    </svg>
  )
}

/* ══════════════════════════════════════════════════════════
   PERSISTENCE
   ══════════════════════════════════════════════════════════ */

const STORAGE_KEY = 'medai_learning_progress_v4'
function loadProgress(): UserProgress {
  try { const r = localStorage.getItem(STORAGE_KEY); if (r) return JSON.parse(r) } catch {}
  return { xp: 0, level: 1, streak: 0, completedLessons: [], completedModules: [], badges: [], quizScores: {}, dailyGoalMet: false, totalCorrectAnswers: 0, totalQuestionsAttempted: 0 }
}
function saveProgress(p: UserProgress) { localStorage.setItem(STORAGE_KEY, JSON.stringify(p)) }

/* ══════════════════════════════════════════════════════════
   MAIN COMPONENT
   ══════════════════════════════════════════════════════════ */

export default function LearningLab() {
  const [view, setView] = useState<ViewState>('home')
  const [progress, setProgress] = useState<UserProgress>(loadProgress)
  const [selMod, setSelMod] = useState<LearningModule | null>(null)
  const [selLesson, setSelLesson] = useState<Lesson | null>(null)
  const [qIdx, setQIdx] = useState(0)
  const [ans, setAns] = useState<number | null>(null)
  const [showExpl, setShowExpl] = useState(false)
  const [score, setScore] = useState(0)
  const [answers, setAnswers] = useState<boolean[]>([])
  const [qStart, setQStart] = useState(0)
  const [shuffledQuiz, setShuffledQuiz] = useState<QuizQuestion[]>([])
  const [aiMsg, setAiMsg] = useState(pickMsg('welcome'))
  const [aiMood, setAiMood] = useState<'happy' | 'thinking' | 'excited' | 'neutral'>('happy')
  const [aiTalk, setAiTalk] = useState(true)
  const [xpVis, setXpVis] = useState(false)
  const [xpAmt, setXpAmt] = useState(0)
  const [lvlUp, setLvlUp] = useState(false)
  const [confetti, setConfetti] = useState(false)
  const [newBadge, setNewBadge] = useState<BadgeData | null>(null)
  const [liveTestCount, setLiveTestCount] = useState(0)
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => { saveProgress(progress) }, [progress])
  useEffect(() => { const t = setTimeout(() => setAiTalk(false), 4000); return () => clearTimeout(t) }, [aiMsg])

  const say = useCallback((cat: keyof typeof AVATAR_MSG, mood: 'happy' | 'thinking' | 'excited' | 'neutral') => { setAiMsg(pickMsg(cat)); setAiMood(mood); setAiTalk(true) }, [])

  const grantXP = useCallback((amount: number) => {
    const total = amount + Math.floor(amount * progress.streak * STREAK_BONUS)
    setXpAmt(total); setXpVis(true); setTimeout(() => setXpVis(false), 2000)
    setProgress(prev => {
      const nxp = prev.xp + total, nlvl = calcLevel(nxp)
      if (nlvl > prev.level) setTimeout(() => { setLvlUp(true); setConfetti(true); say('levelUp', 'excited'); setTimeout(() => setConfetti(false), 3000) }, 500)
      return { ...prev, xp: nxp, level: nlvl }
    })
  }, [progress.streak, say])

  const checkBadges = useCallback((up: UserProgress): UserProgress => {
    const eids = up.badges.map(b => b.id); let newest: BadgeData | null = null
    for (const bd of ALL_BADGES) {
      if (eids.includes(bd.id)) continue; let earn = false
      switch (bd.id) {
        case 'first_lesson': earn = up.completedLessons.length >= 1; break
        case 'quiz_perfect': earn = Object.values(up.quizScores).some(s => s === 100); break
        case 'streak_3': earn = up.streak >= 3; break; case 'streak_7': earn = up.streak >= 7; break
        case 'modules_3': earn = up.completedModules.length >= 3; break
        case 'xp_1000': earn = up.xp >= 1000; break; case 'xp_5000': earn = up.xp >= 5000; break
        case 'all_modules': earn = up.completedModules.length >= MODULES.length; break
        case 'speed_demon': earn = false; break // earned manually
        case 'correct_50': earn = up.totalCorrectAnswers >= 50; break
        case 'live_tester': earn = liveTestCount >= 3; break
        case 'architect': earn = false; break // earned manually
      }
      if (earn) { const b: BadgeData = { ...bd, earned: true, earnedAt: new Date().toISOString() }; up = { ...up, badges: [...up.badges, b] }; newest = b }
    }
    if (newest) { setNewBadge(newest); setTimeout(() => setNewBadge(null), 4000) }
    return up
  }, [liveTestCount])

  const openMod = (m: LearningModule) => { if (!m.unlocked) return; setSelMod(m); setView('module'); say('encouragement', 'happy'); ref.current?.scrollTo(0, 0) }
  const startLesson = (l: Lesson) => { setSelLesson(l); setView('lesson'); setAiMood('thinking'); setAiMsg("Read through the lesson and study the flow diagram. Hit the quiz when ready!"); setAiTalk(true); ref.current?.scrollTo(0, 0) }
  const startQuiz = () => { if (!selLesson) return; const sq = shuffleQuiz(selLesson.quiz); setShuffledQuiz(sq); setView('quiz'); setQIdx(0); setAns(null); setShowExpl(false); setScore(0); setAnswers([]); setQStart(Date.now()); say('encouragement', 'thinking'); ref.current?.scrollTo(0, 0) }

  const openLiveTest = () => { setView('livetest'); say('livetest', 'excited'); ref.current?.scrollTo(0, 0) }
  const openArchitecture = () => {
    setView('architecture'); say('encouragement', 'happy'); ref.current?.scrollTo(0, 0)
    // Award architect badge
    setProgress(prev => {
      if (prev.badges.find(b => b.id === 'architect')) return prev
      const bd = ALL_BADGES.find(b => b.id === 'architect')!
      const b: BadgeData = { ...bd, earned: true, earnedAt: new Date().toISOString() }
      setNewBadge(b); setTimeout(() => setNewBadge(null), 4000)
      return { ...prev, badges: [...prev.badges, b] }
    })
  }

  const onLiveTestComplete = () => {
    const newCount = liveTestCount + 1
    setLiveTestCount(newCount)
    grantXP(30)
    if (newCount >= 3) {
      setProgress(prev => {
        if (prev.badges.find(b => b.id === 'live_tester')) return prev
        const bd = ALL_BADGES.find(b => b.id === 'live_tester')!
        const b: BadgeData = { ...bd, earned: true, earnedAt: new Date().toISOString() }
        setNewBadge(b); setTimeout(() => setNewBadge(null), 4000)
        return { ...prev, badges: [...prev.badges, b] }
      })
    }
  }

  const pickAnswer = (i: number) => {
    if (showExpl || !selLesson || shuffledQuiz.length === 0) return
    const ok = i === shuffledQuiz[qIdx].correct
    setAns(i); setShowExpl(true); setAnswers(p => [...p, ok])
    if (ok) { setScore(p => p + 1); say('correct', 'excited') } else say('incorrect', 'thinking')
  }

  const nextQ = () => { if (!selLesson || shuffledQuiz.length === 0) return; if (qIdx < shuffledQuiz.length - 1) { setQIdx(p => p + 1); setAns(null); setShowExpl(false) } else finishQuiz() }

  const finishQuiz = () => {
    if (!selLesson || !selMod) return
    const tot = selLesson.quiz.length, pct = Math.round((score / tot) * 100), elapsed = (Date.now() - qStart) / 1000
    const passed = pct >= PASS_THRESHOLD
    setView('results'); grantXP(selLesson.xpReward + (pct === 100 ? 50 : pct >= 80 ? 25 : 0))
    setProgress(prev => {
      let up: UserProgress = {
        ...prev,
        // Only mark lesson complete if passed
        completedLessons: passed && !prev.completedLessons.includes(selLesson.id)
          ? [...prev.completedLessons, selLesson.id]
          : prev.completedLessons,
        quizScores: { ...prev.quizScores, [selLesson.id]: Math.max(prev.quizScores[selLesson.id] || 0, pct) },
        totalCorrectAnswers: prev.totalCorrectAnswers + score,
        totalQuestionsAttempted: prev.totalQuestionsAttempted + tot,
        streak: prev.dailyGoalMet ? prev.streak : prev.streak + 1,
        dailyGoalMet: true,
      }
      if (passed && selMod.lessons.every(l => up.completedLessons.includes(l.id)) && !up.completedModules.includes(selMod.id)) { up = { ...up, completedModules: [...up.completedModules, selMod.id] }; grantXP(selMod.xpReward) }
      if (elapsed < 30 && pct === 100) { const sb = ALL_BADGES.find(b => b.id === 'speed_demon'); if (sb && !up.badges.find(b => b.id === 'speed_demon')) { const e = { ...sb, earned: true, earnedAt: new Date().toISOString() }; up = { ...up, badges: [...up.badges, e] }; setNewBadge(e); setTimeout(() => setNewBadge(null), 4000) } }
      return checkBadges(up)
    })
    if (pct === 100) { setConfetti(true); setTimeout(() => setConfetti(false), 3000); say('correct', 'excited') } else if (passed) { say('encouragement', 'happy') } else { say('incorrect', 'thinking') }
    ref.current?.scrollTo(0, 0)
  }

  const goHome = () => { setView('home'); setSelMod(null); setSelLesson(null); say('welcome', 'happy'); ref.current?.scrollTo(0, 0) }

  /* ── Module-level gating ──
     Module 0 (LLM Basics) is always unlocked.
     Each subsequent module unlocks only when EVERY quiz in the previous module
     has been passed with ≥ PASS_THRESHOLD (75%). */
  const allMods = MODULES.map((m, idx) => {
    if (idx === 0) return { ...m, unlocked: true }
    const prevMod = MODULES[idx - 1]
    const prevFullyPassed = prevMod.lessons.every(l => {
      const best = progress.quizScores[l.id]
      return best !== undefined && best >= PASS_THRESHOLD
    })
    return { ...m, unlocked: prevFullyPassed }
  })
  const totalL = MODULES.reduce((a, m) => a + m.lessons.length, 0)
  const compPct = totalL > 0 ? Math.round((progress.completedLessons.length / totalL) * 100) : 0
  const badgesAll = ALL_BADGES.map(b => progress.badges.find(e => e.id === b.id) || b)

  return (
    <div ref={ref} className="min-h-full overflow-y-auto">
      <XPPopup amount={xpAmt} visible={xpVis} />
      <ConfettiBurst active={confetti} />
      <AnimatePresence>{lvlUp && <LevelUpModal level={progress.level} onClose={() => setLvlUp(false)} />}</AnimatePresence>

      {/* Badge toast */}
      <AnimatePresence>{newBadge && (
        <motion.div initial={{ opacity: 0, x: 100 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 100 }} className="fixed bottom-6 right-6 z-50 glass-card rounded-2xl p-4 shadow-2xl border border-amber-200 flex items-center gap-4 max-w-xs">
          <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-amber-400 to-yellow-500 flex items-center justify-center shadow-lg"><Trophy className="w-6 h-6 text-white" /></div>
          <div><p className="text-xs font-semibold text-amber-600 uppercase tracking-wide">Badge Earned!</p><p className="font-bold text-slate-800">{newBadge.name}</p><p className="text-xs text-slate-500">{newBadge.description}</p></div>
        </motion.div>
      )}</AnimatePresence>

      {/* ── HEADER ── */}
      <div className="sticky top-0 z-30 glass-strong border-b border-white/40">
        <div className="max-w-7xl mx-auto px-6 py-3 flex items-center justify-between">
          <div className="flex items-center gap-4">
            {view !== 'home' && (
              <motion.button whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }} onClick={
                view === 'module' ? goHome :
                view === 'livetest' && selMod ? () => { setView('module') } :
                view === 'architecture' ? goHome :
                (view === 'lesson' || view === 'quiz' || view === 'results') ? () => { setView('module'); setSelLesson(null) } :
                goHome
              } className="p-2 rounded-xl hover:bg-white/60 transition-colors">
                <ChevronLeft className="w-5 h-5 text-slate-600" />
              </motion.button>
            )}
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center shadow-lg shadow-blue-500/20"><GraduationCap className="w-5 h-5 text-white" /></div>
              <div><h1 className="text-lg font-bold text-slate-800">Learning Lab</h1><p className="text-xs text-slate-400">{getLevelTitle(progress.level)}</p></div>
            </div>
          </div>
          <div className="flex items-center gap-4">
            {progress.streak > 0 && <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} className="flex items-center gap-1.5 bg-orange-50 border border-orange-200 rounded-full px-3 py-1.5"><Flame className="w-4 h-4 text-orange-500" /><span className="text-sm font-bold text-orange-600">{progress.streak}</span></motion.div>}
            <div className="flex items-center gap-2 bg-amber-50 border border-amber-200 rounded-full px-3 py-1.5"><Star className="w-4 h-4 text-amber-500" fill="#f59e0b" /><span className="text-sm font-bold text-amber-700">{progress.xp.toLocaleString()} XP</span></div>
            <div className="relative"><ProgressRing progress={xpPercent(progress.xp)} size={44} strokeWidth={3} color="#3b82f6" /><div className="absolute inset-0 flex items-center justify-center"><span className="text-xs font-black text-blue-600">{progress.level}</span></div></div>
          </div>
        </div>
      </div>

      {/* ── AI AVATAR ── */}
      <div className="max-w-7xl mx-auto px-6 pt-5 pb-2">
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="flex items-start gap-4">
          <AIAvatar speaking={aiTalk} mood={aiMood} />
          <AIChatBubble message={aiMsg} />
        </motion.div>
      </div>

      {/* ── CONTENT ── */}
      <div className="max-w-7xl mx-auto px-6 pb-10">
        <AnimatePresence mode="wait">

          {/* ═══ HOME ═══ */}
          {view === 'home' && (
            <motion.div key="home" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
              {/* Banner */}
              <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="mt-4 mb-8 rounded-2xl bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 p-6 text-white relative overflow-hidden">
                <motion.div className="absolute inset-0 bg-gradient-to-r from-white/0 via-white/10 to-white/0" animate={{ x: ['-100%', '100%'] }} transition={{ repeat: Infinity, duration: 4, ease: 'linear' }} />
                <div className="relative z-10">
                  <h2 className="text-2xl font-bold mb-2">Understand the AI Behind This App</h2>
                  <p className="text-white/80 text-sm max-w-2xl">Learn how LLMs, RAG, Vector Databases, LangChain, and LangGraph power this platform. Interactive lessons, live tests, and a 3D architecture diagram make complex AI concepts simple.</p>
                </div>
              </motion.div>

              {/* Stats */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
                {[
                  { label: 'Total XP', value: progress.xp.toLocaleString(), Icon: Star, color: 'text-amber-500', bg: 'bg-amber-50', bd: 'border-amber-200', fill: '#f59e0b' as string | undefined },
                  { label: 'Level', value: String(progress.level), Icon: TrendingUp, color: 'text-blue-500', bg: 'bg-blue-50', bd: 'border-blue-200', fill: undefined as string | undefined },
                  { label: 'Completed', value: `${progress.completedLessons.length}/${totalL}`, Icon: Check, color: 'text-emerald-500', bg: 'bg-emerald-50', bd: 'border-emerald-200', fill: undefined as string | undefined },
                  { label: 'Badges', value: String(progress.badges.length), Icon: Trophy, color: 'text-purple-500', bg: 'bg-purple-50', bd: 'border-purple-200', fill: undefined as string | undefined },
                ].map((s, i) => (
                  <motion.div key={s.label} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.1 }} className={`${s.bg} ${s.bd} border rounded-2xl p-4 card-hover`}>
                    <div className="flex items-center justify-between mb-2"><s.Icon className={`w-5 h-5 ${s.color}`} fill={s.fill} /><span className="text-xs font-medium text-slate-400">{s.label}</span></div>
                    <p className="text-2xl font-black text-slate-800">{s.value}</p>
                  </motion.div>
                ))}
              </div>

              {/* Progress */}
              <div className="glass-card rounded-2xl p-5 mb-8 border border-white/60">
                <div className="flex items-center justify-between mb-3"><h3 className="font-semibold text-slate-700">Overall Progress</h3><span className="text-sm font-bold text-blue-600">{compPct}%</span></div>
                <div className="w-full h-3 bg-slate-100 rounded-full overflow-hidden"><motion.div className="h-full bg-gradient-to-r from-blue-500 to-indigo-500 rounded-full" initial={{ width: 0 }} animate={{ width: `${compPct}%` }} transition={{ duration: 1 }} /></div>
                <p className="text-xs text-slate-400 mt-2">{progress.completedLessons.length} of {totalL} lessons completed</p>
              </div>

              {/* Quick actions — now includes Architecture + Badges + Leaderboard */}
              <div className="flex gap-3 mb-8 overflow-x-auto pb-2">
                <motion.button whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }} onClick={openArchitecture} className="flex-shrink-0 flex items-center gap-2 bg-gradient-to-r from-indigo-500 to-purple-600 text-white px-5 py-2.5 rounded-xl font-medium shadow-lg shadow-indigo-500/20 text-sm"><Workflow className="w-4 h-4" />3D Architecture</motion.button>
                <motion.button whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }} onClick={() => setView('badges')} className="flex-shrink-0 flex items-center gap-2 bg-gradient-to-r from-purple-500 to-violet-600 text-white px-5 py-2.5 rounded-xl font-medium shadow-lg shadow-purple-500/20 text-sm"><Trophy className="w-4 h-4" />Badges ({progress.badges.length}/{ALL_BADGES.length})</motion.button>
                <motion.button whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }} onClick={() => setView('leaderboard')} className="flex-shrink-0 flex items-center gap-2 bg-gradient-to-r from-amber-500 to-orange-600 text-white px-5 py-2.5 rounded-xl font-medium shadow-lg shadow-amber-500/20 text-sm"><BarChart3 className="w-4 h-4" />Leaderboard</motion.button>
              </div>

              {/* Modules */}
              <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-5">
                {allMods.map((mod, i) => {
                  const done = mod.lessons.filter(l => progress.completedLessons.includes(l.id)).length
                  const pct = mod.lessons.length > 0 ? Math.round((done / mod.lessons.length) * 100) : 0
                  const complete = progress.completedModules.includes(mod.id)
                  const hasLiveTest = !!mod.liveTestScenario
                  const isLocked = !mod.unlocked
                  // Figure out prerequisite module name for locked tooltip
                  const prevModName = i > 0 ? MODULES[i - 1].title : ''
                  return (
                    <motion.div key={mod.id} initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.08 }}
                      whileHover={!isLocked ? { y: -4 } : {}}
                      onClick={() => !isLocked && openMod(mod)}
                      className={`glass-card rounded-2xl p-6 border relative overflow-hidden group transition-shadow ${isLocked ? 'border-slate-200 opacity-70 cursor-not-allowed' : 'border-white/60 cursor-pointer hover:shadow-xl'}`}>
                      {/* Gradient accent bar */}
                      <div className={`absolute top-0 left-0 right-0 h-1 ${isLocked ? 'bg-slate-300' : `bg-gradient-to-r ${mod.gradient}`}`} />
                      {/* Lock overlay */}
                      {isLocked && (
                        <div className="absolute inset-0 z-10 bg-white/50 backdrop-blur-[2px] flex flex-col items-center justify-center rounded-2xl">
                          <motion.div
                            animate={{ y: [0, -3, 0] }}
                            transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
                            className="w-12 h-12 rounded-xl bg-gradient-to-br from-slate-400 to-slate-500 flex items-center justify-center shadow-lg mb-3"
                          >
                            <Lock className="w-6 h-6 text-white" />
                          </motion.div>
                          <p className="text-xs font-bold text-slate-600 text-center px-4">
                            Pass all quizzes in
                          </p>
                          <p className="text-xs font-bold text-blue-600 text-center px-4">
                            "{prevModName}"
                          </p>
                          <p className="text-[10px] text-slate-400 mt-1">
                            with {PASS_THRESHOLD}%+ to unlock
                          </p>
                        </div>
                      )}
                      <div className="flex items-start justify-between mb-4">
                        <div className={`w-12 h-12 rounded-xl ${isLocked ? 'bg-slate-300' : `bg-gradient-to-br ${mod.gradient}`} flex items-center justify-center shadow-lg ${isLocked ? '' : mod.glow}`}><mod.icon className="w-6 h-6 text-white" /></div>
                        <div className="flex items-center gap-1.5">
                          {hasLiveTest && !isLocked && <span className="text-[10px] font-bold bg-emerald-50 text-emerald-600 border border-emerald-200 px-2 py-0.5 rounded-full">Live Test</span>}
                          {complete && <div className="flex items-center gap-1 bg-emerald-50 border border-emerald-200 rounded-full px-2 py-1"><Check className="w-3.5 h-3.5 text-emerald-500" /><span className="text-xs font-semibold text-emerald-600">Done</span></div>}
                          {isLocked && <div className="flex items-center gap-1 bg-slate-100 border border-slate-200 rounded-full px-2 py-1"><Lock className="w-3 h-3 text-slate-400" /><span className="text-xs font-semibold text-slate-500">Locked</span></div>}
                        </div>
                      </div>
                      <p className={`text-[10px] font-semibold uppercase tracking-wider mb-1 ${isLocked ? 'text-slate-300' : 'text-slate-400'}`}>{mod.category}</p>
                      <h3 className={`font-bold mb-1 transition-colors ${isLocked ? 'text-slate-400' : 'text-slate-800 group-hover:text-blue-600'}`}>{mod.title}</h3>
                      <p className={`text-sm mb-4 line-clamp-2 ${isLocked ? 'text-slate-400' : 'text-slate-500'}`}>{mod.description}</p>
                      <div className="flex items-center justify-between text-xs text-slate-400"><span>{mod.lessons.length} lesson{mod.lessons.length > 1 ? 's' : ''}</span><span className={`font-semibold ${isLocked ? 'text-slate-400' : 'text-amber-600'}`}>+{mod.xpReward} XP</span></div>
                      <div className="mt-3 w-full h-1.5 bg-slate-100 rounded-full overflow-hidden"><motion.div className={`h-full ${isLocked ? 'bg-slate-300' : `bg-gradient-to-r ${mod.gradient}`} rounded-full`} initial={{ width: 0 }} animate={{ width: `${pct}%` }} transition={{ duration: 0.8 }} /></div>
                    </motion.div>
                  )
                })}
              </div>
            </motion.div>
          )}

          {/* ═══ 3D ARCHITECTURE ═══ */}
          {view === 'architecture' && (
            <motion.div key="arch" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
              <ArchitectureDiagram3D onClose={goHome} />
            </motion.div>
          )}

          {/* ═══ LIVE TEST ═══ */}
          {view === 'livetest' && selMod?.liveTestScenario && (
            <motion.div key="livetest" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
              <LiveTestSimulator scenario={selMod.liveTestScenario} onClose={() => setView('module')} onComplete={onLiveTestComplete} />
            </motion.div>
          )}

          {/* ═══ MODULE ═══ */}
          {view === 'module' && selMod && (
            <motion.div key="module" initial={{ opacity: 0, x: 30 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -30 }} className="mt-6">
              <div className="glass-card rounded-2xl p-8 border border-white/60 mb-6 relative overflow-hidden">
                <div className={`absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r ${selMod.gradient}`} />
                <div className="flex items-center gap-4 mb-4">
                  <div className={`w-14 h-14 rounded-2xl bg-gradient-to-br ${selMod.gradient} flex items-center justify-center shadow-xl ${selMod.glow}`}><selMod.icon className="w-7 h-7 text-white" /></div>
                  <div><p className="text-xs font-medium text-slate-400 uppercase tracking-wider">{selMod.category}</p><h2 className="text-2xl font-bold text-slate-800">{selMod.title}</h2></div>
                </div>
                <p className="text-slate-600 mb-4">{selMod.description}</p>
                <div className="flex items-center gap-4 text-sm"><span className="flex items-center gap-1.5 text-slate-500"><BookOpen className="w-4 h-4" />{selMod.lessons.length} lesson{selMod.lessons.length > 1 ? 's' : ''}</span><span className="flex items-center gap-1.5 text-amber-600 font-semibold"><Star className="w-4 h-4" fill="#f59e0b" />+{selMod.xpReward} XP</span></div>
              </div>

              {/* Live Test button */}
              {selMod.liveTestScenario && (
                <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="mb-6">
                  <motion.button whileHover={{ scale: 1.02, y: -2 }} whileTap={{ scale: 0.98 }} onClick={openLiveTest}
                    className="w-full bg-gradient-to-r from-emerald-500 via-teal-500 to-cyan-500 text-white py-5 rounded-2xl font-semibold text-lg shadow-xl shadow-emerald-500/20 flex items-center justify-center gap-3 hover:shadow-2xl transition-all relative overflow-hidden">
                    <motion.div className="absolute inset-0 bg-gradient-to-r from-white/0 via-white/10 to-white/0" animate={{ x: ['-100%', '100%'] }} transition={{ repeat: Infinity, duration: 3, ease: 'linear' }} />
                    <span className="relative z-10 flex items-center gap-3">
                      <MonitorPlay className="w-6 h-6" />
                      Run Live Test — Watch the Full Data Flow
                      <ArrowRight className="w-5 h-5" />
                    </span>
                  </motion.button>
                  <p className="text-center text-xs text-slate-400 mt-2">See exactly how data flows: Frontend → Backend → AI → Database → Response</p>
                </motion.div>
              )}

              {/* Lessons list */}
              <div className="space-y-4">
                {selMod.lessons.map((lesson, i) => {
                  const isDone = progress.completedLessons.includes(lesson.id), best = progress.quizScores[lesson.id]
                  // Gate: first lesson always unlocked; subsequent lessons require previous lesson ≥ 75%
                  const prevLesson = i > 0 ? selMod.lessons[i - 1] : null
                  const prevScore = prevLesson ? (progress.quizScores[prevLesson.id] ?? -1) : 100
                  const isLocked = i > 0 && prevScore < PASS_THRESHOLD
                  return (
                    <motion.div key={lesson.id} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.1 }}
                      whileHover={!isLocked ? { x: 4 } : {}}
                      onClick={() => !isLocked && startLesson(lesson)}
                      className={`glass-card rounded-2xl p-5 border border-white/60 flex items-center gap-4 group transition-all ${isLocked ? 'opacity-60 cursor-not-allowed' : 'cursor-pointer hover:shadow-lg'}`}>
                      <div className={`w-10 h-10 rounded-xl flex items-center justify-center font-bold text-sm ${isDone ? 'bg-gradient-to-br from-emerald-400 to-teal-500 text-white shadow-lg' : isLocked ? 'bg-slate-200 text-slate-400' : 'bg-slate-100 text-slate-500'}`}>
                        {isDone ? <Check className="w-5 h-5" /> : isLocked ? <Lock className="w-4 h-4" /> : i + 1}
                      </div>
                      <div className="flex-1">
                        <h3 className={`font-semibold transition-colors ${isLocked ? 'text-slate-400' : 'text-slate-800 group-hover:text-blue-600'}`}>{lesson.title}</h3>
                        <div className="flex items-center gap-3 mt-1">
                          <span className="text-xs text-slate-400">{lesson.quiz.length} questions</span>
                          <span className="text-xs text-amber-500 font-medium">+{lesson.xpReward} XP</span>
                          {best !== undefined && <span className={`text-xs font-semibold ${best >= PASS_THRESHOLD ? 'text-emerald-500' : 'text-amber-500'}`}>Best: {best}%</span>}
                          {isLocked && <span className="text-xs text-red-400 font-medium flex items-center gap-1"><Lock className="w-3 h-3" />Score {PASS_THRESHOLD}%+ on previous lesson</span>}
                        </div>
                      </div>
                      <ChevronRight className={`w-5 h-5 ${isLocked ? 'text-slate-200' : 'text-slate-300 group-hover:text-blue-400'} transition-colors`} />
                    </motion.div>
                  )
                })}
              </div>
            </motion.div>
          )}

          {/* ═══ LESSON ═══ */}
          {view === 'lesson' && selLesson && (
            <motion.div key="lesson" initial={{ opacity: 0, x: 30 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -30 }} className="mt-6 max-w-3xl mx-auto">
              <div className="glass-card rounded-2xl p-8 border border-white/60 mb-6">
                <h2 className="text-2xl font-bold text-slate-800 mb-6">{selLesson.title}</h2>
                {selLesson.content.split('\n\n').map((para, i) => (
                  <motion.p key={i} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.12 }} className="text-slate-600 leading-relaxed mb-4 whitespace-pre-wrap">{para}</motion.p>
                ))}
                {selLesson.flowDiagram && <AnimatedFlowDiagram steps={selLesson.flowDiagram} />}
                <div className="bg-blue-50/80 border border-blue-100 rounded-2xl p-5 mt-6">
                  <h3 className="font-semibold text-blue-700 mb-3 flex items-center gap-2"><Lightbulb className="w-5 h-5" />Key Takeaways</h3>
                  <ul className="space-y-2">{selLesson.keyPoints.map((pt, i) => (
                    <motion.li key={i} initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.5 + i * 0.1 }} className="flex items-start gap-2 text-sm text-blue-800"><Check className="w-4 h-4 text-blue-500 mt-0.5 flex-shrink-0" />{pt}</motion.li>
                  ))}</ul>
                </div>
              </div>
              <motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }} onClick={startQuiz} className="w-full bg-gradient-to-r from-blue-500 to-indigo-600 text-white py-4 rounded-2xl font-semibold text-lg shadow-xl shadow-blue-500/20 flex items-center justify-center gap-3 hover:shadow-2xl transition-shadow">
                <Brain className="w-5 h-5" />Take the Quiz ({selLesson.quiz.length} questions)<ArrowRight className="w-5 h-5" />
              </motion.button>
            </motion.div>
          )}

          {/* ═══ QUIZ ═══ */}
          {view === 'quiz' && selLesson && shuffledQuiz.length > 0 && (() => {
            const q = shuffledQuiz[qIdx]
            return (
              <motion.div key="quiz" initial={{ opacity: 0, x: 30 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -30 }} className="mt-6 max-w-2xl mx-auto">
                <div className="flex items-center gap-2 mb-6">{shuffledQuiz.map((_, i) => <div key={i} className={`flex-1 h-2 rounded-full transition-all ${i < qIdx ? (answers[i] ? 'bg-emerald-400' : 'bg-red-400') : i === qIdx ? 'bg-blue-400' : 'bg-slate-200'}`} />)}</div>
                <p className="text-sm text-slate-400 mb-2">Question {qIdx + 1} of {shuffledQuiz.length}</p>
                <div className="glass-card rounded-2xl p-8 border border-white/60">
                  <div className="flex items-center gap-2 mb-4">
                    <span className={`text-xs font-semibold px-2.5 py-1 rounded-full ${q.difficulty === 'easy' ? 'bg-emerald-50 text-emerald-600 border border-emerald-200' : q.difficulty === 'medium' ? 'bg-amber-50 text-amber-600 border border-amber-200' : 'bg-red-50 text-red-600 border border-red-200'}`}>{q.difficulty.charAt(0).toUpperCase() + q.difficulty.slice(1)}</span>
                    <span className="text-xs text-slate-400">{q.category}</span>
                  </div>
                  <h3 className="text-xl font-bold text-slate-800 mb-6">{q.question}</h3>
                  <div className="space-y-3">{q.options.map((opt, i) => {
                    const isSel = ans === i, isCorr = i === q.correct
                    let cls = 'bg-white border-slate-200 hover:border-blue-300 hover:bg-blue-50/50'
                    if (showExpl) { if (isCorr) cls = 'bg-emerald-50 border-emerald-300 ring-2 ring-emerald-200'; else if (isSel) cls = 'bg-red-50 border-red-300 ring-2 ring-red-200'; else cls = 'bg-slate-50 border-slate-200 opacity-60' }
                    else if (isSel) cls = 'bg-blue-50 border-blue-400 ring-2 ring-blue-200'
                    return (
                      <motion.button key={i} whileHover={!showExpl ? { scale: 1.01 } : {}} whileTap={!showExpl ? { scale: 0.99 } : {}} onClick={() => pickAnswer(i)} disabled={showExpl} className={`w-full text-left p-4 rounded-xl border-2 transition-all flex items-center gap-3 ${cls}`}>
                        <span className={`w-8 h-8 rounded-lg flex items-center justify-center text-sm font-bold ${showExpl && isCorr ? 'bg-emerald-500 text-white' : showExpl && isSel && !isCorr ? 'bg-red-500 text-white' : 'bg-slate-100 text-slate-500'}`}>{showExpl && isCorr ? <Check className="w-4 h-4" /> : showExpl && isSel && !isCorr ? <X className="w-4 h-4" /> : String.fromCharCode(65 + i)}</span>
                        <span className="font-medium text-slate-700">{opt}</span>
                      </motion.button>
                    )
                  })}</div>
                  <AnimatePresence>{showExpl && (
                    <motion.div initial={{ opacity: 0, y: 10, height: 0 }} animate={{ opacity: 1, y: 0, height: 'auto' }} exit={{ opacity: 0 }} className="mt-6 bg-indigo-50/80 border border-indigo-100 rounded-xl p-4">
                      <p className="text-sm font-semibold text-indigo-700 mb-1 flex items-center gap-1.5"><Lightbulb className="w-4 h-4" />Explanation</p>
                      <p className="text-sm text-indigo-600">{q.explanation}</p>
                    </motion.div>
                  )}</AnimatePresence>
                  {showExpl && (
                    <motion.button initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }} onClick={nextQ} className="mt-6 w-full bg-gradient-to-r from-blue-500 to-indigo-600 text-white py-3 rounded-xl font-semibold flex items-center justify-center gap-2 shadow-lg">
                      {qIdx < shuffledQuiz.length - 1 ? <>Next Question <ChevronRight className="w-5 h-5" /></> : <>See Results <ArrowRight className="w-5 h-5" /></>}
                    </motion.button>
                  )}
                </div>
              </motion.div>
            )
          })()}

          {/* ═══ RESULTS ═══ */}
          {view === 'results' && selLesson && (
            <motion.div key="results" initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0 }} className="mt-6 max-w-2xl mx-auto">
              <div className="glass-card rounded-2xl p-8 border border-white/60 text-center">
                {(() => {
                  const tot = selLesson.quiz.length
                  const pct = tot > 0 ? Math.round((score / tot) * 100) : 0
                  const passed = pct >= PASS_THRESHOLD
                  return (
                    <>
                      <div className="mb-6 relative inline-block">
                        <ProgressRing progress={pct} size={120} strokeWidth={8} color={score === tot ? '#10b981' : passed ? '#3b82f6' : '#f59e0b'} />
                        <div className="absolute inset-0 flex items-center justify-center"><div><span className="text-3xl font-black text-slate-800">{score}</span><span className="text-lg text-slate-400">/{tot}</span></div></div>
                      </div>
                      <h2 className="text-2xl font-bold text-slate-800 mb-2">{score === tot ? 'Perfect Score!' : passed ? 'Great Job!' : 'Keep Trying!'}</h2>
                      <p className="text-slate-500 mb-2">You scored {pct}% on {selLesson.title}</p>

                      {/* Pass / Fail indicator */}
                      {passed ? (
                        <div className="space-y-2 mb-6">
                          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="inline-flex items-center gap-2 bg-emerald-50 border border-emerald-200 rounded-full px-4 py-2">
                            <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                            <span className="text-sm font-semibold text-emerald-700">Passed — Next lesson unlocked</span>
                          </motion.div>
                          {/* Check if this pass unlocks the next module */}
                          {(() => {
                            if (!selMod) return null
                            const modIdx = MODULES.findIndex(m => m.id === selMod.id)
                            if (modIdx < 0 || modIdx >= MODULES.length - 1) return null
                            const allLessonsPassed = selMod.lessons.every(l => {
                              if (l.id === selLesson.id) return pct >= PASS_THRESHOLD
                              return (progress.quizScores[l.id] ?? -1) >= PASS_THRESHOLD
                            })
                            if (!allLessonsPassed) return null
                            const nextMod = MODULES[modIdx + 1]
                            return (
                              <motion.div initial={{ opacity: 0, y: 10, scale: 0.95 }} animate={{ opacity: 1, y: 0, scale: 1 }} transition={{ delay: 0.3 }}
                                className="flex items-center justify-center gap-2 bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 rounded-xl px-5 py-3">
                                <motion.div animate={{ rotate: [0, 10, -10, 0] }} transition={{ duration: 1.5, repeat: Infinity }}>
                                  <Sparkles className="w-4 h-4 text-blue-500" />
                                </motion.div>
                                <span className="text-sm font-bold text-blue-700">
                                  New module unlocked: "{nextMod.title}"
                                </span>
                                <ArrowRight className="w-4 h-4 text-blue-500" />
                              </motion.div>
                            )
                          })()}
                        </div>
                      ) : (
                        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="inline-flex items-center gap-2 bg-amber-50 border border-amber-200 rounded-full px-4 py-2 mb-6">
                          <AlertTriangle className="w-4 h-4 text-amber-500" />
                          <span className="text-sm font-semibold text-amber-700">Score {PASS_THRESHOLD}% or higher to unlock the next lesson</span>
                        </motion.div>
                      )}

                      <div className="flex justify-center gap-3 mb-8">{answers.map((ok, i) => <motion.div key={i} initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ delay: i * 0.1 }} className={`w-10 h-10 rounded-xl flex items-center justify-center ${ok ? 'bg-emerald-100 text-emerald-600' : 'bg-red-100 text-red-600'}`}>{ok ? <Check className="w-5 h-5" /> : <X className="w-5 h-5" />}</motion.div>)}</div>
                      <div className="flex gap-3">
                        <motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }} onClick={startQuiz} className="flex-1 bg-white border-2 border-slate-200 text-slate-700 py-3 rounded-xl font-semibold flex items-center justify-center gap-2 hover:border-blue-300 transition-colors"><RotateCcw className="w-4 h-4" />{passed ? 'Retry' : 'Try Again'}</motion.button>
                        <motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }} onClick={() => { setView('module'); setSelLesson(null) }} className="flex-1 bg-gradient-to-r from-blue-500 to-indigo-600 text-white py-3 rounded-xl font-semibold flex items-center justify-center gap-2 shadow-lg">{passed ? 'Continue' : 'Back to Module'} <ArrowRight className="w-4 h-4" /></motion.button>
                      </div>
                    </>
                  )
                })()}
              </div>
            </motion.div>
          )}

          {/* ═══ BADGES ═══ */}
          {view === 'badges' && (
            <motion.div key="badges" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="mt-6">
              <h2 className="text-2xl font-bold text-slate-800 mb-6 flex items-center gap-2"><Trophy className="w-6 h-6 text-amber-500" />Your Badges <span className="text-sm font-normal text-slate-400 ml-2">{progress.badges.length}/{ALL_BADGES.length}</span></h2>
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">{badgesAll.map((badge, i) => {
                const rc = RARITY_COLORS[badge.rarity], Ic = BADGE_ICON_MAP[badge.iconName] || Star
                return (
                  <motion.div key={badge.id} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }} className={`rounded-2xl p-5 border text-center relative overflow-hidden ${badge.earned ? `${rc.bg} ${rc.border}` : 'bg-slate-50 border-slate-200 opacity-50'}`}>
                    {badge.earned && badge.rarity === 'legendary' && <motion.div className="absolute inset-0 bg-gradient-to-r from-amber-200/20 via-yellow-200/40 to-amber-200/20" animate={{ x: ['-100%', '100%'] }} transition={{ repeat: Infinity, duration: 3 }} />}
                    <div className={`w-12 h-12 rounded-xl mx-auto mb-3 flex items-center justify-center ${badge.earned ? `bg-gradient-to-br ${badge.rarity === 'common' ? 'from-slate-400 to-slate-500' : badge.rarity === 'rare' ? 'from-blue-400 to-blue-600' : badge.rarity === 'epic' ? 'from-purple-400 to-purple-600' : 'from-amber-400 to-yellow-500'} text-white shadow-lg` : 'bg-slate-200 text-slate-400'}`}>{badge.earned ? <Ic className="w-6 h-6" /> : <Lock className="w-5 h-5" />}</div>
                    <h4 className="font-bold text-sm text-slate-700 mb-1 relative z-10">{badge.name}</h4>
                    <p className="text-xs text-slate-500 relative z-10">{badge.description}</p>
                    <span className={`inline-block mt-2 text-xs font-semibold uppercase tracking-wider ${rc.text} relative z-10`}>{badge.rarity}</span>
                  </motion.div>
                )
              })}</div>
            </motion.div>
          )}

          {/* ═══ LEADERBOARD ═══ */}
          {view === 'leaderboard' && (
            <motion.div key="lb" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="mt-6 max-w-2xl mx-auto">
              <h2 className="text-2xl font-bold text-slate-800 mb-6 flex items-center gap-2"><BarChart3 className="w-6 h-6 text-amber-500" />Leaderboard</h2>
              <div className="space-y-3">{[...LEADERBOARD, { name: 'You', xp: progress.xp, level: progress.level, avatar: 'AA' }].sort((a, b) => b.xp - a.xp).map((e, i) => {
                const isU = e.name === 'You'
                return (
                  <motion.div key={e.name} initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.08 }} className={`glass-card rounded-2xl p-4 border flex items-center gap-4 ${isU ? 'border-blue-200 bg-blue-50/50 ring-2 ring-blue-100' : 'border-white/60'}`}>
                    <div className={`w-10 h-10 rounded-xl flex items-center justify-center font-black text-sm ${i === 0 ? 'bg-gradient-to-br from-amber-400 to-yellow-500 text-white shadow-lg' : i === 1 ? 'bg-gradient-to-br from-slate-300 to-slate-400 text-white' : i === 2 ? 'bg-gradient-to-br from-amber-600 to-amber-700 text-white' : 'bg-slate-100 text-slate-500'}`}>{i === 0 ? <Crown className="w-5 h-5" /> : `#${i + 1}`}</div>
                    <div className={`w-9 h-9 rounded-lg flex items-center justify-center text-xs font-bold ${isU ? 'bg-blue-100 text-blue-600' : 'bg-slate-100 text-slate-600'}`}><User className="w-4 h-4" /></div>
                    <div className="flex-1"><p className={`font-semibold ${isU ? 'text-blue-700' : 'text-slate-800'}`}>{e.name} {isU && <span className="text-xs bg-blue-100 text-blue-600 px-2 py-0.5 rounded-full ml-1">You</span>}</p><p className="text-xs text-slate-400">Level {e.level} · {getLevelTitle(e.level)}</p></div>
                    <div className="text-right"><p className="font-bold text-amber-600">{e.xp.toLocaleString()}</p><p className="text-xs text-slate-400">XP</p></div>
                  </motion.div>
                )
              })}</div>
            </motion.div>
          )}

        </AnimatePresence>
      </div>
    </div>
  )
}
