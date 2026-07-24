import express, { Response } from "express";
import { prisma } from "../db";
import { authenticateToken, AuthRequest } from "../middleware/auth";

const router = express.Router();

// POST /api/documents/:id/presence - Heartbeat active user presence
router.post("/documents/:id/presence", authenticateToken, async (req: AuthRequest, res: Response, next) => {
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

    const presence = await prisma.presence.upsert({
      where: {
        documentId_userId: {
          documentId: id,
          userId
        }
      },
      create: {
        documentId: id,
        userId,
        lastSeen: new Date()
      },
      update: {
        lastSeen: new Date()
      },
      include: {
        user: { select: { id: true, name: true, email: true } }
      }
    });

    res.json(presence);
  } catch (err) {
    next(err);
  }
});

// GET /api/documents/:id/presence - Get active collaborators
router.get("/documents/:id/presence", authenticateToken, async (req: AuthRequest, res: Response, next) => {
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

    // Active within last 30 seconds
    const thirtySecondsAgo = new Date(Date.now() - 30 * 1000);

    const activePresences = await prisma.presence.findMany({
      where: {
        documentId: id,
        lastSeen: { gte: thirtySecondsAgo }
      },
      include: {
        user: { select: { id: true, name: true, email: true } }
      }
    });

    res.json(activePresences);
  } catch (err) {
    next(err);
  }
});

export default router;
