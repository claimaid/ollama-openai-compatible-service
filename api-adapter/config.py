from pydantic_settings import BaseSettings
import os
from dotenv import load_dotenv

load_dotenv()

class Settings(BaseSettings):
    """
    API adapter settings loaded from environment variables
    """
    
    # Ollama settings
    ollama_host: str = os.getenv("OLLAMA_HOST", "http://ollama:11434")
    default_model: str = os.getenv("OLLAMA_DEFAULT_MODEL", "llama3")
    
    # API settings
    port: int = int(os.getenv("API_PORT", "8000"))
    enable_auth: bool = os.getenv("ENABLE_AUTH", "false").lower() == "true"
    api_key: str = os.getenv("API_KEY", "")
    
    # Logging
    log_level: str = os.getenv("LOG_LEVEL", "INFO")
    
    class Config:
        env_file = ".env"
        case_sensitive = False