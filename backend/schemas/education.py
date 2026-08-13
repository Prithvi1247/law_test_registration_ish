from pydantic import BaseModel


class EducationCreate(BaseModel):
    applicant_id: int
    educational_background: str


class EducationResponse(BaseModel):
    id: int
    applicant_id: int
    educational_background: str