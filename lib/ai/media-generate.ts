"use server";

export interface GenerateImageOptions {
  prompt: string;
  provider: "huggingface" | "replicate" | "hyperframes";
  model?: string;
  apiKey?: string;
  width?: number;
  height?: number;
  negativePrompt?: string;
}

export interface GenerateImageResult {
  imageUrl?: string;
  imageBase64?: string;
  error?: string;
  provider: string;
  model: string;
}

export interface GenerateVideoOptions {
  prompt: string;
  provider: "replicate" | "huggingface" | "hyperframes";
  model?: string;
  apiKey?: string;
  duration?: number;
  fps?: number;
  width?: number;
  height?: number;
}

export interface GenerateVideoResult {
  videoUrl?: string;
  error?: string;
  provider: string;
  model: string;
}

export interface GenerateAnimationOptions {
  prompt: string;
  type?: "hyperframe" | "lottie" | "css" | "gif";
  mcpEndpoint?: string;
  apiKey?: string;
  style?: string;
  duration?: number;
  fps?: number;
  width?: number;
  height?: number;
}

export interface GenerateAnimationResult {
  animationUrl?: string;
  animationData?: string;
  animationHtml?: string;
  animationCss?: string;
  error?: string;
  type: string;
}

// ──────────────────────────────────────────────
// IMAGE GENERATION
// ──────────────────────────────────────────────

async function generateImageHuggingFace(
  opts: GenerateImageOptions
): Promise<GenerateImageResult> {
  const model = opts.model ?? "stabilityai/stable-diffusion-xl-base-1.0";

  if (!opts.apiKey) {
    return {
      error: "Hugging Face API key is required.",
      provider: "huggingface",
      model,
    };
  }

  const res = await fetch(
    `https://api-inference.huggingface.co/models/${model}`,
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${opts.apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        inputs: opts.prompt,
        parameters: {
          negative_prompt: opts.negativePrompt ?? "blurry, low quality, distorted",
          width: opts.width ?? 1024,
          height: opts.height ?? 1024,
        },
      }),
    }
  );

  if (!res.ok) {
    const body = await res.text();
    return {
      error: `Hugging Face error ${res.status}: ${body}`,
      provider: "huggingface",
      model,
    };
  }

  const contentType = res.headers.get("content-type") ?? "";
  if (contentType.includes("image")) {
    const buffer = await res.arrayBuffer();
    const base64 = Buffer.from(buffer).toString("base64");
    const mime = contentType.split(";")[0] ?? "image/png";
    return {
      imageBase64: `data:${mime};base64,${base64}`,
      provider: "huggingface",
      model,
    };
  }

  // If JSON error response
  const json = await res.json();
  return {
    error: json.error ?? "Unknown error",
    provider: "huggingface",
    model,
  };
}

