"use client";

import { useEffect, useState, useRef } from "react";
import Link from "next/link";
import { motion, useInView } from "framer-motion";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Legend,
} from "recharts";
import {
  PenLine,
  CalendarDays,
  Plug,
  BarChart3,
  ShieldCheck,
  Sparkles,
  Bell,
  TrendingUp,
  MessageSquare,
  Heart,
  Share2,
  Eye,
} from "lucide-react";
import { Card, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  MotionContainer,
  MotionItem,
  MotionCard,
  MotionPage,
} from "@/components/motion/motion-wrapper";
import { formatNumber } from "@/lib/utils";
import { allPlatformIds, getPlatform } from "@/lib/platforms/registry";

const stats = [
  { label: "Scheduled Posts", value: 12, change: "+3 this week", icon: CalendarDays },
  { label: "Connected Platforms", value: 4, change: "of 12 available", icon: Plug },
  { label: "AI Drafts Generated", value: 28, change: "+12 this week", icon: Sparkles },
  { label: "Total Engagements", value: 8420, change: "+8.4%", icon: TrendingUp },
];

const engagementData = [
  { platform: "X", likes: 1240, comments: 320, shares: 180 },
  { platform: "LinkedIn", likes: 890, comments: 210, shares: 340 },
  { platform: "Mastodon", likes: 430, comments: 120, shares: 95 },
  { platform: "Bluesky", likes: 560, comments: 140, shares: 110 },
  { platform: "Instagram", likes: 2100, comments: 180, shares: 420 },
];

const formatData = [
  { name: "Posts", value: 45, color: "#f97c35" },
  { name: "Threads", value: 18, color: "#d75f8f" },
  { name: "Reels/Shorts", value: 12, color: "#6364FF" },
  { name: "Images", value: 22, color: "#0A66C2" },
  { name: "Articles", value: 8, color: "#16a34a" },
];

const engagementDonutData = [
  { name: "Likes", value: 5220, color: "#f97c35" },
  { name: "Comments", value: 970, color: "#d75f8f" },
  { name: "Shares", value: 1145, color: "#6364FF" },
  { name: "Clicks", value: 1085, color: "#0A66C2" },
];

const recentActions = [
  { id: "1", action: "Post scheduled", target: "LinkedIn product launch", time: "2 min ago", status: "pending" },
  { id: "2", action: "AI draft generated", target: "Mastodon thread", time: "15 min ago", status: "success" },
  { id: "3", action: "Campaign published", target: "X / Bluesky awareness", time: "1 hr ago", status: "success" },
  { id: "4", action: "Reply received", target: "Instagram reel teaser", time: "3 hr ago", status: "info" },
  { id: "5", action: "New follower", target: "X (@techfan)", time: "5 hr ago", status: "success" },
  { id: "6", action: "Post approved", target: "YouTube short", time: "6 hr ago", status: "pending" },
];

const notifications = [
  { id: "1", message: "Bluesky token expires in 3 days", type: "warning" },
  { id: "2", message: "4 posts awaiting approval", type: "info" },
  { id: "3", message: "Weekly engagement report ready", type: "success" },
];

const quickActions = [
  { label: "Compose", description: "Create a new post with AI assistance", icon: PenLine, href: "/compose" },
  { label: "Calendar", description: "Review scheduled content", icon: CalendarDays, href: "/calendar" },
  { label: "Platforms", description: "Connect social accounts", icon: Plug, href: "/platforms" },
  { label: "Analytics", description: "View cross-platform metrics", icon: BarChart3, href: "#analytics" },
];

// ── Animated Counter ─────────────────────────────
function AnimatedCounter({ value, duration = 1.5 }: { value: number; duration?: number }) {
  const [count, setCount] = useState(0);
  const ref = useRef<HTMLSpanElement>(null);
  const inView = useInView(ref, { once: true });

  useEffect(() => {
    if (!inView) return;
    let start = 0;
    const end = value;
    const increment = end / (duration * 60);
    const timer = setInterval(() => {
      start += increment;
      if (start >= end) {
        setCount(end);
        clearInterval(timer);
      } else {
        setCount(Math.floor(start));
      }
    }, 1000 / 60);
    return () => clearInterval(timer);
  }, [inView, value, duration]);

  return <span ref={ref}>{formatNumber(count)}</span>;
}

// ── Animated Table Row ───────────────────────────
function AnimatedRow({
  children,
  index,
}: {
  children: React.ReactNode;
  index: number;
}) {
  return (
    <motion.tr
      initial={{ opacity: 0, x: -16 }}
      whileInView={{ opacity: 1, x: 0 }}
      viewport={{ once: true }}
      transition={{ delay: index * 0.08, duration: 0.35, ease: "easeOut" }}
      className="border-b border-border last:border-0"
    >
      {children}
    </motion.tr>
  );
}

