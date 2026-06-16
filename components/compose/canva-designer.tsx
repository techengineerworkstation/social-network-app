"use client";

import { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Palette,
  Plus,
  Download,
  ExternalLink,
  Loader2,
  Image as ImageIcon,
  Film,
  FileText,
  Trash2,
  RefreshCw,
  Search,
} from "lucide-react";
import { Card, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Select } from "@/components/ui/select";
import type { MediaAttachment } from "./media-generator";

interface CanvaDesign {
  id: string;
  title: string;
  thumbnail: { url: string; width: number; height: number };
  urls: { edit_url: string; view_url: string };
  page_count: number;
  design_type: { type: string; name: string };
  updated_at: number;
}

interface CanvaDesignerProps {
  onAttach: (media: MediaAttachment) => void;
}

const designTypes = [
  { value: "presentation", label: "Presentation" },
  { value: "social_media", label: "Social Media Post" },
  { value: "video", label: "Video" },
  { value: "instagram_post", label: "Instagram Post" },
  { value: "instagram_story", label: "Instagram Story" },
  { value: "facebook_post", label: "Facebook Post" },
  { value: "twitter_post", label: "X / Twitter Post" },
  { value: "linkedin_post", label: "LinkedIn Post" },
  { value: "youtube_thumbnail", label: "YouTube Thumbnail" },
  { value: "tiktok_video", label: "TikTok Video" },
  { value: "pinterest_pin", label: "Pinterest Pin" },
  { value: "poster", label: "Poster" },
  { value: "logo", label: "Logo" },
  { value: "flyer", label: "Flyer" },
  { value: "banner", label: "Banner" },
];

const exportFormats = [
  { value: "png", label: "PNG (Image)" },
  { value: "jpg", label: "JPG (Image)" },
  { value: "pdf", label: "PDF (Document)" },
  { value: "mp4", label: "MP4 (Video)" },
  { value: "gif", label: "GIF (Animation)" },
];

let mediaCounter = 0;

