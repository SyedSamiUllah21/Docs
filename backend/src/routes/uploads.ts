import express, { Response } from "express";
import multer from "multer";
import path from "path";
import fs from "fs";
import { prisma } from "../db";
import { authenticateToken, AuthRequest } from "../middleware/auth";

const router = express.Router();

const uploadDir = process.env.UPLOAD_DIR || "./uploads";
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
    cb(null, uniqueSuffix + "-" + file.originalname.replace(/[^a-zA-Z0-9.-]/g, "_"));
  }
});

const upload = multer({
  storage,
  limits: { fileSize: 10 * 1024 * 1024 } // 10MB limit
});

// POST /api/documents/:id/upload - Upload file attachment
router.post("/documents/:id/upload", authenticateToken, upload.single("file"), async (req: AuthRequest, res: Response, next) => {
  try {
    const { id } = req.params;
    const userId = req.user!.id;
    const file = req.file;

    if (!file) {
      return res.status(400).json({ error: "No file attached" });
    }

    const document = await prisma.document.findUnique({
      where: { id },
      include: { sharedWith: true }
    });

    if (!document) {
      // Remove uploaded temp file
      if (fs.existsSync(file.path)) fs.unlinkSync(file.path);
      return res.status(404).json({ error: "Document not found" });
    }

    const isOwner = document.ownerId === userId;
    const canEdit = isOwner || document.sharedWith.some(s => s.userId === userId && s.permission === "edit");

    if (!canEdit) {
      if (fs.existsSync(file.path)) fs.unlinkSync(file.path);
      return res.status(403).json({ error: "No edit permission to upload attachments" });
    }

    const attachment = await prisma.attachment.create({
      data: {
        documentId: id,
        filename: file.originalname,
        filePath: file.path,
        fileType: file.mimetype || "application/octet-stream",
        fileSize: file.size
      }
    });

    res.status(201).json(attachment);
  } catch (err) {
    next(err);
  }
});

// GET /api/attachments/:id - Download attachment
router.get("/attachments/:id", authenticateToken, async (req: AuthRequest, res: Response, next) => {
  try {
    const { id } = req.params;
    const userId = req.user!.id;

    const attachment = await prisma.attachment.findUnique({
      where: { id },
      include: {
        document: {
          include: { sharedWith: true }
        }
      }
    });

    if (!attachment) {
      return res.status(404).json({ error: "Attachment not found" });
    }

    const document = attachment.document;
    const isOwner = document.ownerId === userId;
    const hasAccess = document.sharedWith.some(s => s.userId === userId);

    if (!isOwner && !hasAccess) {
      return res.status(403).json({ error: "Access denied" });
    }

    if (!fs.existsSync(attachment.filePath)) {
      return res.status(404).json({ error: "File not found on server" });
    }

    res.download(attachment.filePath, attachment.filename);
  } catch (err) {
    next(err);
  }
});

// DELETE /api/attachments/:id - Delete attachment
router.delete("/attachments/:id", authenticateToken, async (req: AuthRequest, res: Response, next) => {
  try {
    const { id } = req.params;
    const userId = req.user!.id;

    const attachment = await prisma.attachment.findUnique({
      where: { id },
      include: {
        document: {
          include: { sharedWith: true }
        }
      }
    });

    if (!attachment) {
      return res.status(404).json({ error: "Attachment not found" });
    }

    const document = attachment.document;
    const isOwner = document.ownerId === userId;
    const canEdit = isOwner || document.sharedWith.some(s => s.userId === userId && s.permission === "edit");

    if (!canEdit) {
      return res.status(403).json({ error: "No edit permission to delete attachment" });
    }

    if (fs.existsSync(attachment.filePath)) {
      fs.unlinkSync(attachment.filePath);
    }

    await prisma.attachment.delete({ where: { id } });

    res.json({ success: true, message: "Attachment deleted successfully" });
  } catch (err) {
    next(err);
  }
});

export default router;
