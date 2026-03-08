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

---

## 🧠 Architecture Deep Dive — How LLM, LangChain, LangGraph & RAG Work

This section explains exactly how every AI component connects in MedAI. Read this to learn the concepts, then run the test commands below to see each piece in action.

---

### 🔤 Glossary (What Each Term Means)

| Term | What It Is | Analogy |
|------|-----------|---------|
| **LLM** | Large Language Model (GPT-4o) — the brain that generates text | A very smart doctor who can answer questions |
| **LangChain** | Python framework to talk to LLMs with structured prompts & tools | The receptionist who formats your question before handing it to the doctor |
| **LangGraph** | Extension of LangChain — builds multi-step AI workflows as a graph of nodes | A hospital with multiple departments: you go to Triage → Diagnosis → Pharmacy in order |
| **RAG** | Retrieval-Augmented Generation — feed the LLM your own documents so it gives personalized answers | Giving the doctor your lab reports before they answer your question |
| **FAISS** | Facebook AI Similarity Search — fast vector database for finding similar text chunks | A filing cabinet that instantly finds the most relevant page from 1000 documents |
| **Embeddings** | Converting text into numbers (vectors) so computers can compare similarity | Turning words into GPS coordinates so you can find "nearby" text |
| **Chunks** | Splitting a large document into smaller pieces (1000 chars each) | Cutting a 50-page report into sticky notes so the AI can find the right one |

---

### 📊 How a Chat Message Flows Through the System

When a user types **"I have a headache and fever"** in the AI Doctor chat, here's exactly what happens:

