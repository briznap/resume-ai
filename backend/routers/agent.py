"""POST /api/chat — the resume assistant endpoint.

Pipeline: validate/sanitize input → check agent availability → proxy to
Anthropic via AgentService. Requires a valid session (Phase 2) and is rate
limited per session (30 / 30 min). All input validation happens *before*
anything is forwarded to Anthropic, per CLAUDE.md → Security Requirements.
"""

import logging

from fastapi import APIRouter, Depends, HTTPException, Request, Response

from dependencies import get_current_session
from middleware.rate_limiter import limiter, session_key_func
from models.agent import ChatRequest, ChatResponse, ChatTurn
from services.logging_service import log_event

logger = logging.getLogger("resume-ai")

router = APIRouter()

MAX_MESSAGE_LENGTH = 1000
MAX_HISTORY_TURNS = 20

# Case-insensitive substring checks. Stored lowercased; messages are lowercased
# before comparison so casing variants are caught too.
INJECTION_PATTERNS = (
    "[inst]",
    "<|system|>",
    "###system",
    "ignore previous instructions",
)


def _sanitize(text: str) -> str:
    """Strip null bytes and surrounding whitespace."""
    return text.replace("\x00", "").strip()


def _validate_user_text(text: str) -> str:
    """Sanitize and validate a user-authored message. Raises HTTP 400 on reject."""
    cleaned = _sanitize(text)
    if not cleaned:
        raise HTTPException(status_code=400, detail="Message cannot be empty.")
    if len(cleaned) > MAX_MESSAGE_LENGTH:
        raise HTTPException(
            status_code=400,
            detail=f"Message exceeds the {MAX_MESSAGE_LENGTH} character limit.",
        )
    lowered = cleaned.lower()
    if any(pattern in lowered for pattern in INJECTION_PATTERNS):
        raise HTTPException(status_code=400, detail="Message contains disallowed content.")
    return cleaned


def _build_anthropic_messages(message: str, history: list[ChatTurn]) -> list[dict]:
    """Validate history and assemble the messages array for Anthropic.

    History is capped to the most recent turns. User turns get the same
    injection validation as the new message; assistant turns are only
    null-stripped (they are model output, not user input).
    """
    recent = history[-MAX_HISTORY_TURNS:]
    messages: list[dict] = []
    for turn in recent:
        if turn.role == "user":
            content = _validate_user_text(turn.content)
        else:
            content = _sanitize(turn.content)
        if content:
            messages.append({"role": turn.role, "content": content})
    messages.append({"role": "user", "content": message})
    return messages


@router.post("/api/chat", response_model=ChatResponse)
@limiter.limit("30/30 minutes", key_func=session_key_func)
async def chat(
    request: Request,
    response: Response,
    body: ChatRequest,
    session: dict = Depends(get_current_session),
) -> ChatResponse:
    # `response` is injected by FastAPI; slowapi writes the X-RateLimit-* headers
    # into it after a successful return (headers_enabled=True). Without this
    # parameter, slowapi raises on the success path.
    # Validate input first so malformed requests are rejected even if the agent
    # is unconfigured — and crucially before anything reaches Anthropic.
    message = _validate_user_text(body.message)
    anthropic_messages = _build_anthropic_messages(message, body.history)

    service = getattr(request.app.state, "agent_service", None)
    if service is None:
        raise HTTPException(status_code=503, detail="The assistant is not available.")

    # Audit trail of what's being asked: the validated message text already
    # being forwarded to Anthropic, tied to the authenticated user.
    log_event("agent_query", email=session["email"], message=message)

    try:
        reply = await service.generate_reply(anthropic_messages)
    except Exception:
        # Never leak provider/internal error details (or the API key) to clients.
        logger.exception("Anthropic request failed")
        raise HTTPException(status_code=502, detail="The assistant is temporarily unavailable.")

    return ChatResponse(reply=reply)
