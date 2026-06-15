import { prisma } from "@/lib/prisma";
import { addDays, subDays } from "date-fns";

async function main() {
  // Create sample connected accounts
  const mastodon = await prisma.account.upsert({
    where: { platformId_handle: { platformId: "mastodon", handle: "@demo" } },
    update: {},
    create: {
      platformId: "mastodon",
      handle: "@demo",
      displayName: "Demo Account",
      status: "active",
    },
  });

  const bluesky = await prisma.account.upsert({
    where: { platformId_handle: { platformId: "bluesky", handle: "demo.bsky.social" } },
    update: {},
    create: {
      platformId: "bluesky",
      handle: "demo.bsky.social",
      displayName: "Demo Bluesky",
      status: "active",
    },
  });

  const linkedin = await prisma.account.upsert({
    where: { platformId_handle: { platformId: "linkedin", handle: "demo-user" } },
    update: {},
    create: {
      platformId: "linkedin",
      handle: "demo-user",
      displayName: "Demo LinkedIn",
      status: "active",
    },
  });

  const x = await prisma.account.upsert({
    where: { platformId_handle: { platformId: "x", handle: "demo_x" } },
    update: {},
    create: {
      platformId: "x",
      handle: "demo_x",
      displayName: "Demo X",
      status: "active",
    },
  });

  // Create sample posts
  const published = await prisma.post.create({
    data: {
      title: "Product launch announcement",
      content: "Excited to share our latest update with the community!",
      format: "post",
      status: "published",
      publishedAt: subDays(new Date(), 2),
      platforms: {
        create: [
          { accountId: x.id, status: "sent", sentAt: subDays(new Date(), 2) },
          { accountId: linkedin.id, status: "sent", sentAt: subDays(new Date(), 2) },
        ],
      },
      engagement: {
        create: { impressions: 12500, likes: 420, comments: 38, shares: 92 },
      },
    },
  });

  const scheduled = await prisma.post.create({
    data: {
      title: "Weekly community update",
      content: "Here's what happened this week across our social channels.",
      format: "thread",
      status: "scheduled",
      scheduledAt: addDays(new Date(), 1),
      platforms: {
        create: [
          { accountId: mastodon.id, status: "pending" },
          { accountId: bluesky.id, status: "pending" },
        ],
      },
      engagement: { create: {} },
    },
  });

  const draft = await prisma.post.create({
    data: {
      title: "Instagram reel teaser",
      content: "Behind the scenes of our next release — stay tuned!",
      format: "reel",
      status: "draft",
      platforms: {
        create: [{ accountId: x.id, status: "pending" }],
      },
      engagement: { create: {} },
    },
  });

  await prisma.activityLog.createMany({
    data: [
      { type: "publish", message: "Published product launch on X and LinkedIn" },
      { type: "schedule", message: "Scheduled weekly update on Mastodon and Bluesky" },
      { type: "ai_generate", message: "Generated Instagram reel caption draft" },
    ],
  });

  console.log("Seeded database with demo data.", { published, scheduled, draft });
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (e) => {
    console.error(e);
    await prisma.$disconnect();
    process.exit(1);
  });
