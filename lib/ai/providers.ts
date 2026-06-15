export type AiProviderId = "openrouter" | "gemini" | "groq" | "huggingface" | "ollama";

export interface AiProvider {
  id: AiProviderId;
  name: string;
  description: string;
  website: string;
  authType: "api-key" | "none";
  defaultModel: string;
  models: string[];
  baseUrl?: string;
  docsUrl: string;
  supportsImages: boolean;
  supportsStreaming: boolean;
}

export const aiProviders: Record<AiProviderId, AiProvider> = {
  openrouter: {
    id: "openrouter",
    name: "OpenRouter",
    description:
      "Unified API for many open models. Free models available via model selection; requires an API key.",
    website: "https://openrouter.ai",
    authType: "api-key",
    defaultModel: "meta-llama/llama-3.1-8b-instruct:free",
    models: [
      "meta-llama/llama-3.1-8b-instruct:free",
      "google/gemini-2.0-flash-thinking-exp:free",
      "deepseek/deepseek-chat:free",
      "mistralai/mistral-7b-instruct:free",
    ],
    baseUrl: "https://openrouter.ai/api/v1",
    docsUrl: "https://openrouter.ai/docs",
    supportsImages: true,
    supportsStreaming: true,
  },
  gemini: {
    id: "gemini",
    name: "Google Gemini",
    description:
      "Google's generative AI API with a generous free tier for text and image generation.",
    website: "https://ai.google.dev",
    authType: "api-key",
    defaultModel: "gemini-2.0-flash",
    models: ["gemini-2.0-flash", "gemini-1.5-flash", "gemini-1.5-pro"],
    baseUrl: "https://generativelanguage.googleapis.com/v1beta",
    docsUrl: "https://ai.google.dev/gemini-api/docs",
    supportsImages: true,
    supportsStreaming: false,
  },
  groq: {
    id: "groq",
    name: "Groq",
    description:
      "Ultra-fast inference for open models. Free tier available with an API key.",
    website: "https://groq.com",
    authType: "api-key",
    defaultModel: "llama-3.1-8b-instant",
    models: [
      "llama-3.1-8b-instant",
      "llama-3.3-70b-versatile",
      "mixtral-8x7b-32768",
      "gemma2-9b-it",
    ],
    baseUrl: "https://api.groq.com/openai/v1",
    docsUrl: "https://console.groq.com/docs",
    supportsImages: false,
    supportsStreaming: true,
  },
  huggingface: {
    id: "huggingface",
    name: "Hugging Face Inference API",
    description:
      "Serverless inference on thousands of open models with a free tier.",
    website: "https://huggingface.co",
    authType: "api-key",
    defaultModel: "mistralai/Mistral-7B-Instruct-v0.3",
    models: [
      "mistralai/Mistral-7B-Instruct-v0.3",
      "meta-llama/Meta-Llama-3-8B-Instruct",
      "HuggingFaceH4/zephyr-7b-beta",
    ],
    baseUrl: "https://api-inference.huggingface.co/models",
    docsUrl: "https://huggingface.co/docs/api-inference/index",
    supportsImages: false,
    supportsStreaming: false,
  },
  ollama: {
    id: "ollama",
    name: "Ollama",
    description:
      "Self-hosted open-source LLM server. No API key required if running locally.",
    website: "https://ollama.com",
    authType: "none",
    defaultModel: "llama3.1",
    models: ["llama3.1", "mistral", "gemma2", "phi4", "qwen2.5"],
    baseUrl: "http://localhost:11434",
    docsUrl: "https://github.com/ollama/ollama/blob/main/docs/api.md",
    supportsImages: true,
    supportsStreaming: false,
  },
};

export const allAiProviderIds = Object.keys(aiProviders) as AiProviderId[];

export function getAiProvider(id: AiProviderId): AiProvider {
  return aiProviders[id];
}
