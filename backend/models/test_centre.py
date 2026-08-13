from sqlalchemy import Boolean, String
from sqlalchemy.orm import Mapped, mapped_column

from app.database import Base


class TestCentre(Base):
    __tablename__ = "test_centres"

    id: Mapped[int] = mapped_column(primary_key=True)

    city: Mapped[str] = mapped_column(
        String(100),
        nullable=False
    )

    state: Mapped[str | None] = mapped_column(
        String(100)
    )

    is_active: Mapped[bool] = mapped_column(
        Boolean,
        nullable=False,
        default=True
    )