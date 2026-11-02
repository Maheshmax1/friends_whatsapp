# Realtime Chat App (Friends WhatsApp)

A full-stack realtime chat application built with **Next.js 16 (App Router)**, **NestJS 11**, **Prisma ORM**, **Socket.IO**, and **Supabase (PostgreSQL)**.

---

## 🚀 Quick Start (Local Development)

### 1. Clone & Install
```bash
git clone https://github.com/Maheshmax1/friends_whatsapp.git
cd friends_whatsapp
npm install
```

### 2. Environment Variables

#### Root & Backend (`.env` & `apps/backend/.env`)
Create `.env` in the root (and `apps/backend/.env`):
```env
# Supabase PostgreSQL connection URLs:
DATABASE_URL="postgresql://postgres.aogzegukyiepsdsgoxug:kCurcKtHcTsNQ73z@aws-0-eu-west-1.pooler.supabase.com:6543/postgres?pgbouncer=true"
DIRECT_URL="postgresql://postgres.aogzegukyiepsdsgoxug:kCurcKtHcTsNQ73z@aws-0-eu-west-1.pooler.supabase.com:5432/postgres"

PORT=5000
JWT_SECRET="chat-super-secret-jwt-key-2026-safe-and-secure"
NODE_ENV=development
```

#### Web Frontend (`apps/web/.env.local`)
Create `apps/web/.env.local`:
```env
NEXT_PUBLIC_SUPABASE_URL=https://aogzegukyiepsdsgoxug.supabase.co
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=sb_publishable_HKu5sNbT6caQRZG9txFMGA__rnnqcqF
NEXT_PUBLIC_API_URL=http://localhost:5000
```

### 3. Sync Database Schema
Push the Prisma models to your Supabase PostgreSQL database:
```bash
npm run db:push
```

### 4. Run Everything with One Command
```bash
npm run dev
```

- **Frontend**: [http://localhost:3000](http://localhost:3000)
- **Backend API**: [http://localhost:5000](http://localhost:5000)

*(Optional: To run offline without Supabase, `npm run db:start` boots a zero-config local PostgreSQL database on port 5432 without needing Docker).*

---

## 🌐 Deployment Guide

### Deploying Frontend to Vercel (Free)

1. Go to [vercel.com](https://vercel.com) and click **Add New... > Project**.
2. Import `Maheshmax1/friends_whatsapp`.
3. In **Project Settings**:
   - **Root Directory**: `apps/web` *(Click Edit and select `apps/web`)*
   - **Framework Preset**: `Next.js`
4. Add **Environment Variables**:
   - `NEXT_PUBLIC_SUPABASE_URL`: `https://aogzegukyiepsdsgoxug.supabase.co`
   - `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`: `sb_publishable_HKu5sNbT6caQRZG9txFMGA__rnnqcqF`
   - `NEXT_PUBLIC_API_URL`: Your backend URL (e.g. `https://your-backend.onrender.com`)
5. Click **Deploy**.

---

### Deploying Backend to Render / Railway (Free / Low Cost)

> [!NOTE]
> Vercel is serverless and does not maintain persistent WebSockets (Socket.IO). The backend should be hosted on a persistent Node.js host like **[Render](https://render.com)** or **[Railway](https://railway.app)**.

#### Deploy on Render (Web Service):
1. Create a **Web Service** on Render connected to this repository.
2. Settings:
   - **Root Directory**: `apps/backend`
   - **Build Command**: `npm install && npm run build`
   - **Start Command**: `npm run start:prod`
3. Environment Variables:
   - `DATABASE_URL`: Your Supabase pooler URL
   - `DIRECT_URL`: Your Supabase direct connection URL
   - `JWT_SECRET`: Any long secure secret string
   - `PORT`: `5000`
4. Copy your Render URL (e.g. `https://friends-whatsapp-api.onrender.com`) and set it as `NEXT_PUBLIC_API_URL` in Vercel!

---

## 📁 Project Structure

```
friends_whatsapp/
├── apps/
│   ├── backend/               # NestJS API, WebSocket Gateway, Prisma ORM
│   │   ├── prisma/            # schema.prisma database schema
│   │   └── src/               # Auth, Chats, Users, WebSockets modules
│   └── web/                   # Next.js 16 Web Frontend (Tailwind, Lucide, Radix)
│       └── src/
│           ├── app/           # App router pages
│           ├── context/       # ChatContext (Socket.IO, Auth state)
│           └── utils/supabase # Server, client & middleware helpers
├── scripts/
│   └── start-db.js            # Standalone zero-Docker embedded PostgreSQL runner
├── package.json               # Monorepo workspaces & dev commands
└── README.md                  # This setup guide
```

---

## 🛠 Available Scripts

| Command | Description |
|---|---|
| `npm run dev` | Runs DB, backend, and web frontend concurrently |
| `npm run dev:backend` | Starts only the NestJS backend in watch mode |
| `npm run dev:web` | Starts only the Next.js frontend in dev mode |
| `npm run db:push` | Pushes Prisma schema changes to Supabase |
| `npm run db:generate` | Regenerates Prisma Client types |
| `npm run build` | Compiles both backend and frontend for production |
