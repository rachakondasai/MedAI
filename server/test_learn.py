#!/usr/bin/env python3
"""
╔══════════════════════════════════════════════════════════════════╗
║     MedAI — Interactive Learning & Testing Guide                 ║
║     Learn LLM, LangChain, LangGraph, and RAG step by step       ║
║                                                                  ║
║  Usage:                                                          ║
║     cd server                                                    ║
║     source venv/bin/activate                                     ║
║     python test_learn.py            ← run ALL tests              ║
║     python test_learn.py 1          ← run test 1 only            ║
║     python test_learn.py 3          ← run test 3 only            ║
║     python test_learn.py 1 2 3      ← run tests 1, 2, and 3     ║
╚══════════════════════════════════════════════════════════════════╝
"""

import asyncio
import json
import os
import sys
import time

from dotenv import load_dotenv
load_dotenv()

# ──────────────────────────────────────────────────────────────────
# COLORS for terminal output
# ──────────────────────────────────────────────────────────────────
class C:
    HEADER = "\033[95m"
    BLUE = "\033[94m"
    CYAN = "\033[96m"
    GREEN = "\033[92m"
    YELLOW = "\033[93m"
    RED = "\033[91m"
    BOLD = "\033[1m"
    DIM = "\033[2m"
    RESET = "\033[0m"

def banner(text):
    width = 66
    print()
    print(f"{C.CYAN}{'═' * width}{C.RESET}")
    print(f"{C.CYAN}║{C.BOLD}{C.YELLOW}  {text.center(width - 4)}  {C.RESET}{C.CYAN}║{C.RESET}")
    print(f"{C.CYAN}{'═' * width}{C.RESET}")
    print()

def section(text):
    print(f"\n{C.BOLD}{C.BLUE}▸ {text}{C.RESET}")
    print(f"{C.DIM}{'─' * 60}{C.RESET}")

def teach(text):
    for line in text.strip().split("\n"):
        print(f"  {C.DIM}📖 {line}{C.RESET}")

def result(label, value):
    print(f"  {C.GREEN}✓ {label}:{C.RESET} {value}")

def warn(text):
    print(f"  {C.YELLOW}⚠  {text}{C.RESET}")

def error(text):
    print(f"  {C.RED}✗  {text}{C.RESET}")

def pause():
    print(f"\n  {C.DIM}Press Enter to continue...{C.RESET}", end="")
    input()

def get_api_key():
    key = os.getenv("OPENAI_API_KEY", "")
    if not key or key.strip() == "":
        error("No OPENAI_API_KEY found in server/.env!")
        print(f"  {C.YELLOW}Fix: Open server/.env and add your key:{C.RESET}")
        print(f"  {C.CYAN}  OPENAI_API_KEY=sk-your-key-here{C.RESET}")
        sys.exit(1)
    return key.strip()


# ══════════════════════════════════════════════════════════════════
# TEST 1: What is an LLM? — Talk to GPT-4o directly
# ══════════════════════════════════════════════════════════════════

async def test_1_raw_llm():
    banner("TEST 1: What is an LLM? — Raw OpenAI Call")

    teach("""
An LLM (Large Language Model) is an AI model trained on massive text data.
GPT-4o-mini is the LLM we use. It takes text in, generates text out.

In this test, we call the OpenAI API DIRECTLY using LangChain's ChatOpenAI.
No RAG, no graph, no tools — just: question in → answer out.

📁 File: server/medical_agent.py
📌 Line: self.llm = ChatOpenAI(model="gpt-4o-mini", temperature=0.3)

"temperature" controls randomness:
  • 0.0 = always the same answer (deterministic)
  • 0.3 = mostly consistent, slightly creative (our default)
  • 1.0 = very creative/random
""")

    section("Calling GPT-4o-mini with a simple medical question...")

    from langchain_openai import ChatOpenAI
    from langchain_core.messages import HumanMessage

    api_key = get_api_key()
    llm = ChatOpenAI(
        openai_api_key=api_key,
        model="gpt-4o-mini",
        temperature=0.3,
        max_tokens=500,
    )

    question = "What could cause a headache and fever together?"

    result_label = f"Question"
    result(result_label, question)

    start = time.time()
    response = await llm.ainvoke([HumanMessage(content=question)])
    elapsed = time.time() - start

    section("LLM Response")
    print(f"  {C.GREEN}{response.content[:600]}{C.RESET}")

    section("Metadata (what LangChain tracks for you)")
    meta = response.response_metadata or {}
    token_usage = meta.get("token_usage", {})
    result("Model", meta.get("model_name", "gpt-4o-mini"))
    result("Prompt tokens", token_usage.get("prompt_tokens", "?"))
    result("Completion tokens", token_usage.get("completion_tokens", "?"))
    result("Total tokens", token_usage.get("total_tokens", "?"))
    result("Response time", f"{elapsed:.2f}s")

    teach("""
🎓 WHAT YOU LEARNED:
  • ChatOpenAI is LangChain's wrapper around the OpenAI API
  • HumanMessage is how you send a user's question
  • The LLM returned a text response + metadata (tokens, model)
  • This is the FOUNDATION — everything else builds on this
""")


