from datetime import datetime

from sqlalchemy import (
    BigInteger,
    DateTime,
    ForeignKey,
    Index,
    String,
    UniqueConstraint,
    func,
)
from sqlalchemy.orm import Mapped, mapped_column

from app.database import Base


class ApplicantDocument(Base):
    """
    Application-level document catalogue.

    This table is the ONLY thing the backend ever queries to find an
    applicant's documents. storage_path points directly at the Supabase
    Storage object — nothing ever lists or scans the bucket to find it.
    """

    __tablename__ = "applicant_documents"

    __table_args__ = (
        # One active row per applicant/document_type. Re-uploading a
        # document type updates this row (see the upload endpoint) instead
        # of inserting a second one, so this constraint should never
        # actually be hit in normal operation — it's there as a hard
        # guarantee, not just an app-level convention.
        UniqueConstraint(
            "applicant_id", "document_type",
            name="uq_applicant_documents_applicant_id_document_type",
        ),
        # The unique constraint above gives Postgres an index on
        # (applicant_id, document_type), which already satisfies lookups
        # that filter on both. This second index covers the "all documents
        # for this applicant" query (no document_type filter) so that one
        # also hits an index rather than a sequential scan.
        Index("ix_applicant_documents_applicant_id", "applicant_id"),
    )

    id: Mapped[int] = mapped_column(primary_key=True)

    applicant_id: Mapped[int] = mapped_column(
        ForeignKey("applicants.id", ondelete="CASCADE"),
        nullable=False,
    )

    document_type: Mapped[str] = mapped_column(
        String(50),
        nullable=False,
    )

    storage_path: Mapped[str] = mapped_column(
        String,
        nullable=False,
    )

    original_filename: Mapped[str | None] = mapped_column(
        String(255)
    )

    content_type: Mapped[str | None] = mapped_column(
        String(100)
    )

    file_size: Mapped[int | None] = mapped_column(
        BigInteger
    )

    upload_status: Mapped[str] = mapped_column(
        String(20),
        nullable=False,
        default="UPLOADED",
    )

    verification_status: Mapped[str] = mapped_column(
        String(20),
        nullable=False,
        default="NOT_REVIEWED",
    )

    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        server_default=func.now(),
        nullable=False,
    )

    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        server_default=func.now(),
        onupdate=func.now(),
        nullable=False,
    )