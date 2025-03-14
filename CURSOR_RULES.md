# Cursor Rules for Development

This document outlines the rules to follow when making changes to the codebase using Cursor IDE. These rules ensure consistent development practices and maintain the infrastructure as code principles.

## General Rules

1. **Infrastructure as Code First**: All infrastructure changes must be made in code first, never manually adjusted in runtime.
2. **Code Documentation**: All functions, classes, and non-trivial code blocks must have documentation.
3. **Code Formatting**: Use consistent code formatting in each language (determined by default linters).
4. **Git Commits**: Use descriptive commit messages that explain the purpose of the change.

## API Adapter Rules

1. **OpenAI API Compatibility**: All endpoints must maintain compatibility with OpenAI's API specifications.
2. **Error Handling**: All API calls must include proper error handling and return appropriate HTTP status codes.
3. **Logging**: Maintain consistent logging patterns for debugging and monitoring.
4. **Configuration**: All configuration should be loaded from environment variables, with sensible defaults.

```python
# Good example
@app.post("/v1/chat/completions")
async def chat_completions(request: ChatCompletionRequest, authorized: bool = Depends(verify_api_key)):
    """
    OpenAI-compatible chat completions endpoint
    """
    logger.info(f"Chat completion request for model: {request.model}")
    
    try:
        # API logic here
        return response
    except Exception as e:
        logger.error(f"Error in chat completion: {str(e)}")
        raise HTTPException(status_code=500, detail="Internal server error")
```

## Web UI Rules

1. **Minimal UI Changes**: The Web UI should remain minimal and functional. Avoid unnecessary UI complexity.
2. **Component Structure**: Keep components small and focused on a single responsibility.
3. **State Management**: Use clear patterns for state management (React hooks for simple state, context for global state).
4. **API Integration**: All API calls should be centralized in the service layer.

```typescript
// Good example - Small, focused component
const ModelSelector: React.FC<ModelSelectorProps> = ({
  models,
  selectedModel,
  onModelChange,
  isLoading,
}) => {
  return (
    <div className="flex items-center space-x-2">
      <label htmlFor="model-selector" className="text-sm font-medium">
        Model:
      </label>
      <select
        id="model-selector"
        value={selectedModel}
        onChange={(e) => onModelChange(e.target.value)}
        disabled={isLoading}
        className="p-2 rounded border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 text-sm"
      >
        {models.map((model) => (
          <option key={model.id} value={model.id}>
            {model.id}
          </option>
        ))}
      </select>
    </div>
  );
};
```

## Docker Rules

1. **Container Isolation**: Each container should have a single responsibility.
2. **Environment Variables**: All configuration should be passed via environment variables.
3. **Volume Management**: Persistent data must be stored in volumes.
4. **Resource Constraints**: Add appropriate resource constraints to containers.

```yaml
# Good example
services:
  ollama:
    image: ollama/ollama:latest
    volumes:
      - ./ollama-data:/root/.ollama
    environment:
      - NVIDIA_VISIBLE_DEVICES=all
    deploy:
      resources:
        reservations:
          devices:
            - driver: nvidia
              count: 1
              capabilities: [gpu]
```

## Model Management Rules

1. **Model Versioning**: Always specify model versions explicitly.
2. **Download Verification**: Verify model downloads for integrity.
3. **Script Idempotency**: Ensure scripts can be run multiple times safely.

## Workflow Rules for Adding New Features

1. **Read Codebase First**: Understand the existing code before making changes.
2. **Plan Changes**: Document the planned changes before implementing.
3. **Update Documentation**: Update README.md and other documentation to reflect changes.
4. **Test Changes**: Test changes in a development environment before committing.
5. **Review Changes**: Use Cursor's AI capabilities to review code for potential issues.

By following these rules, we ensure that our development practices maintain the infrastructure as code principles and produce consistent, maintainable code.