```
┌──────────────────────────────────────────────────────────────────────┐
│                        USER SENDS MESSAGE                            │
│              "I have a headache and fever"                            │
└──────────────────────┬───────────────────────────────────────────────┘
                       │
                       ▼
┌──────────────────────────────────────────────────────────────────────┐
│  STEP 1: Frontend (React) → POST /api/chat                          │
│  File: src/lib/api.ts → sendChatMessage()                            │
│  Sends: { message, conversation_history, api_key, location }        │
└──────────────────────┬───────────────────────────────────────────────┘
                       │
                       ▼
┌──────────────────────────────────────────────────────────────────────┐
│  STEP 2: FastAPI Backend receives the request                        │
│  File: server/main.py → chat() endpoint                              │
│                                                                      │
│  2a. Get the OpenAI API key (from request or server .env)            │
│  2b. Get the MedicalAgent (LangGraph) and RAGEngine (FAISS)         │
│  2c. Log the user's message to SQLite database                       │
└──────────────────────┬───────────────────────────────────────────────┘
                       │
                       ▼
┌──────────────────────────────────────────────────────────────────────┐
│  STEP 3: RAG Retrieval (if reports were uploaded)                    │
│  File: server/rag_engine.py → query()                                │
│                                                                      │
│  3a. Convert "I have a headache and fever" into a vector (embedding) │
│      using OpenAI text-embedding-3-small model                       │
│  3b. FAISS searches the vector store for the 4 most similar chunks   │
│  3c. Returns matching text chunks from your uploaded PDF reports     │
│  3d. This becomes "rag_context" — extra knowledge for the LLM       │
│                                                                      │
│  If NO reports uploaded → rag_context is empty, RAG is skipped       │
└──────────────────────┬───────────────────────────────────────────────┘
                       │
                       ▼
┌──────────────────────────────────────────────────────────────────────┐
│  STEP 4: LangGraph Agent runs 3-node workflow                        │
│  File: server/medical_agent.py → MedicalAgent.run()                  │
│                                                                      │
│  ┌─────────────────────────────────────────────────────────────────┐ │
│  │  NODE 1: generate_reply (LangChain + LLM)                      │ │
│  │  • System prompt: "You are MedAI, an AI healthcare assistant"  │ │
│  │  • Includes conversation history (previous messages)            │ │
│  │  • Includes RAG context (from patient's reports, if any)        │ │
│  │  • LLM: ChatOpenAI(model="gpt-4o-mini", temperature=0.3)      │ │
│  │  • Output: A friendly, detailed medical response                │ │
│  └──────────────────────────┬──────────────────────────────────────┘ │
│                             │                                        │
│                             ▼                                        │
│  ┌─────────────────────────────────────────────────────────────────┐ │
│  │  NODE 2: generate_analysis (LangChain + LLM)                   │ │
│  │  • System prompt: "Respond with JSON: conditions, specialists, │ │
│  │    riskLevel, tests"                                            │ │
│  │  • LLM: ChatOpenAI(model="gpt-4o-mini", temperature=0.1)      │ │
│  │  • Output: { conditions: ["Migraine", "Viral fever", ...],     │ │
│  │    specialists: ["Neurologist", "GP"], riskLevel: "Moderate",  │ │
│  │    tests: ["CBC", "Malaria test"] }                            │ │
│  └──────────────────────────┬──────────────────────────────────────┘ │
│                             │                                        │
│                             ▼                                        │
│  ┌─────────────────────────────────────────────────────────────────┐ │
│  │  NODE 3: generate_enrichment (LangChain + LLM)                 │ │
│  │  • Input: analysis JSON + user's location (e.g. "Hyderabad")   │ │
│  │  • System prompt: "Suggest hospitals near the user's city      │ │
│  │    and medicines with buy links"                                │ │
│  │  • LLM: ChatOpenAI(model="gpt-4o-mini", temperature=0.2)      │ │
│  │  • Output: { hospitals: [{name, mapLink}],                     │ │
│  │    medicines: [{name, buyLink, dosage}] }                      │ │
│  │  • Merges hospitals & medicines INTO the analysis object       │ │
│  └─────────────────────────────────────────────────────────────────┘ │
│                                                                      │
│  LangGraph flow: Node1 → Node2 → Node3 → END                        │
└──────────────────────┬───────────────────────────────────────────────┘
                       │
                       ▼
┌──────────────────────────────────────────────────────────────────────┐
│  STEP 5: Response sent back to frontend                              │
│  {                                                                   │
│    "reply": "Based on your symptoms of headache and fever...",       │
│    "analysis": {                                                     │
│      "conditions": ["Migraine", "Viral Fever"],                      │
│      "specialists": ["Neurologist", "General Physician"],            │
│      "riskLevel": "Moderate",                                        │
│      "tests": ["CBC", "Malaria Antigen Test"],                       │
│      "hospitals": [{ "name": "Apollo Hyderabad", "mapLink": "..." }]│
│      "medicines": [{ "name": "Paracetamol 500mg", ... }]            │
│    },                                                                │
│    "sources": ["blood_report.pdf"]   ← (only if RAG was used)       │
│  }                                                                   │
└──────────────────────────────────────────────────────────────────────┘
```

---

### 📄 How RAG Works (Report Upload → Personalized Answers)

When a user uploads a PDF medical report, here's the RAG pipeline:

```
┌─────────────────────────────────────────────────────────────────────┐
│  STEP 1: PDF Upload                                                  │
│  File: server/rag_engine.py → ingest_pdf()                           │
│                                                                      │
│  1a. PyPDF extracts text from each page of the PDF                   │
│  1b. RecursiveCharacterTextSplitter splits text into chunks          │
│      • chunk_size = 1000 characters                                  │
│      • chunk_overlap = 200 characters (so context isn't lost)        │
│      • Splits on: paragraph → line → sentence → word                 │
│  1c. Each chunk becomes a LangChain Document object with metadata    │
│      Document(page_content="Hemoglobin: 14.2 g/dL...",              │
│               metadata={"source": "blood_report.pdf", "page": 3})   │
└──────────────────────┬──────────────────────────────────────────────┘
                       │
                       ▼
┌─────────────────────────────────────────────────────────────────────┐
│  STEP 2: Embedding & FAISS Indexing                                  │
│                                                                      │
│  2a. OpenAIEmbeddings converts each chunk into a 1536-dim vector    │
│      Model: text-embedding-3-small                                   │
│      "Hemoglobin: 14.2 g/dL" → [0.023, -0.041, 0.067, ...]         │
│  2b. FAISS.from_documents() stores all vectors in an in-memory index │
│  2c. Subsequent uploads → FAISS.add_documents() (appends to same    │
│      index, so all reports are searchable together)                   │
└──────────────────────┬──────────────────────────────────────────────┘
                       │
                       ▼
┌─────────────────────────────────────────────────────────────────────┐
│  STEP 3: Retrieval (when user asks a question)                       │
│  File: server/rag_engine.py → query()                                │
│                                                                      │
│  3a. User question is embedded into a vector                         │
│  3b. FAISS does similarity_search(question_vector, k=4)              │
│      → finds the 4 closest text chunks from all uploaded reports    │
│  3c. These chunks are joined into "rag_context" string              │
│  3d. rag_context is injected into the LLM prompt:                   │
│      "Here is context from the patient's medical reports: ..."       │
│  3e. The LLM now answers using BOTH its knowledge AND your reports  │
└─────────────────────────────────────────────────────────────────────┘
```

