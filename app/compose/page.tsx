"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { CalendarClock, Image, AlertTriangle, CheckCircle2 } from "lucide-react";
import { Card, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { AiAssistantPanel } from "@/components/ai/ai-assistant-panel";
import {
  MotionContainer,
  MotionItem,
  MotionPage,
} from "@/components/motion/motion-wrapper";
import { allPlatformIds, getPlatform } from "@/lib/platforms/registry";

const formats = [
  { value: "post", label: "Standard Post" },
  { value: "thread", label: "Thread / Series" },
  { value: "story", label: "Story" },
  { value: "reel", label: "Reel / Short" },
  { value: "image", label: "Image Post" },
  { value: "video", label: "Video Post" },
  { value: "gif", label: "GIF Post" },
  { value: "article", label: "Article / Newsletter" },
];

export default function ComposePage() {
  const router = useRouter();
  const [content, setContent] = useState("");
  const [title, setTitle] = useState("");
  const [format, setFormat] = useState("post");
  const [selectedPlatforms, setSelectedPlatforms] = useState<string[]>([]);
  const [scheduledAt, setScheduledAt] = useState("");
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

  const togglePlatform = (id: string) => {
    setSelectedPlatforms((prev) =>
      prev.includes(id) ? prev.filter((p) => p !== id) : [...prev, id]
    );
  };

  const handleApplyAi = (text: string) => {
    setContent(text);
  };

  const handleSubmit = async (status: "draft" | "scheduled") => {
    if (!content.trim()) {
      setMessage({ type: "error", text: "Content is required." });
      return;
    }
    if (status === "scheduled" && selectedPlatforms.length === 0) {
      setMessage({ type: "error", text: "Select at least one platform to schedule." });
      return;
    }
    if (status === "scheduled" && !scheduledAt) {
      setMessage({ type: "error", text: "Select a schedule date and time." });
      return;
    }

    setSaving(true);
    setMessage(null);

    try {
      const res = await fetch("/api/posts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title,
          content,
          format,
          status,
          scheduledAt: scheduledAt || null,
          platformIds: status === "scheduled" ? selectedPlatforms : [],
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setMessage({ type: "error", text: data.error ?? "Save failed" });
      } else {
        setMessage({
          type: "success",
          text:
            status === "scheduled"
              ? "Post scheduled and queued for approval."
              : "Draft saved successfully.",
        });
        if (status === "scheduled") {
          setTimeout(() => router.push("/calendar"), 800);
        }
      }
    } catch (err) {
      setMessage({ type: "error", text: err instanceof Error ? err.message : "Unknown error" });
    } finally {
      setSaving(false);
    }
  };

  return (
    <MotionPage>
      <div className="space-y-6">
        <MotionContainer>
          <MotionItem>
            <h1 className="text-2xl font-semibold tracking-tight sm:text-3xl">
              Compose
            </h1>
          </MotionItem>
          <MotionItem>
            <p className="mt-1 text-sm text-muted-foreground">
              Draft content, get AI suggestions, and schedule human-approved posts.
            </p>
          </MotionItem>
        </MotionContainer>

        <div className="grid gap-6 lg:grid-cols-3">
          {/* Composer */}
          <MotionContainer className="space-y-6 lg:col-span-2">
            <MotionItem>
              <Card>
                <CardHeader>
                  <CardTitle>New Post</CardTitle>
                  <CardDescription>
                    Compose a post that can be tailored for each connected platform.
                  </CardDescription>
                </CardHeader>

                <div className="space-y-4">
                  <Input
                    label="Title / Headline (optional)"
                    placeholder="e.g., Product Launch Announcement"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                  />

                  <Select
                    label="Content Format"
                    value={format}
                    onChange={(e) => setFormat(e.target.value)}
                    options={formats}
                  />

                  <Textarea
                    label="Content"
                    placeholder="What do you want to share?"
                    value={content}
                    onChange={(e) => setContent(e.target.value)}
                    className="min-h-[180px]"
                  />

                  <div className="flex items-center gap-2 rounded-lg border border-dashed border-border p-4 text-sm text-muted-foreground">
                    <Image className="h-4 w-4" />
                    <span>Drag images, videos, or GIFs here (placeholder)</span>
                  </div>

                  <div>
                    <label className="mb-2 block text-sm font-medium text-foreground">
                      Target Platforms
                    </label>
                    <div className="flex flex-wrap gap-2">
                      {allPlatformIds.map((id) => {
                        const platform = getPlatform(id);
                        const selected = selectedPlatforms.includes(id);
                        return (
                          <button
                            key={id}
                            type="button"
                            onClick={() => togglePlatform(id)}
                            className={`inline-flex items-center gap-2 rounded-full border px-3 py-1.5 text-xs font-medium transition-colors ${
                              selected
                                ? "border-primary bg-primary/10 text-primary"
                                : "border-border bg-card text-muted-foreground hover:bg-muted"
                            }`}
                          >
                            <span
                              className="h-2 w-2 rounded-full"
                              style={{ backgroundColor: platform.color }}
                            />
                            {platform.name}
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  <div className="grid gap-4 sm:grid-cols-2">
                    <Input
                      label="Schedule Date / Time"
                      type="datetime-local"
                      value={scheduledAt}
                      onChange={(e) => setScheduledAt(e.target.value)}
                    />
                  </div>

                  {message && (
                    <div
                      className={`flex items-start gap-2 rounded-lg p-3 text-sm ${
                        message.type === "success"
                          ? "bg-green-50 text-green-800"
                          : "bg-red-50 text-red-800"
                      }`}
                    >
                      {message.type === "success" ? (
                        <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0" />
                      ) : (
                        <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
                      )}
                      {message.text}
                    </div>
                  )}

                  <div className="flex flex-col gap-3 pt-2 sm:flex-row">
                    <Button
                      variant="outline"
                      className="sm:flex-1"
                      onClick={() => handleSubmit("draft")}
                      isLoading={saving}
                    >
                      Save Draft for Review
                    </Button>
                    <Button
                      className="sm:flex-1"
                      onClick={() => handleSubmit("scheduled")}
                      isLoading={saving}
                      disabled={!content.trim()}
                    >
                      <CalendarClock className="h-4 w-4" />
                      Schedule Approval
                    </Button>
                  </div>
                </div>
              </Card>
            </MotionItem>

            {/* Safety notice */}
            <MotionItem>
              <div className="flex items-start gap-3 rounded-lg border border-orange-200 bg-orange-50/50 p-4 text-sm text-orange-900">
                <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
                <div>
                  <p className="font-medium">Human-in-the-loop required</p>
                  <p className="text-orange-800/80">
                    Nothing is published automatically. Scheduled posts are queued for
                    your explicit final approval before calling any platform API.
                  </p>
                </div>
              </div>
            </MotionItem>
          </MotionContainer>

          {/* AI Assistant */}
          <MotionContainer className="lg:col-span-1">
            <MotionItem>
              <AiAssistantPanel onApply={handleApplyAi} />
            </MotionItem>
          </MotionContainer>
        </div>
      </div>
    </MotionPage>
  );
}
