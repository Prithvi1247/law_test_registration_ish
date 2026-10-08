"""
Builds the retrieval index from the SLAT admission guidelines PDF.

Run this once (and again whenever the guidelines PDF changes) — it is a
build-time step, not something that runs on every chat request:

    python -m chatbot.ingest_guidelines path/to/slat-guidelines.pdf

This writes chatbot/data/guidelines_index.json containing every chunk's
text alongside its embedding vector. retriever.py loads that file at
process startup and does an in-memory similarity search against it —
no vector database needed for a single document of this size.
"""

import json
import sys

from pypdf import PdfReader

from . import config
from .gemini_client import embed_texts


def extract_text(pdf_path: str) -> str:
    reader = PdfReader(pdf_path)
    pages = [page.extract_text() or "" for page in reader.pages]
    return "\n\n".join(pages)


def chunk_text(text: str, chunk_size: int, overlap: int) -> list[str]:
    """Simple character-based sliding-window chunker with paragraph-aware
    boundaries where possible. No tokenizer dependency — for a guidelines
    document this is accurate enough, and keeps the ingestion script
    dependency-light."""
    # Collapse excess whitespace but keep paragraph breaks, which make for
    # more natural chunk boundaries than a pure fixed-width slice.
    paragraphs = [p.strip() for p in text.split("\n\n") if p.strip()]

    chunks: list[str] = []
    current = ""
    for paragraph in paragraphs:
        candidate = f"{current}\n\n{paragraph}".strip() if current else paragraph
        if len(candidate) <= chunk_size:
            current = candidate
            continue
        if current:
            chunks.append(current)
        # A single paragraph longer than chunk_size still needs splitting.
        if len(paragraph) > chunk_size:
            start = 0
            while start < len(paragraph):
                end = start + chunk_size
                chunks.append(paragraph[start:end])
                start = end - overlap
            current = ""
        else:
            current = paragraph

    if current:
        chunks.append(current)

    # Apply overlap between adjacent paragraph-based chunks too, so a fact
    # split across a chunk boundary still has a decent chance of appearing
    # whole in at least one chunk.
    overlapped: list[str] = []
    for i, chunk in enumerate(chunks):
        if i == 0:
            overlapped.append(chunk)
            continue
        prefix = chunks[i - 1][-overlap:] if overlap > 0 else ""
        overlapped.append(f"{prefix}\n{chunk}".strip())
    return overlapped


def main() -> None:
    if len(sys.argv) != 2:
        print("Usage: python -m chatbot.ingest_guidelines <path-to-guidelines.pdf>")
        sys.exit(1)

    pdf_path = sys.argv[1]
    print(f"Reading {pdf_path} ...")
    text = extract_text(pdf_path)

    print("Chunking ...")
    chunks = chunk_text(text, config.CHUNK_SIZE_CHARS, config.CHUNK_OVERLAP_CHARS)
    print(f"  {len(chunks)} chunks")

    print(f"Embedding with {config.GEMINI_EMBEDDING_MODEL} ...")
    # Batch to stay well under any single-request size limit.
    batch_size = 50
    embeddings: list[list[float]] = []
    for start in range(0, len(chunks), batch_size):
        batch = chunks[start : start + batch_size]
        embeddings.extend(embed_texts(batch))
        print(f"  embedded {min(start + batch_size, len(chunks))}/{len(chunks)}")

    index = [{"text": chunk, "embedding": vector} for chunk, vector in zip(chunks, embeddings)]

    import os

    os.makedirs(os.path.dirname(config.GUIDELINES_INDEX_PATH), exist_ok=True)
    with open(config.GUIDELINES_INDEX_PATH, "w", encoding="utf-8") as f:
        json.dump(index, f)

    print(f"Wrote {config.GUIDELINES_INDEX_PATH}")


if __name__ == "__main__":
    main()
