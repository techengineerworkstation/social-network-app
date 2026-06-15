import { NextRequest, NextResponse } from "next/server";
import { generateImage } from "@/lib/ai/media-generate";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const prompt = typeof body.prompt === "string" ? body.prompt : "";
    const provider = body.provider ?? "huggingface";
    const model = typeof body.model === "string" ? body.model : undefined;
    const width = typeof body.width === "number" ? body.width : 1024;
    const height = typeof body.height === "number" ? body.height : 1024;
    const negativePrompt =
      typeof body.negativePrompt === "string" ? body.negativePrompt : undefined;

    if (!prompt) {
      return NextResponse.json({ error: "Prompt is required" }, { status: 400 });
    }

    const envKeyMap: Record<string, string | undefined> = {
      huggingface: process.env.HUGGINGFACE_API_KEY,
      replicate: process.env.REPLICATE_API_TOKEN,
    };

    const result = await generateImage({
      prompt,
      provider,
      model,
      apiKey: body.apiKey ?? envKeyMap[provider],
      width,
      height,
      negativePrompt,
    });

    if (result.error) {
      return NextResponse.json(
        { error: result.error, provider: result.provider },
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
