import hashlib
import logging
from dotenv import load_dotenv
from pydantic import Field
from pydantic_settings import BaseSettings

# Load environment variables from .env file
load_dotenv(".env", override=True)
logger = logging.getLogger(__name__)


def hash_key(key: str) -> str:
    """Hash the key using SHA-256."""
    return hashlib.sha256(key.encode()).hexdigest()


class Settings(BaseSettings):
    """Class to store all the settings of the application."""

    # Load environment variables
    APOSTGRES_DATABASE_URL: str = Field(env="APOSTGRES_DATABASE_URL")
    API_KEY: str = Field(env="API_KEY")
    OPENAI_API_KEY: str = Field(env="OPENAI_API_KEY")
    SECRET_KEY: str = Field(env="SECRET_KEY")
    ALGORITHM: str = Field(env="ALGORITHM")
    ACCESS_TOKEN_EXPIRE_MINUTES: int = Field(env="ACCESS_TOKEN_EXPIRE_MINUTES")

    class Config:
        env_file = ".env"
        env_file_encoding = "utf-8"


# Create an instance of Settings
settings = Settings()