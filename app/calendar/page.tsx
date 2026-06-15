"use client";

import { useEffect, useState } from "react";
import {
  format,
  startOfMonth,
  endOfMonth,
  eachDayOfInterval,
  isSameMonth,
  isSameDay,
  addMonths,
  subMonths,
  startOfWeek,
  endOfWeek,
  parseISO,
} from "date-fns";
import { ChevronLeft, ChevronRight, Clock, Loader2 } from "lucide-react";
import { Card, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  MotionContainer,
  MotionItem,
  MotionPage,
} from "@/components/motion/motion-wrapper";
import { cn } from "@/lib/utils";
import { getPlatform } from "@/lib/platforms/registry";

interface ScheduledPost {
  id: string;
  title: string | null;
  content: string;
  platforms: { account: { platformId: string } }[];
  scheduledAt: string;
  status: string;
}

const statusBadge = (status: string) => {
  switch (status) {
    case "published":
      return <Badge variant="success">Published</Badge>;
    case "scheduled":
      return <Badge variant="default">Scheduled</Badge>;
    case "pending_approval":
      return <Badge variant="warning">Pending Approval</Badge>;
    default:
      return <Badge variant="outline">Draft</Badge>;
  }
};

export default function CalendarPage() {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState<Date | null>(new Date());
  const [posts, setPosts] = useState<ScheduledPost[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetch("/api/posts")
      .then((res) => res.json())
      .then((data) => {
        if (Array.isArray(data)) {
          setPosts(data);
        } else {
          setError(data.error ?? "Failed to load posts");
        }
      })
      .catch((err) => setError(err instanceof Error ? err.message : "Unknown error"))
      .finally(() => setLoading(false));
  }, []);

  const monthStart = startOfMonth(currentDate);
  const monthEnd = endOfMonth(monthStart);
  const calendarStart = startOfWeek(monthStart);
  const calendarEnd = endOfWeek(monthEnd);
  const days = eachDayOfInterval({ start: calendarStart, end: calendarEnd });

  const postsForSelected = selectedDate
    ? posts.filter((p) => p.scheduledAt && isSameDay(parseISO(p.scheduledAt), selectedDate))
    : [];

  return (
    <MotionPage>
      <div className="space-y-6">
        <MotionContainer>
          <MotionItem>
            <h1 className="text-2xl font-semibold tracking-tight sm:text-3xl">
              Content Calendar
            </h1>
          </MotionItem>
          <MotionItem>
            <p className="mt-1 text-sm text-muted-foreground">
              Review and approve upcoming posts across all connected platforms.
            </p>
          </MotionItem>
        </MotionContainer>

        {loading && (
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Loader2 className="h-4 w-4 animate-spin" />
            Loading posts...
          </div>
        )}

        {error && (
          <div className="rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-800">
            {error}
          </div>
        )}

        <div className="grid gap-6 lg:grid-cols-3">
          <MotionContainer className="lg:col-span-2">
            <MotionItem>
              <Card>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle>{format(currentDate, "MMMM yyyy")}</CardTitle>
                    <div className="flex items-center gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setCurrentDate(subMonths(currentDate, 1))}
                      >
                        <ChevronLeft className="h-4 w-4" />
                      </Button>
                      <Button variant="outline" size="sm" onClick={() => setCurrentDate(new Date())}>
                        Today
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setCurrentDate(addMonths(currentDate, 1))}
                      >
                        <ChevronRight className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </CardHeader>

                <div className="grid grid-cols-7 gap-px rounded-lg border border-border bg-border text-center text-xs font-medium text-muted-foreground">
                  {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((d) => (
                    <div key={d} className="bg-card py-2">
                      {d}
                    </div>
                  ))}
                  {days.map((day) => {
                    const isCurrentMonth = isSameMonth(day, currentDate);
                    const isSelected = selectedDate && isSameDay(day, selectedDate);
                    const dayPosts = posts.filter(
                      (p) => p.scheduledAt && isSameDay(parseISO(p.scheduledAt), day)
                    );
                    return (
                      <button
                        key={day.toISOString()}
                        onClick={() => setSelectedDate(day)}
                        className={cn(
                          "relative min-h-[80px] bg-card p-2 text-left transition-colors hover:bg-muted",
                          !isCurrentMonth && "text-muted-foreground/50",
                          isSelected && "bg-accent"
                        )}
                      >
                        <span
                          className={cn(
                            "inline-flex h-6 w-6 items-center justify-center rounded-full text-sm",
                            isSelected && "bg-primary text-primary-foreground"
                          )}
                        >
                          {format(day, "d")}
                        </span>
                        {dayPosts.length > 0 && (
                          <div className="mt-2 flex flex-wrap gap-1">
                            {dayPosts.slice(0, 3).map((post) => (
                              <span
                                key={post.id}
                                className="h-1.5 w-1.5 rounded-full bg-orange-500"
                              />
                            ))}
                          </div>
                        )}
                      </button>
                    );
                  })}
                </div>
              </Card>
            </MotionItem>
          </MotionContainer>

          <MotionContainer>
            <MotionItem>
              <Card>
                <CardHeader>
                  <CardTitle>
                    {selectedDate ? format(selectedDate, "MMMM d, yyyy") : "Select a date"}
                  </CardTitle>
                  <CardDescription>
                    {postsForSelected.length} post
                    {postsForSelected.length === 1 ? "" : "s"} scheduled
                  </CardDescription>
                </CardHeader>

                <div className="space-y-3">
                  {postsForSelected.length === 0 && (
                    <div className="rounded-lg border border-dashed border-border p-6 text-center text-sm text-muted-foreground">
                      No posts scheduled for this date.
                    </div>
                  )}
                  {postsForSelected.map((post) => (
                    <div
                      key={post.id}
                      className="rounded-lg border border-border p-3 transition-colors hover:bg-muted/50"
                    >
                      <div className="flex items-start justify-between gap-2">
                        <p className="text-sm font-medium">{post.title || post.content.slice(0, 50)}</p>
                        {statusBadge(post.status)}
                      </div>
                      <div className="mt-2 flex flex-wrap items-center gap-1.5">
                        {post.platforms.map(({ account }) => {
                          const platform = getPlatform(account.platformId as never);
                          return (
                            <span
                              key={account.platformId}
                              className="inline-flex items-center gap-1 rounded-full border border-border px-2 py-0.5 text-[10px] font-medium text-muted-foreground"
                            >
                              <span
                                className="h-1.5 w-1.5 rounded-full"
                                style={{ backgroundColor: platform.color }}
                              />
                              {platform.name}
                            </span>
                          );
                        })}
                      </div>
                      <div className="mt-2 flex items-center gap-1 text-xs text-muted-foreground">
                        <Clock className="h-3 w-3" />
                        {post.scheduledAt ? format(parseISO(post.scheduledAt), "h:mm a") : "—"}
                      </div>
                    </div>
                  ))}
                </div>
              </Card>
            </MotionItem>
          </MotionContainer>
        </div>
      </div>
    </MotionPage>
  );
}
