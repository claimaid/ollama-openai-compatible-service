from fastapi import FastAPI, HTTPException, Depends, Header, Request
from fastapi.middleware.cors import CORSMiddleware
import httpx
import os
import time
import json
import logging
from typing import Optional, List, Dict, Any, Union
from pydantic import BaseModel, Field
from config import Settings
from tenacity import retry, stop_after_attempt, wait_exponential

# Initialize settings
settings = Settings()

# Configure logging
logging.basicConfig(
    level=getattr(logging, settings.log_level),
    format="%(asctime)s - %(name)s - %(levelname)s - %(message)s",
)
logger = logging.getLogger("api-adapter")

app = FastAPI(
    title="OpenAI-Compatible API for Ollama",
    description="A compatible API interface for Ollama models",
    version="1.0.0",
)

# Add CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Models for API request/response
class ChatMessage(BaseModel):
    role: str
    content: str

class ChatCompletionRequest(BaseModel):
    model: str
    messages: List[ChatMessage]
    temperature: Optional[float] = 0.7
    max_tokens: Optional[int] = None
    stream: Optional[bool] = False
    
class ModelItem(BaseModel):
    id: str
    object: str = "model"
    created: int = Field(default_factory=lambda: int(time.time()))
    owned_by: str = "ollama"

class ModelList(BaseModel):
    object: str = "list"
    data: List[ModelItem]

# Authentication dependency
async def verify_api_key(authorization: Optional[str] = Header(None)):
    if not settings.enable_auth:
        return True
    
    if not authorization:
        raise HTTPException(status_code=401, detail="API key missing")
    
    if not authorization.startswith("Bearer "):
        raise HTTPException(status_code=401, detail="Invalid API key format")
    
    api_key = authorization.replace("Bearer ", "")
    
    if api_key != settings.api_key:
        raise HTTPException(status_code=401, detail="Invalid API key")
    
    return True

# Retry decorator for Ollama API calls
@retry(stop=stop_after_attempt(3), wait=wait_exponential(multiplier=1, min=1, max=10))
async def call_ollama_api(endpoint: str, method: str = "GET", json_data: Optional[Dict[str, Any]] = None):
    """
    Helper function to call Ollama API with retry logic
    """
    url = f"{settings.ollama_host}{endpoint}"
    
    async with httpx.AsyncClient() as client:
        if method == "GET":
            response = await client.get(url, timeout=60.0)
        elif method == "POST":
            response = await client.post(url, json=json_data, timeout=60.0)
        else:
            raise ValueError(f"Unsupported HTTP method: {method}")
        
        if response.status_code >= 400:
            error_detail = response.text
            logger.error(f"Ollama API error: {error_detail}")
            raise HTTPException(
                status_code=response.status_code, 
                detail=f"Ollama API error: {error_detail}"
            )
        
        return response.json()

@app.post("/v1/chat/completions")
async def chat_completions(request: ChatCompletionRequest, authorized: bool = Depends(verify_api_key)):
    """
    OpenAI-compatible chat completions endpoint
    """
    logger.info(f"Chat completion request for model: {request.model}")
    
    # Extract model from request
    model = request.model
    
    # Transform OpenAI format to Ollama format
    messages = request.messages
    
    # Format prompt based on messages
    system_prompt = ""
    user_messages = []
    
    for msg in messages:
        if msg.role == "system":
            system_prompt = msg.content
        elif msg.role == "user":
            user_messages.append(msg.content)
    
    # Combine the latest user message as the prompt
    prompt = user_messages[-1] if user_messages else ""
    
    # Prepare Ollama request
    ollama_request = {
        "model": model,
        "prompt": prompt,
        "options": {
            "temperature": request.temperature,
        }
    }
    
    if system_prompt:
        ollama_request["system"] = system_prompt
    
    if request.max_tokens:
        ollama_request["options"]["num_predict"] = request.max_tokens
    
    # Call Ollama API
    try:
        ollama_response = await call_ollama_api("/api/generate", "POST", ollama_request)
        
        # Transform Ollama response to OpenAI format
        return {
            "id": f"chatcmpl-{os.urandom(12).hex()}",
            "object": "chat.completion",
            "created": int(time.time()),
            "model": model,
            "choices": [
                {
                    "index": 0,
                    "message": {
                        "role": "assistant",
                        "content": ollama_response.get("response", "")
                    },
                    "finish_reason": "stop"
                }
            ],
            "usage": {
                "prompt_tokens": ollama_response.get("prompt_eval_count", 0),
                "completion_tokens": ollama_response.get("eval_count", 0),
                "total_tokens": (
                    ollama_response.get("prompt_eval_count", 0) + 
                    ollama_response.get("eval_count", 0)
                )
            }
        }
    except Exception as e:
        logger.error(f"Error calling Ollama API: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Internal server error: {str(e)}")

@app.get("/v1/models", response_model=ModelList)
async def list_models(authorized: bool = Depends(verify_api_key)):
    """
    OpenAI-compatible models list endpoint
    """
    logger.info("Listing available models")
    
    # Get available models from Ollama
    try:
        ollama_response = await call_ollama_api("/api/tags")
        models = ollama_response.get("models", [])
        
        # Transform to OpenAI format
        return {
            "object": "list",
            "data": [
                {
                    "id": model["name"],
                    "object": "model",
                    "created": int(time.time()),
                    "owned_by": "ollama"
                } 
                for model in models
            ]
        }
    except Exception as e:
        logger.error(f"Error listing models: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Internal server error: {str(e)}")

@app.get("/health")
async def health_check():
    """
    Health check endpoint for the API adapter
    """
    return {"status": "ok", "version": "1.0.0"}

@app.get("/")
async def root():
    """
    Root endpoint with API information
    """
    return {
        "name": "Ollama OpenAI-Compatible API",
        "version": "1.0.0",
        "description": "OpenAI-compatible API for Ollama LLMs",
        "endpoints": {
            "chat_completions": "/v1/chat/completions",
            "models": "/v1/models",
            "health": "/health"
        }
    }

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("app:app", host="0.0.0.0", port=settings.port, reload=True)