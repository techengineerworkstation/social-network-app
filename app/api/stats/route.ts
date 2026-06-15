import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
    const [totalPosts, scheduled, published, draft, accounts, engagements] = await Promise.all([
      prisma.post.count(),
      prisma.post.count({ where: { status: "scheduled" } }),
      prisma.post.count({ where: { status: "published" } }),
      prisma.post.count({ where: { status: "draft" } }),
      prisma.account.count({ where: { status: "active" } }),
      prisma.engagement.aggregate({
        _sum: { impressions: true, likes: true, comments: true, shares: true, clicks: true },
      }),
    ]);

    return NextResponse.json({
      totalPosts,
      scheduled,
      published,
      draft,
      connectedAccounts: accounts,
      engagements: {
        impressions: engagements._sum.impressions ?? 0,
        likes: engagements._sum.likes ?? 0,
        comments: engagements._sum.comments ?? 0,
        shares: engagements._sum.shares ?? 0,
        clicks: engagements._sum.clicks ?? 0,
      },
    });
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Failed to fetch stats" },
      { status: 500 }
    );
  }
}
