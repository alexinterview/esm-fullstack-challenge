from datetime import datetime
from typing import Optional
from pydantic import BaseModel, EmailStr, Field, field_validator
import re


class Token(BaseModel):
    access_token: str
    token_type: str


class TokenData(BaseModel):
    username: Optional[str] = None


class User(BaseModel):
    id: int
    username: str
    email: str
    full_name: str
    disabled: bool = False
    created_at: Optional[datetime] = None


class UserCreate(BaseModel):
    username: str = Field(..., min_length=3, max_length=50)
    email: EmailStr
    password: str = Field(..., min_length=8)
    full_name: str = Field(..., min_length=1, max_length=100)

    @field_validator('username')
    @classmethod
    def username_alphanumeric(cls, v: str) -> str:
        if not re.match(r'^[a-zA-Z0-9_]+$', v):
            raise ValueError('Username must contain only alphanumeric characters and underscores')
        return v

    @field_validator('password')
    @classmethod
    def password_strength(cls, v: str) -> str:
        if len(v) < 8:
            raise ValueError('Password must be at least 8 characters long')
        return v


class UserInDB(User):
    hashed_password: str


class LoginRequest(BaseModel):
    username: str
    password: str


class UserResponse(BaseModel):
    """Response model for user registration."""
    id: int
    username: str
    email: str
    full_name: str
    disabled: bool
    created_at: Optional[str] = None


class LogoutResponse(BaseModel):
    """Response model for logout."""
    message: str
