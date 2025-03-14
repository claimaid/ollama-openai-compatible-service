# Ollama OpenAI-Compatible Service

An infrastructure-as-code approach to deploying Ollama with GPU passthrough and an OpenAI-compatible API interface.

## Overview

This project provides a complete solution for running local LLMs using Ollama with GPU acceleration, exposed through an OpenAI-compatible API. The entire infrastructure is defined as code, making it easy to deploy, maintain, and version.

### Features

- **Docker-based**: Full containerization with Docker Compose
- **GPU Passthrough**: Utilizes NVIDIA GPUs for accelerated inference
- **OpenAI-Compatible API**: Drop-in replacement for OpenAI API consumers
- **Model Management**: Easy switching between different models
- **Minimal Web UI**: Simple interface for interaction with models
- **Infrastructure as Code**: All components defined as code for consistent deployment

## Architecture

```
┌─────────────┐     ┌─────────────┐     ┌─────────────┐
│             │     │             │     │             │
│   Web UI    │────▶│ API Adapter │────▶│   Ollama    │
│             │     │             │     │             │
└─────────────┘     └─────────────┘     └─────────────┘
                                               │
                                               ▼
                                        ┌─────────────┐
                                        │  GPU Device │
                                        └─────────────┘
```

## Requirements

- Docker Engine (20.10.0+)
- Docker Compose (2.0.0+)
- NVIDIA Container Toolkit (for GPU acceleration)
- NVIDIA GPU with current drivers

## Quick Start

1. Clone this repository:
   ```bash
   git clone https://github.com/claimaid/ollama-openai-compatible-service.git
   cd ollama-openai-compatible-service
   ```

2. Run the setup script:
   ```bash
   ./scripts/setup.sh
   ```

3. Start the services:
   ```bash
   docker-compose up -d
   ```

4. Pull a model:
   ```bash
   ./scripts/model-manager.sh pull llama3
   ```

5. Access the web UI at: http://localhost:3000
   Access the API at: http://localhost:8000/v1

## Configuration

Configuration is managed through environment variables in the `.env` file:

```
# Ollama settings
OLLAMA_DEFAULT_MODEL=llama3
OLLAMA_HOST=http://ollama:11434

# API Adapter settings
API_PORT=8000
ENABLE_AUTH=false
API_KEY=your_api_key

# Web UI settings
WEB_PORT=3000
```

## Model Management

The included model management script provides an easy way to handle models:

```bash
# List available models
./scripts/model-manager.sh list

# Pull a model
./scripts/model-manager.sh pull llama3

# Remove a model
./scripts/model-manager.sh remove llama3

# Set default model
./scripts/model-manager.sh default llama3

# Get model information
./scripts/model-manager.sh info llama3
```

## API Usage

The API is compatible with the OpenAI API. Examples:

### Chat Completions

```bash
curl http://localhost:8000/v1/chat/completions \
  -H "Content-Type: application/json" \
  -d '{
    "model": "llama3",
    "messages": [
      {"role": "system", "content": "You are a helpful assistant."},
      {"role": "user", "content": "Hello, how are you?"}
    ]
  }'
```

### List Models

```bash
curl http://localhost:8000/v1/models
```

## Development

### Infrastructure as Code Principles

This project follows infrastructure as code principles:

1. **Version Control**: All configuration is in version control
2. **Declarative Definition**: Infrastructure defined declaratively
3. **Idempotency**: Same configuration always produces same result
4. **Self-Documentation**: Code serves as documentation

### Adding Models

To add custom models, use the model management script:

```bash
./scripts/model-manager.sh pull <model_name>
```

### Extending the API

The API adapter is built with FastAPI. To extend it, modify the `api-adapter/app.py` file.

## License

MIT