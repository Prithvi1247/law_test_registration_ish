from datetime import date

from pydantic import BaseModel


class TestDateResponse(BaseModel):
    id: int
    test_name: str
    test_date: date
    is_active: bool


class TestCentreResponse(BaseModel):
    id: int
    city: str
    state: str | None
    is_active: bool