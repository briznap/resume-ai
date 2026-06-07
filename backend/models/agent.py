"""Pydantic models for the chat endpoint."""

from typing import Literal

from pydantic import BaseModel, Field

Role = Literal["user", "assistant"]


class ChatTurn(BaseModel):
    """A single prior turn in the conversation, sent back for context."""

    role: Role
    content: str


class ChatRequest(BaseModel):
    """A chat request: the new user message plus prior conversation turns."""

    message: str
    history: list[ChatTurn] = Field(default_factory=list)


class ChatResponse(BaseModel):
    reply: str
