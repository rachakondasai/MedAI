# 🏥 MedAI — AI Healthcare SaaS Platform

A production-grade AI healthcare dashboard powered by **React 18 + TypeScript** (frontend) and **FastAPI + LangChain + LangGraph + OpenAI** (backend). Features an AI Doctor chat, medical report analysis with RAG, hospital & medicine search, vitals tracking, and a full admin panel.

> **Clone → Run → Done.** One command starts both frontend and backend.

---

## ✨ Key Features

| Feature | Description |
|---------|-------------|
| 🤖 **AI Doctor Chat** | GPT-4o powered medical consultation with structured analysis (conditions, specialists, risk level, tests) |
| 📄 **Report Analysis** | Upload PDF lab reports → FAISS RAG indexing → AI-powered biomarker analysis |
| 🏥 **Hospital Finder** | Location-aware hospital search with ratings, Practo & Google Maps booking links |
| 💊 **Medicine Search** | AI-recommended medicines with dosage info and 1mg / PharmEasy buy links |
| 📊 **Vitals Tracking** | Manual entry of heart rate, BP, SpO₂, temperature, blood sugar, weight — with trend charts |
| 📍 **Auto Location** | Browser geolocation + OpenStreetMap reverse geocoding (cached 30 min) |
| 🔐 **Auth System** | JWT-based signup / login / logout with role-based access (user & admin) |
| ⚙️ **Persistent Settings** | Toggle preferences (notifications, privacy, 2FA) saved to backend per user |
| 🛡️ **Admin Dashboard** | User management, session logs, search analytics, chat history |
| 🔑 **API Key via UI** | No API key in code — admin pastes their OpenAI key in the Settings page |

---

## 🛠️ Tech Stack

### Frontend
- **React 18** + TypeScript
- **Vite** — lightning-fast build tool
- **Tailwind CSS** — utility-first styling
- **Framer Motion** — smooth animations
- **Lucide React** — beautiful icons
- **Recharts** — data visualization
- **React Router DOM** — client-side routing

### Backend
- **FastAPI** — async Python API
- **LangChain + LangGraph** — multi-step AI reasoning workflows
- **OpenAI GPT-4o** — medical consultation engine
- **FAISS** — vector store for PDF report RAG
- **SQLite** — lightweight database (auto-created)
- **JWT Auth** — secure token-based authentication

---

## 🚀 Quick Start