# ══════════════════════════════════════════════════════════════════
# TEST 2: LangChain Messages — System, Human, AI
# ══════════════════════════════════════════════════════════════════

async def test_2_langchain_messages():
    banner("TEST 2: LangChain Messages — How Conversations Work")

    teach("""
LangChain uses 3 message types to structure conversations:

  1. SystemMessage → "You are a medical assistant" (role/personality)
  2. HumanMessage  → "I have a headache" (user's input)
  3. AIMessage     → "Headaches can be caused by..." (AI's previous reply)

The LLM sees ALL messages each time — it has no memory on its own.
YOU must pass the full conversation history every time.

📁 File: server/medical_agent.py
📌 Method: _generate_reply_node()
📌 It builds: [SystemMessage, ...history..., HumanMessage]
""")

    from langchain_openai import ChatOpenAI
    from langchain_core.messages import HumanMessage, SystemMessage, AIMessage

    api_key = get_api_key()
    llm = ChatOpenAI(openai_api_key=api_key, model="gpt-4o-mini", temperature=0.3, max_tokens=400)

    # --- Round 1: Without conversation history ---
    section("Round 1 — Single message (no history)")
    messages_r1 = [
        SystemMessage(content="You are a helpful medical AI. Be concise (2-3 sentences)."),
        HumanMessage(content="I have a headache."),
    ]
    result("Messages sent", f"{len(messages_r1)} messages (System + Human)")

    r1 = await llm.ainvoke(messages_r1)
    print(f"  {C.GREEN}AI: {r1.content}{C.RESET}")

    # --- Round 2: WITH conversation history ---
    section("Round 2 — With conversation history (AI remembers Round 1)")
    messages_r2 = [
        SystemMessage(content="You are a helpful medical AI. Be concise (2-3 sentences)."),
        HumanMessage(content="I have a headache."),          # Round 1 user msg
        AIMessage(content=r1.content),                        # Round 1 AI reply
        HumanMessage(content="Now I also have a fever and body aches. What could it be?"),  # Round 2
    ]
    result("Messages sent", f"{len(messages_r2)} messages (System + Human + AI + Human)")

    r2 = await llm.ainvoke(messages_r2)
    print(f"  {C.GREEN}AI: {r2.content}{C.RESET}")

    # --- Round 3: WITHOUT history (AI forgets) ---
    section("Round 3 — Same question but WITHOUT history (AI forgets!)")
    messages_r3 = [
        SystemMessage(content="You are a helpful medical AI. Be concise (2-3 sentences)."),
        HumanMessage(content="Now I also have a fever and body aches. What could it be?"),
    ]
    result("Messages sent", f"{len(messages_r3)} messages (System + Human only)")

    r3 = await llm.ainvoke(messages_r3)
    print(f"  {C.GREEN}AI: {r3.content}{C.RESET}")

    teach("""
🎓 WHAT YOU LEARNED:
  • Round 2: AI knows about the headache from Round 1 (because we passed history)
  • Round 3: AI does NOT know about the headache (no history passed)
  • LLMs have NO built-in memory — LangChain manages conversation state
  • In MedAI: medical_agent.py passes conversation_history[] from the frontend
""")


# ══════════════════════════════════════════════════════════════════
# TEST 3: LangChain Structured Output — Forcing JSON
# ══════════════════════════════════════════════════════════════════

