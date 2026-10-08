"""
Gemini access via the OpenAI-compatible SDK.

Kept to one function per concern so the rest of the module never imports
`openai` directly — if you later swap providers, this is the only file
that changes.
"""

from functools import lru_cache
from typing import Sequence

from openai import OpenAI

from . import config


@lru_cache(maxsize=1)
def _client() -> OpenAI:
    config.require_api_key()
    return OpenAI(api_key=config.GEMINI_API_KEY, base_url=config.GEMINI_BASE_URL)


def embed_texts(texts: Sequence[str]) -> list[list[float]]:
    """Embeds a batch of strings with the configured Gemini embedding model.
    Used both by the ingestion script and by the retriever (to embed the
    applicant's question before searching)."""
    if not texts:
        return []
    response = _client().embeddings.create(model=config.GEMINI_EMBEDDING_MODEL, input=list(texts))
    # response.data is returned in the same order as the input list.
    return [item.embedding for item in response.data]


def chat_completion(messages: list[dict]) -> str:
    """Sends a chat-completions request and returns the assistant's reply
    text. Raises on any SDK/network error — the router is responsible for
    turning that into a safe, generic message for the client."""
    response = _client().chat.completions.create(
        model=config.GEMINI_CHAT_MODEL,
        messages=messages,
        temperature=0.2,  # low temperature: this is a factual-answers assistant, not a creative one
        max_tokens=600,
    )
    return response.choices[0].message.content or ""
