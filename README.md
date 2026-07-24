# FastDocs - Full-Stack Lightweight Document Editor

FastDocs is a fast, modern full-stack document editor built with Next.js 14, TipTap, Tailwind CSS, Express.js, Prisma ORM, and SQLite.

## Architecture

- **`frontend/`**: Next.js 14 App Router, React 18, TipTap Editor, Axios, Tailwind CSS
- **`backend/`**: Express.js REST API, Prisma ORM, SQLite database, Multer file storage, JWT auth, Zod validation

## Quick Start

### 1. Backend Setup
```bash
cd backend
npm install
npx prisma migrate dev --name init
npx prisma db seed
npm run dev
```
Backend runs on `http://localhost:4000`.

### 2. Frontend Setup
```bash
cd frontend
npm install
npm run dev
```
Frontend runs on `http://localhost:3000`.

## Seeded Accounts

- **Alice**: `alice@test.com` / `password123`
- **Bob**: `bob@test.com` / `password123`
