"""
RAG Engine — FAISS Vector Store + LangChain
Handles PDF ingestion, chunking, embedding, and retrieval.
"""

import io
from typing import Optional
from pypdf import PdfReader

from langchain_text_splitters import RecursiveCharacterTextSplitter
from langchain_openai import OpenAIEmbeddings
from langchain_community.vectorstores import FAISS
from langchain_core.documents import Document


class RAGEngine:
    def __init__(self, api_key: str):
        self.api_key = api_key
        self.embeddings = OpenAIEmbeddings(
            openai_api_key=api_key,
            model="text-embedding-3-small",
        )
        self.text_splitter = RecursiveCharacterTextSplitter(
            chunk_size=1000,
            chunk_overlap=200,
            separators=["\n\n", "\n", ". ", " ", ""],
        )
        self.vectorstore: Optional[FAISS] = None
        self._all_texts: list[str] = []
        self._last_ingested_text: str = ""

    def has_documents(self) -> bool:
        return self.vectorstore is not None

    def ingest_pdf(self, pdf_bytes: bytes, filename: str) -> int:
        """Parse PDF, chunk, embed, and store in FAISS."""
        reader = PdfReader(io.BytesIO(pdf_bytes))
        pages_text = []
        for i, page in enumerate(reader.pages):
            text = page.extract_text()
            if text and text.strip():
                pages_text.append(text.strip())

        full_text = "\n\n".join(pages_text)
        self._last_ingested_text = full_text
        self._all_texts.append(full_text)

        # Create documents with metadata
        documents = []
        for i, page_text in enumerate(pages_text):
            documents.append(Document(
                page_content=page_text,
                metadata={"source": filename, "page": i + 1},
            ))

        # Split into chunks
        chunks = self.text_splitter.split_documents(documents)

        # Add to FAISS vector store
        if self.vectorstore is None:
            self.vectorstore = FAISS.from_documents(chunks, self.embeddings)
        else:
            self.vectorstore.add_documents(chunks)

        return len(chunks)

    def query(self, question: str, k: int = 4) -> list[Document]:
        """Retrieve relevant chunks for a question."""
        if self.vectorstore is None:
            return []
        return self.vectorstore.similarity_search(question, k=k)

    def get_last_ingested_text(self) -> str:
        return self._last_ingested_text

    def get_all_text(self) -> str:
        return "\n\n---\n\n".join(self._all_texts)
