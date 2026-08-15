from datetime import date
from pydantic import BaseModel


class ReviewPersonal(BaseModel):
    id: int
    full_name: str
    date_of_birth: date
    country_code: str
    mobile_number: str
    category: str
    is_nri: bool
    nationality: str


class ReviewEducation(BaseModel):
    educational_background: str


class ReviewCityPreference(BaseModel):
    preference_rank: int
    city: str
    state: str | None


# NEW — one selected test date, with only the preferences that belong to it.
class ReviewTestDate(BaseModel):
    id: int
    test_name: str
    test_date: date
    city_preferences: list[ReviewCityPreference]


class ReviewDocument(BaseModel):
    document_type: str
    original_filename: str | None
    file_url: str


class ReviewResponse(BaseModel):
    personal: ReviewPersonal
    education: ReviewEducation | None
    # CHANGED: was `test_date: ReviewTestDate | None` +
    # top-level `city_preferences: list[ReviewCityPreference]`.
    # Now a list — one entry per selected test date, each carrying only
    # its own preferences, since an applicant can select multiple dates.
    test_dates: list[ReviewTestDate]
    documents: list[ReviewDocument]