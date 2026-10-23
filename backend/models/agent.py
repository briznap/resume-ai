"""Pydantic models for the chat endpoint."""

from typing import Literal

from pydantic import BaseModel, Field

Role = Literal["user", "assistant"]


class ChatTurn(BaseModel):
    """A single prior turn in the conversation, sent back for context."""

    role: Role
    # Caps what a client can stuff into history (assistant turns get no other
    # length check, and history is forwarded to Anthropic) — bounds API cost per
    # request. Real replies are max_tokens=1024 (~4-5k chars), so 8000 is
    # headroom; user turns are separately held to 1000 by the chat router.
    content: str = Field(max_length=8000)


class ChatRequest(BaseModel):
    """A chat request: the new user message plus prior conversation turns."""

    message: str
    history: list[ChatTurn] = Field(default_factory=list)


class ChatResponse(BaseModel):
    reply: str
