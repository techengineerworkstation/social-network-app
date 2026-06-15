export interface McpServerConfig {
  id: string;
  name: string;
  description: string;
  endpoint: string;
  transport: "stdio" | "sse" | "streamable-http";
  apiKey?: string;
  capabilities: string[];
  status: "connected" | "disconnected" | "error";
}

export interface McpToolCall {
  server: string;
  tool: string;
  arguments: Record<string, unknown>;
}

export interface McpToolResult {
  content: Array<{
    type: "text" | "image" | "video" | "animation";
    text?: string;
    url?: string;
    data?: string;
    mimeType?: string;
  }>;
  isError?: boolean;
}

export const defaultMcpServers: McpServerConfig[] = [
  {
    id: "hyperframes",
    name: "Hyperframes Animation Engine",
    description:
      "Local hyperframes app for generating CSS/HTML/Lottie/GIF animations from text prompts. Connect via MCP or REST API.",
    endpoint: "http://localhost:3001",
    transport: "streamable-http",
    capabilities: [
      "generate_animation",
      "generate_hyperframe",
      "generate_lottie",
      "generate_css_animation",
      "generate_image",
      "generate_video",
    ],
    status: "disconnected",
  },
];

export async function callMcpTool(
  serverConfig: McpServerConfig,
  tool: McpToolCall
): Promise<McpToolResult> {
  const endpoint = serverConfig.endpoint;

  // Try MCP JSON-RPC style
  try {
    const res = await fetch(`${endpoint}/api/mcp`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json, text/event-stream",
        ...(serverConfig.apiKey
          ? { Authorization: `Bearer ${serverConfig.apiKey}` }
          : {}),
      },
      body: JSON.stringify({
        jsonrpc: "2.0",
        id: Date.now(),
        method: "tools/call",
        params: {
          name: tool.tool,
          arguments: tool.arguments,
        },
      }),
      signal: AbortSignal.timeout(60_000),
    });

    if (res.ok) {
      const contentType = res.headers.get("content-type") ?? "";

      // Handle SSE response
      if (contentType.includes("text/event-stream")) {
        const text = await res.text();
        const lines = text.split("\n").filter((l) => l.startsWith("data:"));
        const lastData = lines[lines.length - 1]?.slice(5)?.trim();
        if (lastData) {
          const parsed = JSON.parse(lastData);
          return parsed.result ?? { content: [{ type: "text", text: lastData }] };
        }
      }

      // Handle JSON response
      const data = await res.json();
      if (data.result) return data.result;
      if (data.content) return data;
    }
  } catch {
    // Fall through to REST style
  }

  // Fallback: REST-style endpoint
  try {
    const res = await fetch(`${endpoint}/api/tools/${tool.tool}`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        ...(serverConfig.apiKey
          ? { Authorization: `Bearer ${serverConfig.apiKey}` }
          : {}),
      },
      body: JSON.stringify(tool.arguments),
      signal: AbortSignal.timeout(60_000),
    });

    if (res.ok) {
      const data = await res.json();
      return {
        content: [
          {
            type: "text",
            text: JSON.stringify(data),
          },
        ],
      };
    }

    return {
      content: [],
      isError: true,
    };
  } catch (err) {
    return {
      content: [
        {
          type: "text",
          text: err instanceof Error ? err.message : "Connection failed",
        },
      ],
      isError: true,
    };
  }
}

export async function checkMcpServerHealth(
  config: McpServerConfig
): Promise<"connected" | "disconnected" | "error"> {
  try {
    const res = await fetch(`${config.endpoint}/health`, {
      method: "GET",
      signal: AbortSignal.timeout(5000),
    });
    return res.ok ? "connected" : "disconnected";
  } catch {
    return "disconnected";
  }
}