**Key insight:** Without RAG, the LLM gives generic answers. With RAG, it says things like _"Your hemoglobin is 14.2 g/dL which is within normal range"_ — because it can read your actual report.

---

### ⛓️ How LangChain Works in This Project

LangChain is the **glue** between your Python code and the OpenAI LLM. Here's what it provides:

| LangChain Component | File | What It Does |
|---------------------|------|-------------|
| `ChatOpenAI` | `medical_agent.py` | Wrapper around OpenAI API — handles auth, retries, streaming, token counting |
| `SystemMessage` | `medical_agent.py` | Tells the LLM its role (e.g., "You are a medical assistant") |
| `HumanMessage` | `medical_agent.py` | The user's actual question |
| `AIMessage` | `medical_agent.py` | Previous AI responses (for conversation context) |
| `OpenAIEmbeddings` | `rag_engine.py` | Converts text → vectors for FAISS similarity search |
| `RecursiveCharacterTextSplitter` | `rag_engine.py` | Smart text chunking that respects sentence boundaries |
| `FAISS` (via `langchain_community`) | `rag_engine.py` | Vector store with `from_documents()` and `similarity_search()` |
| `Document` | `rag_engine.py` | Data class holding text + metadata (source file, page number) |

**Without LangChain:** You'd write raw `openai.ChatCompletion.create()` calls, manually manage message arrays, and build your own text splitter + vector store adapter. LangChain abstracts all of this.

---

### 🔀 How LangGraph Works in This Project

LangGraph turns the AI agent into a **state machine** — a graph of nodes where data flows step by step.

```
File: server/medical_agent.py → MedicalAgent._build_graph()

        ┌──────────────────┐
        │   ENTRY POINT    │
        └────────┬─────────┘
                 │
                 ▼
        ┌──────────────────┐     Uses LangChain ChatOpenAI
        │  generate_reply  │───► System prompt + conversation history + RAG context
        │   (Node 1)       │     Output: friendly text reply
        └────────┬─────────┘
                 │
                 ▼
        ┌──────────────────┐     Uses LangChain ChatOpenAI
        │ generate_analysis│───► System prompt forces JSON output
        │   (Node 2)       │     Output: {conditions, specialists, riskLevel, tests}
        └────────┬─────────┘
                 │
                 ▼
        ┌────────────────────┐   Uses LangChain ChatOpenAI
        │generate_enrichment │──► Takes analysis + location
        │   (Node 3)         │   Output: {hospitals, medicines} with live links
        └────────┬───────────┘
                 │
                 ▼
        ┌──────────────────┐
        │       END        │
        └──────────────────┘
```

**Why LangGraph instead of just calling the LLM 3 times?**
- **Shared state**: All nodes read/write to the same `AgentState` dictionary — Node 3 can see what Node 2 produced
- **Composability**: You can add/remove/reorder nodes without rewriting everything
- **Conditional routing**: You could add `if riskLevel == "Critical": → route to emergency node` (not implemented yet, but easy to add)
- **Debuggability**: Each node can be tested independently
- **Async**: All nodes run with `await`, so the API doesn't block

