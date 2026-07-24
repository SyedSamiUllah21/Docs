import express, { Response } from "express";
import { prisma } from "../db";
import { authenticateToken, AuthRequest } from "../middleware/auth";
import { shareDocumentSchema } from "../lib/validators";
import { validateBody } from "../middleware/validation";

const router = express.Router();

// POST /api/documents/:id/share - Grant or update user access (Owner only)
router.post("/:id/share", authenticateToken, validateBody(shareDocumentSchema), async (req: AuthRequest, res: Response, next) => {
  try {
    const { id } = req.params;
    const { email, permission } = req.body;
    const ownerId = req.user!.id;

    const document = await prisma.document.findUnique({
      where: { id }
    });

    if (!document) {
      return res.status(404).json({ error: "Document not found" });
    }

    if (document.ownerId !== ownerId) {
      return res.status(403).json({ error: "Only the document owner can share this document" });
    }

    const recipient = await prisma.user.findUnique({
      where: { email }
    });

    if (!recipient) {
      return res.status(404).json({ error: `User with email "${email}" not found` });
    }

    if (recipient.id === ownerId) {
      return res.status(400).json({ error: "You cannot share a document with yourself" });
    }

    const access = await prisma.documentAccess.upsert({
      where: {
        documentId_userId: {
          documentId: id,
          userId: recipient.id
        }
      },
      create: {
        documentId: id,
        userId: recipient.id,
        permission: permission || "view"
      },
      update: {
        permission
      },
      include: {
        user: { select: { id: true, name: true, email: true } }
      }
    });

    res.status(200).json(access);
  } catch (err) {
    next(err);
  }
});

// GET /api/documents/:id/share - List users access list
router.get("/:id/share", authenticateToken, async (req: AuthRequest, res: Response, next) => {
  try {
    const { id } = req.params;
    const userId = req.user!.id;

    const document = await prisma.document.findUnique({
      where: { id },
      include: {
        sharedWith: {
          include: {
            user: { select: { id: true, name: true, email: true } }
          }
        }
      }
    });

    if (!document) {
      return res.status(404).json({ error: "Document not found" });
    }

    const isOwner = document.ownerId === userId;
    const hasAccess = document.sharedWith.some(s => s.userId === userId);

    if (!isOwner && !hasAccess) {
      return res.status(403).json({ error: "Access denied" });
    }

    res.json({
      ownerId: document.ownerId,
      sharedWith: document.sharedWith
    });
  } catch (err) {
    next(err);
  }
});

// DELETE /api/documents/:id/share/:userId - Revoke access (Owner only)
router.delete("/:id/share/:targetUserId", authenticateToken, async (req: AuthRequest, res: Response, next) => {
  try {
    const { id, targetUserId } = req.params;
    const ownerId = req.user!.id;

    const document = await prisma.document.findUnique({
      where: { id }
    });

    if (!document) {
      return res.status(404).json({ error: "Document not found" });
    }

    if (document.ownerId !== ownerId) {
      return res.status(403).json({ error: "Only the document owner can revoke access" });
    }

    await prisma.documentAccess.deleteMany({
      where: {
        documentId: id,
        userId: targetUserId
      }
    });

    res.json({ success: true, message: "Access revoked successfully" });
  } catch (err) {
    next(err);
  }
});

export default router;