async def test_3_structured_json():
    banner("TEST 3: Structured Output — How We Force the LLM to Return JSON")

    teach("""
Normally an LLM returns free-form text. But MedAI needs STRUCTURED data:
  • conditions: ["Migraine", "Viral Fever"]
  • specialists: ["Neurologist"]
  • riskLevel: "Moderate"

How? We use a System Prompt that says "respond with ONLY valid JSON"
+ a LOW temperature (0.1) to make the output predictable.

📁 File: server/medical_agent.py
📌 Prompt: ANALYSIS_SYSTEM_PROMPT (forces JSON schema)
📌 LLM: analysis_llm with temperature=0.1
""")

    from langchain_openai import ChatOpenAI
    from langchain_core.messages import HumanMessage, SystemMessage

    api_key = get_api_key()

    # --- Attempt with HIGH temperature (unreliable) ---
    section("Attempt 1 — temperature=0.8 (high, unreliable)")
    high_temp_llm = ChatOpenAI(openai_api_key=api_key, model="gpt-4o-mini", temperature=0.8, max_tokens=500)

    json_prompt = """Respond with ONLY a valid JSON object (no markdown, no extra text):
{
  "conditions": ["condition1", "condition2"],
  "specialists": ["specialist1"],
  "riskLevel": "Low / Moderate / High",
  "tests": ["test1", "test2"]
}"""

    msgs = [
        SystemMessage(content=json_prompt),
        HumanMessage(content="Symptoms: severe headache, stiff neck, sensitivity to light"),
    ]

    r1 = await high_temp_llm.ainvoke(msgs)
    print(f"  {C.YELLOW}Raw output (temp=0.8):{C.RESET}")
    print(f"  {r1.content[:300]}")
    try:
        json.loads(r1.content.strip().replace("```json", "").replace("```", "").strip())
        result("JSON valid?", "Yes ✓")
    except json.JSONDecodeError:
        warn("JSON INVALID — high temperature added extra text!")

    # --- Attempt with LOW temperature (reliable) ---
    section("Attempt 2 — temperature=0.1 (low, reliable — what MedAI uses)")
    low_temp_llm = ChatOpenAI(openai_api_key=api_key, model="gpt-4o-mini", temperature=0.1, max_tokens=500)

    r2 = await low_temp_llm.ainvoke(msgs)
    print(f"  {C.GREEN}Raw output (temp=0.1):{C.RESET}")
    print(f"  {r2.content[:300]}")

    text = r2.content.strip()
    if text.startswith("```"):
        text = text.split("```")[1]
        if text.startswith("json"):
            text = text[4:]
        text = text.strip()

    try:
        data = json.loads(text)
        result("JSON valid?", "Yes ✓")
        result("Conditions", data.get("conditions", []))
        result("Specialists", data.get("specialists", []))
        result("Risk Level", data.get("riskLevel", "?"))
        result("Tests", data.get("tests", []))
    except json.JSONDecodeError:
        error("JSON still invalid — very rare with temp=0.1")

    teach("""
🎓 WHAT YOU LEARNED:
  • System prompt defines the JSON schema the LLM must follow
  • temperature=0.1 makes the LLM deterministic → valid JSON almost every time
  • medical_agent.py strips markdown ```json``` wrappers as a safety measure
  • This is exactly how Node 2 (generate_analysis) works in the LangGraph
""")


# ══════════════════════════════════════════════════════════════════
# TEST 4: RAG — Embeddings & FAISS Vector Search
# ══════════════════════════════════════════════════════════════════