**The state object flowing through the graph:**
```python
class AgentState(TypedDict):
    message: str                     # User's original question
    conversation_history: list[dict] # Previous chat messages
    rag_context: str                 # Text from uploaded reports (from FAISS)
    location: str                    # User's city (for hospital search)
    reply: str                       # ← Written by Node 1
    analysis: Optional[dict]         # ← Written by Node 2, enriched by Node 3
```

---

### 🔑 How the LLM Enters (3 Different LLM Instances)

MedAI uses **3 separate ChatOpenAI instances** with different temperatures:

```python
# File: server/medical_agent.py → MedicalAgent.__init__()

self.llm = ChatOpenAI(temperature=0.3)            # Node 1: Conversational reply
                                                    # Higher temp = more creative/natural text

self.analysis_llm = ChatOpenAI(temperature=0.1)    # Node 2: Structured analysis JSON
                                                    # Low temp = deterministic, precise output

self.enrichment_llm = ChatOpenAI(temperature=0.2)  # Node 3: Hospital/medicine recommendations
                                                    # Medium temp = accurate but varied
```

**Why different temperatures?**
- **Reply** (0.3): Needs to sound natural and empathetic, so slightly creative
- **Analysis** (0.1): Must output valid JSON — needs to be very precise and predictable
- **Enrichment** (0.2): Needs real hospital names but some variety in suggestions

---

## 🧪 Testing Guide — Learn by Testing Each Component

Start both servers first: `./start.sh`, then open a second terminal for testing.

### Prerequisites for Testing

```bash
cd server
source venv/bin/activate
```

---

### Test 1: Test the LLM Directly (No LangChain, No RAG)

This tests raw OpenAI API — the foundation everything else is built on.

```bash
# In server/ directory with venv activated
python3 -c "
import asyncio
from langchain_openai import ChatOpenAI
from langchain_core.messages import HumanMessage, SystemMessage
from dotenv import load_dotenv
import os

load_dotenv()
api_key = os.getenv('OPENAI_API_KEY')

llm = ChatOpenAI(openai_api_key=api_key, model='gpt-4o-mini', temperature=0.3)

messages = [
    SystemMessage(content='You are a helpful medical assistant.'),
    HumanMessage(content='What could cause a headache and fever?')
]

response = asyncio.run(llm.ainvoke(messages))
print('=== LLM RESPONSE ===')
print(response.content)
print()
print('=== METADATA ===')
print(f'Model: {response.response_metadata.get(\"model_name\", \"unknown\")}')
print(f'Tokens used: {response.response_metadata.get(\"token_usage\", {})}')
"
```

**What to observe:**
- The LLM responds with medical advice
- `temperature=0.3` gives consistent but slightly varied responses
- Run it twice — you'll get similar but not identical answers

---

### Test 2: Test LangChain Message Types

This tests how LangChain structures conversation history for the LLM.

```bash
python3 -c "
import asyncio
from langchain_openai import ChatOpenAI
from langchain_core.messages import HumanMessage, SystemMessage, AIMessage
from dotenv import load_dotenv
import os

load_dotenv()
llm = ChatOpenAI(openai_api_key=os.getenv('OPENAI_API_KEY'), model='gpt-4o-mini', temperature=0.3)

# Simulate a multi-turn conversation (LangChain manages the message array)
messages = [
    SystemMessage(content='You are a medical AI. Be concise.'),
    HumanMessage(content='I have a headache.'),
    AIMessage(content='Headaches can be caused by tension, dehydration, or migraines. How long have you had it?'),
    HumanMessage(content='About 3 days, and now I also have a fever.'),
]

response = asyncio.run(llm.ainvoke(messages))
print('=== MULTI-TURN RESPONSE ===')
print(response.content)
print()
print('Notice: The AI remembers the earlier messages because LangChain passed the full history.')
"
```

**What to learn:**
- `SystemMessage` = instructions to the AI (invisible to user)
- `HumanMessage` = user messages
- `AIMessage` = previous AI responses
- LangChain maintains context by passing ALL messages each time

