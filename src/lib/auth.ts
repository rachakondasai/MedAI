/**
 * MedAI Auth Client
 * Handles signup, login, logout, and token management
 */

// Use ?? (nullish coalescing) — NOT || — so that VITE_API_URL="" correctly
// produces an empty string (relative URLs via Nginx), instead of falling back
// to localhost:8000 which doesn't exist on mobile/remote devices.
const API_BASE = import.meta.env.VITE_API_URL ?? 'http://localhost:8000'

export interface AuthUser {
  id: string
  email: string
  name: string
  role: 'user' | 'admin'
}

interface AuthResponse {
  token: string
  user: AuthUser
}

// --- Token Storage ---

export function getToken(): string | null {
  return localStorage.getItem('medai_auth_token')
}

export function setToken(token: string) {
  localStorage.setItem('medai_auth_token', token)
}

export function clearToken() {
  localStorage.removeItem('medai_auth_token')
  localStorage.removeItem('medai_user')
}

export function getStoredUser(): AuthUser | null {
  const raw = localStorage.getItem('medai_user')
  if (!raw) return null
  try {
    return JSON.parse(raw) as AuthUser
  } catch {
    return null
  }
}

function storeUser(user: AuthUser) {
  localStorage.setItem('medai_user', JSON.stringify(user))
}

function authHeaders(): Record<string, string> {
  const token = getToken()
  return token ? { Authorization: `Bearer ${token}` } : {}
}

async function authRequest(endpoint: string, options: RequestInit = {}, timeoutMs: number = 15000) {
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
      throw new Error('Request timed out. The backend may be unresponsive.')
    }
    throw err
  }
}

// --- Auth Functions ---

export async function signup(email: string, name: string, password: string): Promise<AuthUser> {
  const data: AuthResponse = await authRequest('/api/auth/signup', {
    method: 'POST',
    body: JSON.stringify({ email, name, password }),
  })
  setToken(data.token)
  storeUser(data.user)
  return data.user
}

export async function login(email: string, password: string): Promise<AuthUser> {
  const data: AuthResponse = await authRequest('/api/auth/login', {
    method: 'POST',
    body: JSON.stringify({ email, password }),
  })
  setToken(data.token)
  storeUser(data.user)
  return data.user
}

export async function logout(): Promise<void> {
  try {
    await authRequest('/api/auth/logout', { method: 'POST' })
  } catch {
    // Ignore logout errors — just clear local state
  }
  clearToken()
}

export async function getMe(): Promise<AuthUser> {
  return authRequest('/api/auth/me')
}

export function isAuthenticated(): boolean {
  return !!getToken()
}

export function isAdmin(): boolean {
  const user = getStoredUser()
  return user?.role === 'admin'
}

// --- Admin API Functions ---

export interface AdminOverview {
  total_users: number
  new_users_today: number
  active_sessions: number
  total_searches: number
  today_searches: number
  total_reports: number
  total_chats: number
  recent_users: Array<{
    id: string
    email: string
    name: string
    role: string
    created_at: string
    last_login: string | null
  }>
  recent_searches: Array<{
    query: string
    created_at: string
    risk_level: string | null
    duration_ms: number | null
    email: string | null
  }>
}

export interface SearchStats {
  total: number
  today: number
  avg_duration_ms: number
  top_queries: Array<{ query: string; count: number }>
  daily_counts: Array<{ day: string; count: number }>
}

export async function getAdminOverview(): Promise<AdminOverview> {
  return authRequest('/api/admin/overview')
}

export async function getAdminUsers(): Promise<any[]> {
  return authRequest('/api/admin/users')
}

export async function getAdminSessions(limit = 100): Promise<any[]> {
  return authRequest(`/api/admin/sessions?limit=${limit}`)
}

export async function getAdminSearchLogs(limit = 100): Promise<any[]> {
  return authRequest(`/api/admin/search-logs?limit=${limit}`)
}

export async function getAdminSearchStats(): Promise<SearchStats> {
  return authRequest('/api/admin/search-stats')
}

export async function getAdminChatHistory(limit = 100): Promise<any[]> {
  return authRequest(`/api/admin/chat-history?limit=${limit}`)
}

export async function getAdminReports(limit = 100): Promise<any[]> {
  return authRequest(`/api/admin/reports?limit=${limit}`)
}

// --- Admin User Management ---

export async function adminCreateUser(email: string, name: string, password: string, role: string = 'user'): Promise<any> {
  return authRequest('/api/admin/create-user', {
    method: 'POST',
    body: JSON.stringify({ email, name, password, role }),
  })
}

export async function adminDeleteUser(userId: string): Promise<any> {
  return authRequest(`/api/admin/users/${userId}`, {
    method: 'DELETE',
  })
}

export async function adminToggleUserRole(userId: string): Promise<any> {
  return authRequest(`/api/admin/users/${userId}/role`, {
    method: 'PATCH',
  })
}

// --- User History API ---

export async function getUserChatHistory(limit = 50): Promise<any[]> {
  return authRequest(`/api/user/chat-history?limit=${limit}`)
}

export async function getUserSearchLogs(limit = 50): Promise<any[]> {
  return authRequest(`/api/user/search-logs?limit=${limit}`)
}

export async function getUserReports(limit = 50): Promise<any[]> {
  return authRequest(`/api/user/reports?limit=${limit}`)
}

export async function deleteUserReport(reportId: string): Promise<{ message: string; report_id: string }> {
  return authRequest(`/api/user/reports/${reportId}`, {
    method: 'DELETE',
  })
}
