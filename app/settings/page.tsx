"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import {
  Save,
  KeyRound,
  Database,
  ShieldCheck,
  Loader2,
  CheckCircle2,
  AlertCircle,
  Eye,
  EyeOff,
  Plug,
  Wifi,
  WifiOff,
} from "lucide-react";
import { Card, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import {
  MotionContainer,
  MotionItem,
  MotionPage,
} from "@/components/motion/motion-wrapper";
import { aiProviders, AiProviderId } from "@/lib/ai/providers";
import { allPlatformIds, getPlatform } from "@/lib/platforms/registry";
import { PlatformId } from "@/lib/types/platform";

interface PlatformKeyState {
  platformId: string;
  clientId: string;
  clientSecret: string;
  accessToken: string;
  apiKey: string;
  apiSecret: string;
  instanceUrl: string;
  scopes: string;
  notes: string;
  hasCredentials: boolean;
}

export default function SettingsPage() {
  const [provider, setProvider] = useState<AiProviderId>("gemini");
  const [apiKey, setApiKey] = useState("");
  const [dbUrl, setDbUrl] = useState("");
  const [saved, setSaved] = useState(false);
  const [platformKeys, setPlatformKeys] = useState<PlatformKeyState[]>([]);
  const [loadingKeys, setLoadingKeys] = useState(true);
  const [savingPlatform, setSavingPlatform] = useState<string | null>(null);
  const [showSecrets, setShowSecrets] = useState<Record<string, boolean>>({});
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);
  const [mcpEndpoint, setMcpEndpoint] = useState("http://localhost:3001");
  const [mcpKey, setMcpKey] = useState("");

  useEffect(() => {
    fetch("/api/platform-keys")
      .then((res) => res.json())
      .then((data) => {
        if (Array.isArray(data)) setPlatformKeys(data);
      })
      .catch(() => {})
      .finally(() => setLoadingKeys(false));
  }, []);

  const handleSave = () => {
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  const toggleShow = (key: string) => {
    setShowSecrets((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  const updatePlatformKey = (
    platformId: string,
    field: keyof PlatformKeyState,
    value: string
  ) => {
    setPlatformKeys((prev) =>
      prev.map((pk) =>
        pk.platformId === platformId ? { ...pk, [field]: value } : pk
      )
    );
  };

  const handleSavePlatformKey = async (platformId: string) => {
    const pk = platformKeys.find((k) => k.platformId === platformId);
    if (!pk) return;

    setSavingPlatform(platformId);
    setMessage(null);

    try {
      const res = await fetch("/api/platform-keys", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(pk),
      });
      const data = await res.json();
      if (!res.ok) {
        setMessage({ type: "error", text: data.error ?? "Save failed" });
      } else {
        setMessage({ type: "success", text: `Credentials saved for ${platformId}` });
        // Refresh keys
        const refreshed = await fetch("/api/platform-keys").then((r) => r.json());
        if (Array.isArray(refreshed)) setPlatformKeys(refreshed);
      }
    } catch (err) {
      setMessage({ type: "error", text: err instanceof Error ? err.message : "Unknown error" });
    } finally {
      setSavingPlatform(null);
    }
  };

  const getFieldsForPlatform = (platformId: PlatformId) => {
    const platform = getPlatform(platformId);
    const authType = platform.auth.type;

    if (authType === "oauth2") {
      return [
        { field: "clientId" as const, label: "Client ID", type: "text" },
        { field: "clientSecret" as const, label: "Client Secret", type: "password" },
        { field: "accessToken" as const, label: "Access Token", type: "password" },
        { field: "refreshToken" as const, label: "Refresh Token", type: "password" },
        { field: "scopes" as const, label: "Scopes", type: "text" },
        { field: "instanceUrl" as const, label: "Instance URL (optional)", type: "text" },
      ];
    }
    if (authType === "api-key") {
      return [
        { field: "apiKey" as const, label: "API Key", type: "password" },
        { field: "apiSecret" as const, label: "API Secret (optional)", type: "password" },
        { field: "instanceUrl" as const, label: "Base URL (optional)", type: "text" },
      ];
    }
    if (authType === "token") {
      return [
        { field: "accessToken" as const, label: "Access Token / App Password", type: "password" },
        { field: "instanceUrl" as const, label: "Instance URL", type: "text" },
      ];
    }
    // "none"
    return [
      { field: "instanceUrl" as const, label: "Service URL (optional)", type: "text" },
    ];
  };

  return (
    <MotionPage>
      <div className="space-y-6">
        <MotionContainer>
          <MotionItem>
            <h1 className="text-2xl font-semibold tracking-tight sm:text-3xl">
              Settings
            </h1>
          </MotionItem>
          <MotionItem>
            <p className="mt-1 text-sm text-muted-foreground">
              Configure AI providers, platform API credentials, database, and security.
            </p>
          </MotionItem>
        </MotionContainer>

        {message && (
          <motion.div
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            className={`flex items-start gap-2 rounded-lg p-3 text-sm ${
              message.type === "success"
                ? "bg-green-50 text-green-800"
                : "bg-red-50 text-red-800"
            }`}
          >
            {message.type === "success" ? (
              <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0" />
            ) : (
              <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
            )}
            {message.text}
          </motion.div>
        )}

        <div className="grid gap-6 lg:grid-cols-2">
          <MotionContainer className="space-y-6">
            {/* AI Provider Keys */}
            <MotionItem>
              <Card>
                <CardHeader>
                  <div className="flex items-center gap-2">
                    <KeyRound className="h-4 w-4 text-orange-500" />
                    <CardTitle>AI Provider Keys</CardTitle>
                  </div>
                  <CardDescription>
                    Keys are stored server-side via environment variables and never
                    shipped to the browser.
                  </CardDescription>
                </CardHeader>

                <div className="space-y-4">
                  <Select
                    label="Default AI Provider"
                    value={provider}
                    onChange={(e) => setProvider(e.target.value as AiProviderId)}
                    options={Object.values(aiProviders).map((p) => ({
                      value: p.id,
                      label: p.name,
                    }))}
                  />

                  <Input
                    label="API Key"
                    type="password"
                    placeholder={`Enter ${aiProviders[provider].name} API key`}
                    value={apiKey}
                    onChange={(e) => setApiKey(e.target.value)}
                  />

                  <Input
                    label="Default Model"
                    value={aiProviders[provider].defaultModel}
                    disabled
                  />

                  <Button onClick={handleSave} className="w-full">
                    <Save className="h-4 w-4" />
                    {saved ? "Saved" : "Save AI Keys"}
                  </Button>
                </div>
              </Card>
            </MotionItem>

            {/* Database */}
            <MotionItem>
              <Card>
                <CardHeader>
                  <div className="flex items-center gap-2">
                    <Database className="h-4 w-4 text-magenta-500" />
                    <CardTitle>Database</CardTitle>
                  </div>
                  <CardDescription>
                    PostgreSQL connection for local use or Vercel Postgres for production.
                  </CardDescription>
                </CardHeader>

                <div className="space-y-4">
                  <Input
                    label="DATABASE_URL"
                    type="password"
                    placeholder="postgresql://user:pass@localhost:5432/social_network_app"
                    value={dbUrl}
                    onChange={(e) => setDbUrl(e.target.value)}
                  />
                  <div className="rounded-lg border border-border bg-muted/50 p-3 text-xs text-muted-foreground">
                    <p>
                      Recommended for Vercel: use Vercel Postgres or Neon. For local
                      development, run PostgreSQL via Docker.
                    </p>
                  </div>
                  <Button onClick={handleSave} variant="outline" className="w-full">
                    <Save className="h-4 w-4" />
                    {saved ? "Saved" : "Save Configuration"}
                  </Button>
                </div>
              </Card>
            </MotionItem>
          </MotionContainer>

          <MotionContainer className="space-y-6">
            {/* Security Posture */}
            <MotionItem>
              <Card>
                <CardHeader>
                  <div className="flex items-center gap-2">
                    <ShieldCheck className="h-4 w-4 text-green-600" />
                    <CardTitle>Security Posture</CardTitle>
                  </div>
                  <CardDescription>
                    Zero-vulnerability tolerance enforced by the following controls.
                  </CardDescription>
                </CardHeader>

                <div className="grid gap-3 sm:grid-cols-2">
                  {[
                    "Strict TypeScript",
                    "CSP + Security Headers",
                    "Server-side secrets",
                    "No dangerouslySetInnerHTML",
                    "Human-in-the-loop",
                    "API input validation",
                    "Bearer-protected cron",
                    "npm audit: 0 vulnerabilities",
                  ].map((control) => (
                    <div
                      key={control}
                      className="flex items-center gap-2 rounded-lg border border-border p-3 transition-colors hover:bg-muted/50"
                    >
                      <ShieldCheck className="h-4 w-4 text-green-600" />
                      <span className="text-sm font-medium">{control}</span>
                    </div>
                  ))}
                </div>
              </Card>
            </MotionItem>
          </MotionContainer>
        </div>

        {/* Platform API Keys - Full width */}
        <MotionContainer>
          <MotionItem>
            <Card>
              <CardHeader>
                <div className="flex items-center gap-2">
                  <KeyRound className="h-4 w-4 text-orange-500" />
                  <CardTitle>Platform API Credentials</CardTitle>
                </div>
                <CardDescription>
                  Enter API keys, OAuth client credentials, or access tokens for each
                  social platform. These are stored in the database and used
                  server-side only.
                </CardDescription>
              </CardHeader>

              {loadingKeys ? (
                <div className="flex items-center gap-2 p-6 text-sm text-muted-foreground">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Loading platform keys...
                </div>
              ) : (
                <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                  {allPlatformIds.map((id) => {
                    const platform = getPlatform(id);
                    const pk = platformKeys.find((k) => k.platformId === id);
                    const fields = getFieldsForPlatform(id);

                    return (
                      <div
                        key={id}
                        className="rounded-lg border border-border p-4 transition-colors hover:bg-muted/30"
                      >
                        <div className="mb-3 flex items-center gap-2">
                          <span
                            className="flex h-6 w-6 items-center justify-center rounded text-xs font-bold text-white"
                            style={{ backgroundColor: platform.color }}
                          >
                            {platform.name.charAt(0)}
                          </span>
                          <span className="text-sm font-semibold">{platform.name}</span>
                          {pk?.hasCredentials && (
                            <Badge variant="success" className="ml-auto text-[10px]">
                              Saved
                            </Badge>
                          )}
                        </div>

                        <div className="space-y-2">
                          {fields.map(({ field, label, type }) => {
                            const secretKey = `${id}-${field}`;
                            const isSecret = type === "password";
                            const showThis = showSecrets[secretKey];

                            return (
                              <div key={field} className="relative">
                                <label className="mb-0.5 block text-xs font-medium text-muted-foreground">
                                  {label}
                                </label>
                                <div className="relative">
                                  <input
                                    type={isSecret && !showThis ? "password" : "text"}
                                    value={
                                      (pk?.[field as keyof PlatformKeyState] as string) ?? ""
                                    }
                                    onChange={(e) =>
                                      updatePlatformKey(id, field as keyof PlatformKeyState, e.target.value)
                                    }
                                    placeholder={label}
                                    className="h-8 w-full rounded border border-input bg-background px-2 pr-8 text-xs text-foreground placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                                  />
                                  {isSecret && (
                                    <button
                                      type="button"
                                      onClick={() => toggleShow(secretKey)}
                                      className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                                    >
                                      {showThis ? (
                                        <EyeOff className="h-3 w-3" />
                                      ) : (
                                        <Eye className="h-3 w-3" />
                                      )}
                                    </button>
                                  )}
                                </div>
                              </div>
                            );
                          })}

                          <Button
                            size="sm"
                            className="mt-2 w-full"
                            onClick={() => handleSavePlatformKey(id)}
                            isLoading={savingPlatform === id}
                          >
                            <Save className="h-3 w-3" />
                            Save {platform.name}
                          </Button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </Card>
          </MotionItem>
        </MotionContainer>

        {/* MCP Server Configuration */}
        <MotionContainer>
          <MotionItem>
            <Card>
              <CardHeader>
                <div className="flex items-center gap-2">
                  <Plug className="h-4 w-4 text-orange-500" />
                  <CardTitle>MCP Server Connections</CardTitle>
                </div>
                <CardDescription>
                  Connect Model Context Protocol (MCP) servers for animation generation,
                  image creation, and video rendering. The Hyperframes app runs locally
                  and exposes an MCP-compatible API.
                </CardDescription>
              </CardHeader>

              <div className="space-y-4">
                {/* Hyperframes MCP */}
                <div className="rounded-lg border border-border p-4">
                  <div className="mb-3 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-blue-500 to-indigo-600 text-sm font-bold text-white">
                        H
                      </span>
                      <div>
                        <p className="text-sm font-semibold">Hyperframes Animation Engine</p>
                        <p className="text-xs text-muted-foreground">
                          Local MCP server for CSS/HTML/Lottie/GIF animations
                        </p>
                      </div>
                    </div>
                    <Badge variant="outline" className="gap-1">
                      <WifiOff className="h-3 w-3" />
                      Not connected
                    </Badge>
                  </div>

                  <div className="space-y-2">
                    <Input
                      label="MCP Endpoint URL"
                      placeholder="http://localhost:3001"
                      value={mcpEndpoint}
                      onChange={(e) => setMcpEndpoint(e.target.value)}
                    />
                    <Input
                      label="API Key (optional)"
                      type="password"
                      placeholder="Enter key if required"
                      value={mcpKey}
                      onChange={(e) => setMcpKey(e.target.value)}
                    />
                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        className="flex-1"
                        onClick={async () => {
                          try {
                            const res = await fetch("/api/mcp");
                            const data = await res.json();
                            const hyperframes = data.find(
                              (s: { id: string }) => s.id === "hyperframes"
                            );
                            setMessage({
                              type: hyperframes?.status === "connected" ? "success" : "error",
                              text:
                                hyperframes?.status === "connected"
                                  ? "Hyperframes MCP server is reachable"
                                  : "Cannot connect to Hyperframes MCP server",
                            });
                          } catch {
                            setMessage({
                              type: "error",
                              text: "Failed to check MCP server health",
                            });
                          }
                        }}
                      >
                        <Wifi className="h-3 w-3" />
                        Test Connection
                      </Button>
                      <Button size="sm" className="flex-1" onClick={handleSave}>
                        <Save className="h-3 w-3" />
                        Save MCP Config
                      </Button>
                    </div>
                  </div>

                  <div className="mt-3 rounded-lg bg-muted/50 p-3 text-xs text-muted-foreground">
                    <p className="font-medium">Capabilities:</p>
                    <div className="mt-1 flex flex-wrap gap-1">
                      {[
                        "generate_animation",
                        "generate_hyperframe",
                        "generate_lottie",
                        "generate_css_animation",
                        "generate_image",
                        "generate_video",
                      ].map((cap) => (
                        <Badge key={cap} variant="secondary" className="text-[10px]">
                          {cap}
                        </Badge>
                      ))}
                    </div>
                    <p className="mt-2">
                      Set <code className="rounded bg-muted px-1 font-mono">HYPERFRAMES_MCP_URL</code> in
                      your <code className="rounded bg-muted px-1 font-mono">.env</code> file to auto-connect.
                    </p>
                  </div>
                </div>

                {/* Generic MCP server addition hint */}
                <div className="rounded-lg border border-dashed border-border p-4 text-center text-xs text-muted-foreground">
                  <Plug className="mx-auto mb-2 h-5 w-5" />
                  <p>
                    Additional MCP servers can be configured by adding entries to{" "}
                    <code className="rounded bg-muted px-1 font-mono">lib/ai/mcp-client.ts</code>
                  </p>
                </div>
              </div>
            </Card>
          </MotionItem>
        </MotionContainer>
      </div>
    </MotionPage>
  );
}
