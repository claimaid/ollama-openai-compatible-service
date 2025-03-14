#!/bin/bash

# Configuration
DEFAULT_MODEL="llama3"

# Color output
RED='\033[0;31m'
GREEN='\033[0;32m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${BLUE}Setting up Ollama Docker environment...${NC}"

# Check Docker and Docker Compose installation
if ! command -v docker &> /dev/null; then
  echo -e "${RED}Error: Docker is not installed. Please install Docker first.${NC}"
  exit 1
fi

if ! command -v docker-compose &> /dev/null; then
  echo -e "${RED}Error: Docker Compose is not installed. Please install Docker Compose first.${NC}"
  exit 1
fi

# Check NVIDIA Docker support
if ! docker info | grep -q "Runtimes.*nvidia"; then
  echo -e "${RED}Warning: NVIDIA Docker runtime not detected. GPU passthrough may not work.${NC}"
  echo -e "${RED}See https://docs.nvidia.com/datacenter/cloud-native/container-toolkit/install-guide.html${NC}"
fi

# Create required directories
mkdir -p ollama-data

# Create .env file if it doesn't exist
if [ ! -f .env ]; then
  cat > .env << EOF
# Ollama settings
OLLAMA_DEFAULT_MODEL=${DEFAULT_MODEL}
OLLAMA_HOST=http://ollama:11434

# API Adapter settings
API_PORT=8000
ENABLE_AUTH=false
API_KEY=$(openssl rand -hex 16)

# Web UI settings
WEB_PORT=3000
EOF
  echo -e "${GREEN}.env file created with default settings${NC}"
else
  echo -e "${BLUE}.env file already exists, skipping creation${NC}"
fi

# Make scripts executable
chmod +x scripts/*.sh
echo -e "${GREEN}Scripts are now executable${NC}"

echo -e "${GREEN}Setup complete! You can now start the services with:${NC}"
echo -e "docker-compose up -d"
echo -e ""
echo -e "${BLUE}After starting, pull a model with:${NC}"
echo -e "./scripts/model-manager.sh pull ${DEFAULT_MODEL}"
echo -e ""
echo -e "${BLUE}Access the web UI at:${NC} http://localhost:3000"
echo -e "${BLUE}API endpoint:${NC} http://localhost:8000/v1"