---

### Test 3: Test LangChain Structured JSON Output

This tests how MedAI forces the LLM to output structured JSON.

```bash
python3 -c "
import asyncio, json
from langchain_openai import ChatOpenAI
from langchain_core.messages import HumanMessage, SystemMessage
from dotenv import load_dotenv
import os

load_dotenv()
analysis_llm = ChatOpenAI(openai_api_key=os.getenv('OPENAI_API_KEY'), model='gpt-4o-mini', temperature=0.1)

messages = [
    SystemMessage(content='''Respond with ONLY a valid JSON object:
{
  \"conditions\": [\"condition1\", \"condition2\"],
  \"specialists\": [\"specialist1\"],
  \"riskLevel\": \"Low / Moderate / High\",
  \"tests\": [\"test1\", \"test2\"]
}'''),
    HumanMessage(content='Analyze: persistent headache, fever 101°F, body aches for 3 days'),
]

response = asyncio.run(analysis_llm.ainvoke(messages))
print('=== RAW LLM OUTPUT ===')
print(response.content)
print()

# Parse the JSON
data = json.loads(response.content)
print('=== PARSED ANALYSIS ===')
print(f'Conditions: {data[\"conditions\"]}')
print(f'Specialists: {data[\"specialists\"]}')
print(f'Risk Level: {data[\"riskLevel\"]}')
print(f'Tests: {data[\"tests\"]}')
print()
print('Key insight: temperature=0.1 forces precise JSON output.')
print('temperature=0.3 would sometimes add markdown or extra text.')
"
```

**What to learn:**
- System prompt engineering forces JSON format
- Low temperature (0.1) = more reliable JSON parsing
- This is exactly how Node 2 (`generate_analysis`) works in the LangGraph

---

### Test 4: Test RAG — Embedding + FAISS Vector Search

This tests the RAG pipeline without any LLM — just text → vectors → similarity search.

```bash
python3 -c "
from langchain_openai import OpenAIEmbeddings
from langchain_community.vectorstores import FAISS
from langchain_core.documents import Document
from langchain_text_splitters import RecursiveCharacterTextSplitter
from dotenv import load_dotenv
import os

load_dotenv()
api_key = os.getenv('OPENAI_API_KEY')

# Step 1: Create sample medical report text
report_text = '''
Patient: John Doe, Age: 35
Date: 2024-01-15

Complete Blood Count (CBC):
- Hemoglobin: 14.2 g/dL (Normal: 13.5-17.5)
- WBC: 11,500 /μL (Normal: 4,500-11,000) — SLIGHTLY ELEVATED
- Platelets: 250,000 /μL (Normal: 150,000-400,000)
- RBC: 5.1 million/μL (Normal: 4.7-6.1)

Liver Function Test:
- ALT (SGPT): 45 U/L (Normal: 7-56)
- AST (SGOT): 38 U/L (Normal: 10-40)
- Bilirubin: 0.9 mg/dL (Normal: 0.1-1.2)

Lipid Profile:
- Total Cholesterol: 220 mg/dL (Desirable: <200) — BORDERLINE HIGH
- HDL: 45 mg/dL (Normal: >40)
- LDL: 140 mg/dL (Normal: <100) — HIGH
- Triglycerides: 175 mg/dL (Normal: <150) — HIGH
'''

# Step 2: Split into chunks (same as rag_engine.py)
splitter = RecursiveCharacterTextSplitter(chunk_size=500, chunk_overlap=100)
docs = [Document(page_content=report_text, metadata={'source': 'blood_report.pdf', 'page': 1})]
chunks = splitter.split_documents(docs)
print(f'=== CHUNKING ===')
print(f'Original text: {len(report_text)} chars')
print(f'Split into: {len(chunks)} chunks')
for i, chunk in enumerate(chunks):
    print(f'  Chunk {i+1}: {len(chunk.page_content)} chars — starts with: \"{chunk.page_content[:60]}...\"')
print()

# Step 3: Create FAISS index (this calls OpenAI Embeddings API)
embeddings = OpenAIEmbeddings(openai_api_key=api_key, model='text-embedding-3-small')
vectorstore = FAISS.from_documents(chunks, embeddings)
print(f'=== FAISS INDEX CREATED ===')
print(f'Vectors stored: {vectorstore.index.ntotal}')
print()

# Step 4: Query the index (similarity search)
queries = [
    'What is the hemoglobin level?',
    'Is cholesterol normal?',
    'What about liver function?',
]

for query in queries:
    results = vectorstore.similarity_search(query, k=2)
    print(f'--- Query: \"{query}\" ---')
    for j, doc in enumerate(results):
        print(f'  Match {j+1} (from {doc.metadata[\"source\"]}): \"{doc.page_content[:100]}...\"')
    print()

print('Key insight: FAISS finds the RELEVANT chunk for each question!')
print('\"hemoglobin\" query → returns CBC chunk, not Lipid chunk.')
print('\"cholesterol\" query → returns Lipid chunk, not CBC chunk.')
print('This is how RAG gives the LLM personalized context.')
"
```

