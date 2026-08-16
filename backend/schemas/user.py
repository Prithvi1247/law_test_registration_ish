import re

from pydantic import BaseModel, EmailStr, field_validator

INDIAN_MOBILE_RE = re.compile(r"^[6-9]\d{9}$")


class UserResponse(BaseModel):
    id: int
    email: str
    # Added so the frontend can prefill/lock the mobile field on Personal
    # Details from the authoritative user record — no DB migration, this
    # column already exists, it just wasn't exposed in the response before.
    mobile_number: str | None
    is_verified: bool


class UserCreate(BaseModel):
    email: EmailStr
    mobile_number: str
    password: str

    @field_validator("mobile_number")
    @classmethod
    def validate_indian_mobile(cls, v: str) -> str:
        v = v.strip()
        if not INDIAN_MOBILE_RE.match(v):
            raise ValueError("Mobile number must be exactly 10 digits and start with 6-9.")
        return v


class UserLogin(BaseModel):
    identifier: str
    password: str