async def test_4_rag_embeddings():
    banner("TEST 4: RAG — How Text Becomes Vectors & FAISS Finds Similar Text")

    teach("""
RAG = Retrieval-Augmented Generation
The idea: BEFORE asking the LLM, SEARCH your documents for relevant info,
then INJECT that info into the LLM prompt.

Step 1: Split documents into chunks (1000 chars each)
Step 2: Convert each chunk into a VECTOR (a list of 1536 numbers)
Step 3: Store vectors in FAISS (a fast similarity search index)
Step 4: When user asks a question → convert question to vector →
        find the nearest vectors → return those chunks

📁 File: server/rag_engine.py
📌 Embeddings: OpenAIEmbeddings(model="text-embedding-3-small")
📌 Vector store: FAISS.from_documents()
📌 Search: vectorstore.similarity_search(question, k=4)
""")

    from langchain_openai import OpenAIEmbeddings
    from langchain_community.vectorstores import FAISS
    from langchain_core.documents import Document
    from langchain_text_splitters import RecursiveCharacterTextSplitter

    api_key = get_api_key()

    # --- Step 1: Sample medical report ---
    report = """
Patient: Sai Prasad, Age: 28
Date: 2024-03-01

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

Blood Sugar:
- Fasting Blood Sugar: 112 mg/dL (Normal: 70-100) — PRE-DIABETIC
- HbA1c: 6.2% (Normal: <5.7%) — PRE-DIABETIC
"""

    # --- Step 2: Chunking ---
    section("Step 1: Chunking the report")
    splitter = RecursiveCharacterTextSplitter(
        chunk_size=500, chunk_overlap=100,
        separators=["\n\n", "\n", ". ", " ", ""],
    )
    docs = [Document(page_content=report, metadata={"source": "blood_report.pdf", "page": 1})]
    chunks = splitter.split_documents(docs)

    result("Original text length", f"{len(report)} characters")
    result("Number of chunks", len(chunks))
    for i, chunk in enumerate(chunks):
        print(f"    Chunk {i+1}: {len(chunk.page_content)} chars → \"{chunk.page_content[:70].strip()}...\"")

    # --- Step 3: Embedding ---
    section("Step 2: Converting chunks to vectors (embeddings)")
    teach("Each chunk becomes a list of 1536 numbers — its 'meaning' in math form.")

    embeddings = OpenAIEmbeddings(openai_api_key=api_key, model="text-embedding-3-small")

    # Show what an embedding looks like
    sample_embedding = embeddings.embed_query("What is my hemoglobin level?")
    result("Embedding dimensions", len(sample_embedding))
    result("First 5 values", [round(v, 4) for v in sample_embedding[:5]])
    result("Last 5 values", [round(v, 4) for v in sample_embedding[-5:]])
    teach("Every question and every chunk gets converted to a vector like this.")

    # --- Step 4: Build FAISS index ---
    section("Step 3: Building FAISS vector index")
    vectorstore = FAISS.from_documents(chunks, embeddings)
    result("Vectors in index", vectorstore.index.ntotal)

    # --- Step 5: Similarity search ---
    section("Step 4: Searching with different questions")
    queries = [
        "What is the hemoglobin level?",
        "Is cholesterol normal?",
        "Am I at risk for diabetes?",
        "How is liver function?",
    ]

    for q in queries:
        results_docs = vectorstore.similarity_search(q, k=1)
        top_match = results_docs[0].page_content[:120].strip().replace("\n", " ")
        print(f"  {C.CYAN}Q: \"{q}\"{C.RESET}")
        print(f"    {C.GREEN}→ Best match: \"{top_match}...\"{C.RESET}")
        print()

    teach("""
🎓 WHAT YOU LEARNED:
  • Text is split into small chunks so the LLM can handle them
  • Each chunk is converted to a 1536-dimension vector (embedding)
  • FAISS stores these vectors and finds similar ones in milliseconds
  • "hemoglobin" question → finds the CBC chunk (not lipid!)
  • "cholesterol" question → finds the Lipid chunk (not CBC!)
  • This is how RAG retrieves RELEVANT context for the LLM
""")


# ══════════════════════════════════════════════════════════════════
# TEST 5: RAG + LLM — Generic vs Personalized Answers
# ══════════════════════════════════════════════════════════════════

