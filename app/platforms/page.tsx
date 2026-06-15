"use client";

import { useEffect, useState } from "react";
import { ExternalLink, CheckCircle2, AlertCircle, Loader2 } from "lucide-react";
import { Card, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  MotionContainer,
  MotionItem,
  MotionPage,
  MotionCard,
} from "@/components/motion/motion-wrapper";
import { allPlatformIds, getPlatform } from "@/lib/platforms/registry";
import { PlatformId } from "@/lib/types/platform";

interface Account {
  id: string;
  platformId: PlatformId;
  handle: string;
  displayName: string;
  status: "active" | "expired" | "error";
}

export default function PlatformsPage() {
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetch("/api/accounts")
      .then((res) => res.json())
      .then((data) => {
        if (Array.isArray(data)) {
          setAccounts(data);
        } else {
          setError(data.error ?? "Failed to load accounts");
        }
      })
      .catch((err) => setError(err instanceof Error ? err.message : "Unknown error"))
      .finally(() => setLoading(false));
  }, []);

  const isConnected = (id: PlatformId) =>
    accounts.some((a) => a.platformId === id && a.status === "active");

  return (
    <MotionPage>
      <div className="space-y-6">
        <MotionContainer>
          <MotionItem>
            <h1 className="text-2xl font-semibold tracking-tight sm:text-3xl">
              Platform Connections
            </h1>
          </MotionItem>
          <MotionItem>
            <p className="mt-1 text-sm text-muted-foreground">
              Connect official APIs to publish, schedule, and analyze content.
            </p>
          </MotionItem>
        </MotionContainer>

        {loading && (
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Loader2 className="h-4 w-4 animate-spin" />
            Loading accounts...
          </div>
        )}

        {error && (
          <div className="rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-800">
            {error}
          </div>
        )}

        <MotionContainer className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {allPlatformIds.map((id) => {
            const platform = getPlatform(id);
            const connected = isConnected(id);

            return (
              <MotionCard key={id}>
                <Card className="flex h-full flex-col">
                  <CardHeader>
                    <div className="flex items-center gap-3">
                      <span
                        className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg text-white shadow-sm"
                        style={{ backgroundColor: platform.color }}
                      >
                        {platform.name.charAt(0)}
                      </span>
                      <div>
                        <CardTitle>{platform.name}</CardTitle>
                        <CardDescription>
                          {connected ? "Connected" : "Not connected"}
                        </CardDescription>
                      </div>
                    </div>
                    {connected ? (
                      <Badge variant="success" className="gap-1">
                        <CheckCircle2 className="h-3 w-3" />
                        Active
                      </Badge>
                    ) : (
                      <Badge variant="outline">Disconnected</Badge>
                    )}
                  </CardHeader>

                  <div className="flex-1 space-y-3 px-5 pb-5">
                    <p className="text-sm text-muted-foreground">
                      {platform.description}
                    </p>
                    <div className="flex flex-wrap gap-1">
                      {platform.capabilities.slice(0, 4).map((cap) => (
                        <Badge key={cap} variant="secondary" className="text-[10px]">
                          {cap}
                        </Badge>
                      ))}
                    </div>
                    {platform.notes && (
                      <div className="flex items-start gap-2 rounded-lg bg-yellow-50 p-2 text-xs text-yellow-800">
                        <AlertCircle className="mt-0.5 h-3 w-3 shrink-0" />
                        {platform.notes}
                      </div>
                    )}
                  </div>

                  <div className="flex items-center gap-2 border-t border-border p-5">
                    <a
                      href={platform.auth.docsUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex flex-1 items-center justify-center gap-1 rounded-lg border border-border bg-transparent px-3 py-1.5 text-sm font-medium text-foreground transition-colors hover:bg-muted"
                    >
                      <ExternalLink className="h-3 w-3" />
                      Docs
                    </a>
                    <Button size="sm" className="flex-1">
                      {connected ? "Manage" : "Connect"}
                    </Button>
                  </div>
                </Card>
              </MotionCard>
            );
          })}
        </MotionContainer>
      </div>
    </MotionPage>
  );
}
