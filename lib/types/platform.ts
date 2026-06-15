export type PlatformId =
  | "x"
  | "linkedin"
  | "mastodon"
  | "pinterest"
  | "reddit"
  | "threads"
  | "instagram"
  | "tiktok"
  | "youtube"
  | "bluesky"
  | "substack"
  | "beehiiv"
  | "rumble";

export type ContentFormat =
  | "post"
  | "thread"
  | "story"
  | "reel"
  | "image"
  | "video"
  | "gif"
  | "article"
  | "newsletter";

export type PlatformCapability =
  | "publish"
  | "schedule"
  | "analytics"
  | "media-image"
  | "media-video"
  | "media-gif"
  | "draft"
  | "comment"
  | "dm";

export interface PlatformConnector {
  id: PlatformId;
  name: string;
  description: string;
  website: string;
  color: string;
  capabilities: PlatformCapability[];
  supportedFormats: ContentFormat[];
  auth: {
    type: "oauth2" | "api-key" | "token" | "none";
    scopes?: string[];
    setupUrl?: string;
    docsUrl: string;
  };
  limits?: {
    maxPostLength?: number;
    maxMedia?: number;
    videoMaxDurationSec?: number;
  };
  notes?: string;
}

export interface ConnectedAccount {
  platformId: PlatformId;
  handle: string;
  displayName: string;
  avatarUrl?: string;
  connectedAt: string;
  status: "active" | "expired" | "error";
}

export interface PlatformApiConfig {
  platformId: PlatformId;
  apiKey?: string;
  accessToken?: string;
  refreshToken?: string;
  instanceUrl?: string; // Mastodon, Bluesky PDS
  expiresAt?: string;
}
