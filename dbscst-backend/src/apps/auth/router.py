import asyncio
from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import text, select, delete
from jose import JWTError, jwt
from datetime import datetime, timedelta
from core.database import aget_db
from apps.databaseSchemas.models import User, UserActivity, UnverifiedUser, Project
from apps.auth.schemas import UserCreate, UserResponse, Token, UserLogin, EmailCheckRequest, EmailCheckResponse, SignupResponse, ProjectCreate, ProjectResponse
from apps.auth.utils import get_password_hash, verify_password, create_access_token, create_verification_token, send_verification_email, SECRET_KEY, ALGORITHM
from core.security import verify_api_key

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
        verified=True,  # Mark as verified
    )

    db.add(new_user)
    await db.delete(unverified_user)
    await db.commit()

    return {"message": "Email verified successfully"}


@router.post("/auth/login", response_model=Token)
async def login(user: UserLogin, db: AsyncSession = Depends(aget_db)):
    """
    Log in a user and return a JWT token.
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


@router.post("/projects/create", response_model=ProjectResponse)
async def create_project(
    project: ProjectCreate,
    db: AsyncSession = Depends(aget_db),
    token: str = Depends(oauth2_scheme),
):
    """
    Create a new project for the authenticated user.
    """
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        email: str = payload.get("sub")
        if email is None:
            raise HTTPException(status_code=401, detail="Invalid token")
    except JWTError:
        raise HTTPException(status_code=401, detail="Invalid token")

    result = await db.execute(select(User).where(User.email == email))
    db_user = result.scalar_one_or_none()
    if db_user is None:
        raise HTTPException(status_code=404, detail="User not found")

    new_project = Project(
        user_id=db_user.id,
        name=project.name,
        description=project.description,
        schema_type=project.schema_type,
        schema_definition=project.schema_definition,
    )

    db.add(new_project)
    await db.commit()
    await db.refresh(new_project)

    return {
        "id": new_project.id,
        "name": new_project.name,
        "description": new_project.description,
        "schema_type": new_project.schema_type,
        "schema_definition": new_project.schema_definition,
        "created_at": new_project.created_at.isoformat(),
    }


@router.get("/projects/{project_id}", response_model=ProjectResponse)
async def get_project(
    project_id: str,
    db: AsyncSession = Depends(aget_db),
    token: str = Depends(oauth2_scheme),
):
    """
    Retrieve a project by its ID.
    """
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        email: str = payload.get("sub")
        if email is None:
            raise HTTPException(status_code=401, detail="Invalid token")
    except JWTError:
        raise HTTPException(status_code=401, detail="Invalid token")

    result = await db.execute(select(User).where(User.email == email))
    db_user = result.scalar_one_or_none()
    if db_user is None:
        raise HTTPException(status_code=404, detail="User not found")

    result = await db.execute(select(Project).where(Project.id == project_id, Project.user_id == db_user.id))
    project = result.scalar_one_or_none()
    if project is None:
        raise HTTPException(status_code=404, detail="Project not found")

    return {
        "id": project.id,
        "name": project.name,
        "description": project.description,
        "schema_type": project.schema_type,
        "schema_definition": project.schema_definition,
        "created_at": project.created_at.isoformat(),
    }