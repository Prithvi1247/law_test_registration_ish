from datetime import date

from sqlalchemy import Boolean, Date, String
from sqlalchemy.orm import Mapped, mapped_column

from app.database import Base


class TestDate(Base):
    __tablename__ = "test_dates"

    id: Mapped[int] = mapped_column(primary_key=True)

    test_name: Mapped[str] = mapped_column(
        String(100),
        nullable=False
    )

    test_date: Mapped[date] = mapped_column(
        Date,
        nullable=False
    )

    is_active: Mapped[bool] = mapped_column(
        Boolean,
        nullable=False,
        default=True
    )