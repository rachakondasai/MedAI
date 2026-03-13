/**
 * MedAI API Client
 * Connects React frontend to FastAPI + LangChain + LangGraph backend
 */

import { getToken } from './auth'

// When VITE_API_URL is defined (even as ""), use it directly.
// In Docker, set VITE_API_URL="" so /api/* requests go through Nginx reverse proxy.
// For local dev, defaults to http://localhost:8000.
const API_BASE = import.meta.env.VITE_API_URL ?? 'http://localhost:8000'

function getApiKey(): string {
  return localStorage.getItem('medai_api_key') || ''
}

export function setApiKey(key: string) {
  localStorage.setItem('medai_api_key', key)
}

export function getStoredApiKey(): string {
  return getApiKey()
}

function authHeaders(): Record<string, string> {
  const token = getToken()
  return token ? { Authorization: `Bearer ${token}` } : {}
}

async function request(endpoint: string, options: RequestInit = {}, timeoutMs: number = 60000) {
  const controller = new AbortController()
  const timer = setTimeout(() => controller.abort(), timeoutMs)

  try {
    const res = await fetch(`${API_BASE}${endpoint}`, {
      ...options,
      signal: controller.signal,
      headers: {
        'Content-Type': 'application/json',
        'ngrok-skip-browser-warning': 'true',
        ...authHeaders(),
        ...options.headers,
      },
    })
    clearTimeout(timer)
    if (!res.ok) {
      const error = await res.json().catch(() => ({ detail: 'Server error' }))
      throw new Error(error.detail || `HTTP ${res.status}`)
    }
    // Guard against ngrok HTML interstitial pages
    const contentType = res.headers.get('content-type') || ''
    if (!contentType.includes('application/json')) {
      throw new Error('Unexpected response from server. Check API URL and try again.')
    }
    return res.json()
  } catch (err: any) {
    clearTimeout(timer)
    if (err.name === 'AbortError') {
      throw new Error('Request timed out. The server or OpenAI API may be unresponsive. Please try again.')
    }
    throw err
  }
}

// --- API Functions ---

export async function validateApiKey(apiKey: string): Promise<{ valid: boolean; error?: string }> {
  return request('/api/validate-key', {
    method: 'POST',
    body: JSON.stringify({ api_key: apiKey }),
  })
}

export interface ChatResponse {
  reply: string
  analysis?: {
    conditions: string[]
    specialists: string[]
    riskLevel: string
    tests: string[]
    hospitals?: { name: string; mapLink: string }[]
    medicines?: { name: string; buyLink: string; dosage: string }[]
  }
  sources: string[]
}

export async function sendChatMessage(
  message: string,
  conversationHistory: { role: string; content: string }[] = [],
  location?: string,
  model?: string
): Promise<ChatResponse> {
  const apiKey = getApiKey()
  const body: Record<string, unknown> = {
    message,
    conversation_history: conversationHistory,
  }
  if (apiKey) {
    body.api_key = apiKey
  }
  if (location) {
    body.location = location
  }
  if (model) {
    body.model = model
  }
  return request('/api/chat', {
    method: 'POST',
    body: JSON.stringify(body),
  }, 90000) // 90s timeout for LLM calls
}

export async function analyzeSymptoms(symptoms: string) {
  const apiKey = getApiKey()
  const body: Record<string, unknown> = { message: symptoms }
  if (apiKey) body.api_key = apiKey
  return request('/api/analyze-symptoms', {
    method: 'POST',
    body: JSON.stringify(body),
  })
}

export async function uploadReport(file: File) {
  const formData = new FormData()
  formData.append('file', file)

  const headers: Record<string, string> = { ...authHeaders() }
  const apiKey = getApiKey()
  const url = apiKey
    ? `${API_BASE}/api/upload-report?api_key=${encodeURIComponent(apiKey)}`
    : `${API_BASE}/api/upload-report`

  const res = await fetch(url, {
    method: 'POST',
    headers,
    body: formData,
  })
  if (!res.ok) {
    const error = await res.json().catch(() => ({ detail: 'Upload failed' }))
    throw new Error(error.detail || `HTTP ${res.status}`)
  }
  return res.json()
}

export async function uploadReportInChat(file: File): Promise<{
  message: string
  chunks_indexed: number
  analysis: any
}> {
  const formData = new FormData()
  formData.append('file', file)

  const headers: Record<string, string> = { ...authHeaders() }
  const apiKey = getApiKey()
  const url = apiKey
    ? `${API_BASE}/api/upload-report?api_key=${encodeURIComponent(apiKey)}`
    : `${API_BASE}/api/upload-report`

  const res = await fetch(url, {
    method: 'POST',
    headers,
    body: formData,
  })
  if (!res.ok) {
    const error = await res.json().catch(() => ({ detail: 'Upload failed' }))
    throw new Error(error.detail || `HTTP ${res.status}`)
  }
  return res.json()
}

export async function searchHospitals(query: string, location?: string): Promise<ChatResponse> {
  const apiKey = getApiKey()
  const body: Record<string, unknown> = {
    message: `Find hospitals for: ${query}`,
    conversation_history: [],
  }
  if (apiKey) body.api_key = apiKey
  if (location) body.location = location
  return request('/api/chat', {
    method: 'POST',
    body: JSON.stringify(body),
  })
}

export async function searchMedicines(query: string): Promise<ChatResponse> {
  const apiKey = getApiKey()
  const body: Record<string, unknown> = {
    message: `Recommend medicines for: ${query}`,
    conversation_history: [],
  }
  if (apiKey) body.api_key = apiKey
  return request('/api/chat', {
    method: 'POST',
    body: JSON.stringify(body),
  })
}

export async function getHealthSummary() {
  const apiKey = getApiKey()
  const params = apiKey ? `?api_key=${encodeURIComponent(apiKey)}` : ''
  return request(`/api/health-summary${params}`, {}, 30000) // 30s timeout
}

export async function checkBackendHealth(): Promise<boolean> {
  try {
    const res = await fetch(`${API_BASE}/api/health`, { signal: AbortSignal.timeout(3000) })
    return res.ok
  } catch {
    return false
  }
}

// --- User Preferences ---

export async function getUserPreferences(): Promise<Record<string, boolean>> {
  return request('/api/user/preferences')
}

export async function saveUserPreferences(preferences: Record<string, boolean>): Promise<Record<string, boolean>> {
  return request('/api/user/preferences', {
    method: 'PUT',
    body: JSON.stringify({ preferences }),
  })
}

// --- Vitals ---

export interface VitalsEntry {
  id?: string
  heart_rate?: number | null
  blood_pressure_sys?: number | null
  blood_pressure_dia?: number | null
  temperature?: number | null
  spo2?: number | null
  blood_sugar?: number | null
  weight?: number | null
  notes?: string | null
  recorded_at?: string
}

export async function addVitals(vitals: VitalsEntry): Promise<VitalsEntry> {
  return request('/api/user/vitals', {
    method: 'POST',
    body: JSON.stringify(vitals),
  })
}

export async function getVitals(limit = 50): Promise<VitalsEntry[]> {
  return request(`/api/user/vitals?limit=${limit}`)
}

export async function getLatestVitals(): Promise<VitalsEntry> {
  return request('/api/user/vitals/latest')
}