async function generateImageReplicate(
  opts: GenerateImageOptions
): Promise<GenerateImageResult> {
  const model = opts.model ?? "stability-ai/sdxl";

  if (!opts.apiKey) {
    return {
      error: "Replicate API token is required.",
      provider: "replicate",
      model,
    };
  }

  // Create prediction
  const createRes = await fetch(
    "https://api.replicate.com/v1/predictions",
    {
      method: "POST",
      headers: {
        Authorization: `Token ${opts.apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        version: model,
        input: {
          prompt: opts.prompt,
          negative_prompt: opts.negativePrompt ?? "blurry, low quality",
          width: opts.width ?? 1024,
          height: opts.height ?? 1024,
        },
      }),
    }
  );

  if (!createRes.ok) {
    const body = await createRes.text();
    return {
      error: `Replicate error ${createRes.status}: ${body}`,
      provider: "replicate",
      model,
    };
  }

  const prediction = await createRes.json();

  // Poll for result
  let result = prediction;
  while (result.status === "starting" || result.status === "processing") {
    await new Promise((r) => setTimeout(r, 2000));
    const pollRes = await fetch(
      `https://api.replicate.com/v1/predictions/${result.id}`,
      {
        headers: { Authorization: `Token ${opts.apiKey}` },
      }
    );
    result = await pollRes.json();
  }

  if (result.status === "succeeded" && result.output?.length > 0) {
    return {
      imageUrl: result.output[0],
      provider: "replicate",
      model,
    };
  }

  return {
    error: result.error ?? "Generation failed",
    provider: "replicate",
    model,
  };
}

// ──────────────────────────────────────────────
// VIDEO GENERATION
// ──────────────────────────────────────────────

async function generateVideoReplicate(
  opts: GenerateVideoOptions
): Promise<GenerateVideoResult> {
  const model = opts.model ?? "anotherjesse/zeroscope-v2-xl";

  if (!opts.apiKey) {
    return {
      error: "Replicate API token is required.",
      provider: "replicate",
      model,
    };
  }

  const createRes = await fetch(
    "https://api.replicate.com/v1/predictions",
    {
      method: "POST",
      headers: {
        Authorization: `Token ${opts.apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        version: model,
        input: {
          prompt: opts.prompt,
          fps: opts.fps ?? 8,
          width: opts.width ?? 576,
          height: opts.height ?? 320,
        },
      }),
    }
  );

  if (!createRes.ok) {
    const body = await createRes.text();
    return {
      error: `Replicate error ${createRes.status}: ${body}`,
      provider: "replicate",
      model,
    };
  }

  const prediction = await createRes.json();
  let result = prediction;
  while (result.status === "starting" || result.status === "processing") {
    await new Promise((r) => setTimeout(r, 5000));
    const pollRes = await fetch(
      `https://api.replicate.com/v1/predictions/${result.id}`,
      {
        headers: { Authorization: `Token ${opts.apiKey}` },
      }
    );
    result = await pollRes.json();
  }

  if (result.status === "succeeded" && result.output) {
    return {
      videoUrl: Array.isArray(result.output) ? result.output[0] : result.output,
      provider: "replicate",
      model,
    };
  }

  return {
    error: result.error ?? "Video generation failed",
    provider: "replicate",
    model,
  };
}

// ──────────────────────────────────────────────
// HYPERFRAMES MCP ANIMATION GENERATION
// ──────────────────────────────────────────────

export async function generateAnimation(
  opts: GenerateAnimationOptions
): Promise<GenerateAnimationResult> {
  const endpoint = opts.mcpEndpoint ?? "http://localhost:3001";

  try {
    // Try MCP-style JSON-RPC call first
    const mcpRes = await fetch(`${endpoint}/api/generate`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        ...(opts.apiKey ? { Authorization: `Bearer ${opts.apiKey}` } : {}),
      },
      body: JSON.stringify({
        jsonrpc: "2.0",
        id: 1,
        method: "tools/call",
        params: {
          name: "generate_animation",
          arguments: {
            prompt: opts.prompt,
            type: opts.type ?? "hyperframe",
            style: opts.style,
            duration: opts.duration ?? 3,
            fps: opts.fps ?? 24,
            width: opts.width ?? 512,
            height: opts.height ?? 512,
          },
        },
      }),
      signal: AbortSignal.timeout(60_000),
    });

    if (mcpRes.ok) {
      const data = await mcpRes.json();
      const result = data.result ?? data;
      return {
        animationUrl: result.animationUrl,
        animationData: result.animationData,
        animationHtml: result.animationHtml,
        animationCss: result.animationCss,
        type: opts.type ?? "hyperframe",
      };
    }

    // Fallback: try REST-style endpoint
    const restRes = await fetch(`${endpoint}/api/animations`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        ...(opts.apiKey ? { Authorization: `Bearer ${opts.apiKey}` } : {}),
      },
      body: JSON.stringify({
        prompt: opts.prompt,
        type: opts.type ?? "hyperframe",
        style: opts.style,
        duration: opts.duration ?? 3,
        fps: opts.fps ?? 24,
        width: opts.width ?? 512,
        height: opts.height ?? 512,
      }),
      signal: AbortSignal.timeout(60_000),
    });

    if (restRes.ok) {
      const data = await restRes.json();
      return {
        animationUrl: data.animationUrl,
        animationData: data.animationData,
        animationHtml: data.animationHtml,
        animationCss: data.animationCss,
        type: opts.type ?? "hyperframe",
      };
    }

    return {
      error: `Hyperframes API returned ${restRes.status}`,
      type: opts.type ?? "hyperframe",
    };
  } catch (err) {
    return {
      error:
        err instanceof Error
          ? err.message
          : "Failed to connect to Hyperframes MCP server",
      type: opts.type ?? "hyperframe",
    };
  }
}

// ──────────────────────────────────────────────
// MAIN DISPATCHERS
// ──────────────────────────────────────────────

export async function generateImage(
  opts: GenerateImageOptions
): Promise<GenerateImageResult> {
  try {
    if (opts.provider === "huggingface") {
      return await generateImageHuggingFace(opts);
    }
    if (opts.provider === "replicate") {
      return await generateImageReplicate(opts);
    }
    if (opts.provider === "hyperframes") {
      // Delegate to hyperframes MCP
      const endpoint = process.env.HYPERFRAMES_MCP_URL ?? "http://localhost:3001";
      const res = await fetch(`${endpoint}/api/images`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(opts.apiKey ? { Authorization: `Bearer ${opts.apiKey}` } : {}),
        },
        body: JSON.stringify({ prompt: opts.prompt }),
        signal: AbortSignal.timeout(60_000),
      });
      if (res.ok) {
        const data = await res.json();
        return { imageUrl: data.url, imageBase64: data.base64, provider: "hyperframes", model: "hyperframes" };
      }
      return { error: "Hyperframes image generation not available", provider: "hyperframes", model: "hyperframes" };
    }
    return { error: "Unknown provider", provider: opts.provider, model: "unknown" };
  } catch (err) {
    return {
      error: err instanceof Error ? err.message : "Unknown error",
      provider: opts.provider,
      model: opts.model ?? "unknown",
    };
  }
}

export async function generateVideo(
  opts: GenerateVideoOptions
): Promise<GenerateVideoResult> {
  try {
    if (opts.provider === "replicate") {
      return await generateVideoReplicate(opts);
    }
    if (opts.provider === "hyperframes") {
      const endpoint = process.env.HYPERFRAMES_MCP_URL ?? "http://localhost:3001";
      const res = await fetch(`${endpoint}/api/videos`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(opts.apiKey ? { Authorization: `Bearer ${opts.apiKey}` } : {}),
        },
        body: JSON.stringify({ prompt: opts.prompt, duration: opts.duration, fps: opts.fps }),
        signal: AbortSignal.timeout(120_000),
      });
      if (res.ok) {
        const data = await res.json();
        return { videoUrl: data.url, provider: "hyperframes", model: "hyperframes" };
      }
      return { error: "Hyperframes video generation not available", provider: "hyperframes", model: "hyperframes" };
    }
    return { error: "Unknown provider", provider: opts.provider, model: "unknown" };
  } catch (err) {
    return {
      error: err instanceof Error ? err.message : "Unknown error",
      provider: opts.provider,
      model: opts.model ?? "unknown",
    };
  }
}
