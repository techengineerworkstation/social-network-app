"use client";

import { useEffect, useState, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Bell,
  Heart,
  MessageCircle,
  UserPlus,
  Share2,
  AtSign,
  Repeat2,
  Quote,
  Check,
  CheckCheck,
} from "lucide-react";
import { formatDistanceToNow, parseISO } from "date-fns";
import { getPlatform } from "@/lib/platforms/registry";
import { PlatformId } from "@/lib/types/platform";

interface NotificationItem {
  id: string;
  platformId: string;
  type: string;
  actorHandle: string;
  actorName?: string;
  actorAvatarUrl?: string;
  actorProfileUrl?: string;
  targetContent?: string;
  message?: string;
  read: boolean;
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

const typeLabels: Record<string, string> = {
  like: "liked your post",
  comment: "commented",
  follow: "followed you",
  share: "shared your post",
  mention: "mentioned you",
  reply: "replied",
  repost: "reposted",
  quote: "quoted you",
};

export function NotificationDropdown() {
  const [open, setOpen] = useState(false);
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const fetchNotifications = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/notifications?limit=30");
      const data = await res.json();
      if (data.notifications) {
        setNotifications(data.notifications);
        setUnreadCount(data.unreadCount ?? 0);
      }
    } catch {
      // silent
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchNotifications();
    const interval = setInterval(fetchNotifications, 30_000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(e.target as Node)
      ) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const markRead = async (id: string) => {
    await fetch("/api/notifications", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "mark-read", id }),
    });
    setNotifications((prev) =>
      prev.map((n) => (n.id === id ? { ...n, read: true } : n))
    );
    setUnreadCount((prev) => Math.max(0, prev - 1));
  };

  const markAllRead = async () => {
    await fetch("/api/notifications", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "mark-all-read" }),
    });
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
    setUnreadCount(0);
  };

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        onClick={() => setOpen(!open)}
        className="relative flex h-9 w-9 items-center justify-center rounded-lg border border-border bg-card text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
      >
        <Bell className="h-4 w-4" />
        {unreadCount > 0 && (
          <motion.span
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            className="absolute -right-1 -top-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-orange-500 px-1 text-[10px] font-bold text-white"
          >
            {unreadCount > 99 ? "99+" : unreadCount}
          </motion.span>
        )}
      </button>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: 8, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 8, scale: 0.96 }}
            transition={{ duration: 0.15 }}
            className="absolute right-0 top-12 z-50 w-96 max-h-[70vh] overflow-hidden rounded-xl border border-border bg-card shadow-2xl"
          >
            {/* Header */}
            <div className="flex items-center justify-between border-b border-border px-4 py-3">
              <h3 className="text-sm font-semibold">Notifications</h3>
              {unreadCount > 0 && (
                <button
                  onClick={markAllRead}
                  className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground"
                >
                  <CheckCheck className="h-3 w-3" />
                  Mark all read
                </button>
              )}
            </div>

            {/* List */}
            <div className="max-h-[55vh] overflow-y-auto">
              {loading && notifications.length === 0 && (
                <div className="p-6 text-center text-sm text-muted-foreground">
                  Loading...
                </div>
              )}
              {!loading && notifications.length === 0 && (
                <div className="p-6 text-center text-sm text-muted-foreground">
                  No notifications yet.
                </div>
              )}
              {notifications.map((notif) => {
                const Icon = typeIcons[notif.type] ?? Heart;
                const label = typeLabels[notif.type] ?? "engaged";
                const platform = getPlatform(notif.platformId as PlatformId);

                return (
                  <div
                    key={notif.id}
                    className={`flex items-start gap-3 border-b border-border px-4 py-3 transition-colors hover:bg-muted/50 ${
                      !notif.read ? "bg-orange-50/30" : ""
                    }`}
                  >
                    {/* Avatar */}
                    {notif.actorAvatarUrl ? (
                      <img
                        src={notif.actorAvatarUrl}
                        alt={notif.actorHandle}
                        className="h-9 w-9 shrink-0 rounded-full object-cover"
                      />
                    ) : (
                      <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-orange-400 to-magenta-500 text-xs font-bold text-white">
                        {notif.actorHandle.charAt(0).toUpperCase()}
                      </div>
                    )}

                    {/* Content */}
                    <div className="min-w-0 flex-1">
                      <p className="text-sm">
                        <span className="font-semibold">
                          {notif.actorName || notif.actorHandle}
                        </span>{" "}
                        <span className="text-muted-foreground">{label}</span>
                      </p>
                      {notif.message && (
                        <p className="mt-0.5 line-clamp-2 text-xs text-foreground/80">
                          &ldquo;{notif.message}&rdquo;
                        </p>
                      )}
                      {notif.targetContent && (
                        <p className="mt-0.5 line-clamp-1 text-[10px] text-muted-foreground">
                          on: {notif.targetContent}
                        </p>
                      )}
                      <div className="mt-1 flex items-center gap-2">
                        <span
                          className="h-1.5 w-1.5 rounded-full"
                          style={{ backgroundColor: platform.color }}
                        />
                        <span className="text-[10px] text-muted-foreground">
                          {platform.name} ·{" "}
                          {formatDistanceToNow(parseISO(notif.createdAt), {
                            addSuffix: true,
                          })}
                        </span>
                      </div>
                    </div>

                    {/* Mark read */}
                    {!notif.read && (
                      <button
                        onClick={() => markRead(notif.id)}
                        className="shrink-0 rounded p-1 text-muted-foreground hover:bg-muted hover:text-foreground"
                        title="Mark as read"
                      >
                        <Check className="h-3.5 w-3.5" />
                      </button>
                    )}
                  </div>
                );
              })}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