**What to learn:**
- Text is split into chunks so each chunk is small enough for the LLM
- Embeddings convert text into vectors (numbers)
- FAISS finds the most similar vectors instantly
- Different questions retrieve different chunks — this is the magic of RAG

---

### Test 5: Test RAG + LLM Together (The Full RAG Pipeline)

This tests the complete flow: retrieve relevant chunks → inject into LLM prompt → personalized answer.

```bash
python3 -c "
import asyncio
from langchain_openai import ChatOpenAI, OpenAIEmbeddings
from langchain_community.vectorstores import FAISS
from langchain_core.documents import Document
from langchain_core.messages import HumanMessage, SystemMessage
from langchain_text_splitters import RecursiveCharacterTextSplitter
from dotenv import load_dotenv
import os

load_dotenv()
api_key = os.getenv('OPENAI_API_KEY')

# Simulate uploaded report
report = '''Lipid Profile — Total Cholesterol: 220 mg/dL (HIGH), LDL: 140 mg/dL (HIGH),
HDL: 45 mg/dL (Normal), Triglycerides: 175 mg/dL (HIGH).
HbA1c: 6.8% (PRE-DIABETIC range, Normal: <5.7%)'''

# Build RAG index
splitter = RecursiveCharacterTextSplitter(chunk_size=500, chunk_overlap=100)
docs = [Document(page_content=report, metadata={'source': 'report.pdf'})]
chunks = splitter.split_documents(docs)
embeddings = OpenAIEmbeddings(openai_api_key=api_key, model='text-embedding-3-small')
vectorstore = FAISS.from_documents(chunks, embeddings)

# Retrieve relevant context
question = 'Am I at risk for diabetes?'
rag_results = vectorstore.similarity_search(question, k=2)
rag_context = '\n'.join([doc.page_content for doc in rag_results])

print('=== RAG CONTEXT RETRIEVED ===')
print(rag_context[:200])
print()

# Ask the LLM WITH RAG context
llm = ChatOpenAI(openai_api_key=api_key, model='gpt-4o-mini', temperature=0.3)

messages_with_rag = [
    SystemMessage(content='You are a medical AI. Use the patient report context to give personalized answers.'),
    HumanMessage(content=f'Patient question: {question}\n\nPatient report context:\n{rag_context}'),
]

messages_without_rag = [
    SystemMessage(content='You are a medical AI.'),
    HumanMessage(content=question),
]

response_with = asyncio.run(llm.ainvoke(messages_with_rag))
response_without = asyncio.run(llm.ainvoke(messages_without_rag))

print('=== WITHOUT RAG (generic answer) ===')
print(response_without.content[:300])
print()
print('=== WITH RAG (personalized answer) ===')
print(response_with.content[:300])
print()
print('Key insight: WITH RAG, the AI mentions YOUR specific HbA1c of 6.8%.')
print('WITHOUT RAG, it gives generic diabetes risk factors.')
"
```

