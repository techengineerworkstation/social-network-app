"use client";

import { useEffect, useState, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Heart,
  MessageCircle,
  UserPlus,
  Share2,
  AtSign,
  Repeat2,
  Quote,
  X,
} from "lucide-react";
import { getPlatform } from "@/lib/platforms/registry";
import { PlatformId } from "@/lib/types/platform";

export interface ToastNotification {
  id: string;
  platformId: string;
  type: string;
  actorHandle: string;
  actorName?: string;
  actorAvatarUrl?: string;
  targetContent?: string;
  message?: string;
  createdAt: string;
}

const typeIcons: Record<string, typeof Heart> = {
  like: Heart,
  comment: MessageCircle,
  follow: UserPlus,
  share: Share2,
  mention: AtSign,
  reply: MessageCircle,
  repost: Repeat2,
  quote: Quote,
};

const typeColors: Record<string, string> = {
  like: "text-red-500",
  comment: "text-blue-500",
  follow: "text-green-500",
  share: "text-purple-500",
  mention: "text-orange-500",
  reply: "text-blue-500",
  repost: "text-teal-500",
  quote: "text-indigo-500",
};

const typeLabels: Record<string, string> = {
  like: "liked your post",
  comment: "commented on your post",
  follow: "started following you",
  share: "shared your post",
  mention: "mentioned you",
  reply: "replied to you",
  repost: "reposted your post",
  quote: "quoted your post",
};

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<ToastNotification[]>([]);

  const dismiss = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  useEffect(() => {
    const interval = setInterval(async () => {
      try {
        const res = await fetch("/api/notifications?unread=true&limit=5");
        const data = await res.json();
        if (data.notifications?.length > 0) {
          const now = Date.now();
          const fresh = data.notifications.filter(
            (n: ToastNotification & { createdAt: string }) =>
              now - new Date(n.createdAt).getTime() < 60_000
          );
          if (fresh.length > 0) {
            setToasts((prev) => {
              const existingIds = new Set(prev.map((t) => t.id));
              const newOnes = fresh.filter(
                (n: ToastNotification) => !existingIds.has(n.id)
              );
              return [...prev, ...newOnes].slice(-5);
            });
          }
        }
      } catch {
        // silent
      }
    }, 15_000);

    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    if (toasts.length === 0) return;
    const timers = toasts.map(
      (t) => setTimeout(() => dismiss(t.id), 8000) as unknown as NodeJS.Timeout
    );
    return () => timers.forEach(clearTimeout);
  }, [toasts, dismiss]);

  return (
    <>
      {children}
      <div className="fixed bottom-4 right-4 z-[100] flex flex-col gap-2 sm:bottom-6 sm:right-6">
        <AnimatePresence>
          {toasts.map((toast) => (
            <ToastItem
              key={toast.id}
              toast={toast}
              onDismiss={() => dismiss(toast.id)}
            />
          ))}
        </AnimatePresence>
      </div>
    </>
  );
}

function ToastItem({
  toast,
  onDismiss,
}: {
  toast: ToastNotification;
  onDismiss: () => void;
}) {
  const Icon = typeIcons[toast.type] ?? Heart;
  const colorClass = typeColors[toast.type] ?? "text-orange-500";
  const label = typeLabels[toast.type] ?? "engaged with your post";
  const platform = getPlatform(toast.platformId as PlatformId);

  return (
    <motion.div
      initial={{ opacity: 0, x: 80, scale: 0.9 }}
      animate={{ opacity: 1, x: 0, scale: 1 }}
      exit={{ opacity: 0, x: 80, scale: 0.9 }}
      transition={{ type: "spring", stiffness: 400, damping: 25 }}
      className="relative flex w-80 items-start gap-3 rounded-xl border border-border bg-card p-4 shadow-xl backdrop-blur"
    >
      <button
        onClick={onDismiss}
        className="absolute right-2 top-2 rounded-full p-1 text-muted-foreground hover:bg-muted hover:text-foreground"
      >
        <X className="h-3 w-3" />
      </button>

      {toast.actorAvatarUrl ? (
        <img
          src={toast.actorAvatarUrl}
          alt={toast.actorHandle}
          className="h-10 w-10 rounded-full object-cover ring-2 ring-border"
        />
      ) : (
        <div className="flex h-10 w-10 items-center justify-center rounded-full bg-gradient-to-br from-orange-400 to-magenta-500 text-sm font-bold text-white">
          {toast.actorHandle.charAt(0).toUpperCase()}
        </div>
      )}

      <div className="min-w-0 flex-1 pr-4">
        <div className="flex items-center gap-1.5">
          <span className="truncate text-sm font-semibold">
            {toast.actorName || toast.actorHandle}
          </span>
          <Icon className={`h-3.5 w-3.5 shrink-0 ${colorClass}`} />
        </div>
        <p className="truncate text-xs text-muted-foreground">
          @{toast.actorHandle} {label}
        </p>
        {toast.message && (
          <p className="mt-1 line-clamp-2 text-xs text-foreground/80">
            &ldquo;{toast.message}&rdquo;
          </p>
        )}
        {toast.targetContent && (
          <p className="mt-1 line-clamp-1 text-[10px] text-muted-foreground">
            on: {toast.targetContent}
          </p>
        )}
        <div className="mt-1 flex items-center gap-1.5">
          <span
            className="h-2 w-2 rounded-full"
            style={{ backgroundColor: platform.color }}
          />
          <span className="text-[10px] text-muted-foreground">
            {platform.name}
          </span>
        </div>
      </div>
    </motion.div>
  );
}
