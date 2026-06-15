import { NextRequest, NextResponse } from "next/server";
import {
  defaultMcpServers,
  checkMcpServerHealth,
  callMcpTool,
  type McpServerConfig,
} from "@/lib/ai/mcp-client";

const env = process.env;

const configuredServers: McpServerConfig[] = defaultMcpServers.map((s) => ({
  ...s,
  endpoint:
    s.id === "hyperframes"
      ? env.HYPERFRAMES_MCP_URL ?? s.endpoint
      : s.endpoint,
  apiKey:
    s.id === "hyperframes"
      ? env.HYPERFRAMES_MCP_KEY ?? s.apiKey
      : s.apiKey,
}));

export async function GET() {
  const results = await Promise.all(
    configuredServers.map(async (server) => ({
      ...server,
      status: await checkMcpServerHealth(server),
    }))
  );
  return NextResponse.json(results);
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    if (body.action === "call-tool") {
      const serverId = body.serverId as string;
      const server = configuredServers.find((s) => s.id === serverId);
      if (!server) {
        return NextResponse.json(
          { error: `Unknown MCP server: ${serverId}` },
          { status: 404 }
        );
      }

      const result = await callMcpTool(server, {
        server: serverId,
        tool: body.tool,
        arguments: body.arguments ?? {},
      });

      return NextResponse.json(result);
    }

    if (body.action === "health-check") {
      const results = await Promise.all(
        configuredServers.map(async (server) => ({
          id: server.id,
          status: await checkMcpServerHealth(server),
        }))
      );
      return NextResponse.json(results);
    }

    return NextResponse.json({ error: "Invalid action" }, { status: 400 });
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Unknown error" },
      { status: 500 }
    );
  }
}
