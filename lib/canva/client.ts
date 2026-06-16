export interface CanvaConfig {
  appId: string;
  appSecret: string;
  accessToken?: string;
  refreshToken?: string;
  expiresAt?: string;
}

export interface CanvaDesign {
  id: string;
  title: string;
  thumbnail: {
    url: string;
    width: number;
    height: number;
  };
  urls: {
    edit_url: string;
    view_url: string;
  };
  created_at: number;
  updated_at: number;
  page_count: number;
  design_type: {
    type: string;
    name: string;
  };
}

export interface CanvaExport {
  urls: string[];
  page_urls?: string[];
  job_id?: string;
  status: "success" | "in_progress" | "failed";
}

export interface CanvaTemplate {
  id: string;
  title: string;
  thumbnail: {
    url: string;
    width: number;
    height: number;
  };
  design_type: {
    type: string;
    name: string;
  };
  pageCount: number;
}

const CANVA_API_BASE = "https://api.canva.com/rest/v1";

export async function canvaRequest(
  endpoint: string,
  accessToken: string,
  options: RequestInit = {}
) {
  const res = await fetch(`${CANVA_API_BASE}${endpoint}`, {
    ...options,
    headers: {
      Authorization: `Bearer ${accessToken}`,
      "Content-Type": "application/json",
      ...options.headers,
    },
  });

  if (!res.ok) {
    const body = await res.text();
    throw new Error(`Canva API ${res.status}: ${body}`);
  }

  return res.json();
}

export async function listDesigns(
  accessToken: string,
  limit = 20
): Promise<{ designs: CanvaDesign[] }> {
  return canvaRequest(`/designs?limit=${limit}`, accessToken);
}

export async function getDesign(
  accessToken: string,
  designId: string
): Promise<{ design: CanvaDesign }> {
  return canvaRequest(`/designs/${designId}`, accessToken);
}

export async function createDesign(
  accessToken: string,
  options: {
    title?: string;
    design_type?: { type: string; name?: string };
    template_id?: string;
  }
): Promise<{ design: CanvaDesign }> {
  return canvaRequest("/designs", accessToken, {
    method: "POST",
    body: JSON.stringify(options),
  });
}

export async function deleteDesign(
  accessToken: string,
  designId: string
): Promise<void> {
  await canvaRequest(`/designs/${designId}`, accessToken, {
    method: "DELETE",
  });
}

export async function exportDesign(
  accessToken: string,
  designId: string,
  format: "png" | "jpg" | "pdf" | "mp4" | "gif" = "png"
): Promise<CanvaExport> {
  // Start export job
  const job = await canvaRequest(
    `/designs/${designId}/exports`,
    accessToken,
    {
      method: "POST",
      body: JSON.stringify({
        format: {
          type: format,
          quality: "high",
          ...(format === "png" ? { transparent: false } : {}),
          ...(format === "mp4" ? { fps: 24, quality: "regular" } : {}),
        },
      }),
    }
  );

  return job;
}

export async function getExportJob(
  accessToken: string,
  designId: string,
  jobId: string
): Promise<CanvaExport> {
  return canvaRequest(
    `/designs/${designId}/exports/${jobId}`,
    accessToken
  );
}

export async function listTemplates(
  accessToken: string,
  query?: string,
  limit = 20
): Promise<{ templates: CanvaTemplate[] }> {
  const params = new URLSearchParams({ limit: String(limit) });
  if (query) params.set("query", query);
  return canvaRequest(`/templates?${params}`, accessToken);
}

export async function createDesignFromTemplate(
  accessToken: string,
  templateId: string,
  title?: string
): Promise<{ design: CanvaDesign }> {
  return createDesign(accessToken, {
    title,
    template_id: templateId,
  });
}

export function getCanvaAuthUrl(
  appId: string,
  redirectUri: string,
  state: string
): string {
  const params = new URLSearchParams({
    client_id: appId,
    redirect_uri: redirectUri,
    response_type: "code",
    scope: "design:content:write design:content:read asset:read asset:write",
    state,
  });
  return `https://www.canva.com/api/oauth/authorize?${params}`;
}

export async function exchangeCodeForToken(
  appId: string,
  appSecret: string,
  code: string,
  redirectUri: string
): Promise<{
  access_token: string;
  refresh_token: string;
  expires_in: number;
  token_type: string;
}> {
  const credentials = Buffer.from(`${appId}:${appSecret}`).toString("base64");

  const res = await fetch("https://api.canva.com/rest/v1/oauth/token", {
    method: "POST",
    headers: {
      Authorization: `Basic ${credentials}`,
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: new URLSearchParams({
      grant_type: "authorization_code",
      code,
      redirect_uri: redirectUri,
    }),
  });

  if (!res.ok) {
    const body = await res.text();
    throw new Error(`Canva OAuth error ${res.status}: ${body}`);
  }

  return res.json();
}

export async function refreshAccessToken(
  appId: string,
  appSecret: string,
  refreshToken: string
): Promise<{
  access_token: string;
  refresh_token: string;
  expires_in: number;
}> {
  const credentials = Buffer.from(`${appId}:${appSecret}`).toString("base64");

  const res = await fetch("https://api.canva.com/rest/v1/oauth/token", {
    method: "POST",
    headers: {
      Authorization: `Basic ${credentials}`,
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: new URLSearchParams({
      grant_type: "refresh_token",
      refresh_token: refreshToken,
    }),
  });

  if (!res.ok) {
    const body = await res.text();
    throw new Error(`Canva token refresh error ${res.status}: ${body}`);
  }

  return res.json();
}