async def test_5_rag_plus_llm():
    banner("TEST 5: RAG + LLM — See How RAG Makes Answers Personal")

    teach("""
This is the KEY test. Same LLM, same question — but:
  • WITHOUT RAG: generic medical advice
  • WITH RAG: personalized answer using YOUR report data

This is exactly what happens in the /api/chat endpoint:
  1. RAG searches your uploaded reports for relevant chunks
  2. Those chunks are injected into the LLM prompt
  3. The LLM gives a personalized answer

📁 File: server/main.py → chat() endpoint
📌 Lines: "if rag.has_documents(): results = rag.query(req.message)"
""")

    from langchain_openai import ChatOpenAI, OpenAIEmbeddings
    from langchain_community.vectorstores import FAISS
    from langchain_core.documents import Document
    from langchain_core.messages import HumanMessage, SystemMessage
    from langchain_text_splitters import RecursiveCharacterTextSplitter

    api_key = get_api_key()
    llm = ChatOpenAI(openai_api_key=api_key, model="gpt-4o-mini", temperature=0.3, max_tokens=400)

    # Build a mini RAG index
    report = """Lipid Profile: Total Cholesterol: 220 mg/dL (BORDERLINE HIGH),
LDL: 140 mg/dL (HIGH), HDL: 45 mg/dL (Normal), Triglycerides: 175 mg/dL (HIGH).
HbA1c: 6.2% (PRE-DIABETIC range, Normal: <5.7%).
Fasting Blood Sugar: 112 mg/dL (Normal: 70-100) — elevated."""

    splitter = RecursiveCharacterTextSplitter(chunk_size=500, chunk_overlap=100)
    docs = [Document(page_content=report, metadata={"source": "report.pdf"})]
    chunks = splitter.split_documents(docs)
    embeddings = OpenAIEmbeddings(openai_api_key=api_key, model="text-embedding-3-small")
    vectorstore = FAISS.from_documents(chunks, embeddings)

    question = "Am I at risk for diabetes?"

    # RAG retrieval
    rag_results = vectorstore.similarity_search(question, k=2)
    rag_context = "\n".join([doc.page_content for doc in rag_results])

    section("RAG context retrieved from your report")
    print(f"  {C.CYAN}{rag_context[:200]}{C.RESET}")

    # --- WITHOUT RAG ---
    section("Answer WITHOUT RAG (generic)")
    r_without = await llm.ainvoke([
        SystemMessage(content="You are a medical AI. Be concise (3-4 sentences)."),
        HumanMessage(content=question),
    ])
    print(f"  {C.YELLOW}{r_without.content}{C.RESET}")

    # --- WITH RAG ---
    section("Answer WITH RAG (personalized to YOUR report)")
    r_with = await llm.ainvoke([
        SystemMessage(content="You are a medical AI. Use the patient's report data to give a personalized answer. Be concise (3-4 sentences)."),
        HumanMessage(content=f"Patient question: {question}\n\nPatient's medical report:\n{rag_context}"),
    ])
    print(f"  {C.GREEN}{r_with.content}{C.RESET}")

    teach("""
🎓 WHAT YOU LEARNED:
  • WITHOUT RAG: AI gives generic diabetes risk factors (family history, obesity, etc.)
  • WITH RAG: AI says "Your HbA1c is 6.2% and fasting sugar is 112 mg/dL — pre-diabetic"
  • Same LLM, same question — RAG context changes everything
  • This is the #1 reason we use RAG: PERSONALIZED medical answers
""")


# ══════════════════════════════════════════════════════════════════
# TEST 6: LangGraph — Multi-Node Workflow
# ══════════════════════════════════════════════════════════════════

async def test_6_langgraph():
    banner("TEST 6: LangGraph — 3-Node Medical Agent Workflow")

    teach("""
LangGraph is a framework for building MULTI-STEP AI workflows as a graph.
Instead of calling the LLM once, we call it 3 TIMES in sequence:

  Node 1: generate_reply      → Friendly medical response (temp=0.3)
  Node 2: generate_analysis   → Structured JSON: conditions, tests (temp=0.1)
  Node 3: generate_enrichment → Hospitals near you + medicines (temp=0.2)

All 3 nodes share the same STATE object (AgentState).
Each node READS from the state and WRITES back to it.

📁 File: server/medical_agent.py
📌 Class: MedicalAgent
📌 Method: _build_graph() — defines Node1 → Node2 → Node3 → END
📌 State: AgentState (message, reply, analysis, location, rag_context)
""")

    from medical_agent import MedicalAgent

    api_key = get_api_key()
    agent = MedicalAgent(api_key)

    symptoms = "I have been having chest pain and shortness of breath for 2 days"
    location = "Hyderabad"

    section(f"Input: \"{symptoms}\"")
    result("Location", location)

    print(f"\n  {C.DIM}Running LangGraph: Node1 → Node2 → Node3 → END ...{C.RESET}")

    start = time.time()
    output = await agent.run(
        message=symptoms,
        conversation_history=[],
        rag_context="",
        location=location,
    )
    elapsed = time.time() - start

    section("NODE 1 OUTPUT → Reply (friendly medical response)")
    print(f"  {C.GREEN}{output['reply'][:500]}{C.RESET}")

    if output.get("analysis"):
        a = output["analysis"]

        section("NODE 2 OUTPUT → Structured Analysis (JSON)")
        result("Conditions", a.get("conditions", []))
        result("Specialists", a.get("specialists", []))
        result("Risk Level", a.get("riskLevel", "?"))
        result("Tests", a.get("tests", []))

        section("NODE 3 OUTPUT → Enrichment (hospitals & medicines)")
        if a.get("hospitals"):
            for h in a["hospitals"]:
                print(f"    🏥 {C.CYAN}{h['name']}{C.RESET} → {C.DIM}{h['mapLink']}{C.RESET}")
        else:
            warn("No hospitals returned (enrichment may have failed)")

        if a.get("medicines"):
            for m in a["medicines"]:
                print(f"    💊 {C.CYAN}{m['name']}{C.RESET} — {m.get('dosage', '')} → {C.DIM}{m['buyLink']}{C.RESET}")
        else:
            warn("No medicines returned (enrichment may have failed)")
    else:
        warn("Analysis was None — LLM may not have returned valid JSON")

    result("Total time (3 LLM calls)", f"{elapsed:.2f}s")

    teach("""
🎓 WHAT YOU LEARNED:
  • LangGraph ran 3 SEPARATE LLM calls in a defined sequence
  • Node 1 → wrote "reply" to the shared state
  • Node 2 → wrote "analysis" (JSON) to the shared state
  • Node 3 → READ the analysis from state, ADDED hospitals/medicines
  • The location "Hyderabad" made Node 3 suggest hospitals in that city
  • Each node used a DIFFERENT temperature for its task
  • All 3 outputs are combined into one API response
""")


