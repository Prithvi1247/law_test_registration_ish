from pydantic import BaseModel, EmailStr


class UserResponse(BaseModel):
    id: int
    email: str
    is_verified: bool


class UserCreate(BaseModel):
    email: EmailStr