export function CanvaDesigner({ onAttach }: CanvaDesignerProps) {
  const [connected, setConnected] = useState(false);
  const [checking, setChecking] = useState(true);
  const [designs, setDesigns] = useState<CanvaDesign[]>([]);
  const [loading, setLoading] = useState(false);
  const [creating, setCreating] = useState(false);
  const [exporting, setExporting] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [designTitle, setDesignTitle] = useState("");
  const [designType, setDesignType] = useState("social_media");
  const [exportFormat, setExportFormat] = useState("png");
  const [selectedDesign, setSelectedDesign] = useState<CanvaDesign | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [showCreate, setShowCreate] = useState(false);

  const checkConnection = useCallback(async () => {
    setChecking(true);
    try {
      const res = await fetch("/api/canva?action=designs&limit=1");
      if (res.ok) {
        setConnected(true);
        loadDesigns();
      } else {
        setConnected(false);
      }
    } catch {
      setConnected(false);
    } finally {
      setChecking(false);
    }
  }, []);

  useEffect(() => {
    checkConnection();
  }, [checkConnection]);

  const loadDesigns = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/canva?action=designs&limit=30");
      const data = await res.json();
      if (res.ok) {
        setDesigns(data.designs ?? []);
      } else {
        setError(data.error ?? "Failed to load designs");
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load designs");
    } finally {
      setLoading(false);
    }
  };

  const handleConnect = async () => {
    try {
      const res = await fetch("/api/canva?action=auth-url");
      const data = await res.json();
      if (data.url) {
        window.open(data.url, "_blank", "width=800,height=600");
      } else {
        setError(data.error ?? "Failed to get auth URL");
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Connection failed");
    }
  };

  const handleCreateDesign = async () => {
    setCreating(true);
    setError(null);
    try {
      const res = await fetch("/api/canva", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "create-design",
          title: designTitle || "New Design",
          design_type: { type: designType },
        }),
      });
      const data = await res.json();
      if (res.ok && data.design) {
        // Open Canva editor
        window.open(data.design.urls.edit_url, "_blank");
        setShowCreate(false);
        setDesignTitle("");
        // Refresh designs list
        setTimeout(loadDesigns, 2000);
      } else {
        setError(data.error ?? "Failed to create design");
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Creation failed");
    } finally {
      setCreating(false);
    }
  };

  const handleExportAndAttach = async (design: CanvaDesign) => {
    setExporting(design.id);
    setError(null);
    try {
      const res = await fetch("/api/canva", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "export",
          design_id: design.id,
          format: exportFormat,
        }),
      });
      const data = await res.json();

      if (res.ok && data.urls?.length > 0) {
        const url = data.urls[0];
        const isVideo = exportFormat === "mp4";
        const isAnimation = exportFormat === "gif";

        onAttach({
          id: `canva-${design.id}-${++mediaCounter}`,
          type: isAnimation ? "animation" : isVideo ? "video" : "image",
          url,
          name: `${design.title}.${exportFormat}`,
          source: "generated",
        });
      } else if (data.job_id) {
        // Poll for export completion
        let attempts = 0;
        const poll = setInterval(async () => {
          attempts++;
          const pollRes = await fetch("/api/canva", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              action: "check-export",
              design_id: design.id,
              job_id: data.job_id,
            }),
          });
          const pollData = await pollRes.json();

          if (pollData.status === "success" && pollData.urls?.length > 0) {
            clearInterval(poll);
            onAttach({
              id: `canva-${design.id}-${++mediaCounter}`,
              type: exportFormat === "mp4" ? "video" : exportFormat === "gif" ? "animation" : "image",
              url: pollData.urls[0],
              name: `${design.title}.${exportFormat}`,
              source: "generated",
            });
            setExporting(null);
          } else if (pollData.status === "failed" || attempts > 30) {
            clearInterval(poll);
            setError("Export timed out or failed");
            setExporting(null);
          }
        }, 2000);
        return;
      } else {
        setError(data.error ?? "Export failed");
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Export failed");
    } finally {
      setExporting(null);
    }
  };

  const handleDeleteDesign = async (designId: string) => {
    try {
      await fetch("/api/canva", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "delete", design_id: designId }),
      });
      setDesigns((prev) => prev.filter((d) => d.id !== designId));
    } catch {
      // silent
    }
  };

  const filteredDesigns = searchQuery
    ? designs.filter((d) =>
        d.title.toLowerCase().includes(searchQuery.toLowerCase())
      )
    : designs;

  if (checking) {
    return (
      <Card>
        <div className="flex items-center justify-center p-8">
          <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
          <span className="ml-2 text-sm text-muted-foreground">
            Checking Canva connection...
          </span>
        </div>
      </Card>
    );
  }

  if (!connected) {
    return (
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <Palette className="h-4 w-4 text-purple-500" />
            <CardTitle>Canva Design Studio</CardTitle>
          </div>
          <CardDescription>
            Connect your Canva account to create, edit, and export designs
            directly from the compose page.
          </CardDescription>
        </CardHeader>
        <div className="space-y-4 px-5 pb-5">
          <div className="rounded-lg border border-dashed border-border p-6 text-center">
            <Palette className="mx-auto mb-3 h-8 w-8 text-muted-foreground" />
            <p className="text-sm font-medium">Connect to Canva</p>
            <p className="mt-1 text-xs text-muted-foreground">
              Create social media posts, stories, videos, and more using
              Canva&apos;s design tools.
            </p>
            <Button onClick={handleConnect} className="mt-4">
              <ExternalLink className="h-4 w-4" />
              Connect Canva Account
            </Button>
          </div>
          <div className="rounded-lg bg-muted/50 p-3 text-xs text-muted-foreground">
            <p className="font-medium">Setup required:</p>
            <ol className="mt-1 list-inside list-decimal space-y-1">
              <li>
                Create a Canva app at{" "}
                <a
                  href="https://www.canva.com/developers/"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-orange-500 underline"
                >
                  canva.com/developers
                </a>
              </li>
              <li>
                Set <code className="rounded bg-muted px-1 font-mono">CANVA_APP_ID</code> and{" "}
                <code className="rounded bg-muted px-1 font-mono">CANVA_APP_SECRET</code> in .env
              </li>
              <li>Click Connect above to authorize</li>
            </ol>
          </div>
        </div>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Palette className="h-4 w-4 text-purple-500" />
            <CardTitle>Canva Design Studio</CardTitle>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" onClick={loadDesigns}>
              <RefreshCw className="h-3 w-3" />
            </Button>
            <Button size="sm" onClick={() => setShowCreate(!showCreate)}>
              <Plus className="h-3 w-3" />
              New Design
            </Button>
          </div>
        </div>
        <CardDescription>
          Create, edit, and export designs using Canva. Attach them to your post.
        </CardDescription>
      </CardHeader>

      <div className="space-y-4 px-5 pb-5">
        {error && (
          <div className="rounded-lg bg-red-50 p-3 text-sm text-red-800">
            {error}
          </div>
        )}

        {/* Create new design */}
        <AnimatePresence>
          {showCreate && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: "auto", opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              className="overflow-hidden"
            >
              <div className="space-y-3 rounded-lg border border-border p-4">
                <Input
                  label="Design Title"
                  placeholder="e.g., Summer Sale Announcement"
                  value={designTitle}
                  onChange={(e) => setDesignTitle(e.target.value)}
                />
                <Select
                  label="Design Type"
                  value={designType}
                  onChange={(e) => setDesignType(e.target.value)}
                  options={designTypes}
                />
                <div className="flex gap-2">
                  <Button
                    onClick={handleCreateDesign}
                    isLoading={creating}
                    className="flex-1"
                  >
                    <ExternalLink className="h-4 w-4" />
                    Create & Open in Canva
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() => setShowCreate(false)}
                  >
                    Cancel
                  </Button>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Search + Export format */}
        <div className="flex gap-3">
          <div className="flex-1">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <input
                type="text"
                placeholder="Search your designs..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="h-9 w-full rounded-lg border border-input bg-background pl-9 pr-3 text-sm text-foreground placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
              />
            </div>
          </div>
          <Select
            label=""
            value={exportFormat}
            onChange={(e) => setExportFormat(e.target.value)}
            options={exportFormats}
          />
        </div>

        {/* Designs grid */}
        {loading ? (
          <div className="flex items-center justify-center p-6">
            <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
          </div>
        ) : filteredDesigns.length === 0 ? (
          <div className="rounded-lg border border-dashed border-border p-6 text-center text-sm text-muted-foreground">
            {searchQuery
              ? "No designs match your search."
              : "No designs yet. Click 'New Design' to create one in Canva."}
          </div>
        ) : (
          <div className="grid max-h-[400px] grid-cols-2 gap-3 overflow-y-auto sm:grid-cols-3">
            {filteredDesigns.map((design) => (
              <motion.div
                key={design.id}
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className={`group relative cursor-pointer overflow-hidden rounded-lg border transition-all ${
                  selectedDesign?.id === design.id
                    ? "border-orange-400 ring-2 ring-orange-200"
                    : "border-border hover:border-orange-300"
                }`}
                onClick={() => setSelectedDesign(design)}
              >
                {design.thumbnail?.url ? (
                  <img
                    src={design.thumbnail.url}
                    alt={design.title}
                    className="aspect-square w-full object-cover"
                  />
                ) : (
                  <div className="flex aspect-square w-full items-center justify-center bg-muted">
                    <ImageIcon className="h-8 w-8 text-muted-foreground" />
                  </div>
                )}

                {/* Overlay actions */}
                <div className="absolute inset-0 flex flex-col justify-end bg-gradient-to-t from-black/60 to-transparent p-2 opacity-0 transition-opacity group-hover:opacity-100">
                  <div className="flex gap-1">
                    <Button
                      size="sm"
                      className="flex-1 text-[10px]"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleExportAndAttach(design);
                      }}
                      isLoading={exporting === design.id}
                    >
                      <Download className="h-3 w-3" />
                      Attach
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      className="text-[10px]"
                      onClick={(e) => {
                        e.stopPropagation();
                        window.open(design.urls.edit_url, "_blank");
                      }}
                    >
                      <ExternalLink className="h-3 w-3" />
                    </Button>
                    <Button
                      size="sm"
                      variant="danger"
                      className="text-[10px]"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDeleteDesign(design.id);
                      }}
                    >
                      <Trash2 className="h-3 w-3" />
                    </Button>
                  </div>
                </div>

                {/* Title bar */}
                <div className="border-t border-border bg-card p-2">
                  <p className="truncate text-xs font-medium">{design.title}</p>
                  <div className="mt-1 flex items-center gap-1">
                    <Badge variant="outline" className="text-[9px]">
                      {design.design_type?.name ?? design.design_type?.type}
                    </Badge>
                    <span className="text-[9px] text-muted-foreground">
                      {design.page_count} pg
                    </span>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        )}

        {/* Selected design actions */}
        {selectedDesign && (
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex items-center justify-between rounded-lg border border-orange-200 bg-orange-50/50 p-3"
          >
            <div className="flex items-center gap-3">
              {selectedDesign.thumbnail?.url && (
                <img
                  src={selectedDesign.thumbnail.url}
                  alt={selectedDesign.title}
                  className="h-10 w-10 rounded object-cover"
                />
              )}
              <div>
                <p className="text-sm font-medium">{selectedDesign.title}</p>
                <p className="text-xs text-muted-foreground">
                  Export as {exportFormat.toUpperCase()} and attach to post
                </p>
              </div>
            </div>
            <Button
              onClick={() => handleExportAndAttach(selectedDesign)}
              isLoading={exporting === selectedDesign.id}
            >
              <Download className="h-4 w-4" />
              Export & Attach
            </Button>
          </motion.div>
        )}
      </div>
    </Card>
  );
}