**What to learn:**
- Same LLM, same question — but RAG makes the answer **personalized**
- Without RAG: generic medical advice
- With RAG: "Your HbA1c is 6.8% which indicates pre-diabetes"

---

### Test 6: Test the Full LangGraph Workflow (3 Nodes)

This tests the complete MedicalAgent — all 3 nodes running in sequence.

```bash
python3 -c "
import asyncio, json
from medical_agent import MedicalAgent
from dotenv import load_dotenv
import os

load_dotenv()
api_key = os.getenv('OPENAI_API_KEY')

agent = MedicalAgent(api_key)

print('=== Running LangGraph Agent (3 nodes) ===')
print('Node 1: Generate Reply → Node 2: Analyze → Node 3: Enrich with hospitals/medicines')
print()

result = asyncio.run(agent.run(
    message='I have been having chest pain and shortness of breath for 2 days',
    conversation_history=[],
    rag_context='',
    location='Hyderabad',
))

print('=== NODE 1 OUTPUT: Reply ===')
print(result['reply'][:500])
print()

if result.get('analysis'):
    a = result['analysis']
    print('=== NODE 2 OUTPUT: Analysis ===')
    print(f'Conditions: {a.get(\"conditions\", [])}')
    print(f'Specialists: {a.get(\"specialists\", [])}')
    print(f'Risk Level: {a.get(\"riskLevel\", \"Unknown\")}')
    print(f'Tests: {a.get(\"tests\", [])}')
    print()
    print('=== NODE 3 OUTPUT: Enrichment ===')
    if a.get('hospitals'):
        for h in a['hospitals']:
            print(f'  🏥 {h[\"name\"]} → {h[\"mapLink\"]}')
    if a.get('medicines'):
        for m in a['medicines']:
            print(f'  💊 {m[\"name\"]} ({m[\"dosage\"]}) → {m[\"buyLink\"]}')
    print()

print('Key insight: LangGraph ran 3 separate LLM calls in sequence,')
print('each building on the previous node output.')
print('The state object was shared across all nodes.')
"
```

**What to learn:**
- LangGraph runs Node 1 → Node 2 → Node 3 in order
- Each node adds to the shared `AgentState`
- Node 3 uses Node 2's output (analysis) to suggest relevant hospitals/medicines
- The location ("Hyderabad") affects which hospitals are suggested

---

### Test 7: Test RAG + LangGraph Together (Upload Report → Ask Question)

This is the **complete end-to-end test** — exactly what happens in the app.

```bash
python3 -c "
import asyncio, json
from medical_agent import MedicalAgent
from rag_engine import RAGEngine
from dotenv import load_dotenv
import os

load_dotenv()
api_key = os.getenv('OPENAI_API_KEY')

# Initialize both components
agent = MedicalAgent(api_key)
rag = RAGEngine(api_key)

# Simulate a PDF report (as raw text — in real app, PyPDF extracts this)
fake_report_bytes = b'''%PDF-fake
Hemoglobin: 10.2 g/dL (LOW — Normal: 13.5-17.5)
WBC: 15,000 /uL (HIGH — Normal: 4,500-11,000)
Blood Sugar (Fasting): 180 mg/dL (HIGH — Normal: 70-100)
HbA1c: 8.2% (DIABETIC — Normal: <5.7%)
Blood Pressure: 150/95 mmHg (HIGH)
'''

# Since this isn't a real PDF, let's use the RAG engine directly
from langchain_core.documents import Document
docs = [Document(page_content=fake_report_bytes.decode(), metadata={'source': 'test_report.pdf', 'page': 1})]
chunks = rag.text_splitter.split_documents(docs)
rag.vectorstore = None
from langchain_community.vectorstores import FAISS
rag.vectorstore = FAISS.from_documents(chunks, rag.embeddings)
rag._last_ingested_text = fake_report_bytes.decode()
rag._all_texts.append(fake_report_bytes.decode())

# Now query RAG
question = 'Should I be worried about my blood sugar levels?'
rag_results = rag.query(question, k=4)
rag_context = '\n\n'.join([doc.page_content for doc in rag_results])

print('=== RAG RETRIEVED ===')
print(rag_context[:200])
print()

# Run full LangGraph agent WITH RAG context
result = asyncio.run(agent.run(
    message=question,
    conversation_history=[],
    rag_context=rag_context,
    location='Mumbai',
))

print('=== FULL RESPONSE (RAG + LangGraph) ===')
print(result['reply'][:600])
print()

if result.get('analysis'):
    a = result['analysis']
    print(f'Risk Level: {a.get(\"riskLevel\")}')
    print(f'Conditions: {a.get(\"conditions\")}')
    if a.get('hospitals'):
        print(f'Hospitals near Mumbai: {[h[\"name\"] for h in a[\"hospitals\"]]}')
    if a.get('medicines'):
        print(f'Medicines: {[m[\"name\"] for m in a[\"medicines\"]]}')

print()
print('=== COMPLETE FLOW ===')
print('PDF → PyPDF → Chunks → Embeddings → FAISS → RAG Query →')
print('LangGraph (Node1: Reply + RAG context, Node2: Analysis, Node3: Hospitals/Meds) → Response')
"
```

