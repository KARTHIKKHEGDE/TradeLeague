from pydantic import BaseModel, EmailStr, Field, field_validator
import re

PASSWORD_REGEX = re.compile(
    r"^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[\W_]).{8,}$"
)

class LoginRequest(BaseModel):
    email: EmailStr
    password: str

class UserBase(BaseModel):
    email: EmailStr
    username: str

class UserCreate(UserBase):
    password: str = Field(..., min_length=8)

    @field_validator("password")
    def validate_password(cls, v):
        if not PASSWORD_REGEX.match(v):
            raise ValueError(
                "Password must contain: min 8 characters, 1 uppercase, 1 lowercase, "
                "1 number & 1 special character"
            )
        return v

class UserResponse(UserBase):
    id: int
    is_active: bool
    is_admin: bool

    class Config:
        from_attributes = True
