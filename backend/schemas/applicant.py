from pydantic import BaseModel
from datetime import date
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
    # NEW — independent special-category flags. Default False so existing
    # frontend payloads that don't send these yet keep working.
    is_pwd: bool = False
    is_km: bool = False
    is_nagpur_domicile: bool = False
    is_defence: bool = False


# Deliberately does NOT include user_id: the owning user must never change
# via an edit.
class ApplicantUpdate(BaseModel):
    full_name: str
    date_of_birth: date
    country_code: str
    mobile_number: str
    category: Category
    is_nri: bool
    nationality: str
    is_pwd: bool = False
    is_km: bool = False
    is_nagpur_domicile: bool = False
    is_defence: bool = False


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
    is_pwd: bool
    is_km: bool
    is_nagpur_domicile: bool
    is_defence: bool
    status: str