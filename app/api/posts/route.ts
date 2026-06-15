import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { PlatformId } from "@/lib/types/platform";

const validStatuses = ["draft", "scheduled", "pending_approval", "published", "failed"] as const;

export async function GET() {
  try {
    const posts = await prisma.post.findMany({
      orderBy: { createdAt: "desc" },
      include: {
        platforms: {
          include: { account: true },
        },
        engagement: true,
      },
    });
    return NextResponse.json(posts);
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Failed to fetch posts" },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    const title = typeof body.title === "string" ? body.title : null;
    const content = typeof body.content === "string" ? body.content : "";
    const format = typeof body.format === "string" ? body.format : "post";
    const status = validStatuses.includes(body.status) ? body.status : "draft";
    const scheduledAt =
      typeof body.scheduledAt === "string" && body.scheduledAt
        ? new Date(body.scheduledAt)
        : null;
    const platformIds = Array.isArray(body.platformIds)
      ? body.platformIds.filter((id: unknown): id is PlatformId => typeof id === "string")
      : [];

    if (!content.trim()) {
      return NextResponse.json({ error: "Content is required" }, { status: 400 });
    }

    // For scheduling, ensure platforms and scheduledAt are present
    if (status === "scheduled" && (!scheduledAt || platformIds.length === 0)) {
      return NextResponse.json(
        { error: "Scheduled posts require a date and at least one platform" },
        { status: 400 }
      );
    }

    // Find accounts for selected platforms (use first active account per platform)
    const accounts = await prisma.account.findMany({
      where: {
        platformId: { in: platformIds },
        status: "active",
      },
    });

    const accountMap = new Map<string, string>();
    for (const acc of accounts) {
      if (!accountMap.has(acc.platformId)) {
        accountMap.set(acc.platformId, acc.id);
      }
    }

    const post = await prisma.post.create({
      data: {
        title,
        content,
        format,
        status,
        scheduledAt,
        platforms: {
          create: Array.from(accountMap.entries()).map(([platformId, accountId]) => ({
            accountId,
            status: "pending",
          })),
        },
        engagement: {
          create: {},
        },
      },
      include: {
        platforms: { include: { account: true } },
        engagement: true,
      },
    });

    await prisma.activityLog.create({
      data: {
        type: status === "scheduled" ? "schedule" : "ai_generate",
        message: `Post ${status}: ${title || content.slice(0, 50)}`,
        metadata: JSON.stringify({ postId: post.id, platformIds }),
      },
    });

    return NextResponse.json(post, { status: 201 });
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Failed to create post" },
      { status: 500 }
    );
  }
}