# ══════════════════════════════════════════════════════════════════
# TEST 7: RAG + LangGraph — The Complete Pipeline
# ══════════════════════════════════════════════════════════════════

async def test_7_rag_plus_langgraph():
    banner("TEST 7: RAG + LangGraph — The FULL End-to-End Pipeline")

    teach("""
This is the COMPLETE test — exactly what happens when you chat in the app
AFTER uploading a PDF report.

Flow: Upload Report → FAISS Index → User Asks Question → RAG Retrieval →
      LangGraph (Node1 + RAG context, Node2, Node3) → Full Response

📁 Files: rag_engine.py + medical_agent.py + main.py
📌 This combines ALL previous tests into one flow
""")

    from medical_agent import MedicalAgent
    from langchain_openai import OpenAIEmbeddings
    from langchain_community.vectorstores import FAISS
    from langchain_core.documents import Document
    from langchain_text_splitters import RecursiveCharacterTextSplitter

    api_key = get_api_key()

    # Simulate report upload (in real app, PyPDF extracts this from a PDF)
    report_text = """
Patient: Test User, Age: 35
Date: 2024-06-15

Complete Blood Count:
- Hemoglobin: 10.2 g/dL (LOW — Normal: 13.5-17.5) — ANEMIA
- WBC: 15,000 /μL (HIGH — Normal: 4,500-11,000) — POSSIBLE INFECTION
- Platelets: 140,000 /μL (LOW — Normal: 150,000-400,000)

Metabolic Panel:
- Fasting Blood Sugar: 185 mg/dL (Normal: 70-100) — DIABETIC
- HbA1c: 8.4% (Normal: <5.7%) — UNCONTROLLED DIABETES
- Creatinine: 1.8 mg/dL (Normal: 0.7-1.3) — KIDNEY CONCERN

Blood Pressure: 155/98 mmHg — HYPERTENSION
"""

    section("Step 1: Simulating PDF report upload (RAG ingestion)")
    splitter = RecursiveCharacterTextSplitter(chunk_size=500, chunk_overlap=100)
    docs = [Document(page_content=report_text, metadata={"source": "full_report.pdf", "page": 1})]
    chunks = splitter.split_documents(docs)
    embeddings = OpenAIEmbeddings(openai_api_key=api_key, model="text-embedding-3-small")
    vectorstore = FAISS.from_documents(chunks, embeddings)
    result("Chunks indexed in FAISS", len(chunks))

    question = "Based on my report, what should I be most worried about?"

    section("Step 2: RAG retrieval")
    rag_results = vectorstore.similarity_search(question, k=4)
    rag_context = "\n\n".join([doc.page_content for doc in rag_results])
    result("Chunks retrieved", len(rag_results))
    print(f"  {C.CYAN}Context preview: {rag_context[:200]}...{C.RESET}")

    section("Step 3: LangGraph agent with RAG context")
    agent = MedicalAgent(api_key)

    start = time.time()
    output = await agent.run(
        message=question,
        conversation_history=[],
        rag_context=rag_context,
        location="Mumbai",
    )
    elapsed = time.time() - start

    section("FINAL OUTPUT — Reply (personalized with YOUR report data)")
    print(f"  {C.GREEN}{output['reply'][:600]}{C.RESET}")

    if output.get("analysis"):
        a = output["analysis"]
        section("Structured Analysis")
        result("Conditions", a.get("conditions", []))
        result("Risk Level", a.get("riskLevel", "?"))
        result("Specialists", a.get("specialists", []))
        result("Tests", a.get("tests", []))

        if a.get("hospitals"):
            section("Hospitals near Mumbai")
            for h in a["hospitals"]:
                print(f"    🏥 {C.CYAN}{h['name']}{C.RESET}")
        if a.get("medicines"):
            section("Recommended Medicines")
            for m in a["medicines"]:
                print(f"    💊 {C.CYAN}{m['name']}{C.RESET} — {m.get('dosage', '')}")

    result("Total pipeline time", f"{elapsed:.2f}s")

    teach("""
🎓 WHAT YOU LEARNED:
  • The COMPLETE pipeline: PDF → Chunks → Embeddings → FAISS → RAG Query →
    LangGraph (Reply + Analysis + Enrichment) → Personalized Response
  • The AI mentioned YOUR specific values (HbA1c 8.4%, Creatinine 1.8)
  • WITHOUT RAG, it would give generic advice
  • The LangGraph ran 3 nodes, each doing a different job
  • Node 3 used your location (Mumbai) to suggest nearby hospitals
  • THIS is exactly what the /api/chat endpoint does in production
""")


