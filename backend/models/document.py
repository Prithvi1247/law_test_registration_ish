from datetime import datetime

from sqlalchemy import DateTime, ForeignKey, String, BigInteger, func
from sqlalchemy.orm import Mapped, mapped_column

from app.database import Base


class ApplicantDocument(Base):
    __tablename__ = "applicant_documents"

    id: Mapped[int] = mapped_column(primary_key=True)

    applicant_id: Mapped[int] = mapped_column(
        ForeignKey("applicants.id", ondelete="CASCADE"),
        nullable=False
    )

    document_type: Mapped[str] = mapped_column(
        String(100),
        nullable=False
    )

    file_url: Mapped[str] = mapped_column(
        String,
        nullable=False
    )

    original_filename: Mapped[str | None] = mapped_column(
        String(255)
    )

    mime_type: Mapped[str | None] = mapped_column(
        String(100)
    )

    file_size_bytes: Mapped[int | None] = mapped_column(
        BigInteger
    )

    uploaded_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        server_default=func.now(),
        nullable=False
    )