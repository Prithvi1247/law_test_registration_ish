"""
Chatbot HTTP endpoint.

=== INTEGRATION NOTE ===
This module wasn't able to inspect the project's actual main.py, auth
dependency, or database models — none were in scope for this task — so
the two spots marked TODO below are placeholders. Everything else (the
model call, retrieval, guardrails, rate limiting) works standalone.

To wire this in:
    # main.py
    from chatbot.router import router as chatbot_router
    app.include_router(chatbot_router, prefix="/api/chatbot", tags=["chatbot"])
========================
"""

import logging

from fastapi import APIRouter, HTTPException, Request, status

from . import config
from .gemini_client import chat_completion
from .prompts import build_messages
from .rate_limiter import is_allowed
from .retriever import search
from .schemas import ChatRequest, ChatResponse

logger = logging.getLogger(__name__)

router = APIRouter()


# TODO: replace with this project's real "optional current user" dependency.
# It should return the authenticated user's id if a valid session/token is
# present, and None for an anonymous visitor (the chatbot must stay usable
# on pre-login pages like /register per the requirements) — it should
# never raise just because no credentials were sent.
async def get_current_user_id_optional(request: Request) -> int | None:
    return None


def _rate_limit_key(request: Request, user_id: int | None) -> str:
    if user_id is not None:
        return f"user:{user_id}"
    # Anonymous callers are limited per client IP instead. Behind a proxy,
    # make sure this project's existing ASGI stack is configured to set
    # request.client.host to the real client IP (e.g. via a
    # ProxyHeadersMiddleware), or every visitor behind that proxy will
    # share one bucket.
    client_host = request.client.host if request.client else "unknown"
    return f"anon:{client_host}"


@router.post("/message", response_model=ChatResponse)
async def send_message(payload: ChatRequest, request: Request) -> ChatResponse:
    user_id = await get_current_user_id_optional(request)

    if not payload.message.strip():
        raise HTTPException(status.HTTP_400_BAD_REQUEST, "Message cannot be empty.")
    if len(payload.message) > config.MAX_MESSAGE_LENGTH:
        raise HTTPException(
            status.HTTP_400_BAD_REQUEST,
            f"Message is too long (max {config.MAX_MESSAGE_LENGTH} characters).",
        )

    if not is_allowed(_rate_limit_key(request, user_id)):
        raise HTTPException(
            status.HTTP_429_TOO_MANY_REQUESTS,
            "You're sending messages too quickly. Please wait a moment and try again.",
        )

    # Trim history server-side regardless of how much the client sent, to
    # bound token usage/cost per request.
    trimmed_history = [m.model_dump() for m in payload.history[-config.MAX_HISTORY_MESSAGES :]]

    try:
        retrieved_chunks = search(payload.message)
    except Exception:
        # Retrieval failing (e.g. embedding API hiccup) shouldn't take the
        # whole endpoint down — fall back to answering with no reference
        # material, which the system prompt already handles by deferring
        # to the helpdesk rather than guessing.
        logger.exception("Retrieval failed; continuing with no reference material.")
        retrieved_chunks = []

    messages = build_messages(trimmed_history, payload.message, retrieved_chunks)

    try:
        reply = chat_completion(messages)
    except Exception:
        # Never leak provider error details (could include request
        # internals) to the client — log them server-side instead.
        logger.exception("Gemini chat completion failed.")
        raise HTTPException(
            status.HTTP_502_BAD_GATEWAY,
            "The admissions assistant is temporarily unavailable. Please try again shortly, "
            "or contact the admissions helpdesk.",
        )

    return ChatResponse(reply=reply)