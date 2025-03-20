from uuid import UUID
from typing import Optional, Dict, Any
from datetime import datetime
from pydantic import BaseModel, Field, EmailStr, SecretStr

class TokenData(BaseModel):
    email: Optional[str] = Field(None, title="User email")

class EmailCheckRequest(BaseModel):
    email: str

class EmailCheckResponse(BaseModel):
    exists: bool

class SignupResponse(BaseModel):
    message: str
    
class UserBase(BaseModel):

    email: EmailStr = Field(..., title="User email")

class UserCreate(UserBase):
    first_name: str = Field(..., title="First name", min_length=1, max_length=50)
    last_name: str = Field(..., title="Last name", min_length=1, max_length=50)
    password: SecretStr = Field(..., title="Password", min_length=8)

class UserLogin(UserBase):
    password: SecretStr = Field(..., title="Password")

class UserResponse(UserBase):
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
    access_token: str = Field(..., title="Access token")
    token_type: str = Field(default="bearer", title="Token type")

class ProjectCreate(BaseModel):
    name: str = Field(..., title="Project name", min_length=1, max_length=100)
    description: Optional[str] = Field(None, title="Project description", max_length=500)
    schema_type: str = Field(..., title="Schema type (SQL or NoSQL)")
    schema_definition: Dict[str, Any] = Field(..., title="Schema definition")
