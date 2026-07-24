import express, { Response } from "express";
import { prisma } from "../db";
import { authenticateToken, AuthRequest } from "../middleware/auth";

const router = express.Router();

// GET /api/documents/:id/versions - List version history
router.get("/documents/:id/versions", authenticateToken, async (req: AuthRequest, res: Response, next) => {
  try {
    const { id } = req.params;
    const userId = req.user!.id;

    const document = await prisma.document.findUnique({
      where: { id },
      include: { sharedWith: true }
    });

    if (!document) {
      return res.status(404).json({ error: "Document not found" });
    }

    const isOwner = document.ownerId === userId;
    const hasAccess = document.sharedWith.some(s => s.userId === userId);

    if (!isOwner && !hasAccess) {
      return res.status(403).json({ error: "Access denied" });
    }

    const versions = await prisma.documentVersion.findMany({
      where: { documentId: id },
      include: {
        createdBy: { select: { id: true, name: true, email: true } }
      },
      orderBy: { createdAt: "desc" }
    });

    res.json(versions);
  } catch (err) {
    next(err);
  }
});

// POST /api/documents/:id/versions - Create a version snapshot
router.post("/documents/:id/versions", authenticateToken, async (req: AuthRequest, res: Response, next) => {
  try {
    const { id } = req.params;
    const userId = req.user!.id;

    const document = await prisma.document.findUnique({
      where: { id },
      include: { sharedWith: true }
    });

    if (!document) {
      return res.status(404).json({ error: "Document not found" });
    }

    const isOwner = document.ownerId === userId;
    const userAccess = document.sharedWith.find(s => s.userId === userId);
    const canSnapshot = isOwner || (userAccess && ["admin", "editor", "edit"].includes(userAccess.permission));

    if (!canSnapshot) {
      return res.status(403).json({ error: "No permission to create version snapshots" });
    }

    const version = await prisma.documentVersion.create({
      data: {
        documentId: id,
        title: document.title,
        content: document.content,
        createdById: userId
      },
      include: {
        createdBy: { select: { id: true, name: true, email: true } }
      }
    });

    res.status(201).json(version);
  } catch (err) {
    next(err);
  }
});

// POST /api/documents/:id/versions/:versionId/restore - Restore historical version
router.post("/documents/:id/versions/:versionId/restore", authenticateToken, async (req: AuthRequest, res: Response, next) => {
  try {
    const { id, versionId } = req.params;
    const userId = req.user!.id;

    const document = await prisma.document.findUnique({
      where: { id },
      include: { sharedWith: true }
    });

    if (!document) {
      return res.status(404).json({ error: "Document not found" });
    }

    const isOwner = document.ownerId === userId;
    const userAccess = document.sharedWith.find(s => s.userId === userId);
    const canRestore = isOwner || (userAccess && ["admin", "editor", "edit"].includes(userAccess.permission));

    if (!canRestore) {
      return res.status(403).json({ error: "No permission to restore document versions" });
    }

    const version = await prisma.documentVersion.findUnique({
      where: { id: versionId }
    });

    if (!version || version.documentId !== id) {
      return res.status(404).json({ error: "Version snapshot not found" });
    }

    // Save current state as a snapshot before restoring
    await prisma.documentVersion.create({
      data: {
        documentId: id,
        title: document.title + " (Pre-restore snapshot)",
        content: document.content,
        createdById: userId
      }
    });

    // Restore version content and title
    const updatedDocument = await prisma.document.update({
      where: { id },
      data: {
        title: version.title.replace(" (Pre-restore snapshot)", ""),
        content: version.content
      },
      include: {
        owner: { select: { id: true, name: true, email: true } },
        attachments: true
      }
    });

    res.json(updatedDocument);
  } catch (err) {
    next(err);
  }
});

export default router;
