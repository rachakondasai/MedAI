"""
Medical Agent — LangChain + LangGraph
Multi-step reasoning agent for healthcare AI:
1. Symptom Analysis → Structured medical analysis
2. Enrichment → Hospital & medicine recommendations with live links
3. Report Analysis → Extract metrics, flag abnormalities
4. Health Summary → Generate comprehensive summary
Uses LangGraph for stateful, multi-node workflow.
"""

import json
from typing import TypedDict, Annotated, Optional
from langchain_openai import ChatOpenAI
from langchain_core.messages import HumanMessage, SystemMessage, AIMessage
from langgraph.graph import StateGraph, END


# --- System Prompts ---

MEDICAL_SYSTEM_PROMPT = """You are MedAI, an advanced AI healthcare assistant. You are helpful, empathetic, and medically knowledgeable.

IMPORTANT RULES:
1. Always provide a clear, informative response about the user's health concern.
2. Always include a disclaimer that users should consult a real doctor.
3. Be empathetic and reassuring, but factually accurate.
4. If the user describes symptoms, analyze them and suggest possible conditions.
5. Use medical terminology but explain it in simple language.
6. Never diagnose definitively — always say "possible" or "may indicate".

When RAG context from medical reports is provided, use it to give personalized answers.
"""

ANALYSIS_SYSTEM_PROMPT = """You are a medical analysis AI. Given a user's symptoms or health question, provide a structured analysis.

You MUST respond with ONLY a valid JSON object (no markdown, no extra text) with this exact structure:
{
  "conditions": ["condition1", "condition2", "condition3"],
  "specialists": ["specialist1", "specialist2"],
  "riskLevel": "Low / Low to Moderate / Moderate / High / Critical",
  "tests": ["test1", "test2", "test3"]
}

Be medically accurate. List 2-4 conditions, 1-3 specialists, and 2-4 recommended tests.
"""

ENRICHMENT_SYSTEM_PROMPT = """You are a medical recommendation AI. Given a user's symptoms or health question and the medical analysis, suggest nearby hospitals and relevant medicines.

You MUST respond with ONLY a valid JSON object (no markdown, no extra text) with this exact structure:
{
  "hospitals": [
    {
      "name": "Hospital Name",
      "mapLink": "https://www.google.com/maps/search/Hospital+Name+City"
    }
  ],
  "medicines": [
    {
      "name": "Medicine Name (with strength, e.g. Paracetamol 500mg)",
      "buyLink": "https://www.1mg.com/search/all?name=Medicine+Name",
      "dosage": "Dosage instructions"
    }
  ]
}

IMPORTANT RULES:
1. If the user's location/city is provided, suggest 2-4 well-known reputable hospitals IN or NEAR that city. Include the city name in the hospital mapLink.
2. If no location is provided, suggest 2-4 well-known reputable hospitals in major Indian cities (e.g. Apollo, Fortis, AIIMS, Max, Medanta, Manipal, Narayana Health) relevant to the condition.
3. For mapLink, always use Google Maps search URL: https://www.google.com/maps/search/<Hospital+Name+City>
4. Suggest 2-4 commonly used OTC or first-line medicines specifically for the user's symptoms. Be symptom-specific — different symptoms should get different medicines.
5. For buyLink, always use 1mg search URL: https://www.1mg.com/search/all?name=<Medicine+Name>
6. For dosage, give standard adult dosage guidelines.
7. Always add a disclaimer that medicines should be taken only after consulting a doctor.
8. Use URL encoding for spaces (use + instead of spaces in URLs).
9. Medicines must be specifically relevant to the conditions identified in the analysis — not generic.
"""

REPORT_ANALYSIS_PROMPT = """You are a medical report analysis AI. Analyze the following medical report text and extract key findings.

Respond with ONLY a valid JSON object (no markdown, no extra text):
{
  "metrics": [
    {
      "name": "metric name",
      "value": "numeric value",
      "unit": "unit",
      "status": "normal OR warning OR critical",
      "range": "normal range"
    }
  ],
  "summary": "brief overall summary",
  "recommendations": ["recommendation1", "recommendation2"],
  "riskLevel": "Low / Moderate / High"
}
"""

