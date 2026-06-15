import { NextRequest, NextResponse } from "next/server";
import { generateAnimation } from "@/lib/ai/media-generate";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const prompt = typeof body.prompt === "string" ? body.prompt : "";
    const type = body.type ?? "hyperframe";
    const mcpEndpoint =
      typeof body.mcpEndpoint === "string"
        ? body.mcpEndpoint
        : process.env.HYPERFRAMES_MCP_URL ?? "http://localhost:3001";
    const style = typeof body.style === "string" ? body.style : undefined;
    const duration = typeof body.duration === "number" ? body.duration : 3;
    const fps = typeof body.fps === "number" ? body.fps : 24;
    const width = typeof body.width === "number" ? body.width : 512;
    const height = typeof body.height === "number" ? body.height : 512;

    if (!prompt) {
      return NextResponse.json({ error: "Prompt is required" }, { status: 400 });
    }

    const result = await generateAnimation({
      prompt,
      type,
      mcpEndpoint,
      apiKey: body.apiKey,
      style,
      duration,
      fps,
      width,
      height,
    });

    if (result.error) {
      return NextResponse.json(
        { error: result.error, type: result.type },
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
