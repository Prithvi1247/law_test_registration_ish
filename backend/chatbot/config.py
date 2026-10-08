"""
Configuration for the SLAT Admissions Assistant chatbot.

Everything here is read from environment variables so no secret or
deployment-specific value is ever hardcoded. Copy the values below into
your existing .env (or however this project's main.py currently loads
config) — see chatbot/.env.example in this same folder.
"""

import os
from dotenv import load_dotenv

load_dotenv('.env')
# --- Gemini / OpenAI-compatible client -------------------------------------
# Gemini is reached through the OpenAI-compatible endpoint:
# https://ai.google.dev/gemini-api/docs/openai
# The API key is never sent to, or readable from, the frontend — it only
# ever lives in this backend process's environment.
GEMINI_API_KEY = os.environ.get("GEMINI_API_KEY", "")
GEMINI_BASE_URL = os.environ.get(
    "GEMINI_BASE_URL", "https://generativelanguage.googleapis.com/v1beta/openai/"
)

# Chat model used to answer applicant questions.
GEMINI_CHAT_MODEL = os.environ.get("GEMINI_CHAT_MODEL", "gemini-3.5-flash-lite")

# Embedding model used for both ingesting the guidelines PDF and embedding
# each incoming question for retrieval. Must be the same model for both,
# or similarity scores are meaningless.
GEMINI_EMBEDDING_MODEL = os.environ.get("GEMINI_EMBEDDING_MODEL", "gemini-embedding-001")

# --- RAG / retrieval ---------------------------------------------------------
# Where the ingested, embedded guidelines live. Produced by
# `python -m chatbot.ingest_guidelines <path-to-pdf>` (see that file).
GUIDELINES_INDEX_PATH = os.environ.get(
    "CHATBOT_INDEX_PATH", os.path.join(os.path.dirname(__file__), "data", "guidelines_index.json")
)

# Characters per chunk / overlap when splitting the PDF. Kept simple
# (character-based, not token-based) to avoid adding a tokenizer
# dependency just for chunking.
CHUNK_SIZE_CHARS = int(os.environ.get("CHATBOT_CHUNK_SIZE_CHARS", "1200"))
CHUNK_OVERLAP_CHARS = int(os.environ.get("CHATBOT_CHUNK_OVERLAP_CHARS", "200"))

# How many chunks to retrieve per question.
RETRIEVAL_TOP_K = int(os.environ.get("CHATBOT_RETRIEVAL_TOP_K", "4"))

# --- Conversation -------------------------------------------------------------
# The frontend sends its own running history with each request (see
# api/chatbot.ts) rather than this backend persisting conversations to a
# database — deliberately, since this module doesn't know this project's
# real DB/session schema. This caps how much of that history is actually
# forwarded to the model, to bound token usage and cost regardless of how
# long the frontend's local history has grown.
MAX_HISTORY_MESSAGES = int(os.environ.get("CHATBOT_MAX_HISTORY_MESSAGES", "16"))

MAX_MESSAGE_LENGTH = int(os.environ.get("CHATBOT_MAX_MESSAGE_LENGTH", "2000"))

# --- Rate limiting -------------------------------------------------------------
RATE_LIMIT_MAX_REQUESTS = int(os.environ.get("CHATBOT_RATE_LIMIT_MAX_REQUESTS", "15"))
RATE_LIMIT_WINDOW_SECONDS = int(os.environ.get("CHATBOT_RATE_LIMIT_WINDOW_SECONDS", "60"))


def require_api_key() -> str:
    """Raises a clear error at call time (not import time) if the key is
    missing, so the rest of the app can still start up without it."""
    if not GEMINI_API_KEY:
        raise RuntimeError(
            "GEMINI_API_KEY is not set. Add it to your environment (see "
            "chatbot/.env.example) before the chatbot endpoints can respond."
        )
    return GEMINI_API_KEY