export default function DashboardPage() {
  return (
    <MotionPage>
      <div className="space-y-8">
        {/* Header */}
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <MotionContainer>
            <MotionItem>
              <h1 className="text-2xl font-semibold tracking-tight sm:text-3xl">
                Dashboard
              </h1>
            </MotionItem>
            <MotionItem>
              <p className="mt-1 text-sm text-muted-foreground">
                Manage your social presence safely with human-in-the-loop approvals.
              </p>
            </MotionItem>
          </MotionContainer>
          <Badge variant="secondary" className="gap-1 w-fit">
            <ShieldCheck className="h-3 w-3" />
            Human approval required
          </Badge>
        </div>

        {/* Stats with animated counters */}
        <MotionContainer className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {stats.map((stat) => {
            const Icon = stat.icon;
            return (
              <MotionItem key={stat.label}>
                <Card className="overflow-hidden">
                  <CardHeader className="flex-col items-start gap-1">
                    <div className="flex w-full items-center justify-between">
                      <CardDescription>{stat.label}</CardDescription>
                      <Icon className="h-4 w-4 text-muted-foreground" />
                    </div>
                    <CardTitle className="text-3xl">
                      <AnimatedCounter value={stat.value} />
                    </CardTitle>
                    <span className="text-xs text-muted-foreground">{stat.change}</span>
                  </CardHeader>
                </Card>
              </MotionItem>
            );
          })}
        </MotionContainer>

        {/* Quick actions */}
        <div>
          <h2 className="mb-4 text-lg font-semibold tracking-tight">Quick Actions</h2>
          <MotionContainer className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {quickActions.map((action) => {
              const Icon = action.icon;
              return (
                <MotionCard key={action.label}>
                  <Link href={action.href} className="block h-full">
                    <Card className="h-full transition-colors hover:border-orange-300 hover:bg-orange-50/30">
                      <CardHeader>
                        <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-gradient-to-br from-orange-400 to-magenta-500 text-white shadow-sm">
                          <Icon className="h-5 w-5" />
                        </div>
                        <div>
                          <CardTitle>{action.label}</CardTitle>
                          <CardDescription>{action.description}</CardDescription>
                        </div>
                      </CardHeader>
                    </Card>
                  </Link>
                </MotionCard>
              );
            })}
          </MotionContainer>
        </div>

        {/* Animated Charts */}
        <div id="analytics" className="grid gap-6 lg:grid-cols-2">
          {/* Bar Chart - Animated bars */}
          <motion.div
            initial={{ opacity: 0, y: 24 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5, ease: "easeOut" }}
          >
            <Card>
              <CardHeader>
                <CardTitle>Engagement by Platform</CardTitle>
                <CardDescription>Likes, comments, and shares across platforms</CardDescription>
              </CardHeader>
              <div className="h-[300px] w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={engagementData} margin={{ top: 8, right: 8, left: -16, bottom: 0 }}>
                    <XAxis dataKey="platform" tick={{ fontSize: 12 }} />
                    <YAxis tick={{ fontSize: 12 }} />
                    <Tooltip
                      contentStyle={{
                        borderRadius: "8px",
                        border: "1px solid var(--border)",
                        background: "var(--card)",
                      }}
                    />
                    <Legend />
                    <Bar
                      dataKey="likes"
                      fill="#f97c35"
                      radius={[4, 4, 0, 0]}
                      isAnimationActive={true}
                      animationDuration={1500}
                      animationBegin={0}
                      animationEasing="ease-out"
                    />
                    <Bar
                      dataKey="comments"
                      fill="#d75f8f"
                      radius={[4, 4, 0, 0]}
                      isAnimationActive={true}
                      animationDuration={1500}
                      animationBegin={300}
                      animationEasing="ease-out"
                    />
                    <Bar
                      dataKey="shares"
                      fill="#6364FF"
                      radius={[4, 4, 0, 0]}
                      isAnimationActive={true}
                      animationDuration={1500}
                      animationBegin={600}
                      animationEasing="ease-out"
                    />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </Card>
          </motion.div>

          {/* Pie Chart - Animated filling */}
          <motion.div
            initial={{ opacity: 0, y: 24 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5, delay: 0.15, ease: "easeOut" }}
          >
            <Card>
              <CardHeader>
                <CardTitle>Content Format Distribution</CardTitle>
                <CardDescription>Breakdown of scheduled and published formats</CardDescription>
              </CardHeader>
              <div className="h-[300px] w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={formatData}
                      cx="50%"
                      cy="50%"
                      innerRadius={60}
                      outerRadius={90}
                      paddingAngle={3}
                      dataKey="value"
                      isAnimationActive={true}
                      animationDuration={1800}
                      animationBegin={200}
                      animationEasing="ease-out"
                    >
                      {formatData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip
                      contentStyle={{
                        borderRadius: "8px",
                        border: "1px solid var(--border)",
                        background: "var(--card)",
                      }}
                    />
                    <Legend />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            </Card>
          </motion.div>
        </div>

        {/* Donut Ring Charts */}
        <div className="grid gap-6 lg:grid-cols-2">
          {/* Donut - Engagement Breakdown */}
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5, ease: "easeOut" }}
          >
            <Card>
              <CardHeader>
                <CardTitle>Engagement Breakdown</CardTitle>
                <CardDescription>Donut ring showing likes, comments, shares, and clicks</CardDescription>
              </CardHeader>
              <div className="h-[300px] w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={engagementDonutData}
                      cx="50%"
                      cy="50%"
                      innerRadius={50}
                      outerRadius={85}
                      paddingAngle={2}
                      dataKey="value"
                      isAnimationActive={true}
                      animationDuration={2000}
                      animationBegin={0}
                      animationEasing="ease-out"
                      startAngle={90}
                      endAngle={-270}
                    >
                      {engagementDonutData.map((entry, index) => (
                        <Cell key={`donut-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip
                      contentStyle={{
                        borderRadius: "8px",
                        border: "1px solid var(--border)",
                        background: "var(--card)",
                      }}
                      formatter={(value) => formatNumber(Number(value))}
                    />
                    <Legend />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            </Card>
          </motion.div>

          {/* Donut - Platform Share */}
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5, delay: 0.1, ease: "easeOut" }}
          >
            <Card>
              <CardHeader>
                <CardTitle>Platform Share</CardTitle>
                <CardDescription>Content distribution across connected platforms</CardDescription>
              </CardHeader>
              <div className="h-[300px] w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={[
                        { name: "X", value: 35, color: "#000000" },
                        { name: "LinkedIn", value: 25, color: "#0A66C2" },
                        { name: "Instagram", value: 20, color: "#E4405F" },
                        { name: "Mastodon", value: 12, color: "#6364FF" },
                        { name: "Bluesky", value: 8, color: "#0085FF" },
                      ]}
                      cx="50%"
                      cy="50%"
                      innerRadius={50}
                      outerRadius={85}
                      paddingAngle={2}
                      dataKey="value"
                      isAnimationActive={true}
                      animationDuration={2000}
                      animationBegin={300}
                      animationEasing="ease-out"
                      startAngle={90}
                      endAngle={-270}
                    >
                      {[
                        { color: "#000000" },
                        { color: "#0A66C2" },
                        { color: "#E4405F" },
                        { color: "#6364FF" },
                        { color: "#0085FF" },
                      ].map((entry, index) => (
                        <Cell key={`platform-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip
                      contentStyle={{
                        borderRadius: "8px",
                        border: "1px solid var(--border)",
                        background: "var(--card)",
                      }}
                      formatter={(value) => `${value}%`}
                    />
                    <Legend />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            </Card>
          </motion.div>
        </div>

        {/* Animated Tables & Notifications */}
        <div className="grid gap-6 lg:grid-cols-2">
          {/* Animated Activity Table */}
          <motion.div
            initial={{ opacity: 0, x: -24 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5, ease: "easeOut" }}
          >
            <Card>
              <CardHeader>
                <CardTitle>Recent Activity</CardTitle>
                <CardDescription>Latest actions, feedback, replies, and campaign traction</CardDescription>
              </CardHeader>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <motion.tr
                      initial={{ opacity: 0 }}
                      whileInView={{ opacity: 1 }}
                      viewport={{ once: true }}
                      className="border-b border-border text-left text-muted-foreground"
                    >
                      <th className="pb-2 font-medium">Action</th>
                      <th className="pb-2 font-medium">Target</th>
                      <th className="pb-2 font-medium">Time</th>
                      <th className="pb-2 font-medium">Status</th>
                    </motion.tr>
                  </thead>
                  <tbody>
                    {recentActions.map((row, i) => (
                      <AnimatedRow key={row.id} index={i}>
                        <td className="py-3 font-medium">{row.action}</td>
                        <td className="py-3 text-muted-foreground">{row.target}</td>
                        <td className="py-3 text-muted-foreground">{row.time}</td>
                        <td className="py-3">
                          <Badge
                            variant={
                              row.status === "success"
                                ? "success"
                                : row.status === "warning"
                                ? "warning"
                                : "outline"
                            }
                          >
                            {row.status}
                          </Badge>
                        </td>
                      </AnimatedRow>
                    ))}
                  </tbody>
                </table>
              </div>
            </Card>
          </motion.div>

          {/* Notifications */}
          <motion.div
            initial={{ opacity: 0, x: 24 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5, ease: "easeOut" }}
          >
            <Card>
              <CardHeader>
                <div className="flex items-center gap-2">
                  <Bell className="h-4 w-4 text-orange-500" />
                  <CardTitle>Notifications</CardTitle>
                </div>
                <CardDescription>Alerts requiring your attention</CardDescription>
              </CardHeader>
              <div className="space-y-3">
                {notifications.map((note, i) => (
                  <motion.div
                    key={note.id}
                    initial={{ opacity: 0, y: 12 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ delay: i * 0.1, duration: 0.3 }}
                    className="flex items-start gap-3 rounded-lg border border-border p-3 transition-colors hover:bg-muted/50"
                  >
                    {note.type === "warning" && <AlertTriangleIcon />}
                    {note.type === "info" && <InfoIcon />}
                    {note.type === "success" && <CheckIcon />}
                    <p className="text-sm">{note.message}</p>
                  </motion.div>
                ))}
              </div>
            </Card>
          </motion.div>
        </div>

        {/* Animated Campaign Traction */}
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5, ease: "easeOut" }}
        >
          <Card>
            <CardHeader>
              <CardTitle>Campaign Outreach Traction</CardTitle>
              <CardDescription>Aggregated reach metrics for active campaigns</CardDescription>
            </CardHeader>
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              {[
                { label: "Impressions", value: 124500, icon: Eye },
                { label: "Likes", value: 8420, icon: Heart },
                { label: "Comments", value: 1230, icon: MessageSquare },
                { label: "Shares", value: 2890, icon: Share2 },
              ].map((metric, i) => {
                const Icon = metric.icon;
                return (
                  <motion.div
                    key={metric.label}
                    initial={{ opacity: 0, y: 16 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ delay: i * 0.1, duration: 0.4 }}
                    className="rounded-lg border border-border p-4 transition-colors hover:bg-muted/50"
                  >
                    <Icon className="mb-2 h-5 w-5 text-orange-500" />
                    <p className="text-2xl font-semibold">
                      <AnimatedCounter value={metric.value} duration={2} />
                    </p>
                    <p className="text-xs text-muted-foreground">{metric.label}</p>
                  </motion.div>
                );
              })}
            </div>
          </Card>
        </motion.div>

        {/* Platforms overview */}
        <div>
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-lg font-semibold tracking-tight">Supported Platforms</h2>
            <Link href="/platforms">
              <Button variant="outline" size="sm">Manage Connections</Button>
            </Link>
          </div>
          <MotionContainer className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {allPlatformIds.map((id) => {
              const platform = getPlatform(id);
              return (
                <MotionItem key={platform.id}>
                  <div className="flex items-start gap-3 rounded-lg border border-border bg-card p-4 transition-colors hover:bg-muted/50">
                    <span
                      className="mt-0.5 h-3 w-3 shrink-0 rounded-full"
                      style={{ backgroundColor: platform.color }}
                    />
                    <div>
                      <p className="text-sm font-medium">{platform.name}</p>
                      <p className="text-xs text-muted-foreground">
                        {platform.capabilities.slice(0, 3).join(" · ")}
                      </p>
                    </div>
                  </div>
                </MotionItem>
              );
            })}
          </MotionContainer>
        </div>

        {/* AI notice */}
        <MotionItem>
          <Card className="border-orange-200/50 bg-gradient-to-r from-orange-50/50 to-magenta-50/30">
            <CardHeader>
              <div className="flex items-center gap-2">
                <Sparkles className="h-4 w-4 text-orange-500" />
                <CardTitle>AI-Powered, Human Controlled</CardTitle>
              </div>
              <CardDescription>
                This dashboard uses free generative AI APIs (OpenRouter, Google Gemini,
                Groq, Hugging Face, Ollama) to draft content. Every draft requires your
                explicit approval before it reaches any social platform API.
              </CardDescription>
            </CardHeader>
          </Card>
        </MotionItem>
      </div>
    </MotionPage>
  );
}

function AlertTriangleIcon() {
  return (
    <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-yellow-100 text-yellow-700">
      !
    </span>
  );
}

function InfoIcon() {
  return (
    <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-blue-100 text-blue-700">
      i
    </span>
  );
}

function CheckIcon() {
  return (
    <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-green-100 text-green-700">
      ✓
    </span>
  );
}
