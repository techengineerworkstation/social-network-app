"use client";

import { useState, useRef, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Image,
  Video,
  Wand2,
  Upload,
  Link as LinkIcon,
  Clipboard,
  Loader2,
  X,
  Sparkles,
  Film,
  Layers,
} from "lucide-react";
import { Card, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";

export interface MediaAttachment {
  id: string;
  type: "image" | "video" | "animation" | "gif";
  url: string;
  name: string;
  source: "generated" | "uploaded" | "pasted" | "url" | "dragged";
  thumbnail?: string;
}

interface MediaGeneratorProps {
  onAttach: (media: MediaAttachment) => void;
  attachments: MediaAttachment[];
  onRemove: (id: string) => void;
}

const tabs = [
  { id: "generate", label: "AI Generate", icon: Wand2 },
  { id: "upload", label: "Upload", icon: Upload },
  { id: "paste", label: "Paste / URL", icon: Clipboard },
] as const;

const aiTypes = [
  { id: "image", label: "Image", icon: Image, endpoint: "/api/ai/generate-image" },
  { id: "animation", label: "Animation", icon: Layers, endpoint: "/api/ai/generate-animation" },
  { id: "video", label: "Video", icon: Film, endpoint: "/api/ai/generate-video" },
] as const;

const imageProviders = [
  { value: "huggingface", label: "Hugging Face (Free)" },
  { value: "replicate", label: "Replicate" },
  { value: "hyperframes", label: "Hyperframes MCP" },
];

const videoProviders = [
  { value: "replicate", label: "Replicate" },
  { value: "hyperframes", label: "Hyperframes MCP" },
];

const animationStyles = [
  { value: "hyperframe", label: "Hyperframe" },
  { value: "lottie", label: "Lottie" },
  { value: "css", label: "CSS Animation" },
  { value: "gif", label: "GIF" },
];

let mediaCounter = 0;
function newMediaId() {
  return `media-${Date.now()}-${++mediaCounter}`;
}

export function MediaGenerator({
  onAttach,
  attachments,
  onRemove,
}: MediaGeneratorProps) {
  const [activeTab, setActiveTab] = useState<"generate" | "upload" | "paste">("generate");
  const [aiType, setAiType] = useState<"image" | "animation" | "video">("image");
  const [prompt, setPrompt] = useState("");
  const [provider, setProvider] = useState("huggingface");
  const [animStyle, setAnimStyle] = useState("hyperframe");
  const [mcpEndpoint, setMcpEndpoint] = useState("http://localhost:3001");
  const [generating, setGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Paste / URL
  const [urlInput, setUrlInput] = useState("");
  const [pastePreview, setPastePreview] = useState<string | null>(null);

  // Upload
  const fileInputRef = useRef<HTMLInputElement>(null);
  const dropZoneRef = useRef<HTMLDivElement>(null);
  const [dragging, setDragging] = useState(false);

  // ── AI Generate ──────────────────────────────
  const handleGenerate = async () => {
    if (!prompt.trim()) return;
    setGenerating(true);
    setError(null);

    try {
      const endpoint = aiTypes.find((t) => t.id === aiType)?.endpoint ?? "/api/ai/generate-image";
      const body: Record<string, unknown> = {
        prompt,
        provider: aiType === "animation" ? "hyperframes" : provider,
        model: undefined,
      };

      if (aiType === "animation") {
        body.type = animStyle;
        body.mcpEndpoint = mcpEndpoint;
      }

      const res = await fetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });

      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? "Generation failed");
        return;
      }

      const url =
        data.imageUrl ??
        data.imageBase64 ??
        data.videoUrl ??
        data.animationUrl ??
        data.animationHtml ??
        "";

      if (!url) {
        setError("No output returned from provider");
        return;
      }

      onAttach({
        id: newMediaId(),
        type: aiType === "animation" ? "animation" : aiType === "video" ? "video" : "image",
        url,
        name: `${aiType}-${prompt.slice(0, 30).replace(/\s+/g, "-")}`,
        source: "generated",
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unknown error");
    } finally {
      setGenerating(false);
    }
  };

  // ── File handling ────────────────────────────
  const handleFiles = useCallback(
    (files: FileList | File[]) => {
      Array.from(files).forEach((file) => {
        const isVideo = file.type.startsWith("video/");
        const isImage = file.type.startsWith("image/");
        if (!isVideo && !isImage) return;

        const reader = new FileReader();
        reader.onload = () => {
          onAttach({
            id: newMediaId(),
            type: isVideo ? "video" : "image",
            url: reader.result as string,
            name: file.name,
            source: "uploaded",
          });
        };
        reader.readAsDataURL(file);
      });
    },
    [onAttach]
  );

  // ── Paste handler ────────────────────────────
  const handlePaste = useCallback(
    (e: React.ClipboardEvent) => {
      const items = e.clipboardData?.items;
      if (!items) return;

      const files: File[] = [];
      for (const item of Array.from(items)) {
        if (item.kind === "file") {
          const file = item.getAsFile();
          if (file) files.push(file);
        }
      }

      if (files.length > 0) {
        handleFiles(files);
        return;
      }

      // Check for text that looks like a URL
      const text = e.clipboardData.getData("text/plain");
      if (text && (text.startsWith("http") || text.startsWith("data:"))) {
        const isVideo = /\.(mp4|webm|ogg|mov)$/i.test(text);
        onAttach({
          id: newMediaId(),
          type: isVideo ? "video" : "image",
          url: text,
          name: text.split("/").pop() ?? "pasted-media",
          source: "pasted",
        });
      }
    },
    [handleFiles, onAttach]
  );

  // ── URL input ────────────────────────────────
  const handleUrlSubmit = () => {
    if (!urlInput.trim()) return;
    const isVideo = /\.(mp4|webm|ogg|mov)$/i.test(urlInput);
    const isAnimation = /\.(json|lottie|gif)$/i.test(urlInput);

    onAttach({
      id: newMediaId(),
      type: isAnimation ? "animation" : isVideo ? "video" : "image",
      url: urlInput,
      name: urlInput.split("/").pop() ?? "url-media",
      source: "url",
    });
    setUrlInput("");
  };

  // ── Drag and drop ────────────────────────────
  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragging(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragging(false);
  }, []);

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      e.stopPropagation();
      setDragging(false);

      // Handle files
      if (e.dataTransfer.files.length > 0) {
        handleFiles(e.dataTransfer.files);
        return;
      }

      // Handle URLs
      const url = e.dataTransfer.getData("text/uri-list") || e.dataTransfer.getData("text/plain");
      if (url && url.startsWith("http")) {
        const isVideo = /\.(mp4|webm|ogg|mov)$/i.test(url);
        onAttach({
          id: newMediaId(),
          type: isVideo ? "video" : "image",
          url,
          name: url.split("/").pop() ?? "dropped-media",
          source: "dragged",
        });
      }
    },
    [handleFiles, onAttach]
  );

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center gap-2">
          <Image className="h-4 w-4 text-orange-500" />
          <CardTitle>Media</CardTitle>
        </div>
        <CardDescription>
          Generate, upload, paste, or drag-and-drop images, animations, and videos.
        </CardDescription>
      </CardHeader>

      {/* Attached media preview */}
      {attachments.length > 0 && (
        <div className="mb-4 flex flex-wrap gap-3 px-5">
          {attachments.map((att) => (
            <div
              key={att.id}
              className="group relative h-24 w-24 overflow-hidden rounded-lg border border-border"
            >
              {att.type === "video" ? (
                <video
                  src={att.url}
                  className="h-full w-full object-cover"
                  muted
                  loop
                  playsInline
                />
              ) : att.url.startsWith("data:") || att.url.startsWith("http") ? (
                <img
                  src={att.url}
                  alt={att.name}
                  className="h-full w-full object-cover"
                />
              ) : (
                <div className="flex h-full w-full items-center justify-center bg-muted text-xs text-muted-foreground">
                  {att.type}
                </div>
              )}
              <button
                onClick={() => onRemove(att.id)}
                className="absolute right-1 top-1 flex h-5 w-5 items-center justify-center rounded-full bg-black/60 text-white opacity-0 transition-opacity group-hover:opacity-100"
              >
                <X className="h-3 w-3" />
              </button>
              <span className="absolute bottom-0 left-0 right-0 bg-black/50 px-1 py-0.5 text-center text-[9px] text-white">
                {att.source}
              </span>
            </div>
          ))}
        </div>
      )}

      {/* Tabs */}
      <div className="flex gap-1 border-b border-border px-5">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-1.5 border-b-2 px-3 py-2 text-xs font-medium transition-colors ${
                activeTab === tab.id
                  ? "border-orange-500 text-foreground"
                  : "border-transparent text-muted-foreground hover:text-foreground"
              }`}
            >
              <Icon className="h-3.5 w-3.5" />
              {tab.label}
            </button>
          );
        })}
      </div>

      <div className="space-y-4 p-5">
        {/* ── AI Generate Tab ────────────────── */}
        {activeTab === "generate" && (
          <div className="space-y-4">
            {/* Type selector */}
            <div className="flex gap-2">
              {aiTypes.map((t) => {
                const Icon = t.icon;
                return (
                  <button
                    key={t.id}
                    onClick={() => setAiType(t.id)}
                    className={`flex items-center gap-2 rounded-lg border px-3 py-2 text-xs font-medium transition-colors ${
                      aiType === t.id
                        ? "border-orange-300 bg-orange-50 text-orange-700"
                        : "border-border text-muted-foreground hover:bg-muted"
                    }`}
                  >
                    <Icon className="h-3.5 w-3.5" />
                    {t.label}
                  </button>
                );
              })}
            </div>

            {/* Provider / style */}
            {aiType === "image" && (
              <Select
                label="Image Provider"
                value={provider}
                onChange={(e) => setProvider(e.target.value)}
                options={imageProviders}
              />
            )}
            {aiType === "video" && (
              <Select
                label="Video Provider"
                value={provider}
                onChange={(e) => setProvider(e.target.value)}
                options={videoProviders}
              />
            )}
            {aiType === "animation" && (
              <>
                <Select
                  label="Animation Style"
                  value={animStyle}
                  onChange={(e) => setAnimStyle(e.target.value)}
                  options={animationStyles}
                />
                <Input
                  label="Hyperframes MCP Endpoint"
                  value={mcpEndpoint}
                  onChange={(e) => setMcpEndpoint(e.target.value)}
                  placeholder="http://localhost:3001"
                />
              </>
            )}

            <Textarea
              label="Describe what to create"
              placeholder={
                aiType === "image"
                  ? "e.g., A futuristic cityscape at sunset with neon lights"
                  : aiType === "animation"
                  ? "e.g., A bouncing ball with elastic ease, looping infinitely"
                  : "e.g., A short clip of waves crashing on a beach at golden hour"
              }
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              className="min-h-[100px]"
            />

            {error && (
              <div className="rounded-lg bg-red-50 p-3 text-sm text-red-800">
                {error}
              </div>
            )}

            <Button
              onClick={handleGenerate}
              isLoading={generating}
              disabled={!prompt.trim()}
              className="w-full"
            >
              <Sparkles className="h-4 w-4" />
              Generate {aiType === "image" ? "Image" : aiType === "video" ? "Video" : "Animation"}
            </Button>
          </div>
        )}

        {/* ── Upload Tab ─────────────────────── */}
        {activeTab === "upload" && (
          <div className="space-y-4">
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*,video/*,.gif,.lottie,.json"
              multiple
              className="hidden"
              onChange={(e) => {
                if (e.target.files) handleFiles(e.target.files);
              }}
            />

            <div
              ref={dropZoneRef}
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onDrop={handleDrop}
              onPaste={handlePaste}
              tabIndex={0}
              className={`flex cursor-pointer flex-col items-center justify-center gap-3 rounded-xl border-2 border-dashed p-8 transition-colors ${
                dragging
                  ? "border-orange-400 bg-orange-50"
                  : "border-border hover:border-orange-300 hover:bg-muted/50"
              }`}
              onClick={() => fileInputRef.current?.click()}
            >
              <Upload
                className={`h-8 w-8 ${dragging ? "text-orange-500" : "text-muted-foreground"}`}
              />
              <div className="text-center">
                <p className="text-sm font-medium">
                  {dragging ? "Drop files here" : "Click, drag, or paste files"}
                </p>
                <p className="text-xs text-muted-foreground">
                  Supports images (PNG, JPG, WebP), videos (MP4, WebM), GIFs, and Lottie JSON
                </p>
              </div>
              <Badge variant="outline" className="text-[10px]">
                Ctrl+V to paste from clipboard
              </Badge>
            </div>
          </div>
        )}

        {/* ── Paste / URL Tab ────────────────── */}
        {activeTab === "paste" && (
          <div className="space-y-4">
            {/* Clipboard paste area */}
            <div
              onPaste={handlePaste}
              tabIndex={0}
              className="flex flex-col items-center justify-center gap-3 rounded-xl border-2 border-dashed border-border p-6 transition-colors hover:border-orange-300 focus:border-orange-400 focus:outline-none"
            >
              <Clipboard className="h-6 w-6 text-muted-foreground" />
              <p className="text-sm text-muted-foreground">
                Click here and press <kbd className="rounded border border-border bg-muted px-1.5 py-0.5 text-xs font-mono">Ctrl+V</kbd> to paste an image or URL
              </p>
            </div>

            {/* URL input */}
            <div className="flex gap-2">
              <div className="flex-1">
                <Input
                  label="Or enter a media URL"
                  placeholder="https://example.com/image.png"
                  value={urlInput}
                  onChange={(e) => setUrlInput(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") handleUrlSubmit();
                  }}
                />
              </div>
              <div className="flex items-end">
                <Button onClick={handleUrlSubmit} disabled={!urlInput.trim()} variant="outline">
                  <LinkIcon className="h-4 w-4" />
                  Add
                </Button>
              </div>
            </div>

            {/* Preview */}
            {pastePreview && (
              <div className="relative overflow-hidden rounded-lg border border-border">
                <img src={pastePreview} alt="Preview" className="max-h-48 w-full object-contain" />
                <button
                  onClick={() => setPastePreview(null)}
                  className="absolute right-2 top-2 rounded-full bg-black/60 p-1 text-white"
                >
                  <X className="h-3 w-3" />
                </button>
              </div>
            )}
          </div>
        )}
      </div>
    </Card>
  );
}
