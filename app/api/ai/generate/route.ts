import { NextRequest, NextResponse } from "next/server";
import { generateContent } from "@/lib/ai/generate";
import { AiProviderId } from "@/lib/ai/providers";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const provider = body.provider as AiProviderId;
    const prompt = typeof body.prompt === "string" ? body.prompt : "";
    const model = typeof body.model === "string" ? body.model : undefined;
    const apiKey = typeof body.apiKey === "string" ? body.apiKey : undefined;
    const baseUrl = typeof body.baseUrl === "string" ? body.baseUrl : undefined;
    const systemPrompt = typeof body.systemPrompt === "string" ? body.systemPrompt : undefined;
    const temperature = typeof body.temperature === "number" ? body.temperature : 0.7;
    const maxTokens = typeof body.maxTokens === "number" ? body.maxTokens : 400;

    if (!provider || !prompt) {
      return NextResponse.json(
        { error: "Missing provider or prompt" },
        { status: 400 }
      );
    }

    // API keys for server-side calls can also be read from environment variables
    const envKeyMap: Record<AiProviderId, string | undefined> = {
      openrouter: process.env.OPENROUTER_API_KEY,
      gemini: process.env.GEMINI_API_KEY,
      groq: process.env.GROQ_API_KEY,
      huggingface: process.env.HUGGINGFACE_API_KEY,
      ollama: undefined,
    };

    const result = await generateContent({
      provider,
      prompt,
      model,
      apiKey: apiKey ?? envKeyMap[provider],
      baseUrl,
      systemPrompt,
      temperature,
      maxTokens,
    });

    if (result.error) {
      return NextResponse.json(
        { error: result.error, provider: result.provider, model: result.model },
        { status: 502 }
      );
    }

    return NextResponse.json(result);
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Unknown error" },
      { status: 500 }
    );
  }
}
