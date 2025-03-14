#!/bin/bash

# Configuration
OLLAMA_HOST=${OLLAMA_HOST:-"http://localhost:11434"}
API_HOST=${API_HOST:-"http://localhost:8000"}

# Color output
RED='\033[0;31m'
GREEN='\033[0;32m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Check if jq is installed
if ! command -v jq &> /dev/null; then
  echo -e "${RED}Error: jq is required but not installed. Please install jq.${NC}"
  exit 1
fi

# Function to display usage
usage() {
  echo -e "Ollama Model Manager"
  echo -e "-------------------"
  echo -e "Usage: $(basename $0) [command]"
  echo -e ""
  echo -e "Commands:"
  echo -e "  ${GREEN}list${NC}              List available models"
  echo -e "  ${GREEN}pull${NC} [model]      Pull a new model"
  echo -e "  ${GREEN}remove${NC} [model]    Remove a model"
  echo -e "  ${GREEN}default${NC} [model]   Set default model"
  echo -e "  ${GREEN}info${NC} [model]      Get model info"
  echo -e "  ${GREEN}help${NC}              Show this help message"
  echo -e ""
  echo -e "Example:"
  echo -e "  $(basename $0) pull llama3"
}

# List available models
list_models() {
  echo -e "${BLUE}Fetching available models...${NC}"
  curl -s "${OLLAMA_HOST}/api/tags" | jq -r '.models[] | "\(.name) (\(.size))"' | sort
}

# Pull a new model
pull_model() {
  if [ -z "$1" ]; then
    echo -e "${RED}Error: Please specify a model name${NC}"
    exit 1
  fi
  
  echo -e "${BLUE}Pulling model $1...${NC}"
  curl -X POST "${OLLAMA_HOST}/api/pull" -d "{\"name\":\"$1\"}" | jq
}

# Remove a model
remove_model() {
  if [ -z "$1" ]; then
    echo -e "${RED}Error: Please specify a model name${NC}"
    exit 1
  fi
  
  echo -e "${BLUE}Removing model $1...${NC}"
  curl -X DELETE "${OLLAMA_HOST}/api/delete" -d "{\"name\":\"$1\"}" | jq
}

# Set default model
set_default() {
  if [ -z "$1" ]; then
    echo -e "${RED}Error: Please specify a model name${NC}"
    exit 1
  fi
  
  # Check if model exists
  model_exists=$(curl -s "${OLLAMA_HOST}/api/tags" | jq -r ".models[].name" | grep -w "$1" | wc -l)
  
  if [ "$model_exists" -eq 0 ]; then
    echo -e "${RED}Error: Model $1 not found. Please pull it first.${NC}"
    exit 1
  fi
  
  # Update .env file
  if [ -f "../.env" ]; then
    grep -v "OLLAMA_DEFAULT_MODEL" ../.env > ../tmp.env
    echo "OLLAMA_DEFAULT_MODEL=$1" >> ../tmp.env
    mv ../tmp.env ../.env
    echo -e "${GREEN}Default model set to $1 in .env file${NC}"
  else
    echo "OLLAMA_DEFAULT_MODEL=$1" > ../.env
    echo -e "${GREEN}Created .env file with default model set to $1${NC}"
  fi
}

# Get model info
model_info() {
  if [ -z "$1" ]; then
    echo -e "${RED}Error: Please specify a model name${NC}"
    exit 1
  fi
  
  echo -e "${BLUE}Fetching info for model $1...${NC}"
  curl -s "${OLLAMA_HOST}/api/show" -d "{\"name\":\"$1\"}" | jq
}

# Parse command
case "$1" in
  list)
    list_models
    ;;
  pull)
    pull_model "$2"
    ;;
  remove)
    remove_model "$2"
    ;;
  default)
    set_default "$2"
    ;;
  info)
    model_info "$2"
    ;;
  help)
    usage
    ;;
  *)
    usage
    exit 1
    ;;
esac