import { NextRequest, NextResponse } from "next/server";
import {
  listDesigns,
  createDesign,
  deleteDesign,
  exportDesign,
  getExportJob,
  getDesign,
  listTemplates,
  getCanvaAuthUrl,
  exchangeCodeForToken,
  refreshAccessToken,
} from "@/lib/canva/client";

function getCanvaConfig() {
  return {
    appId: process.env.CANVA_APP_ID ?? "",
    appSecret: process.env.CANVA_APP_SECRET ?? "",
    accessToken: process.env.CANVA_ACCESS_TOKEN ?? "",
    refreshToken: process.env.CANVA_REFRESH_TOKEN ?? "",
  };
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const action = searchParams.get("action");
    const config = getCanvaConfig();

    if (action === "auth-url") {
      if (!config.appId) {
        return NextResponse.json(
          { error: "CANVA_APP_ID not configured" },
          { status: 400 }
        );
      }
      const redirectUri =
        searchParams.get("redirect_uri") ??
        `${process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:8899"}/api/canva?action=callback`;
      const state = Math.random().toString(36).slice(2);
      const url = getCanvaAuthUrl(config.appId, redirectUri, state);
      return NextResponse.json({ url, state });
    }

    if (action === "callback") {
      const code = searchParams.get("code");
      if (!code) {
        return NextResponse.json({ error: "Missing code" }, { status: 400 });
      }
      const redirectUri =
        `${process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:8899"}/api/canva?action=callback`;
      const result = await exchangeCodeForToken(
        config.appId,
        config.appSecret,
        code,
        redirectUri
      );
      return NextResponse.json({
        access_token: result.access_token,
        refresh_token: result.refresh_token,
        expires_in: result.expires_in,
        message: "Add these to your .env as CANVA_ACCESS_TOKEN and CANVA_REFRESH_TOKEN",
      });
    }

    if (!config.accessToken) {
      return NextResponse.json(
        { error: "Canva not connected. Set CANVA_ACCESS_TOKEN in .env or authenticate via /api/canva?action=auth-url" },
        { status: 401 }
      );
    }

    if (action === "designs") {
      const limit = Number(searchParams.get("limit") ?? 20);
      const data = await listDesigns(config.accessToken, limit);
      return NextResponse.json(data);
    }

    if (action === "design") {
      const designId = searchParams.get("design_id");
      if (!designId) {
        return NextResponse.json({ error: "Missing design_id" }, { status: 400 });
      }
      const data = await getDesign(config.accessToken, designId);
      return NextResponse.json(data);
    }

    if (action === "templates") {
      const query = searchParams.get("query") ?? undefined;
      const data = await listTemplates(config.accessToken, query);
      return NextResponse.json(data);
    }

    return NextResponse.json({ error: "Unknown action" }, { status: 400 });
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Unknown error" },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const action = body.action as string;
    const config = getCanvaConfig();

    if (!config.accessToken) {
      // Try refresh if we have a refresh token
      if (config.refreshToken && config.appId && config.appSecret) {
        const refreshed = await refreshAccessToken(
          config.appId,
          config.appSecret,
          config.refreshToken
        );
        config.accessToken = refreshed.access_token;
      } else {
        return NextResponse.json(
          { error: "Canva not connected" },
          { status: 401 }
        );
      }
    }

    if (action === "create-design") {
      const data = await createDesign(config.accessToken, {
        title: body.title,
        design_type: body.design_type,
        template_id: body.template_id,
      });
      return NextResponse.json(data);
    }

    if (action === "export") {
      const designId = body.design_id as string;
      const format = body.format ?? "png";
      if (!designId) {
        return NextResponse.json({ error: "Missing design_id" }, { status: 400 });
      }
      const data = await exportDesign(config.accessToken, designId, format);
      return NextResponse.json(data);
    }

    if (action === "check-export") {
      const designId = body.design_id as string;
      const jobId = body.job_id as string;
      if (!designId || !jobId) {
        return NextResponse.json(
          { error: "Missing design_id or job_id" },
          { status: 400 }
        );
      }
      const data = await getExportJob(config.accessToken, designId, jobId);
      return NextResponse.json(data);
    }

    if (action === "delete") {
      const designId = body.design_id as string;
      if (!designId) {
        return NextResponse.json({ error: "Missing design_id" }, { status: 400 });
      }
      await deleteDesign(config.accessToken, designId);
      return NextResponse.json({ ok: true });
    }

    if (action === "refresh-token") {
      if (!config.refreshToken || !config.appId || !config.appSecret) {
        return NextResponse.json(
          { error: "Missing refresh credentials" },
          { status: 400 }
        );
      }
      const result = await refreshAccessToken(
        config.appId,
        config.appSecret,
        config.refreshToken
      );
      return NextResponse.json({
        access_token: result.access_token,
        refresh_token: result.refresh_token,
        expires_in: result.expires_in,
        message: "Update CANVA_ACCESS_TOKEN and CANVA_REFRESH_TOKEN in .env",
      });
    }

    return NextResponse.json({ error: "Unknown action" }, { status: 400 });
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Unknown error" },
      { status: 500 }
    );
  }
}
