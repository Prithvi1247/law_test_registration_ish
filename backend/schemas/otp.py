# schemas/otp.py
from pydantic import BaseModel


class SendOtpRequest(BaseModel):
    user_id: int


class SendOtpResponse(BaseModel):
    message: str
    expires_in_seconds: int
    # Dev-only — see app/otp.py DEV_EXPOSE_OTP. None in production mode.
    dev_otp: str | None = None


class VerifyOtpRequest(BaseModel):
    user_id: int
    otp: str