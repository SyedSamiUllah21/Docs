# 📝 FastDocs

![FastDocs Banner](https://via.placeholder.com/1200x400/0f172a/ffffff?text=FastDocs+-+Full-Stack+Document+Editor)

FastDocs is a modern, lightweight, full-stack document editor built with **Next.js 14**, **Tailwind CSS**, **TipTap**, **Express.js**, and **SQLite**. It offers a clean, glassmorphic UI, rich text editing, live document sharing, PDF/Word exports, and version history tracking.

---

## ✨ Features

- **Rich Text Editor**: Powered by TipTap (ProseMirror), supporting headings, lists, blockquotes, code blocks, tables, and standard formatting (bold, italic, underline, strikethrough).
- **Beautiful UI**: Modern glassmorphism design with Tailwind CSS and Lucide Icons.
- **Export Capabilities**: Directly export your documents to **PDF**, **Word (.doc)**, or **Markdown**.
- **Collaboration & Sharing**: Share documents with specific users, assign roles (Admin, Editor, Viewer), and manage access.
- **Version History**: Save specific snapshots of your documents and restore them at any time.
- **Comments System**: Select text and leave comments. Resolve or delete comments dynamically.
- **File Uploads**: Drag-and-drop file uploads (images, PDFs) directly into your workspace.
- **Dark Mode**: Fully styled for a sleek, comfortable dark-mode editing experience.

---

## 🛠️ Tech Stack

### Frontend
- **Framework**: [Next.js 14](https://nextjs.org/) (App Router)
- **UI & Styling**: [React 18](https://reactjs.org/), [Tailwind CSS](https://tailwindcss.com/)
- **Editor**: [TipTap](https://tiptap.dev/) (headless rich text framework)
- **HTTP Client**: [Axios](https://axios-http.com/)
- **Icons**: [Lucide React](https://lucide.dev/)
- **Export Utilities**: `jspdf`, `html2canvas`

### Backend
- **Runtime**: [Node.js](https://nodejs.org/) & [Express.js](https://expressjs.com/)
- **Database**: [SQLite](https://www.sqlite.org/) with [Prisma ORM](https://www.prisma.io/)
- **Authentication**: JWT-based authentication
- **Validation**: [Zod](https://zod.dev/)
- **File Storage**: Local file system (Multer)

---

## 🚀 Getting Started

Follow these steps to get FastDocs running locally on your machine.

### Prerequisites
- Node.js (v18 or higher recommended)
- npm or yarn

### 1. Backend Setup

Open a terminal and navigate to the backend directory:

```bash
cd backend
```

Install the dependencies:
```bash
npm install
```

Set up the SQLite database and run the seed script to create test users:
```bash
npx prisma migrate dev --name init
npx prisma db seed
```

Start the backend development server:
```bash
npm run dev
```
The backend REST API will run on **http://localhost:4000**.

### 2. Frontend Setup

Open a new terminal window and navigate to the frontend directory:

```bash
cd frontend
```

Install the dependencies:
```bash
npm install
```

Start the Next.js development server:
```bash
npm run dev
```
The frontend application will be available at **http://localhost:3000**.

---

## 🔑 Test Accounts (Seeded Data)

The database seed script automatically creates two test accounts you can use to log in and test sharing features:

- **User 1:**
  - **Email:** `alice@test.com`
  - **Password:** `password123`

- **User 2:**
  - **Email:** `bob@test.com`
  - **Password:** `password123`

---

## 🌍 Deployment

### Deploying the Frontend (Vercel)
The frontend is built with Next.js and can be deployed directly to [Vercel](https://vercel.com) for free. Ensure you set the `NEXT_PUBLIC_API_URL` environment variable to your deployed backend URL.

### Deploying the Backend
Because this app uses **SQLite** (a local file database) and **Multer** for local file uploads, you **must** deploy the backend to a provider that supports **persistent volumes**. 
- **Recommended**: [Fly.io](https://fly.io/) or [Railway.app](https://railway.app/).
- **Note on Render/Vercel**: Deploying the backend to Render's free tier or Vercel will result in database wipes on restart due to ephemeral/read-only file systems. To deploy there, switch the database to PostgreSQL and uploads to a cloud provider like AWS S3 or Vercel Blob.

---

## 📜 License

This project is licensed under the MIT License. Feel free to use, modify, and distribute it as needed.
