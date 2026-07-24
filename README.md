# 📝 FastDocs

![FastDocs Banner](https://via.placeholder.com/1200x400/0f172a/ffffff?text=FastDocs+-+Full-Stack+Document+Editor)

FastDocs is a modern, lightweight, full-stack document editor built with **Next.js 14**, **Tailwind CSS**, **TipTap**, **Express.js**, and **PostgreSQL**. It offers a clean, glassmorphic UI, rich text editing, live document sharing, PDF/Word exports, and version history tracking.

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
- **Database**: [PostgreSQL](https://www.postgresql.org/) with [Prisma ORM](https://www.prisma.io/)
- **Authentication**: JWT-based authentication
- **Validation**: [Zod](https://zod.dev/)
- **File Storage**: Local file system (Multer)

---

## 🚀 Getting Started

Follow these steps to get FastDocs running locally on your machine.

### Prerequisites
- Node.js (v18 or higher recommended)
- npm or yarn
- A PostgreSQL database (local or cloud-hosted via Supabase/Neon/Render)

### 1. Backend Setup

Open a terminal and navigate to the backend directory:

```bash
cd backend
```

Install the dependencies:
```bash
npm install
```

Create a `.env` file in the `backend` directory and add your PostgreSQL connection string and a secret key for JWT:
```env
DATABASE_URL="postgresql://user:password@localhost:5432/fastdocs"
JWT_SECRET="your-super-secret-key"
PORT=4000
```

Set up the database and run the seed script to create test users:
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

### Deploying the Backend (Render.com)
The Node.js/Express backend is fully configured for deployment on Render's free tier. 

1. Create a free **PostgreSQL** database on Render.
2. Create a new **Web Service** on Render and link your GitHub repository.
3. Set the Root Directory to `backend`.
4. Add your Environment Variables (`DATABASE_URL` and `JWT_SECRET`).
5. Deploy! Render will automatically install dependencies, run Prisma migrations, and start the API.

*Note: The free tier of Render uses ephemeral file storage. Any files uploaded directly to the local file system (via Multer) will be reset when the server restarts. For production, switch Multer to a cloud provider like AWS S3 or Vercel Blob.*

### Deploying the Frontend (Vercel)
Vercel is the best and easiest place to deploy the Next.js frontend.

1. Push your repository to GitHub.
2. Import the repository into [Vercel](https://vercel.com).
3. Set the Root Directory to `frontend`.
4. Add the `NEXT_PUBLIC_API_URL` environment variable pointing to your deployed backend (e.g., `https://fastdocs-api.onrender.com`).
5. Deploy!

---

## 📜 License

This project is licensed under the MIT License. Feel free to use, modify, and distribute it as needed.
