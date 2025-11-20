from pydantic_settings import BaseSettings
from pydantic import ConfigDict

class Settings(BaseSettings):
    DATABASE_URL: str
    REDIS_URL: str
    BINANCE_API_KEY: str
    BINANCE_API_SECRET: str
    JWT_SECRET_KEY: str
    JWT_ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 30
    DEBUG: bool = True
    BINANCE_TESTNET: bool = True  # Add this line
    
    model_config = ConfigDict(
        env_file=".env.local",
        extra="ignore"  # This allows extra env vars without errors
    )

settings = Settings()