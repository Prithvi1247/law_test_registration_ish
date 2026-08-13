from pydantic import BaseModel


class CityPreference(BaseModel):
    test_centre_id: int
    preference_rank: int


class TestSelectionCreate(BaseModel):
    test_date_id: int
    city_preferences: list[CityPreference]