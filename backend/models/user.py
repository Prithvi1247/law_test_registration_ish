from datetime import datetime

from sqlalchemy import Boolean, DateTime, String, Text, func
from sqlalchemy.orm import Mapped, mapped_column

from app.database import Base
from typing import TYPE_CHECKING
from sqlalchemy.orm import relationship

if TYPE_CHECKING:
    from models.applicant import Applicant

class User(Base):
    __tablename__ = "users"

    id: Mapped[int] = mapped_column(primary_key=True)

    applicant: Mapped["Applicant"] = relationship(
        back_populates="user"
    )

    email: Mapped[str] = mapped_column(
        String(255),
        unique=True,
        nullable=False
    )

    mobile_number: Mapped[str | None] = mapped_column(
        String(20),
        unique=True,
        nullable=True
    )
    
    password_hash: Mapped[str | None] = mapped_column(Text)

    is_verified: Mapped[bool] = mapped_column(
        Boolean,
        default=False,
        nullable=False
    )

    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        server_default=func.now(),
        nullable=False
    )

    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        server_default=func.now(),
        onupdate=func.now(),
        nullable=False
    )