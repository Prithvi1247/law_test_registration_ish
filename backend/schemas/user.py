from pydantic import BaseModel, EmailStr


class UserResponse(BaseModel):
    id: int
    email: str
    is_verified: bool


class UserCreate(BaseModel):
    email: EmailStr
    mobile_number: str
    password: str

class UserLogin(BaseModel):
    identifier: str
    password: str