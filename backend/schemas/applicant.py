
from pydantic import BaseModel 
from datetime import date, time

class ApplicantCreate(BaseModel):
    user_id: int
    full_name: str
    date_of_birth: date
    country_code: str
    mobile_number: str
    category: str
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
    status : str