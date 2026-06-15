import { NextRequest, NextResponse } from "next/server";
import { generateVideo } from "@/lib/ai/media-generate";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const prompt = typeof body.prompt === "string" ? body.prompt : "";
    const provider = body.provider ?? "replicate";
    const model = typeof body.model === "string" ? body.model : undefined;
    const duration = typeof body.duration === "number" ? body.duration : 4;
    const fps = typeof body.fps === "number" ? body.fps : 8;

    if (!prompt) {
      return NextResponse.json({ error: "Prompt is required" }, { status: 400 });
    }

    const envKeyMap: Record<string, string | undefined> = {
      replicate: process.env.REPLICATE_API_TOKEN,
      huggingface: process.env.HUGGINGFACE_API_KEY,
    };

    const result = await generateVideo({
      prompt,
      provider,
      model,
      apiKey: body.apiKey ?? envKeyMap[provider],
      duration,
      fps,
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
