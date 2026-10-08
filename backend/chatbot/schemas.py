from pydantic import BaseModel, Field


class ChatMessage(BaseModel):
    # Only "user" and "assistant" are accepted from the client — the
    # system prompt is always added server-side (see prompts.py) and can
    # never be supplied or overridden by the frontend.
    role: str = Field(pattern="^(user|assistant)$")
    content: str


class ChatRequest(BaseModel):
    message: str
    # The frontend keeps the running conversation client-side (see
    # api/chatbot.ts) and resends it each turn, rather than this backend
    # persisting chat history to a database it doesn't have a schema for.
    history: list[ChatMessage] = []


class ChatResponse(BaseModel):
    reply: str
