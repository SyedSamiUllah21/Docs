import express, { Response } from "express";
import { prisma } from "../db";
import { authenticateToken, AuthRequest } from "../middleware/auth";
import { createCommentSchema } from "../lib/validators";
import { validateBody } from "../middleware/validation";

const router = express.Router();

// GET /api/documents/:id/comments
router.get("/documents/:id/comments", authenticateToken, async (req: AuthRequest, res: Response, next) => {
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

    const comments = await prisma.comment.findMany({
      where: { documentId: id },
      include: {
        author: { select: { id: true, name: true, email: true } }
      },
      orderBy: { createdAt: "asc" }
    });

    res.json(comments);
  } catch (err) {
    next(err);
  }
});

// POST /api/documents/:id/comments
router.post("/documents/:id/comments", authenticateToken, validateBody(createCommentSchema), async (req: AuthRequest, res: Response, next) => {
  try {
    const { id } = req.params;
    const { content } = req.body;
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
    const canComment = isOwner || (userAccess && ["admin", "editor", "edit", "commenter"].includes(userAccess.permission));

    if (!canComment) {
      return res.status(403).json({ error: "No permission to add comments to this document" });
    }

    const comment = await prisma.comment.create({
      data: {
        documentId: id,
        authorId: userId,
        content
      },
      include: {
        author: { select: { id: true, name: true, email: true } }
      }
    });

    res.status(201).json(comment);
  } catch (err) {
    next(err);
  }
});

// PATCH /api/comments/:commentId/resolve - Toggle comment resolution state
router.patch("/comments/:commentId/resolve", authenticateToken, async (req: AuthRequest, res: Response, next) => {
  try {
    const { commentId } = req.params;
    const userId = req.user!.id;

    const comment = await prisma.comment.findUnique({
      where: { id: commentId },
      include: {
        document: { include: { sharedWith: true } }
      }
    });

    if (!comment) {
      return res.status(404).json({ error: "Comment not found" });
    }

    const document = comment.document;
    const isOwner = document.ownerId === userId;
    const isAuthor = comment.authorId === userId;
    const userAccess = document.sharedWith.find(s => s.userId === userId);
    const canResolve = isOwner || isAuthor || (userAccess && ["admin", "editor", "edit"].includes(userAccess.permission));

    if (!canResolve) {
      return res.status(403).json({ error: "No permission to resolve this comment" });
    }

    const updated = await prisma.comment.update({
      where: { id: commentId },
      data: { resolved: !comment.resolved },
      include: {
        author: { select: { id: true, name: true, email: true } }
      }
    });

    res.json(updated);
  } catch (err) {
    next(err);
  }
});

// DELETE /api/comments/:commentId
router.delete("/comments/:commentId", authenticateToken, async (req: AuthRequest, res: Response, next) => {
  try {
    const { commentId } = req.params;
    const userId = req.user!.id;

    const comment = await prisma.comment.findUnique({
      where: { id: commentId },
      include: { document: true }
    });

    if (!comment) {
      return res.status(404).json({ error: "Comment not found" });
    }

    const isOwner = comment.document.ownerId === userId;
    const isAuthor = comment.authorId === userId;

    if (!isOwner && !isAuthor) {
      return res.status(403).json({ error: "Not authorized to delete this comment" });
    }

    await prisma.comment.delete({ where: { id: commentId } });

    res.json({ success: true, message: "Comment deleted" });
  } catch (err) {
    next(err);
  }
});

export default router;
