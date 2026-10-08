"""
Semantic retrieval over the ingested guidelines index.

A single admission-guidelines PDF is, realistically, a few hundred chunks
at most — brute-force cosine similarity over a numpy array is simpler to
operate and reason about than standing up a vector database for this, and
is effectively instant at this scale. If the knowledge base grows to
cover many documents, swapping this for a real vector store (pgvector,
Chroma, etc.) is a drop-in replacement: only `search()` below needs to
change, not the router or prompts.
"""

import json
import logging

import numpy as np

from . import config
from .gemini_client import embed_texts

logger = logging.getLogger(__name__)

_chunks: list[str] = []
_vectors: np.ndarray | None = None


def _load() -> None:
    global _chunks, _vectors
    try:
        with open(config.GUIDELINES_INDEX_PATH, "r", encoding="utf-8") as f:
            index = json.load(f)
    except FileNotFoundError:
        logger.warning(
            "No chatbot index found at %s — run `python -m chatbot.ingest_guidelines "
            "<pdf path>` first. The chatbot will answer with no reference material "
            "until that's done.",
            config.GUIDELINES_INDEX_PATH,
        )
        _chunks, _vectors = [], np.zeros((0, 0))
        return

    _chunks = [item["text"] for item in index]
    _vectors = np.array([item["embedding"] for item in index], dtype=np.float32)
    # Pre-normalize so similarity search is a plain dot product.
    norms = np.linalg.norm(_vectors, axis=1, keepdims=True)
    norms[norms == 0] = 1.0
    _vectors = _vectors / norms
    logger.info("Loaded %d guideline chunks for retrieval.", len(_chunks))


_load()


def search(query: str, top_k: int | None = None) -> list[str]:
    """Returns the top_k most relevant chunks of guideline text for the
    given question, most relevant first. Returns [] if the index hasn't
    been built yet — callers should treat that the same as "no answer
    found" rather than erroring."""
    top_k = top_k or config.RETRIEVAL_TOP_K
    if _vectors is None or _vectors.shape[0] == 0:
        return []

    [query_vector] = embed_texts([query])
    query_vector = np.array(query_vector, dtype=np.float32)
    norm = np.linalg.norm(query_vector)
    if norm > 0:
        query_vector = query_vector / norm

    scores = _vectors @ query_vector
    top_indices = np.argsort(-scores)[:top_k]
    return [_chunks[i] for i in top_indices]
