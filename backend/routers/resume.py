"""Resume data endpoint.

Serves the resume content that the backend loaded from ``RESUME_PATH`` at
startup (see ``main.py`` lifespan). Loading once at startup matches the
documented workflow: to update content, edit ``resume.json`` and restart the
backend — no per-request disk reads.

Requires a valid session — the resume contains personal contact info, so it is
gated by the same invitation auth as the assistant.
"""

from fastapi import APIRouter, Depends, HTTPException, Request

from dependencies import get_current_session

router = APIRouter()


@router.get("/api/resume")
async def get_resume(request: Request, session: dict = Depends(get_current_session)):
    resume = getattr(request.app.state, "resume", None)
    if resume is None:
        # Resume failed to load at startup (missing/invalid file).
        raise HTTPException(status_code=503, detail="Resume data unavailable")
    return resume
