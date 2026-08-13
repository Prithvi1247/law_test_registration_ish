from sqlalchemy import ForeignKey, SmallInteger
from sqlalchemy.orm import Mapped, mapped_column

from app.database import Base


class ApplicantCityPreference(Base):
    __tablename__ = "applicant_city_preferences"

    id: Mapped[int] = mapped_column(primary_key=True)

    applicant_id: Mapped[int] = mapped_column(
        ForeignKey("applicants.id", ondelete="CASCADE"),
        nullable=False
    )

    test_date_id: Mapped[int] = mapped_column(
        ForeignKey("test_dates.id"),
        nullable=False
    )

    test_centre_id: Mapped[int] = mapped_column(
        ForeignKey("test_centres.id"),
        nullable=False
    )

    preference_rank: Mapped[int] = mapped_column(
        SmallInteger,
        nullable=False
    )