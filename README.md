# Social Network App

A self-hosted, AI-assisted social media management dashboard built with **Next.js 16**, **React 19**, **Tailwind CSS v4**, and **Prisma + PostgreSQL**.

Human-in-the-loop by design — nothing is published without explicit approval.

---

## Features

### Multi-Platform Content Management
- Compose, schedule, and approve posts across **13 social platforms**: X (Twitter), LinkedIn, Mastodon, Bluesky, Reddit, Threads, Instagram, TikTok, YouTube, Pinterest, Substack, BeeHiiv, Rumble
- Content calendar with drag-to-date scheduling
- Multiple format support: posts, threads, stories, reels, images, videos, GIFs, articles, newsletters

### AI-Assisted Content Generation
- Integrates with **5 free generative AI APIs**:
  - **OpenRouter** — unified access to many open models (free tier)
  - **Google Gemini** — generous free tier for text generation
  - **Groq** — ultra-fast inference with free tier
  - **Hugging Face Inference API** — serverless inference on open models
  - **Ollama** — self-hosted, zero-cost local models
- Generate post drafts, captions, and thread outlines
- All AI output is reviewed by a human before publishing

### Dashboard & Analytics
- Bar charts for engagement by platform (likes, comments, shares)
- Pie charts for content format distribution
- Activity tables for actions, feedback, replies, and campaign traction
- Campaign outreach metrics (impressions, likes, comments, shares)
- Notification center for alerts and pending approvals

### Cron Job Scheduler
- Built-in cron endpoint (`/api/cron`) processes scheduled posts every 5 minutes
- Protected by `CRON_SECRET` bearer token
- Vercel Cron configuration included (`vercel.json`)
- Local cron runner via `npm run cron` using `node-cron`

### Security (Zero-Vulnerability Tolerance)
- `npm audit`: **0 vulnerabilities** (enforced)
- Strict TypeScript (`strict: true`)
- Content Security Policy (CSP) headers
- X-Content-Type-Options, X-Frame-Options, Referrer-Policy, Permissions-Policy
- Server-side secrets — API keys never shipped to the browser
- No `dangerouslySetInnerHTML` usage
- Bearer-protected cron endpoint
- API input validation on all routes
- Standalone output for minimal Docker image footprint

### Animations
- Framer Motion page transitions, staggered card reveals, hover lifts, sidebar entrance
- Animated active-indicator in navigation
- Smooth mobile menu overlay

---

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Framework | Next.js 16 (App Router, Turbopack) |
| UI | React 19, Tailwind CSS v4 |
| Animations | Framer Motion |
| Charts | Recharts |
| Database | PostgreSQL + Prisma ORM |
| AI | OpenRouter, Gemini, Groq, Hugging Face, Ollama |
| Scheduler | Vercel Cron / node-cron |
| Language | TypeScript (strict mode) |

---

## Getting Started

### Prerequisites
- Node.js 18+
- PostgreSQL (local or hosted — Neon, Supabase, Vercel Postgres)

### Installation

```bash
# Clone the repo
git clone https://github.com/YOUR_USERNAME/social-network-app.git
cd social-network-app

# Install dependencies
npm install

# Copy environment template
cp .env.example .env

# Edit .env with your DATABASE_URL and API keys
# Then generate Prisma client and run migrations
npm run db:generate
npm run db:migrate

# (Optional) Seed demo data
npm run db:seed

# Start development server
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

### Local Cron Scheduler

```bash
# In a separate terminal, run the cron scheduler
npm run cron
```

### Vercel Deployment

1. Push to GitHub
2. Import the repo in [Vercel](https://vercel.com)
3. Set environment variables in Vercel dashboard:
   - `DATABASE_URL` — your Vercel Postgres or Neon connection string
   - `DIRECT_DATABASE_URL` — direct connection (for migrations)
   - `CRON_SECRET` — random string for cron auth
   - AI provider keys: `OPENROUTER_API_KEY`, `GEMINI_API_KEY`, `GROQ_API_KEY`, `HUGGINGFACE_API_KEY`
4. Vercel Cron is pre-configured in `vercel.json` (every 5 minutes)

---

## Project Structure

```
social-network-app/
├── app/
│   ├── api/
│   │   ├── accounts/         # Platform account CRUD
│   │   ├── ai/generate/      # AI content generation
│   │   ├── cron/             # Scheduled post processor
│   │   ├── platform-keys/    # Platform API key management
│   │   ├── posts/            # Post CRUD
│   │   └── stats/            # Dashboard statistics
│   ├── calendar/             # Content calendar page
│   ├── compose/              # Post composer + AI assistant
│   ├── platforms/            # Platform connections page
│   ├── settings/             # Settings (AI, DB, platform keys, security)
│   ├── layout.tsx            # Root layout with AppShell
│   ├── page.tsx              # Dashboard home
│   └── globals.css           # Theme system (orange/magenta silver)
├── components/
│   ├── ai/                   # AI assistant panel
│   ├── layout/               # App shell, sidebar
│   ├── motion/               # Framer Motion wrappers
│   └── ui/                   # Button, Card, Badge, Input, Textarea, Select
├── lib/
│   ├── ai/                   # AI providers + generation logic
│   ├── platforms/            # Platform registry
│   ├── prisma.ts             # Prisma singleton
│   ├── types/                # TypeScript types
│   └── utils.ts              # Utility functions
├── prisma/
│   ├── schema.prisma         # Database schema
│   └── seed.ts               # Demo data seeder
├── scripts/
│   └── cron.ts               # Local cron runner
├── next.config.ts            # Security-hardened Next.js config
├── vercel.json               # Vercel cron schedule
└── .env.example              # Environment template
```

---

## Environment Variables

| Variable | Required | Description |
|----------|----------|-------------|
| `DATABASE_URL` | Yes | PostgreSQL connection string |
| `DIRECT_DATABASE_URL` | No | Direct connection for migrations |
| `CRON_SECRET` | Yes | Bearer token for cron endpoint |
| `OPENROUTER_API_KEY` | No | OpenRouter API key |
| `GEMINI_API_KEY` | No | Google Gemini API key |
| `GROQ_API_KEY` | No | Groq API key |
| `HUGGINGFACE_API_KEY` | No | Hugging Face API key |
| `OLLAMA_BASE_URL` | No | Ollama server URL (default: http://localhost:11434) |
| `NEXT_PUBLIC_APP_URL` | No | App URL (default: http://localhost:3000) |

---

## License

MIT
