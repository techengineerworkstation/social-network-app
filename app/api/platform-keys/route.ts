import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { PlatformId } from "@/lib/types/platform";
import { allPlatformIds } from "@/lib/platforms/registry";

export async function GET() {
  try {
    const keys = await prisma.platformKey.findMany();
    // Return all platform slots, merging stored keys
    const result = allPlatformIds.map((id) => {
      const stored = keys.find((k) => k.platformId === id);
      return {
        platformId: id,
        clientId: stored?.clientId ? "••••••••" : "",
        clientSecret: stored?.clientSecret ? "••••••••" : "",
        accessToken: stored?.accessToken ? "••••••••" : "",
        apiKey: stored?.apiKey ? "••••••••" : "",
        apiSecret: stored?.apiSecret ? "••••••••" : "",
        instanceUrl: stored?.instanceUrl ?? "",
        scopes: stored?.scopes ?? "",
        notes: stored?.notes ?? "",
        hasCredentials: !!(
          stored?.clientId ||
          stored?.clientSecret ||
          stored?.accessToken ||
          stored?.apiKey
        ),
      };
    });
    return NextResponse.json(result);
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Failed to fetch platform keys" },
      { status: 500 }
    );
  }
}

export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    const platformId = body.platformId as PlatformId;

    if (!platformId || !allPlatformIds.includes(platformId)) {
      return NextResponse.json({ error: "Invalid platformId" }, { status: 400 });
    }

    const data: Record<string, string | null> = {};
    for (const field of [
      "clientId",
      "clientSecret",
      "accessToken",
      "refreshToken",
      "apiKey",
      "apiSecret",
      "instanceUrl",
      "scopes",
      "notes",
    ]) {
      if (typeof body[field] === "string" && body[field] !== "") {
        // Only update if not the masked placeholder
        if (body[field] !== "••••••••") {
          data[field] = body[field];
        }
      } else if (body[field] === "") {
        data[field] = null;
      }
    }

    if (Object.keys(data).length === 0) {
      return NextResponse.json({ error: "No fields to update" }, { status: 400 });
    }

    const key = await prisma.platformKey.upsert({
      where: { platformId },
      update: data,
      create: { platformId, ...data },
    });

    await prisma.activityLog.create({
      data: {
        type: "sync",
        message: `Updated API credentials for ${platformId}`,
        metadata: JSON.stringify({ platformId }),
      },
    });

    return NextResponse.json({
      platformId: key.platformId,
      hasCredentials: true,
    });
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Failed to update platform key" },
      { status: 500 }
    );
  }
}
