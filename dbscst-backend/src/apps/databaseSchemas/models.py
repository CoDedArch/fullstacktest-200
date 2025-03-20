from uuid import UUID as PyUUID
from typing import List, Optional, Dict, Any
from datetime import datetime
from sqlalchemy import ForeignKey, String, text, Text, Boolean, DateTime, JSON
from sqlalchemy.sql import func
from sqlalchemy.orm import Mapped, mapped_column, relationship
from sqlalchemy.dialects.postgresql import UUID
from core.database import Base


class User(Base):
    """
    Represents a user in the system.

    Attributes:
        id (PyUUID): The unique identifier for the user (UUID).
        first_name (str): The first name of the user.
        last_name (str): The last name of the user.
        email (str): The email address of the user (unique and indexed).
        password (str): The hashed password of the user.
        is_active (bool): Indicates whether the user account is active (default: True).
        verified (bool): Indicates whether the user's email has been verified (default: False).
        created_at (datetime): The timestamp when the user was created (default: current time).
        last_login (Optional[datetime]): The timestamp of the user's last login (nullable).
        has_taken_tour (bool): Indicates whether the user has taken the onboarding tour (default: False).

    Relationships:
        projects (List[Project]): A list of projects associated with the user. 
                                  Uses a one-to-many relationship with the `Project` model.
                                  Cascades delete operations to orphaned projects.

    Methods:
        __repr__(): Returns a string representation of the user object.
    """

    __tablename__ = "users"

    id: Mapped[PyUUID] = mapped_column(
        UUID(as_uuid=True), primary_key=True, server_default=text("uuid_generate_v4()")
    )
    first_name: Mapped[str] = mapped_column(String, nullable=False)
    last_name: Mapped[str] = mapped_column(String, nullable=False)
    email: Mapped[str] = mapped_column(String, unique=True, index=True, nullable=False)
    password: Mapped[str] = mapped_column(String, nullable=False)
    is_active: Mapped[bool] = mapped_column(Boolean, default=True)
    verified: Mapped[bool] = mapped_column(Boolean, default=False)
    created_at: Mapped[datetime] = mapped_column(DateTime, server_default=func.now())
    last_login: Mapped[Optional[datetime]] = mapped_column(DateTime, nullable=True)
    has_taken_tour: Mapped[bool] = mapped_column(Boolean, default=False)
    projects: Mapped[List["Project"]] = relationship(
        "Project", back_populates="user", cascade="all, delete-orphan"
    )

    def __repr__(self):
        return f"<User(id={self.id}, email={self.email})>"


class UnverifiedUser(Base):
    """
    Represents an unverified user in the database.

    Attributes:
        id (PyUUID): The unique identifier for the unverified user (UUID).
        first_name (str): The first name of the user.
        last_name (str): The last name of the user.
        email (str): The email address of the user (unique and indexed).
        password (str): The hashed password of the user.
        verification_token (str): The verification token sent to the user's email.
        created_at (datetime): The timestamp when the user was created.

    Methods:
        __repr__: Returns a string representation of the UnverifiedUser object.
    """
     
    __tablename__ = "unverified_users"

    id: Mapped[PyUUID] = mapped_column(
        UUID(as_uuid=True), primary_key=True, server_default=text("uuid_generate_v4()")
    )
    first_name: Mapped[str] = mapped_column(String, nullable=False)
    last_name: Mapped[str] = mapped_column(String, nullable=False)
    email: Mapped[str] = mapped_column(String, unique=True, index=True, nullable=False)
    password: Mapped[str] = mapped_column(String, nullable=False)
    verification_token: Mapped[str] = mapped_column(String, nullable=False)
    created_at: Mapped[datetime] = mapped_column(DateTime, server_default=func.now())

    def __repr__(self):
        return f"<UnverifiedUser(id={self.id}, email={self.email})>"


class Project(Base):
    """
    Represents a project in the database.

    Attributes:
        id (PyUUID): The unique identifier for the project (UUID).
        user_id (PyUUID): The ID of the user who owns the project (foreign key to `users.id`).
        name (str): The name of the project.
        description (Optional[str]): A description of the project (optional).
        created_at (datetime): The timestamp when the project was created.
        updated_at (datetime): The timestamp when the project was last updated.
        user (User): The user who owns the project (relationship to `User` model).
        schemas (List[Schema]): The list of schemas associated with the project (relationship to `Schema` model).

    Relationships:
        - `user`: Many-to-one relationship with the `User` model.
        - `schemas`: One-to-many relationship with the `Schema` model, with cascade delete.

    Methods:
        __repr__(): Returns a string representation of the project.
    """

    __tablename__ = "projects"

    id: Mapped[PyUUID] = mapped_column(
        UUID(as_uuid=True), primary_key=True, server_default=text("uuid_generate_v4()")
    )
    user_id: Mapped[PyUUID] = mapped_column(ForeignKey("users.id"), nullable=False)
    name: Mapped[str] = mapped_column(String, nullable=False)
    description: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime, server_default=func.now())
    updated_at: Mapped[datetime] = mapped_column(DateTime, server_default=func.now(), onupdate=func.now())
    user: Mapped["User"] = relationship("User", back_populates="projects")
    schemas: Mapped[List["Schema"]] = relationship(
        "Schema", back_populates="project", cascade="all, delete-orphan"
    )

    def __repr__(self):
        return f"<Project(id={self.id}, name={self.name})>"


class Schema(Base):
    """
    Represents a database schema in the system.

    Attributes:
        id (PyUUID): The unique identifier for the schema (primary key).
        project_id (PyUUID): The ID of the project this schema belongs to (foreign key).
        name (str): The name of the table (e.g., "users").
        description (Optional[str]): A description of the table (optional).
        schema_type (str): The type of schema (e.g., "SQL" or "NoSQL").
        fields (List[Dict[str, Any]]): The fields of the table, stored as a JSON object.
        created_at (datetime): The timestamp when the schema was created.

    Relationships:
        project (Project): The project this schema belongs to (many-to-one relationship).

    Methods:
        __repr__(): Returns a string representation of the schema.
    """

    __tablename__ = "schemas"

    id: Mapped[PyUUID] = mapped_column(
        UUID(as_uuid=True), primary_key=True, server_default=text("uuid_generate_v4()")
    )
    project_id: Mapped[PyUUID] = mapped_column(ForeignKey("projects.id"), nullable=False)
    name: Mapped[str] = mapped_column(String, nullable=False)  # Name of the table (e.g., "users")
    description: Mapped[Optional[str]] = mapped_column(Text, nullable=True)  # Description of the table
    schema_type: Mapped[str] = mapped_column(String, nullable=False)  # SQL or NoSQL
    fields: Mapped[List[Dict[str, Any]]] = mapped_column(JSON, nullable=False)  # Fields of the table
    created_at: Mapped[datetime] = mapped_column(DateTime, server_default=func.now())
    project: Mapped["Project"] = relationship("Project", back_populates="schemas")

    def __repr__(self):
        return f"<Schema(id={self.id}, name={self.name}, type={self.schema_type})>"