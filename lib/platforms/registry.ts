import { PlatformConnector, PlatformId } from "@/lib/types/platform";

export const platformRegistry: Record<PlatformId, PlatformConnector> = {
  x: {
    id: "x",
    name: "X (Twitter)",
    description:
      "Publish text posts, threads, images, GIFs, and videos via the X API v2. All posts require explicit human approval before publishing.",
    website: "https://x.com",
    color: "#000000",
    capabilities: ["publish", "schedule", "analytics", "media-image", "media-video", "media-gif", "draft"],
    supportedFormats: ["post", "thread", "image", "video", "gif"],
    auth: {
      type: "oauth2",
      scopes: ["tweet.read", "tweet.write", "users.read", "offline.access"],
      docsUrl: "https://developer.x.com/en/docs/twitter-api",
    },
    limits: { maxPostLength: 280, maxMedia: 4 },
    notes: "Posting automation is gated behind human approval in this dashboard.",
  },
  linkedin: {
    id: "linkedin",
    name: "LinkedIn",
    description:
      "Share professional posts, articles, and documents through the LinkedIn Marketing API / REST API.",
    website: "https://linkedin.com",
    color: "#0A66C2",
    capabilities: ["publish", "schedule", "analytics", "media-image", "media-video", "draft"],
    supportedFormats: ["post", "image", "video", "article"],
    auth: {
      type: "oauth2",
      scopes: ["w_member_social", "r_basicprofile", "r_organization_social", "w_organization_social"],
      docsUrl: "https://learn.microsoft.com/en-us/linkedin/",
    },
    limits: { maxPostLength: 3000, maxMedia: 9 },
  },
  mastodon: {
    id: "mastodon",
    name: "Mastodon",
    description:
      "Publish toots, media, and polls to any Mastodon instance using the Mastodon REST API.",
    website: "https://joinmastodon.org",
    color: "#6364FF",
    capabilities: ["publish", "schedule", "analytics", "media-image", "media-video", "media-gif", "draft"],
    supportedFormats: ["post", "image", "video", "gif", "thread"],
    auth: {
      type: "token",
      docsUrl: "https://docs.joinmastodon.org/api/",
    },
    limits: { maxPostLength: 500, maxMedia: 4 },
  },
  bluesky: {
    id: "bluesky",
    name: "Bluesky",
    description:
      "Publish skeets, images, videos, and threads via the AT Protocol (Bluesky / PDS).",
    website: "https://bsky.app",
    color: "#0085FF",
    capabilities: ["publish", "schedule", "analytics", "media-image", "media-video", "media-gif", "draft"],
    supportedFormats: ["post", "image", "video", "gif", "thread"],
    auth: {
      type: "token",
      docsUrl: "https://docs.bsky.app/docs/api/app-bsky-feed-post",
    },
    limits: { maxPostLength: 300, maxMedia: 4 },
  },
  reddit: {
    id: "reddit",
    name: "Reddit",
    description:
      "Submit posts and schedule submissions to authorized subreddits via the Reddit API.",
    website: "https://reddit.com",
    color: "#FF4500",
    capabilities: ["publish", "schedule", "analytics", "media-image", "media-video", "draft"],
    supportedFormats: ["post", "image", "video"],
    auth: {
      type: "oauth2",
      scopes: ["submit", "read", "identity"],
      docsUrl: "https://www.reddit.com/dev/api/",
    },
    limits: { maxPostLength: 40000 },
    notes: "Subreddit rules and moderator approval still apply. No automated commenting or voting.",
  },
  threads: {
    id: "threads",
    name: "Threads",
    description:
      "Publish threads and media through the Threads API with Meta OAuth.",
    website: "https://threads.net",
    color: "#000000",
    capabilities: ["publish", "schedule", "analytics", "media-image", "media-video", "draft"],
    supportedFormats: ["post", "thread", "image", "video"],
    auth: {
      type: "oauth2",
      scopes: ["threads_basic", "threads_content_publish", "threads_read_replies"],
      docsUrl: "https://developers.facebook.com/docs/threads",
    },
    limits: { maxPostLength: 500, maxMedia: 10 },
  },
  instagram: {
    id: "instagram",
    name: "Instagram",
    description:
      "Publish feed posts, stories, reels, and carousels via the Instagram Graph API.",
    website: "https://instagram.com",
    color: "#E4405F",
    capabilities: ["publish", "schedule", "analytics", "media-image", "media-video", "draft"],
    supportedFormats: ["post", "story", "reel", "image", "video"],
    auth: {
      type: "oauth2",
      scopes: ["instagram_basic", "instagram_content_publish", "instagram_manage_insights"],
      docsUrl: "https://developers.facebook.com/docs/instagram-api",
    },
    limits: { maxMedia: 10, videoMaxDurationSec: 90 },
  },
  tiktok: {
    id: "tiktok",
    name: "TikTok",
    description:
      "Upload videos and retrieve analytics via the TikTok Research API / Content Posting API.",
    website: "https://tiktok.com",
    color: "#000000",
    capabilities: ["publish", "schedule", "analytics", "media-video", "draft"],
    supportedFormats: ["video", "reel"],
    auth: {
      type: "oauth2",
      scopes: ["video.publish", "user.info.basic"],
      docsUrl: "https://developers.tiktok.com/",
    },
    limits: { videoMaxDurationSec: 600 },
  },
  youtube: {
    id: "youtube",
    name: "YouTube",
    description:
      "Upload videos, shorts, and manage metadata via the YouTube Data API v3.",
    website: "https://youtube.com",
    color: "#FF0000",
    capabilities: ["publish", "schedule", "analytics", "media-video", "draft"],
    supportedFormats: ["video", "reel"],
    auth: {
      type: "oauth2",
      scopes: ["https://www.googleapis.com/auth/youtube.upload", "https://www.googleapis.com/auth/youtube.readonly"],
      docsUrl: "https://developers.google.com/youtube/v3",
    },
    limits: { videoMaxDurationSec: 43200 },
  },
  pinterest: {
    id: "pinterest",
    name: "Pinterest",
    description:
      "Create Pins and boards via the Pinterest API v5.",
    website: "https://pinterest.com",
    color: "#BD081C",
    capabilities: ["publish", "schedule", "analytics", "media-image", "media-video", "draft"],
    supportedFormats: ["post", "image", "video"],
    auth: {
      type: "oauth2",
      scopes: ["pins:read", "pins:write", "boards:read", "boards:write"],
      docsUrl: "https://developers.pinterest.com/docs/api/v5/",
    },
    limits: { maxPostLength: 500 },
  },
  substack: {
    id: "substack",
    name: "Substack",
    description:
      "Draft and schedule newsletter posts. Full publishing requires manual confirmation inside Substack.",
    website: "https://substack.com",
    color: "#FF6719",
    capabilities: ["draft", "schedule", "analytics", "media-image", "media-video"],
    supportedFormats: ["article", "newsletter", "image", "video"],
    auth: {
      type: "none",
      docsUrl: "https://support.substack.com/",
    },
    notes: "No official write API; generate drafts for manual review/export.",
  },
  beehiiv: {
    id: "beehiiv",
    name: "BeeHiiv",
    description:
      "Draft newsletters and schedule posts via the BeeHiiv API.",
    website: "https://beehiiv.com",
    color: "#FFCC00",
    capabilities: ["publish", "schedule", "analytics", "media-image", "media-video", "draft"],
    supportedFormats: ["newsletter", "article", "image", "video"],
    auth: {
      type: "api-key",
      docsUrl: "https://www.beehiiv.com/resources/tools/api",
    },
  },
  rumble: {
    id: "rumble",
    name: "Rumble",
    description:
      "Upload videos and manage channel content via the Rumble API where available.",
    website: "https://rumble.com",
    color: "#85C742",
    capabilities: ["publish", "schedule", "analytics", "media-video", "draft"],
    supportedFormats: ["video"],
    auth: {
      type: "api-key",
      docsUrl: "https://rumble.com/",
    },
  },
};

export const allPlatformIds = Object.keys(platformRegistry) as PlatformId[];

export function getPlatform(id: PlatformId): PlatformConnector {
  return platformRegistry[id];
}