### Prerequisites
- **Node.js 18+** and **npm**
- **Python 3.11+**
- An **OpenAI API key** (you'll add it in the app, not in code)

### Option 1: One-Command Start (macOS / Linux)

```bash
git clone https://github.com/rachakondasai/MedAI.git
cd MedAI
chmod +x start.sh
./start.sh
```

### Option 2: One-Command Start (Windows)

```cmd
git clone https://github.com/rachakondasai/MedAI.git
cd MedAI
start.bat
```

### Option 3: Manual Setup

```bash
# 1. Install frontend dependencies
npm install

# 2. Set up Python backend
cd server
python3 -m venv venv
source venv/bin/activate        # Windows: venv\Scripts\activate
pip install -r requirements.txt
cp .env.example .env            # Creates empty .env (API key added via UI)
cd ..

# 3. Start both servers
npm start
# Or separately:
#   Terminal 1: npm run dev
#   Terminal 2: cd server && source venv/bin/activate && python main.py
```

### First Login

1. Open **http://localhost:5173**
2. Log in with: `admin@medai.com` / `admin123`
3. Go to **Settings** → paste your **OpenAI API key**
4. Start chatting with the AI Doctor! 🎉

---

## 📂 Project Structure

```
├── start.sh / start.bat       # One-command start scripts
├── package.json               # Frontend deps + npm start script
├── vite.config.ts             # Vite build config
├── tailwind.config.js         # Tailwind CSS config
├── tsconfig.json              # TypeScript config
├── index.html                 # HTML entry point
│
├── src/                       # React frontend
│   ├── App.tsx                # Root app with routing & auth
│   ├── main.tsx               # Entry point
│   ├── index.css              # Global styles + Tailwind
│   ├── components/            # Reusable UI components
│   │   ├── Sidebar.tsx        # Navigation sidebar
│   │   ├── Header.tsx         # Top bar (search, bell, avatar)
│   │   ├── ChatMessage.tsx    # AI Doctor chat bubble
│   │   ├── ChatInput.tsx      # Chat input box
│   │   ├── HealthCard.tsx     # Dashboard stat cards
│   │   ├── HospitalCard.tsx   # Hospital listing card
│   │   ├── MedicineCard.tsx   # Medicine listing card
│   │   └── ReportAnalysis.tsx # Report analysis panel
│   ├── pages/                 # Route-level pages
│   │   ├── Dashboard.tsx      # Health overview, vitals, activity
│   │   ├── AIDoctor.tsx       # Chat with AI Doctor
│   │   ├── MedicalReports.tsx # Upload & analyze PDF reports
│   │   ├── Hospitals.tsx      # Hospital finder
│   │   ├── Medicines.tsx      # Medicine search
│   │   ├── History.tsx        # Consultation history
│   │   ├── Settings.tsx       # API key, preferences, profile
│   │   ├── AdminDashboard.tsx # Admin panel (users, logs)
│   │   └── Login.tsx          # Auth (login & signup)
│   └── lib/                   # Utilities
│       ├── api.ts             # Backend API client
│       ├── auth.ts            # Auth (JWT, signup, login)
│       ├── useLocation.ts     # Global geolocation hook
│       └── utils.ts           # Helpers (cn, classnames)
│
├── server/                    # FastAPI backend
│   ├── main.py                # API routes & app setup
│   ├── medical_agent.py       # LangGraph AI agent
│   ├── rag_engine.py          # FAISS RAG for PDF reports
│   ├── database.py            # SQLite DB (auto-created)
│   ├── auth.py                # JWT auth & middleware
│   ├── requirements.txt       # Python dependencies
│   ├── .env.example           # Environment template (safe to commit)
│   └── .env                   # Your actual env (git-ignored)
│
├── .gitignore                 # Protects .env, venv, node_modules, db
└── README.md                  # This file
```

---

## 📡 API Endpoints

### Auth
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/auth/signup` | Create account |
| POST | `/api/auth/login` | Log in (returns JWT) |
| POST | `/api/auth/logout` | Log out |
| GET | `/api/auth/me` | Current user info |

### Core
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/chat` | AI Doctor chat (LangGraph + RAG) |
| POST | `/api/upload-report` | Upload PDF → FAISS index + analysis |
| POST | `/api/analyze-symptoms` | Structured symptom analysis |
| POST | `/api/validate-key` | Validate an OpenAI API key |
| GET | `/api/health-summary` | AI health summary from reports |

### User (authenticated)
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/user/chat-history` | Chat history |
| GET | `/api/user/search-logs` | Search logs |
| GET | `/api/user/reports` | Uploaded reports |
| GET/PUT | `/api/user/preferences` | Settings toggles |
| POST | `/api/user/vitals` | Add vitals entry |
| GET | `/api/user/vitals` | Vitals history |
| GET | `/api/user/vitals/latest` | Latest vitals |

### Admin (admin role)
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/admin/overview` | Dashboard stats |
| GET | `/api/admin/users` | All users |
| POST | `/api/admin/create-user` | Create user |
| DELETE | `/api/admin/users/:id` | Delete user |
| PATCH | `/api/admin/users/:id/role` | Toggle role |
| GET | `/api/admin/sessions` | All sessions |
| GET | `/api/admin/search-logs` | All search logs |
| GET | `/api/admin/search-stats` | Aggregated stats |

Full interactive docs at **http://localhost:8000/docs** (Swagger UI).

---

## 🔒 Security

- ✅ **No API keys in code** — OpenAI key stored in browser `localStorage`, sent per-request
- ✅ `.env` is git-ignored — only `.env.example` is committed
- ✅ JWT tokens for authentication with role-based access control
- ✅ CORS enabled for local development
- ✅ Admin-only endpoints protected by role middleware
- ✅ Database auto-created at runtime (git-ignored)

---

## 🧪 Development

```bash
# Frontend only (hot reload)
npm run dev

# Backend only (auto reload)
cd server && source venv/bin/activate && python main.py

# TypeScript type check
npx tsc --noEmit

# Production build
npm run build
```

---

## 📋 Pages Overview

| Page | Route | Description |
|------|-------|-------------|
| Dashboard | `/` | Health score, vitals chart, recent activity, quick actions |
| AI Doctor | `/ai-doctor` | GPT-4o chat with structured medical analysis panels |
| Reports | `/reports` | Upload PDFs, view AI analysis with biomarker breakdown |
| Hospitals | `/hospitals` | Location-aware hospital finder with booking links |
| Medicines | `/medicines` | AI-powered medicine search with buy links |
| History | `/history` | Timeline of all consultations, reports, searches |
| Settings | `/settings` | API key, profile, notification & privacy toggles |
| Admin | `/admin` | User management, analytics, logs (admin only) |
| Login | — | Signup & login with JWT auth |

---

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch: `git checkout -b feature/amazing-feature`
3. Commit: `git commit -m 'Add amazing feature'`
4. Push: `git push origin feature/amazing-feature`
5. Open a Pull Request

---

## 📜 License

MIT — free for personal and commercial use.

---

Built with ❤️ by the MedAI team.
