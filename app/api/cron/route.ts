import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  // Protect cron endpoint with shared secret
  const authHeader = request.headers.get("authorization");
  const expected = `Bearer ${process.env.CRON_SECRET ?? ""}`;

  if (!process.env.CRON_SECRET || authHeader !== expected) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const now = new Date();

    // Find scheduled posts whose time has come and are pending approval
    const duePosts = await prisma.post.findMany({
      where: {
        status: "scheduled",
        scheduledAt: { lte: now },
      },
      include: {
        platforms: {
          include: { account: true },
        },
      },
    });

    const results: { postId: string; status: string }[] = [];

    for (const post of duePosts) {
      // Transition to pending_approval so a human must confirm before actual publish.
      // In a fully automated but legitimate flow, this is where official platform APIs
      // would be called after the human approval step.
      await prisma.post.update({
        where: { id: post.id },
        data: { status: "pending_approval" },
      });

      await prisma.activityLog.create({
        data: {
          type: "schedule",
          message: `Scheduled post moved to pending approval: ${post.title || post.content.slice(0, 50)}`,
          metadata: JSON.stringify({ postId: post.id }),
        },
      });

      results.push({ postId: post.id, status: "pending_approval" });
    }

    return NextResponse.json({
      processed: results.length,
      posts: results,
      checkedAt: now.toISOString(),
    });
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Cron failed" },
      { status: 500 }
    );
  }
}