---

### Test 8: Test via API (curl) — How the Frontend Calls the Backend

These are the actual HTTP calls the React app makes. Test them with curl:

```bash
# Make sure the backend is running (./start.sh or: cd server && source venv/bin/activate && python main.py)

# 1. Login and get a JWT token
TOKEN=$(curl -s -X POST http://localhost:8000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@medai.com","password":"admin123"}' | python3 -c "import sys,json; print(json.load(sys.stdin)['token'])")
echo "Token: $TOKEN"

# 2. Test the chat endpoint (LangGraph + LLM)
curl -s -X POST http://localhost:8000/api/chat \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -d '{"message":"I have a sore throat and mild fever","location":"Delhi"}' | python3 -m json.tool

# 3. Upload a PDF report (triggers RAG pipeline)
# curl -X POST http://localhost:8000/api/upload-report \
#   -H "Authorization: Bearer $TOKEN" \
#   -F "file=@/path/to/your/report.pdf"

# 4. Test health summary (uses RAG if reports exist)
curl -s http://localhost:8000/api/health-summary \
  -H "Authorization: Bearer $TOKEN" | python3 -m json.tool

# 5. Test symptom analysis (structured JSON output)
curl -s -X POST http://localhost:8000/api/analyze-symptoms \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -d '{"message":"severe headache, stiff neck, sensitivity to light"}' | python3 -m json.tool
```

---

### 📝 Summary: What to Test & What You'll Learn

| Test # | What It Tests | Key Concept You Learn |
|--------|--------------|----------------------|
| **Test 1** | Raw LLM call via LangChain | How ChatOpenAI wraps the OpenAI API |
| **Test 2** | Multi-turn conversation | How LangChain manages message history (System/Human/AI messages) |
| **Test 3** | Structured JSON output | How system prompts + low temperature force valid JSON |
| **Test 4** | RAG: Embeddings + FAISS | How text becomes vectors, how similarity search works |
| **Test 5** | RAG + LLM together | How RAG context makes LLM answers personalized |
| **Test 6** | Full LangGraph workflow | How 3 nodes share state and build on each other |
| **Test 7** | RAG + LangGraph end-to-end | The complete pipeline: PDF → RAG → LangGraph → Response |
| **Test 8** | API calls with curl | How the React frontend communicates with the backend |

---

### 🧑‍🏫 Learning Path (Recommended Order)

```
Start here          Then learn          Then combine          Master level
    │                   │                    │                     │
    ▼                   ▼                    ▼                     ▼
 Test 1              Test 4              Test 5               Test 7
 (raw LLM)           (RAG only)          (RAG + LLM)          (RAG + LangGraph)
    │                   │                    │                     │
    ▼                   │                    ▼                     ▼
 Test 2              Test 3              Test 6               Test 8
 (conversation)      (JSON output)       (LangGraph)          (full API)
```

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
