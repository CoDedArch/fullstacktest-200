from datetime import datetime
from typing import List, Optional, Dict, Any
from pydantic import BaseModel, Field

class SchemaField(BaseModel):
    name: str = Field(..., title="Field name")
    type: str = Field(..., title="Field type")
    required: bool = Field(default=True, title="Is field required")
    description: Optional[str] = Field(None, title="Field description")

class SchemaTable(BaseModel):
    name: str = Field(..., title="Table name")
    fields: List[SchemaField] = Field(..., title="List of fields")
    description: Optional[str] = Field(None, title="Table description")

class DatabaseSchema(BaseModel):
    tables: List[SchemaTable]
    follow_up_question: Optional[str] = None 
    project_title: Optional[str] = None
    project_url: Optional[str] = None

    class Config:
        from_attributes = True

class GenerateSchemaRequest(BaseModel):
    project_description: str
    api_key: str
    conversation_id: Optional[str] = None  
    user_feedback: Optional[str] = None

class GeneratedSchemaResponse(BaseModel):
    project_title: str
    tables: List[Dict] 
    follow_up_question: Optional[str] = None 
    conversation_id: Optional[str] = None 


class SchemaResponse(BaseModel):
    follow_up_question: str
    project_title: str

class ProjectSchemaResponse(BaseModel):
    id: str
    name: str
    description: Optional[str]
    schema_type: str
    fields: List[Dict[str, Any]]
    created_at: str

class ProjectResponse(BaseModel):
    id: str
    name: str
    description: Optional[str]
    created_at: datetime
    url: str
    schemas: Optional[List[ProjectSchemaResponse]] = []

class SchemaUpdate(BaseModel):
    id: str
    name: str
    description: str
    schema_type: str
    fields: List[dict]

class ProjectUpdate(BaseModel):
    schemas: List[SchemaUpdate]