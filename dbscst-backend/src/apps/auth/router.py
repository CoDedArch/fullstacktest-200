from uuid import UUID
from datetime import datetime, timedelta
from jose import JWTError, jwt
from typing import List
from fastapi import APIRouter, Depends, HTTPException, status, Response
from fastapi.responses import JSONResponse
from fastapi.security import OAuth2PasswordBearer
from sqlalchemy import select, delete
from sqlalchemy.orm import selectinload
from sqlalchemy.ext.asyncio import AsyncSession
from core.database import aget_db
from apps.databaseSchemas.models import User, UnverifiedUser, Project
from apps.databaseSchemas.schemas import ProjectResponse, ProjectUpdate
from apps.auth.schemas import UserCreate, Token, UserLogin, EmailCheckRequest, EmailCheckResponse, SignupResponse, ProjectCreate
from apps.auth.utils import get_password_hash, verify_password, create_access_token, create_verification_token, send_verification_email, SECRET_KEY, ALGORITHM

router = APIRouter()

# OAuth2 scheme for token authentication
oauth2_scheme = OAuth2PasswordBearer(tokenUrl="auth/login")

async def cleanup_unverified_users(db: AsyncSession):
    """
    Delete unverified users older than 24 hours.
    """

    expiration_time = datetime.utcnow() - timedelta(hours=24)
    await db.execute(delete(UnverifiedUser).where(UnverifiedUser.created_at < expiration_time))
    await db.commit()


@router.post("/auth/signup", response_model=SignupResponse)
async def signup(user: UserCreate, db: AsyncSession = Depends(aget_db)):
    """
    Register a new user and send a verification email.

    Args:
        user (UserCreate): The user's registration details.
        db (AsyncSession): The database session.

    Returns:
        dict: A message indicating that the verification email has been sent.

    Raises:
        HTTPException: If the email is already registered or an unexpected error occurs.
    """

    result = await db.execute(select(User).where(User.email == user.email))
    if result.scalar_one_or_none():
        raise HTTPException(status_code=400, detail="Email already registered")

    hashed_password = get_password_hash(user.password.get_secret_value())
    
    verification_token = create_verification_token({"sub": user.email})

    new_unverified_user = UnverifiedUser(
        first_name=user.first_name,
        last_name=user.last_name,
        email=user.email,
        password=hashed_password,
        verification_token=verification_token,
    )

    db.add(new_unverified_user)
    await db.commit()

    await send_verification_email(user.email, verification_token)

    return {"message": "Verification email sent. Please check your inbox."}


@router.get("/auth/verify")
async def verify_email(token: str, db: AsyncSession = Depends(aget_db)):
    """
    Verify a user's email address using the verification token.

    Args:
        token (str): The verification token sent to the user's email.
        db (AsyncSession): The database session.

    Returns:
        dict: A message indicating that the email was verified successfully.

    Raises:
        HTTPException: If the verification token is invalid or the user is not found.
                      - 401 Unauthorized: Invalid verification token.
    """

    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Invalid verification token",
    )
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        email: str = payload.get("sub")
        if email is None:
            raise credentials_exception
    except JWTError:
        raise credentials_exception

    result = await db.execute(select(UnverifiedUser).where(UnverifiedUser.email == email))
    unverified_user = result.scalar_one_or_none()
    if unverified_user is None:
        raise credentials_exception

    new_user = User(
        first_name=unverified_user.first_name,
        last_name=unverified_user.last_name,
        email=unverified_user.email,
        password=unverified_user.password,
        verified=True,
    )

    db.add(new_user)
    await db.delete(unverified_user)
    await db.commit()

    return {"message": "Email verified successfully"}


@router.post("/auth/login", response_model=Token)
async def login(user: UserLogin, db: AsyncSession = Depends(aget_db)):
    """
    Log in a user and return a JWT token.

    Args:
        user (UserLogin): The user's login credentials (email and password).
        db (AsyncSession): The database session.

    Returns:
        dict: A dictionary containing the access token and token type.

    Raises:
        HTTPException: If the email or password is incorrect or the email is not verified.
                      - 400 Bad Request: Incorrect email or password.
                      - 400 Bad Request: Email not verified.
    """

    result = await db.execute(select(User).where(User.email == user.email))
    db_user = result.scalar_one_or_none()

    if not db_user or not verify_password(user.password.get_secret_value(), db_user.password):
        raise HTTPException(status_code=400, detail="Incorrect email or password")

    if not db_user.verified:
        raise HTTPException(status_code=400, detail="Email not verified")

    db_user.last_login = datetime.utcnow()
    await db.commit()

    access_token = create_access_token(data={"sub": db_user.email})

    return {
        "access_token": access_token,
        "token_type": "bearer",
    }


@router.post("/auth/check-email", response_model=EmailCheckResponse)
async def check_email(request: EmailCheckRequest, db: AsyncSession = Depends(aget_db)):
    """
    Check if an email already exists in the database.
    """

    result = await db.execute(select(User).where(User.email == request.email))
    db_user = result.scalar_one_or_none()
    return {"exists": db_user is not None}


