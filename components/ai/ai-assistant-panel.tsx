"use client";

import { useState } from "react";
import { Sparkles, AlertCircle } from "lucide-react";
import { Card, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Select } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  aiProviders,
  AiProviderId,
  getAiProvider,
} from "@/lib/ai/providers";

interface AiAssistantPanelProps {
  onApply: (text: string) => void;
}

export function AiAssistantPanel({ onApply }: AiAssistantPanelProps) {
  const [provider, setProvider] = useState<AiProviderId>("gemini");
  const [model, setModel] = useState<string>(aiProviders.gemini.defaultModel);
  const [apiKey, setApiKey] = useState("");
  const [prompt, setPrompt] = useState("");
  const [generated, setGenerated] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const providerInfo = getAiProvider(provider);

  const handleProviderChange = (value: string) => {
    const next = value as AiProviderId;
    setProvider(next);
    setModel(aiProviders[next].defaultModel);
    setError(null);
  };

  const handleGenerate = async () => {
    if (!prompt.trim()) return;
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/ai/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          provider,
          model,
          prompt,
          apiKey: apiKey || undefined,
          temperature: 0.7,
          maxTokens: 400,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? "Generation failed");
      } else {
        setGenerated(data.text ?? "");
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unknown error");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card className="h-full border-magenta-200/50 bg-gradient-to-br from-card to-magenta-50/30">
      <CardHeader>
        <div className="flex items-center gap-2">
          <Sparkles className="h-4 w-4 text-orange-500" />
          <CardTitle>AI Assistant</CardTitle>
        </div>
        <CardDescription>
          Generate post drafts using free generative AI APIs. All output is
          reviewed by a human before publishing.
        </CardDescription>
      </CardHeader>

      <div className="space-y-4">
        <Select
          label="AI Provider"
          value={provider}
          onChange={(e) => handleProviderChange(e.target.value)}
          options={Object.values(aiProviders).map((p) => ({
            value: p.id,
            label: p.name,
          }))}
        />

        <Select
          label="Model"
          value={model}
          onChange={(e) => setModel(e.target.value)}
          options={providerInfo.models.map((m) => ({
            value: m,
            label: m,
          }))}
        />

        {providerInfo.authType === "api-key" && (
          <Input
            label="API Key"
            type="password"
            placeholder={`Enter your ${providerInfo.name} API key`}
            value={apiKey}
            onChange={(e) => setApiKey(e.target.value)}
          />
        )}

        {provider === "ollama" && (
          <Input
            label="Ollama Base URL"
            placeholder="http://localhost:11434"
            value={apiKey}
            onChange={(e) => setApiKey(e.target.value)}
          />
        )}

        <div className="flex flex-wrap gap-2">
          <Badge variant="secondary">{providerInfo.authType === "none" ? "No key" : "API key"}</Badge>
          {providerInfo.supportsImages && <Badge variant="outline">Images</Badge>}
          {providerInfo.supportsStreaming && <Badge variant="outline">Streaming</Badge>}
          <a
            href={providerInfo.docsUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="text-xs text-muted-foreground underline hover:text-foreground"
          >
            {providerInfo.name} docs
          </a>
        </div>

        <Textarea
          label="What should the AI write?"
          placeholder="e.g., A friendly announcement about our new product launch for LinkedIn and Mastodon"
          value={prompt}
          onChange={(e) => setPrompt(e.target.value)}
          className="min-h-[120px]"
        />

        <Button
          onClick={handleGenerate}
          isLoading={loading}
          disabled={!prompt.trim()}
          className="w-full"
        >
          <Sparkles className="h-4 w-4" />
          Generate Draft
        </Button>

        {error && (
          <div className="flex items-start gap-2 rounded-lg bg-red-50 p-3 text-sm text-red-800">
            <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
            {error}
          </div>
        )}

        {generated && (
          <div className="space-y-2">
            <label className="text-sm font-medium text-foreground">
              Generated Draft
            </label>
            <div className="rounded-lg border border-border bg-background p-3 text-sm text-foreground">
              {generated}
            </div>
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                className="flex-1"
                onClick={() => setGenerated("")}
              >
                Discard
              </Button>
              <Button
                size="sm"
                className="flex-1"
                onClick={() => onApply(generated)}
              >
                Apply to Composer
              </Button>
            </div>
          </div>
        )}
      </div>
    </Card>
  );
}
