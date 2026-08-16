

import os
import random
from datetime import datetime, timedelta, timezone

OTP_LENGTH = 6
OTP_TTL_SECONDS = 5 * 60  # 5 minutes
RESEND_COOLDOWN_SECONDS = 30
MAX_VERIFY_ATTEMPTS = 5

# Dev-only escape hatch so OTP can be tested without a real SMS/email
# provider. Never true unless explicitly set — isolated from normal
# production response shape (SendOtpResponse.dev_otp is None otherwise).
DEV_EXPOSE_OTP = os.getenv("DEV_EXPOSE_OTP", "false").lower() == "true"


def generate_otp() -> str:
    return "".join(str(random.randint(0, 9)) for _ in range(OTP_LENGTH))


def otp_expiry() -> datetime:
    return datetime.now(timezone.utc) + timedelta(seconds=OTP_TTL_SECONDS)


def is_expired(expires_at: datetime) -> bool:
    now = datetime.now(timezone.utc)
    # SQLAlchemy may return naive datetimes depending on driver config.
    if expires_at.tzinfo is None:
        expires_at = expires_at.replace(tzinfo=timezone.utc)
    return now > expires_at


def send_otp_dev(otp: str, user_id: int) -> None:
    # Placeholder for a real SMS/email provider. For now: log server-side
    # only — never returned to the client unless DEV_EXPOSE_OTP is set.
    print(f"[DEV OTP] user_id={user_id} otp={otp} (would be sent via SMS/email in production)")