# ══════════════════════════════════════════════════════════════════
# TEST 8: Test via HTTP API (like the React frontend does)
# ══════════════════════════════════════════════════════════════════

async def test_8_http_api():
    banner("TEST 8: HTTP API — How the React Frontend Talks to the Backend")

    teach("""
The React frontend (src/lib/api.ts) makes HTTP requests to the FastAPI backend.
This test simulates those exact calls using Python's httpx.

Make sure the backend is running: ./start.sh or python main.py

📁 Frontend: src/lib/api.ts → sendChatMessage(), uploadReport(), etc.
📁 Backend: server/main.py → @app.post("/api/chat"), etc.
""")

    try:
        import httpx
    except ImportError:
        warn("Installing httpx for HTTP testing...")
        import subprocess
        subprocess.check_call([sys.executable, "-m", "pip", "install", "-q", "httpx"])
        import httpx

    BASE_URL = "http://localhost:8000"

    # Check if backend is running
    section("Step 1: Check if backend is running")
    try:
        async with httpx.AsyncClient(timeout=5) as client:
            r = await client.get(f"{BASE_URL}/")
            data = r.json()
            result("Backend status", data.get("status", "?"))
            result("Service", data.get("service", "?"))
    except Exception:
        error("Backend is NOT running!")
        print(f"  {C.YELLOW}Start it first: ./start.sh  OR  cd server && source venv/bin/activate && python main.py{C.RESET}")
        return

    async with httpx.AsyncClient(timeout=30) as client:

        # Step 2: Login
        section("Step 2: Login (get JWT token)")
        r = await client.post(f"{BASE_URL}/api/auth/login", json={
            "email": "admin@medai.com",
            "password": "admin123",
        })
        if r.status_code != 200:
            error(f"Login failed: {r.text}")
            return
        login_data = r.json()
        token = login_data["token"]
        user = login_data["user"]
        result("Logged in as", f"{user['name']} ({user['email']})")
        result("Role", user["role"])
        result("JWT Token", f"{token[:30]}...")

        headers = {"Authorization": f"Bearer {token}"}

        # Step 3: Chat (triggers LangGraph)
        section("Step 3: Chat with AI Doctor (LangGraph + LLM)")
        r = await client.post(f"{BASE_URL}/api/chat", json={
            "message": "I have a sore throat and mild fever",
            "location": "Bangalore",
            "conversation_history": [],
        }, headers=headers)

        if r.status_code == 200:
            chat_data = r.json()
            print(f"  {C.GREEN}Reply: {chat_data['reply'][:300]}...{C.RESET}")
            if chat_data.get("analysis"):
                a = chat_data["analysis"]
                result("Conditions", a.get("conditions", []))
                result("Risk Level", a.get("riskLevel", "?"))
                if a.get("hospitals"):
                    result("Hospitals", [h["name"] for h in a["hospitals"]])
                if a.get("medicines"):
                    result("Medicines", [m["name"] for m in a["medicines"]])
        elif r.status_code == 400:
            warn(f"API key not set: {r.json().get('detail', '')}")
            print(f"  {C.YELLOW}Fix: Go to Settings in the app and paste your OpenAI API key{C.RESET}")
        else:
            error(f"Chat failed: {r.status_code} {r.text[:200]}")

        # Step 4: Get user data
        section("Step 4: Get user data (authenticated endpoints)")
        for endpoint in ["/api/user/chat-history?limit=3", "/api/user/vitals/latest"]:
            r = await client.get(f"{BASE_URL}{endpoint}", headers=headers)
            result(endpoint, f"Status {r.status_code}, {len(str(r.json()))} chars")

    teach("""
🎓 WHAT YOU LEARNED:
  • The React app calls the SAME endpoints you just tested
  • Step 2: Login returns a JWT token (stored in localStorage)
  • Step 3: /api/chat triggers the full LangGraph pipeline
  • The frontend sends the token in every request header
  • FastAPI decodes the JWT to identify the user
  • All chat messages are logged to SQLite for history
""")


