"""Resume data endpoint.

Serves the resume content that the backend loaded from ``RESUME_PATH`` at
startup (see ``main.py`` lifespan). Loading once at startup matches the
documented workflow: to update content, edit ``resume.json`` and restart the
backend — no per-request disk reads.
"""

from fastapi import APIRouter, HTTPException, Request

router = APIRouter()


@router.get("/api/resume")
async def get_resume(request: Request):
    resume = getattr(request.app.state, "resume", None)
    if resume is None:
        # Resume failed to load at startup (missing/invalid file).
        raise HTTPException(status_code=503, detail="Resume data unavailable")
    return resume
