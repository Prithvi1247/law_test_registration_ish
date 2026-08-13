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


class ReviewTestDate(BaseModel):
    id: int
    test_name: str
    test_date: date


class ReviewCityPreference(BaseModel):
    preference_rank: int
    city: str
    state: str | None


class ReviewDocument(BaseModel):
    document_type: str
    original_filename: str | None
    file_url: str


class ReviewResponse(BaseModel):
    personal: ReviewPersonal
    education: ReviewEducation | None
    test_date: ReviewTestDate | None
    city_preferences: list[ReviewCityPreference]
    documents: list[ReviewDocument]