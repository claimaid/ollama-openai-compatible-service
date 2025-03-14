import React, { useEffect, useState, useRef } from 'react';
import Head from 'next/head';
import { api, ChatMessage, Model } from '../services/api';
import Message from '../components/Message';
import ModelSelector from '../components/ModelSelector';

export default function Home() {
  const [messages, setMessages] = useState<ChatMessage[]>([
    { role: 'system', content: 'You are a helpful assistant.' },
  ]);
  const [input, setInput] = useState('');
  const [models, setModels] = useState<Model[]>([]);
  const [selectedModel, setSelectedModel] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Get available models on component mount
  useEffect(() => {
    const fetchModels = async () => {
      try {
        const modelList = await api.getModels();
        setModels(modelList);
        if (modelList.length > 0) {
          setSelectedModel(modelList[0].id);
        }
      } catch (err) {
        console.error('Error fetching models:', err);
        setError('Failed to fetch available models. Please check if the API server is running.');
      }
    };
    
    fetchModels();
  }, []);

  // Scroll to bottom of chat
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (input.trim() === '') return;
    if (!selectedModel) {
      setError('Please select a model first');
      return;
    }
    
    const userMessage: ChatMessage = { role: 'user', content: input };
    setMessages([...messages, userMessage]);
    setInput('');
    setIsLoading(true);
    setError(null);
    
    try {
      // Get only visible messages (excluding system messages)
      const visibleMessages = messages.filter(msg => msg.role !== 'system');
      
      const response = await api.createChatCompletion({
        model: selectedModel,
        messages: [
          { role: 'system', content: 'You are a helpful assistant.' },
          ...visibleMessages,
          userMessage,
        ],
      });
      
      const assistantMessage = response.choices[0].message;
      setMessages(prev => [...prev, assistantMessage]);
    } catch (err) {
      console.error('Error getting chat completion:', err);
      setError('Failed to get response from the API. Please check if the server is running and the model is available.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleModelChange = (modelId: string) => {
    setSelectedModel(modelId);
  };

  // Filter out system messages for display
  const visibleMessages = messages.filter(msg => msg.role !== 'system');

  return (
    <>
      <Head>
        <title>Ollama Chat</title>
        <meta name="description" content="Chat with Ollama models" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <link rel="icon" href="/favicon.ico" />
      </Head>
      
      <main className="flex flex-col h-screen max-h-screen">
        {/* Header */}
        <header className="bg-primary-700 text-white p-4">
          <div className="container mx-auto flex justify-between items-center">
            <h1 className="text-xl font-bold">Ollama Chat</h1>
            <ModelSelector
              models={models}
              selectedModel={selectedModel}
              onModelChange={handleModelChange}
              isLoading={isLoading}
            />
          </div>
        </header>
        
        {/* Chat Messages */}
        <div className="flex-1 overflow-auto p-4">
          <div className="container mx-auto max-w-4xl">
            {visibleMessages.length === 0 ? (
              <div className="text-center text-gray-500 my-10">
                <p className="text-xl mb-2">Welcome to Ollama Chat!</p>
                <p>Send a message to start the conversation.</p>
              </div>
            ) : (
              visibleMessages.map((message, index) => (
                <Message key={index} message={message} />
              ))
            )}
            {error && (
              <div className="p-4 rounded-lg my-2 bg-red-100 dark:bg-red-900 text-red-700 dark:text-red-100">
                <p className="font-bold">Error</p>
                <p>{error}</p>
              </div>
            )}
            {isLoading && (
              <div className="p-4 rounded-lg my-2 bg-gray-100 dark:bg-gray-800">
                <p className="flex items-center">
                  <span className="mr-2">Thinking</span>
                  <span className="animate-pulse">...</span>
                </p>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>
        </div>
        
        {/* Input Form */}
        <div className="border-t border-gray-300 dark:border-gray-700 p-4 bg-white dark:bg-gray-800">
          <div className="container mx-auto max-w-4xl">
            <form onSubmit={handleSubmit} className="flex space-x-2">
              <input
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder="Type your message..."
                disabled={isLoading}
                className="flex-1 p-3 border border-gray-300 dark:border-gray-700 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 dark:bg-gray-700"
              />
              <button
                type="submit"
                disabled={isLoading || !selectedModel}
                className="bg-primary-600 hover:bg-primary-700 text-white px-4 py-2 rounded-md disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Send
              </button>
            </form>
          </div>
        </div>
      </main>
    </>
  );
}