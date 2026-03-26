from pydantic_settings import BaseSettings

class Settings(BaseSettings):
    DATABASE_URL: str
    QDRANT_URL: str
    QDRANT_API_KEY: str
    OPENAI_API_KEY: str
    GROQ_API_KEY: str
    GOOGLE_API_KEY: str
    INTERSWITCH_MAC_KEY: str
    INTERSWITCH_CLIENT_ID: str

    class Config:
        env_file = ".env"

settings = Settings()