async def get_current_user(token: str = Depends(oauth2_scheme), db: AsyncSession = Depends(aget_db)):
    """
    Retrieve the current authenticated user from the provided JWT token.

    Args:
        token (str): The JWT token provided in the Authorization header.
        db (AsyncSession): The database session.

    Returns:
        User: The authenticated user object.

    Raises:
        HTTPException: If the token is invalid or the user is not found.
                      - 401 Unauthorized: Invalid or missing token.
    """

    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Could not validate credentials",
        headers={"WWW-Authenticate": "Bearer"},
    )
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        email: str = payload.get("sub")
        if email is None:
            raise credentials_exception
    except JWTError:
        raise credentials_exception

    result = await db.execute(select(User).where(User.email == email))
    user = result.scalar_one_or_none()
    if user is None:
        raise credentials_exception
    return user



@router.get("/api/user-projects", response_model=List[ProjectResponse])
async def get_user_projects(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(aget_db),
):
    """
    Retrieve all projects for the current user.

    Args:
        current_user (User): The currently authenticated user, obtained from the `get_current_user` dependency.
        db (AsyncSession): The database session, obtained from the `aget_db` dependency.

    Returns:
        List[ProjectResponse]: A list of projects belonging to the current user, each containing:
            - id (str): The unique identifier of the project.
            - name (str): The name of the project.
            - description (str): The description of the project.
            - created_at (str): The timestamp when the project was created (in ISO format).
            - url (str): A unique URL for accessing the project details.

        If no projects are found, returns a JSON response with a message:
            - message (str): "No projects found".

    Raises:
        HTTPException: If an unexpected error occurs during the database query.
    """

    result = await db.execute(select(Project).where(Project.user_id == current_user.id))
    projects = result.scalars().all()
    print(projects)
    if not projects:
        return JSONResponse(content={"message": "No projects found"}, status_code=200)
    return [
        {
            "id": str(project.id),
            "name": project.name,
            "description": project.description,
            "created_at": project.created_at.isoformat(),
            "url": f"/projects/{project.id}",
        }
        for project in projects
    ]


@router.get("/api/user-projects/project/get/{project_id}", response_model=ProjectResponse)
async def get_project(
    project_id: UUID,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(aget_db),
):
    """
    Retrieve a single project by ID, including its schemas.

    Args:
        project_id (UUID): The unique identifier of the project to retrieve.
        current_user (User): The currently authenticated user (dependency).
        db (AsyncSession): The database session (dependency).

    Returns:
        dict: A dictionary containing the project details, including its schemas.

    Raises:
        HTTPException: If the project is not found.
                      - 404 Not Found: Project with the specified ID does not exist.
    """

    result = await db.execute(
        select(Project)
        .where(Project.id == project_id)
        .options(selectinload(Project.schemas))
    )
    project = result.scalars().first()

    if not project:
        raise HTTPException(status_code=404, detail="Project not found")

    return {
        "id": str(project.id),
        "name": project.name,
        "description": project.description,
        "created_at": project.created_at.isoformat(),
        "url": f"/projects/{project.id}",
        "schemas": [
            {
                "id": str(schema.id),
                "name": schema.name,
                "description": schema.description,
                "schema_type": schema.schema_type,
                "fields": schema.fields if schema.fields else [],
                "created_at": schema.created_at.isoformat(),
            }
            for schema in project.schemas
        ],
    }


@router.put("/api/user-projects/project/update/{project_id}", status_code=200)
async def update_project_schemas(
    project_id: UUID,
    project_update: ProjectUpdate,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(aget_db),
):
    """
    Update the schemas of a project.

    Args:
        project_id (UUID): The ID of the project to update.
        project_update (ProjectUpdate): The updated project data, including schemas.
        current_user (User): The currently authenticated user (retrieved via dependency injection).
        db (AsyncSession): The database session (retrieved via dependency injection).

    Returns:
        Response: An HTTP 200 OK response with no body.

    Raises:
        HTTPException: 
            - 404 Not Found: If the project or any schema is not found.
    """

    result = await db.execute(
        select(Project)
        .where(Project.id == project_id, Project.user_id == current_user.id)
        .options(selectinload(Project.schemas)) 
    )
    project = result.scalars().first()

    if not project:
        raise HTTPException(status_code=404, detail="Project not found")

    updated_schemas = []
    for schema_update in project_update.schemas:
        # Find the corresponding schema in the project
        schema = next((s for s in project.schemas if str(s.id) == schema_update.id), None)
        if not schema:
            raise HTTPException(status_code=404, detail=f"Schema with ID {schema_update.id} not found")

        # Update the schema fields
        schema.name = schema_update.name
        schema.description = schema_update.description
        schema.schema_type = schema_update.schema_type
        schema.fields = schema_update.fields

        updated_schemas.append(schema)

    project.schemas = updated_schemas
    await db.commit()
    await db.refresh(project)

    return Response(status_code=200)