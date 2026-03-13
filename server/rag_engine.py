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

    def remove_documents_by_source(self, source_name: str) -> bool:
        """Remove all documents matching the given source filename from the FAISS index.
        Rebuilds the index from the remaining documents. Returns True if any were removed."""
        if self.vectorstore is None:
            return False

        # Get all documents from the existing store
        docstore = self.vectorstore.docstore
        index_to_id = self.vectorstore.index_to_docstore_id

        remaining_docs = []
        removed_any = False
        for idx, doc_id in index_to_id.items():
            doc = docstore.search(doc_id)
            if hasattr(doc, 'metadata') and doc.metadata.get('source') == source_name:
                removed_any = True
            else:
                remaining_docs.append(doc)

        if not removed_any:
            return False

        # Also remove from _all_texts (best-effort: remove text associated with this source)
        # _all_texts is a flat list of full report texts — we can't map them precisely,
        # but we rebuild the index from remaining docs
        if remaining_docs:
            self.vectorstore = FAISS.from_documents(remaining_docs, self.embeddings)
        else:
            self.vectorstore = None

        return True

    def query(self, question: str, k: int = 4) -> list[Document]:
        """Retrieve relevant chunks for a question."""
        if self.vectorstore is None:
            return []
        return self.vectorstore.similarity_search(question, k=k)

    def get_last_ingested_text(self) -> str:
        return self._last_ingested_text

    def get_all_text(self) -> str:
        return "\n\n---\n\n".join(self._all_texts)