HEALTH_SUMMARY_PROMPT = """Based on all the medical reports provided, generate a comprehensive health summary.

Respond with ONLY a valid JSON object:
{
  "summary": "comprehensive health summary paragraph",
  "score": 75,
  "riskLevel": "Low / Moderate / High",
  "keyFindings": ["finding1", "finding2"],
  "recommendations": ["rec1", "rec2", "rec3"]
}

The score should be 0-100 representing overall health.
"""


# --- LangGraph State ---

class AgentState(TypedDict):
    message: str
    conversation_history: list[dict]
    rag_context: str
    location: str
    reply: str
    analysis: Optional[dict]


# --- Medical Agent ---

# Map frontend model IDs to actual OpenAI-compatible model names
MODEL_MAP = {
    "gpt-4o": "gpt-4o",
    "gpt-4-turbo": "gpt-4-turbo",
    "gpt-3.5-turbo": "gpt-3.5-turbo",
    "gpt-4o-mini": "gpt-4o-mini",
}


class MedicalAgent:
    def __init__(self, api_key: str, model: str = "gpt-4o-mini"):
        self.api_key = api_key
        # Resolve model name (fall back to gpt-4o-mini for unsupported/non-OpenAI models)
        resolved_model = MODEL_MAP.get(model, "gpt-4o-mini")
        self.llm = ChatOpenAI(
            openai_api_key=api_key,
            model=resolved_model,
            temperature=0.3,
            max_tokens=2000,
        )
        self.analysis_llm = ChatOpenAI(
            openai_api_key=api_key,
            model="gpt-4o-mini",
            temperature=0.1,
            max_tokens=1000,
        )
        self.enrichment_llm = ChatOpenAI(
            openai_api_key=api_key,
            model="gpt-4o-mini",
            temperature=0.2,
            max_tokens=1000,
        )
        self.graph = self._build_graph()

    def _build_graph(self) -> StateGraph:
        """Build the LangGraph workflow for medical consultation."""
        graph = StateGraph(AgentState)

        # Add nodes
        graph.add_node("generate_reply", self._generate_reply_node)
        graph.add_node("generate_analysis", self._generate_analysis_node)
        graph.add_node("generate_enrichment", self._generate_enrichment_node)

        # Define flow: generate reply → generate analysis → generate enrichment → END
        graph.set_entry_point("generate_reply")
        graph.add_edge("generate_reply", "generate_analysis")
        graph.add_edge("generate_analysis", "generate_enrichment")
        graph.add_edge("generate_enrichment", END)

        return graph.compile()

    async def _generate_reply_node(self, state: AgentState) -> dict:
        """Node 1: Generate the main conversational reply."""
        messages = [SystemMessage(content=MEDICAL_SYSTEM_PROMPT)]

        # Add conversation history
        for msg in state.get("conversation_history", []):
            if msg["role"] == "user":
                messages.append(HumanMessage(content=msg["content"]))
            else:
                messages.append(AIMessage(content=msg["content"]))

        # Add RAG context if available
        user_content = state["message"]
        if state.get("rag_context"):
            user_content = f"""User question: {state['message']}

Relevant context from patient's medical reports:
{state['rag_context']}

Use this context to provide a personalized, accurate response."""

        messages.append(HumanMessage(content=user_content))

        response = await self.llm.ainvoke(messages)
        return {"reply": response.content}

    async def _generate_analysis_node(self, state: AgentState) -> dict:
        """Node 2: Generate structured medical analysis."""
        messages = [
            SystemMessage(content=ANALYSIS_SYSTEM_PROMPT),
            HumanMessage(content=f"Analyze these symptoms/question: {state['message']}"),
        ]

        try:
            response = await self.analysis_llm.ainvoke(messages)
            text = response.content.strip()
            # Handle markdown code blocks
            if text.startswith("```"):
                text = text.split("```")[1]
                if text.startswith("json"):
                    text = text[4:]
                text = text.strip()
            analysis = json.loads(text)
            return {"analysis": analysis}
        except (json.JSONDecodeError, Exception):
            return {"analysis": None}

    async def _generate_enrichment_node(self, state: AgentState) -> dict:
        """Node 3: Generate hospital & medicine recommendations with live links."""
        analysis = state.get("analysis")
        if not analysis:
            return {}

        analysis_summary = json.dumps(analysis, indent=2)
        location = state.get("location", "")
        location_context = f"\nUser's location/city: {location}" if location else "\nUser's location: Not provided (suggest hospitals in major Indian cities)"

        messages = [
            SystemMessage(content=ENRICHMENT_SYSTEM_PROMPT),
            HumanMessage(content=f"User symptoms/question: {state['message']}{location_context}\n\nMedical analysis:\n{analysis_summary}"),
        ]

        try:
            response = await self.enrichment_llm.ainvoke(messages)
            text = response.content.strip()
            if text.startswith("```"):
                text = text.split("```")[1]
                if text.startswith("json"):
                    text = text[4:]
                text = text.strip()
            enrichment = json.loads(text)

            # Merge enrichment into the existing analysis
            updated_analysis = {**analysis}
            if enrichment.get("hospitals"):
                updated_analysis["hospitals"] = enrichment["hospitals"]
            if enrichment.get("medicines"):
                updated_analysis["medicines"] = enrichment["medicines"]

            return {"analysis": updated_analysis}
        except (json.JSONDecodeError, Exception):
            return {}

    async def run(
        self,
        message: str,
        conversation_history: list[dict] = [],
        rag_context: str = "",
        location: str = "",
    ) -> dict:
        """Run the full LangGraph medical agent."""
        initial_state: AgentState = {
            "message": message,
            "conversation_history": conversation_history,
            "rag_context": rag_context,
            "location": location,
            "reply": "",
            "analysis": None,
        }

        result = await self.graph.ainvoke(initial_state)
        return {
            "reply": result["reply"],
            "analysis": result.get("analysis"),
        }

    async def analyze_symptoms(self, symptoms: str) -> dict:
        """Dedicated symptom analysis with structured output."""
        messages = [
            SystemMessage(content=ANALYSIS_SYSTEM_PROMPT),
            HumanMessage(content=f"Patient symptoms: {symptoms}"),
        ]

        try:
            response = await self.analysis_llm.ainvoke(messages)
            text = response.content.strip()
            if text.startswith("```"):
                text = text.split("```")[1]
                if text.startswith("json"):
                    text = text[4:]
                text = text.strip()
            return json.loads(text)
        except (json.JSONDecodeError, Exception):
            return {
                "conditions": ["Unable to analyze"],
                "specialists": ["General Physician"],
                "riskLevel": "Unknown",
                "tests": ["Complete health checkup recommended"],
            }

    async def analyze_report(self, report_text: str) -> dict:
        """Analyze a medical report and extract structured data."""
        messages = [
            SystemMessage(content=REPORT_ANALYSIS_PROMPT),
            HumanMessage(content=f"Medical report:\n\n{report_text[:4000]}"),
        ]

        try:
            response = await self.analysis_llm.ainvoke(messages)
            text = response.content.strip()
            if text.startswith("```"):
                text = text.split("```")[1]
                if text.startswith("json"):
                    text = text[4:]
                text = text.strip()
            return json.loads(text)
        except (json.JSONDecodeError, Exception):
            return {"summary": "Report uploaded but analysis failed. Please try again.", "metrics": []}

    async def generate_health_summary(self, all_reports_text: str) -> dict:
        """Generate a comprehensive health summary from all reports."""
        messages = [
            SystemMessage(content=HEALTH_SUMMARY_PROMPT),
            HumanMessage(content=f"All medical reports:\n\n{all_reports_text[:6000]}"),
        ]

        try:
            response = await self.analysis_llm.ainvoke(messages)
            text = response.content.strip()
            if text.startswith("```"):
                text = text.split("```")[1]
                if text.startswith("json"):
                    text = text[4:]
                text = text.strip()
            return json.loads(text)
        except (json.JSONDecodeError, Exception):
            return {"summary": "Unable to generate summary.", "score": None}