# ══════════════════════════════════════════════════════════════════
# MAIN — Run all tests or specific ones
# ══════════════════════════════════════════════════════════════════

ALL_TESTS = {
    1: ("LLM Basics — Raw OpenAI Call", test_1_raw_llm),
    2: ("LangChain Messages — Conversation History", test_2_langchain_messages),
    3: ("Structured JSON Output — Temperature & Prompts", test_3_structured_json),
    4: ("RAG — Embeddings & FAISS Vector Search", test_4_rag_embeddings),
    5: ("RAG + LLM — Generic vs Personalized Answers", test_5_rag_plus_llm),
    6: ("LangGraph — 3-Node Medical Agent Workflow", test_6_langgraph),
    7: ("RAG + LangGraph — Full End-to-End Pipeline", test_7_rag_plus_langgraph),
    8: ("HTTP API — Frontend-to-Backend Communication", test_8_http_api),
}


async def main():
    banner("MedAI — Interactive Learning & Testing Guide")

    print(f"  {C.BOLD}Available Tests:{C.RESET}")
    print()
    for num, (title, _) in ALL_TESTS.items():
        print(f"    {C.CYAN}{num}{C.RESET} → {title}")
    print()
    print(f"  {C.DIM}Recommended order: 1 → 2 → 3 → 4 → 5 → 6 → 7 → 8{C.RESET}")
    print(f"  {C.DIM}Each test builds on concepts from the previous one.{C.RESET}")
    print()

    # Determine which tests to run
    if len(sys.argv) > 1:
        selected = []
        for arg in sys.argv[1:]:
            try:
                n = int(arg)
                if n in ALL_TESTS:
                    selected.append(n)
                else:
                    error(f"Test {n} does not exist (valid: 1-8)")
            except ValueError:
                if arg in ("all", "a", "*"):
                    selected = list(ALL_TESTS.keys())
                    break
                error(f"Invalid argument: {arg}")
        if not selected:
            return
    else:
        # Interactive mode
        print(f"  {C.BOLD}Enter test numbers (e.g. '1' or '1 2 3' or 'all'):{C.RESET} ", end="")
        user_input = input().strip()
        if not user_input:
            return
        if user_input in ("all", "a", "*"):
            selected = list(ALL_TESTS.keys())
        else:
            selected = []
            for part in user_input.split():
                try:
                    n = int(part)
                    if n in ALL_TESTS:
                        selected.append(n)
                except ValueError:
                    pass

    if not selected:
        error("No valid tests selected.")
        return

    print(f"\n  {C.BOLD}Running {len(selected)} test(s): {selected}{C.RESET}")

    for num in selected:
        title, func = ALL_TESTS[num]
        try:
            await func()
        except Exception as e:
            error(f"Test {num} failed: {e}")
            import traceback
            traceback.print_exc()

        if num != selected[-1]:
            pause()

    # Final summary
    banner("All Done! 🎉")
    print(f"""
  {C.BOLD}Learning Path Summary:{C.RESET}

  {C.CYAN}Test 1{C.RESET} → LLM is the brain (GPT-4o). LangChain wraps the API.
  {C.CYAN}Test 2{C.RESET} → LangChain manages conversation with System/Human/AI messages.
  {C.CYAN}Test 3{C.RESET} → System prompts + low temperature force structured JSON output.
  {C.CYAN}Test 4{C.RESET} → RAG splits text → embeddings → FAISS indexes → similarity search.
  {C.CYAN}Test 5{C.RESET} → RAG + LLM = personalized answers from YOUR medical reports.
  {C.CYAN}Test 6{C.RESET} → LangGraph chains 3 LLM calls: Reply → Analysis → Enrichment.
  {C.CYAN}Test 7{C.RESET} → RAG + LangGraph = the complete MedAI pipeline.
  {C.CYAN}Test 8{C.RESET} → The React frontend calls these same endpoints via HTTP.

  {C.GREEN}You now understand the full AI stack used in MedAI! 🧠{C.RESET}

  {C.DIM}Tip: Modify the test inputs (symptoms, location, report data) and{C.RESET}
  {C.DIM}re-run to see how the outputs change.{C.RESET}
""")


if __name__ == "__main__":
    asyncio.run(main())
