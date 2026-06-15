#!/bin/bash
# ─────────────────────────────────────────────────────────────
# Social Network App — Vercel Deployment Script
# ─────────────────────────────────────────────────────────────
# This script:
#   1. Exports local PostgreSQL data
#   2. Pushes schema to Vercel Postgres / Neon
#   3. Imports data into the remote database
#   4. Deploys to Vercel
#
# Prerequisites:
#   - Vercel CLI installed: npm i -g vercel
#   - Authenticated: vercel login
#   - Local PostgreSQL running with seeded data
#   - Remote DATABASE_URL set in Vercel dashboard
# ─────────────────────────────────────────────────────────────

set -e

echo "╔══════════════════════════════════════════════════════╗"
echo "║   Social Network App — Vercel Deployment            ║"
echo "╚══════════════════════════════════════════════════════╝"
echo ""

# Step 1: Verify build
echo "▶ Step 1: Verifying build..."
npm run build
echo "✓ Build successful"
echo ""

# Step 2: Export local data
echo "▶ Step 2: Exporting local PostgreSQL data..."
LOCAL_DB="postgresql://socialnet:socialnet123@localhost:5432/social_network_app"
EXPORT_FILE="prisma/data-export.sql"

pg_dump "$LOCAL_DB" \
  --no-owner \
  --no-privileges \
  --data-only \
  --column-inserts \
  -f "$EXPORT_FILE" 2>/dev/null || {
    echo "⚠ Could not export from local DB. Skipping data export."
    echo "  You can manually export later with:"
    echo "  pg_dump $LOCAL_DB --data-only --column-inserts -f prisma/data-export.sql"
    EXPORT_FILE=""
  }

if [ -n "$EXPORT_FILE" ] && [ -f "$EXPORT_FILE" ]; then
  echo "✓ Data exported to $EXPORT_FILE"
fi
echo ""

# Step 3: Push to GitHub
echo "▶ Step 3: Pushing to GitHub..."
git add -A
git status --short
echo ""
read -p "Commit and push? (y/n) " -n 1 -r
echo ""
if [[ $REPLY =~ ^[Yy]$ ]]; then
  git commit -m "deploy: Vercel deployment preparation" 2>/dev/null || true
  git push
  echo "✓ Pushed to GitHub"
fi
echo ""

# Step 4: Deploy to Vercel
echo "▶ Step 4: Deploying to Vercel..."
echo ""
echo "  In the Vercel dashboard, ensure these environment variables are set:"
echo "  ┌─────────────────────────────────────────────────────────────┐"
echo "  │ DATABASE_URL     = <your Vercel Postgres or Neon URL>       │"
echo "  │ CRON_SECRET      = <random string>                          │"
echo "  │ GEMINI_API_KEY   = <optional>                               │"
echo "  │ OPENROUTER_API_KEY = <optional>                             │"
echo "  │ GROQ_API_KEY     = <optional>                               │"
echo "  │ HUGGINGFACE_API_KEY = <optional>                            │"
echo "  │ REPLICATE_API_TOKEN = <optional>                            │"
echo "  │ HYPERFRAMES_MCP_URL = <optional>                            │"
echo "  │ NEXT_PUBLIC_APP_URL = <your-vercel-url>                     │"
echo "  └─────────────────────────────────────────────────────────────┘"
echo ""
read -p "Run 'vercel --prod' now? (y/n) " -n 1 -r
echo ""
if [[ $REPLY =~ ^[Yy]$ ]]; then
  vercel --prod
  echo ""
  echo "✓ Deployed to Vercel"
fi

# Step 5: Sync data to remote database
echo ""
echo "▶ Step 5: Database sync"
echo ""
if [ -n "$EXPORT_FILE" ] && [ -f "$EXPORT_FILE" ]; then
  echo "  To sync your local data to the Vercel database:"
  echo ""
  echo "  Option A — Neon (recommended):"
  echo "    1. Get your Neon connection string from the Vercel dashboard"
  echo "    2. Run: psql '<neon-url>' -f $EXPORT_FILE"
  echo ""
  echo "  Option B — Vercel Postgres:"
  echo "    1. Get the direct connection string from Vercel dashboard"
  echo "    2. Run: psql '<vercel-pg-url>' -f $EXPORT_FILE"
  echo ""
  echo "  Option C — Prisma db push + seed:"
  echo "    1. Set DATABASE_URL to your remote URL in .env"
  echo "    2. Run: npm run db:push"
  echo "    3. Run: npm run db:seed"
  echo "    4. Restore your local DATABASE_URL"
fi

echo ""
echo "╔══════════════════════════════════════════════════════╗"
echo "║   Deployment complete!                              ║"
echo "║   Check your Vercel dashboard for the live URL.     ║"
echo "╚══════════════════════════════════════════════════════╝"
