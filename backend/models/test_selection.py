from sqlalchemy import ForeignKey
from sqlalchemy.orm import Mapped, mapped_column

from app.database import Base


class ApplicantTestSelection(Base):
    __tablename__ = "applicant_test_selections"

    id: Mapped[int] = mapped_column(primary_key=True)

    applicant_id: Mapped[int] = mapped_column(
        ForeignKey("applicants.id", ondelete="CASCADE"),
        nullable=False
    )

    test_date_id: Mapped[int] = mapped_column(
        ForeignKey("test_dates.id"),
        nullable=False
    )