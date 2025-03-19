from pydantic import BaseModel, Field, EmailStr, SecretStr
from typing import Optional, Dict, Any
from datetime import datetime
from uuid import UUID


# User-related schemas
class UserBase(BaseModel):
    """
    Base schema for user operations.
    """
    email: EmailStr = Field(..., title="User email")


class UserCreate(UserBase):
    """
    Schema for creating a new user.
    """
    first_name: str = Field(..., title="First name", min_length=1, max_length=50)
    last_name: str = Field(..., title="Last name", min_length=1, max_length=50)
    password: SecretStr = Field(..., title="Password", min_length=8)


class UserLogin(UserBase):
    """
    Schema for user login.
    """
    password: SecretStr = Field(..., title="Password")


class UserResponse(UserBase):
    """
    Schema for returning user information.
    """
    id: UUID
    first_name: str = Field(..., title="First name")
    last_name: str = Field(..., title="Last name")
    email: str = Field(..., title="User email")
    is_active: bool = Field(..., title="Is user active")
    verified: bool = Field(..., title="Is user verified")
    created_at: datetime = Field(..., title="User creation timestamp")

    class Config:
        from_attributes = True


class Token(BaseModel):
    """
    Schema for JWT token response.
    """
    access_token: str = Field(..., title="Access token")
    token_type: str = Field(default="bearer", title="Token type")


class TokenData(BaseModel):
    """
    Schema for data encoded in the JWT token.
    """
    email: Optional[str] = Field(None, title="User email")


# Request model for checking email
class EmailCheckRequest(BaseModel):
    email: str


# Response model for checking email
class EmailCheckResponse(BaseModel):
    exists: bool


class SignupResponse(BaseModel):
    message: str


# Project-related schemas
class ProjectCreate(BaseModel):
    """
    Schema for creating a new project.
    """
    name: str = Field(..., title="Project name", min_length=1, max_length=100)
    description: Optional[str] = Field(None, title="Project description", max_length=500)
    schema_type: str = Field(..., title="Schema type (SQL or NoSQL)")
    schema_definition: Dict[str, Any] = Field(..., title="Schema definition")


class ProjectResponse(BaseModel):
    """
    Schema for returning project information.
    """
    id: UUID
    name: str = Field(..., title="Project name")
    description: Optional[str] = Field(None, title="Project description")
    schema_type: str = Field(..., title="Schema type (SQL or NoSQL)")
    schema_definition: Dict[str, Any] = Field(..., title="Schema definition")
    created_at: datetime = Field(..., title="Project creation timestamp")

    class Config:
        from_attributes = True