"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import {
  LayoutDashboard,
  PenLine,
  CalendarDays,
  Plug,
  Settings,
  ShieldCheck,
  Sparkles,
  Menu,
  X,
  Palette,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useState, useEffect } from "react";
import { NotificationDropdown } from "@/components/notifications/notification-dropdown";

const navItems = [
  { href: "/", label: "Dashboard", icon: LayoutDashboard },
  { href: "/compose", label: "Compose", icon: PenLine },
  { href: "/calendar", label: "Calendar", icon: CalendarDays },
  { href: "/platforms", label: "Platforms", icon: Plug },
  { href: "/settings", label: "Settings", icon: Settings },
];

const themes = [
  { id: "silver", label: "Silver (Default)", colors: "from-orange-400 to-magenta-500" },
  { id: "ultramarine", label: "Ultramarine", colors: "from-blue-500 to-indigo-600" },
];

export function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [theme, setTheme] = useState("silver");
  const [showThemePicker, setShowThemePicker] = useState(false);

  useEffect(() => {
    const saved = localStorage.getItem("theme") ?? "silver";
    setTheme(saved);
    document.documentElement.setAttribute("data-theme", saved);
  }, []);

  const switchTheme = (id: string) => {
    setTheme(id);
    localStorage.setItem("theme", id);
    document.documentElement.setAttribute("data-theme", id);
    setShowThemePicker(false);
  };

  return (
    <div className="flex min-h-screen flex-col lg:flex-row">
      {/* Mobile menu toggle */}
      <button
        onClick={() => setMobileOpen(!mobileOpen)}
        className="fixed bottom-4 right-4 z-50 flex h-12 w-12 items-center justify-center rounded-full bg-gradient-to-br from-orange-400 to-magenta-500 text-white shadow-lg lg:hidden"
        aria-label="Toggle menu"
      >
        {mobileOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
      </button>

      {/* Mobile overlay */}
      <AnimatePresence>
        {mobileOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            onClick={() => setMobileOpen(false)}
            className="fixed inset-0 z-30 bg-black/40 backdrop-blur-sm lg:hidden"
          />
        )}
      </AnimatePresence>

      {/* Sidebar */}
      <motion.aside
        initial={{ x: -16, opacity: 0 }}
        animate={{ x: 0, opacity: 1 }}
        transition={{ duration: 0.35, ease: "easeOut" }}
        className={cn(
          "fixed inset-y-0 left-0 z-40 flex w-64 flex-col border-r border-border bg-card/95 backdrop-blur transition-transform lg:sticky lg:top-0 lg:h-screen lg:translate-x-0",
          mobileOpen ? "translate-x-0" : "-translate-x-full"
        )}
      >
        <div className="flex h-16 shrink-0 items-center gap-2 border-b border-border px-6 lg:h-auto lg:border-b-0 lg:py-6">
          <Link href="/" className="flex items-center gap-2 text-lg font-semibold tracking-tight">
            <motion.span
              whileHover={{ rotate: 12, scale: 1.05 }}
              transition={{ type: "spring", stiffness: 400, damping: 15 }}
              className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-orange-400 to-magenta-500 text-white shadow-sm"
            >
              <Sparkles className="h-4 w-4" />
            </motion.span>
            <span>Social Network</span>
          </Link>
        </div>

        <nav className="flex-1 space-y-1 overflow-y-auto px-3 py-4">
          {navItems.map((item, index) => {
            const Icon = item.icon;
            const isActive = pathname === item.href;
            return (
              <motion.div
                key={item.href}
                initial={{ x: -12, opacity: 0 }}
                animate={{ x: 0, opacity: 1 }}
                transition={{ delay: 0.05 * index, duration: 0.3 }}
              >
                <Link
                  href={item.href}
                  onClick={() => setMobileOpen(false)}
                  className={cn(
                    "flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors",
                    isActive
                      ? "bg-accent text-accent-foreground"
                      : "text-muted-foreground hover:bg-muted hover:text-foreground"
                  )}
                >
                  <Icon className="h-4 w-4" />
                  {item.label}
                  {isActive && (
                    <motion.div
                      layoutId="active-indicator"
                      className="ml-auto h-1.5 w-1.5 rounded-full bg-orange-500"
                      transition={{ type: "spring", stiffness: 500, damping: 30 }}
                    />
                  )}
                </Link>
              </motion.div>
            );
          })}
        </nav>

        <div className="flex items-center gap-2 border-t border-border px-6 py-4 text-xs text-muted-foreground">
          <ShieldCheck className="h-3.5 w-3.5" />
          <span>Human-in-the-loop</span>
        </div>
      </motion.aside>

      {/* Main content */}
      <main className="flex-1 overflow-auto">
        {/* Top bar */}
        <div className="sticky top-0 z-30 flex h-14 items-center justify-between border-b border-border bg-card/80 px-4 backdrop-blur sm:px-6">
          <div className="text-sm font-medium text-muted-foreground">
            {navItems.find((n) => n.href === pathname)?.label ?? ""}
          </div>

          <div className="flex items-center gap-2">
            {/* Theme switcher */}
            <div className="relative">
              <button
                onClick={() => setShowThemePicker(!showThemePicker)}
                className="flex h-9 w-9 items-center justify-center rounded-lg border border-border bg-card text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
              >
                <Palette className="h-4 w-4" />
              </button>

              <AnimatePresence>
                {showThemePicker && (
                  <motion.div
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: 8 }}
                    className="absolute right-0 top-12 z-50 w-56 rounded-xl border border-border bg-card p-2 shadow-xl"
                  >
                    <p className="mb-2 px-2 text-xs font-medium text-muted-foreground">
                      Theme
                    </p>
                    {themes.map((t) => (
                      <button
                        key={t.id}
                        onClick={() => switchTheme(t.id)}
                        className={cn(
                          "flex w-full items-center gap-3 rounded-lg px-3 py-2 text-sm transition-colors hover:bg-muted",
                          theme === t.id && "bg-accent"
                        )}
                      >
                        <span
                          className={`h-4 w-4 rounded-full bg-gradient-to-br ${t.colors}`}
                        />
                        {t.label}
                        {theme === t.id && (
                          <span className="ml-auto text-xs text-primary">Active</span>
                        )}
                      </button>
                    ))}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {/* Notifications */}
            <NotificationDropdown />
          </div>
        </div>

        <AnimatePresence mode="wait">
          <motion.div
            key={pathname}
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 6 }}
            transition={{ duration: 0.25, ease: "easeInOut" }}
            className="mx-auto max-w-7xl p-4 sm:p-6 lg:p-8"
          >
            {children}
          </motion.div>
        </AnimatePresence>
      </main>
    </div>
  );
}
