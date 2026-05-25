# NECKLINE

Solid scent brand storefront. MERN stack e-commerce platform.

## Stack

- **Frontend**: Next.js 14 (App Router), React 18, TypeScript, Tailwind CSS
- **Backend**: Express 4, Mongoose 8, Node.js 20 LTS
- **Database**: MongoDB Atlas (production), Docker/local for development
- **Deployment**: Vercel (frontend), Render (backend)

## Quick Start

```bash
# 1. Start local MongoDB
docker-compose up -d

# 2. Install dependencies
npm install

# 3. Set up environment variables
cp apps/api/.env.example apps/api/.env
cp apps/web/.env.example apps/web/.env.local

# 4. Start development servers
npm run dev
```

## Workspaces

- `apps/web` — Next.js frontend
- `apps/api` — Express backend

## Spec Kit Workflow

Every phase follows: `/specify → /clarify → /plan → /tasks → /analyze → /implement`

See `ROADMAP.md` for phase breakdown and `CONSTITUTION.md` for governing principles.
