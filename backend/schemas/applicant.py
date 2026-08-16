from pydantic import BaseModel
from datetime import date, time
from typing import Literal

CATEGORY_OPTIONS = ("General", "OBC", "SC", "ST", "EWS")
Category = Literal["General", "OBC", "SC", "ST", "EWS"]


class ApplicantCreate(BaseModel):
    user_id: int
    full_name: str
    date_of_birth: date
    country_code: str
    mobile_number: str
    category: Category
    is_nri: bool
    nationality: str


# NEW — used by PATCH /applicants/{applicant_id}. Deliberately does NOT
# include user_id: the owning user must never change via an edit.
class ApplicantUpdate(BaseModel):
    full_name: str
    date_of_birth: date
    country_code: str
    mobile_number: str
    category: Category
    is_nri: bool
    nationality: str


class ApplicantResponse(BaseModel):
    id: int
    user_id: int
    registration_id: str | None
    full_name: str
    date_of_birth: date
    country_code: str
    mobile_number: str
    category: str
    is_nri: bool
    nationality: str
    status: str