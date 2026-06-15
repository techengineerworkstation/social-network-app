"use server";

import { AiProviderId, getAiProvider } from "@/lib/ai/providers";

export interface GenerateContentOptions {
  provider: AiProviderId;
  model?: string;
  prompt: string;
  apiKey?: string;
  baseUrl?: string;
  temperature?: number;
  maxTokens?: number;
  systemPrompt?: string;
}

export interface GenerateContentResult {
  text: string;
  provider: AiProviderId;
  model: string;
  error?: string;
}

const defaultSystemPrompt = `You are a helpful social media assistant.
Generate safe, engaging, human-sounding content based on the user's request.
Never include disallowed content, spam, harassment, or platform manipulation instructions.
All output is reviewed by a human before publishing.`;

function trimText(text: string): string {
  return text.trim().replace(/^["']|["']$/g, "");
}

async function callOpenRouter(
  opts: GenerateContentOptions
): Promise<GenerateContentResult> {
  const provider = getAiProvider(opts.provider);
  const model = opts.model ?? provider.defaultModel;
  const baseUrl = opts.baseUrl ?? provider.baseUrl;

  if (!opts.apiKey) {
    return {
      text: "",
      provider: opts.provider,
      model,
      error: "OpenRouter API key is required.",
    };
  }

  const res = await fetch(`${baseUrl}/chat/completions`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${opts.apiKey}`,
      "HTTP-Referer": process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000",
      "X-Title": "Social Network App",
    },
    body: JSON.stringify({
      model,
      messages: [
        { role: "system", content: opts.systemPrompt ?? defaultSystemPrompt },
        { role: "user", content: opts.prompt },
      ],
      temperature: opts.temperature ?? 0.7,
      max_tokens: opts.maxTokens ?? 400,
    }),
  });

  if (!res.ok) {
    const body = await res.text();
    return {
      text: "",
      provider: opts.provider,
      model,
      error: `OpenRouter error ${res.status}: ${body}`,
    };
  }

  const data = await res.json();
  return {
    text: trimText(data.choices?.[0]?.message?.content ?? ""),
    provider: opts.provider,
    model,
  };
}

async function callGemini(
  opts: GenerateContentOptions
): Promise<GenerateContentResult> {
  const provider = getAiProvider(opts.provider);
  const model = opts.model ?? provider.defaultModel;

  if (!opts.apiKey) {
    return {
      text: "",
      provider: opts.provider,
      model,
      error: "Google Gemini API key is required.",
    };
  }

  const url = new URL(
    `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent`
  );
  url.searchParams.set("key", opts.apiKey);

  const res = await fetch(url.toString(), {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      contents: [
        {
          parts: [
            {
              text: `${opts.systemPrompt ?? defaultSystemPrompt}\n\nUser request: ${opts.prompt}`,
            },
          ],
        },
      ],
      generationConfig: {
        temperature: opts.temperature ?? 0.7,
        maxOutputTokens: opts.maxTokens ?? 400,
      },
    }),
  });

  if (!res.ok) {
    const body = await res.text();
    return {
      text: "",
      provider: opts.provider,
      model,
      error: `Gemini error ${res.status}: ${body}`,
    };
  }

  const data = await res.json();
  return {
    text: trimText(data.candidates?.[0]?.content?.parts?.[0]?.text ?? ""),
    provider: opts.provider,
    model,
  };
}

async function callGroq(
  opts: GenerateContentOptions
): Promise<GenerateContentResult> {
  const provider = getAiProvider(opts.provider);
  const model = opts.model ?? provider.defaultModel;

  if (!opts.apiKey) {
    return {
      text: "",
      provider: opts.provider,
      model,
      error: "Groq API key is required.",
    };
  }

  const res = await fetch(`${provider.baseUrl}/chat/completions`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${opts.apiKey}`,
    },
    body: JSON.stringify({
      model,
      messages: [
        { role: "system", content: opts.systemPrompt ?? defaultSystemPrompt },
        { role: "user", content: opts.prompt },
      ],
      temperature: opts.temperature ?? 0.7,
      max_tokens: opts.maxTokens ?? 400,
    }),
  });

  if (!res.ok) {
    const body = await res.text();
    return {
      text: "",
      provider: opts.provider,
      model,
      error: `Groq error ${res.status}: ${body}`,
    };
  }

  const data = await res.json();
  return {
    text: trimText(data.choices?.[0]?.message?.content ?? ""),
    provider: opts.provider,
    model,
  };
}

async function callHuggingFace(
  opts: GenerateContentOptions
): Promise<GenerateContentResult> {
  const provider = getAiProvider(opts.provider);
  const model = opts.model ?? provider.defaultModel;

  if (!opts.apiKey) {
    return {
      text: "",
      provider: opts.provider,
      model,
      error: "Hugging Face API key is required.",
    };
  }

  const res = await fetch(`${provider.baseUrl}/${model}`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${opts.apiKey}`,
    },
    body: JSON.stringify({
      inputs: `${opts.systemPrompt ?? defaultSystemPrompt}\n\nUser request: ${opts.prompt}\n\nResponse:`,
      parameters: {
        temperature: opts.temperature ?? 0.7,
        max_new_tokens: opts.maxTokens ?? 400,
        return_full_text: false,
      },
    }),
  });

  if (!res.ok) {
    const body = await res.text();
    return {
      text: "",
      provider: opts.provider,
      model,
      error: `Hugging Face error ${res.status}: ${body}`,
    };
  }

  const data = await res.json();
  const text = Array.isArray(data) ? data[0]?.generated_text : data.generated_text;
  return {
    text: trimText(text ?? ""),
    provider: opts.provider,
    model,
  };
}

async function callOllama(
  opts: GenerateContentOptions
): Promise<GenerateContentResult> {
  const provider = getAiProvider(opts.provider);
  const model = opts.model ?? provider.defaultModel;
  const baseUrl = opts.baseUrl ?? provider.baseUrl;

  const res = await fetch(`${baseUrl}/api/generate`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      model,
      system: opts.systemPrompt ?? defaultSystemPrompt,
      prompt: opts.prompt,
      stream: false,
      options: {
        temperature: opts.temperature ?? 0.7,
        num_predict: opts.maxTokens ?? 400,
      },
    }),
  });

  if (!res.ok) {
    const body = await res.text();
    return {
      text: "",
      provider: opts.provider,
      model,
      error: `Ollama error ${res.status}: ${body}`,
    };
  }

  const data = await res.json();
  return {
    text: trimText(data.response ?? ""),
    provider: opts.provider,
    model,
  };
}

export async function generateContent(
  opts: GenerateContentOptions
): Promise<GenerateContentResult> {
  try {
    switch (opts.provider) {
      case "openrouter":
        return await callOpenRouter(opts);
      case "gemini":
        return await callGemini(opts);
      case "groq":
        return await callGroq(opts);
      case "huggingface":
        return await callHuggingFace(opts);
      case "ollama":
        return await callOllama(opts);
      default:
        return {
          text: "",
          provider: opts.provider,
          model: opts.model ?? "unknown",
          error: "Unknown AI provider.",
        };
    }
  } catch (err) {
    return {
      text: "",
      provider: opts.provider,
      model: opts.model ?? getAiProvider(opts.provider).defaultModel,
      error: err instanceof Error ? err.message : "Unknown error",
    };
  }
}
