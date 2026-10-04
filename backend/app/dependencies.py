import os
from collections.abc import Generator

from fastapi import Header, HTTPException
from sqlalchemy.orm import Session

from app.database import SessionLocal
from models.applicant import Applicant


def get_db() -> Generator:
    db = SessionLocal()

    try:
        yield db
    finally:
        db.close()


# ---------------------------------------------------------------------------
# ⚠️  SECURITY GAP THIS DOES NOT FULLY CLOSE  ⚠️
#
# This codebase has no session/JWT auth anywhere yet — /login returns the
# user row and nothing else; every existing endpoint just trusts whatever
# applicant_id is in the URL. That means, as of today, Applicant A really
# can hit /applicants/{Applicant B's id}/documents and it will work.
#
# The two dependencies below exist so every document route is *wired
# through* an ownership check, so that the day real session auth lands,
# fixing get_current_user_id's body is the ONLY change needed — no route
# has to be touched. Until then, X-User-Id is exactly as trustworthy as a
# self-reported header, i.e. not at all. Do not treat this as real
# authorization; treat it as the seam where real authorization plugs in.
# ---------------------------------------------------------------------------
def get_current_user_id(x_user_id: int = Header(..., alias="X-User-Id")) -> int:
    return x_user_id


def get_owned_applicant(applicant_id: int, db: Session, current_user_id: int) -> Applicant:
    applicant = db.query(Applicant).filter(Applicant.id == applicant_id).first()

    if not applicant:
        raise HTTPException(status_code=404, detail="Applicant not found")

    if applicant.user_id != current_user_id:
        raise HTTPException(
            status_code=403,
            detail="You do not have access to this applicant's data",
        )

    return applicant


# Same caveat as above: there is no admin auth mechanism anywhere in this
# codebase yet. This stub keeps the admin document route from being
# completely open, but it is a placeholder, not a real auth system —
# replace it with the project's actual admin authentication as soon as one
# exists, rather than building this out further.
def require_admin(x_admin_key: str = Header(..., alias="X-Admin-Key")) -> None:
    expected = os.getenv("ADMIN_API_KEY")
    if not expected or x_admin_key != expected:
        raise HTTPException(status_code=403, detail="Admin access required")