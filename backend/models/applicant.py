from datetime import date, datetime

from sqlalchemy import Boolean, Date, DateTime, String, func, ForeignKey
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.database import Base

from typing import TYPE_CHECKING

if TYPE_CHECKING:
    from models.user import User


class Applicant(Base):
    __tablename__ = "applicants"

    id: Mapped[int] = mapped_column(primary_key=True)

    user: Mapped["User"] = relationship(
        back_populates="applicant"
    )
    user_id: Mapped[int] = mapped_column(
        ForeignKey("users.id"),
        nullable=False,
        unique=True
    )

    registration_id: Mapped[str | None] = mapped_column(
        String(50),
        unique=True
    )

    full_name: Mapped[str] = mapped_column(
        String(150),
        nullable=False
    )

    date_of_birth: Mapped[date] = mapped_column(
        Date,
        nullable=False
    )

    country_code: Mapped[str] = mapped_column(
        String(10),
        nullable=False
    )

    mobile_number: Mapped[str] = mapped_column(
        String(20),
        nullable=False
    )

    category: Mapped[str] = mapped_column(
        String(100),
        nullable=False
    )

    is_nri: Mapped[bool] = mapped_column(
        Boolean,
        nullable=False
    )

    nationality: Mapped[str] = mapped_column(
        String(100),
        nullable=False
    )

    # --- NEW: independent special-category flags -----------------------
    # These stack with `category` and with each other (an applicant can be
    # SC *and* PWD *and* NRI at the same time). They exist specifically so
    # app/document_rules.py has something to read — before this, there was
    # no way to represent "this applicant is PWD" at all.
    is_pwd: Mapped[bool] = mapped_column(
        Boolean,
        nullable=False,
        default=False,
    )

    is_km: Mapped[bool] = mapped_column(
        Boolean,
        nullable=False,
        default=False,
    )

    is_nagpur_domicile: Mapped[bool] = mapped_column(
        Boolean,
        nullable=False,
        default=False,
    )

    is_defence: Mapped[bool] = mapped_column(
        Boolean,
        nullable=False,
        default=False,
    )
    # ---------------------------------------------------------------------

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

    status: Mapped[str] = mapped_column(
        String(30),
        nullable=False,
        default="draft"
    )