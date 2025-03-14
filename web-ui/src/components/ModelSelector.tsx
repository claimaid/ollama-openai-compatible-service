import React from 'react';
import { Model } from '../services/api';

interface ModelSelectorProps {
  models: Model[];
  selectedModel: string;
  onModelChange: (model: string) => void;
  isLoading: boolean;
}

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
        {models.length === 0 ? (
          <option value="">No models available</option>
        ) : (
          models.map((model) => (
            <option key={model.id} value={model.id}>
              {model.id}
            </option>
          ))
        )}
      </select>
    </div>
  );
};

export default ModelSelector;