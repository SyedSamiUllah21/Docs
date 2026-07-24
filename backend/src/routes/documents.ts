import express, { Response } from "express";
import { prisma } from "../db";
import { authenticateToken, AuthRequest } from "../middleware/auth";
import { createDocumentSchema, updateDocumentSchema } from "../lib/validators";
import { validateBody } from "../middleware/validation";

const router = express.Router();

// GET /api/documents - List owned and shared documents
router.get("/", authenticateToken, async (req: AuthRequest, res: Response, next) => {
  try {
    const userId = req.user!.id;

    // Fetch owned documents
    const ownedDocuments = await prisma.document.findMany({
      where: { ownerId: userId },
      include: {
        owner: { select: { id: true, name: true, email: true } },
        attachments: { select: { id: true, filename: true } }
      },
      orderBy: { updatedAt: "desc" }
    });

    // Fetch shared documents
    const sharedAccessList = await prisma.documentAccess.findMany({
      where: { userId },
      include: {
        document: {
          include: {
            owner: { select: { id: true, name: true, email: true } },
            attachments: { select: { id: true, filename: true } }
          }
        }
      },
      orderBy: { grantedAt: "desc" }
    });

    const ownedFormatted = ownedDocuments.map(doc => ({
      ...doc,
      isOwned: true,
      permission: "edit"
    }));

    const sharedFormatted = sharedAccessList.map(access => ({
      ...access.document,
      isOwned: false,
      permission: access.permission
    }));

    // Merge without duplicates
    const allDocuments = [...ownedFormatted, ...sharedFormatted];

    res.json(allDocuments);
  } catch (err) {
    next(err);
  }
});

// POST /api/documents - Create new document
router.post("/", authenticateToken, validateBody(createDocumentSchema), async (req: AuthRequest, res: Response, next) => {
  try {
    const userId = req.user!.id;
    const { title, content } = req.body;

    const defaultContent = JSON.stringify({
      type: "doc",
      content: [
        {
          type: "paragraph",
          content: [{ type: "text", text: "" }]
        }
      ]
    });

    const document = await prisma.document.create({
      data: {
        title: title || "Untitled Document",
        content: content || defaultContent,
        ownerId: userId
      },
      include: {
        owner: { select: { id: true, name: true, email: true } }
      }
    });

    res.status(201).json(document);
  } catch (err) {
    next(err);
  }
});

// GET /api/documents/:id - Get single document with permission check
router.get("/:id", authenticateToken, async (req: AuthRequest, res: Response, next) => {
  try {
    const { id } = req.params;
    const userId = req.user!.id;

    const document = await prisma.document.findUnique({
      where: { id },
      include: {
        owner: { select: { id: true, name: true, email: true } },
        sharedWith: {
          include: {
            user: { select: { id: true, name: true, email: true } }
          }
        },
        attachments: true
      }
    });

    if (!document) {
      return res.status(404).json({ error: "Document not found" });
    }

    const isOwner = document.ownerId === userId;
    const access = document.sharedWith.find(s => s.userId === userId);

    if (!isOwner && !access) {
      return res.status(403).json({ error: "Access denied. You do not have permission to view this document." });
    }

    const userPermission = isOwner ? "edit" : access?.permission || "view";

    res.json({
      ...document,
      isOwned: isOwner,
      permission: userPermission
    });
  } catch (err) {
    next(err);
  }
});

// PUT /api/documents/:id - Update document content & title
router.put("/:id", authenticateToken, validateBody(updateDocumentSchema), async (req: AuthRequest, res: Response, next) => {
  try {
    const { id } = req.params;
    const userId = req.user!.id;
    const { title, content } = req.body;

    const document = await prisma.document.findUnique({
      where: { id },
      include: { sharedWith: true }
    });

    if (!document) {
      return res.status(404).json({ error: "Document not found" });
    }

    const isOwner = document.ownerId === userId;
    const userAccess = document.sharedWith.find(s => s.userId === userId);

    if (!isOwner && (!userAccess || userAccess.permission !== "edit")) {
      return res.status(403).json({ error: "No edit permission for this document" });
    }

    const updatedDocument = await prisma.document.update({
      where: { id },
      data: {
        title: title !== undefined ? title : document.title,
        content: content !== undefined ? content : document.content
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

// PATCH /api/documents/:id - Update document metadata
router.patch("/:id", authenticateToken, async (req: AuthRequest, res: Response, next) => {
  try {
    const { id } = req.params;
    const userId = req.user!.id;
    const { title } = req.body;

    const document = await prisma.document.findUnique({
      where: { id },
      include: { sharedWith: true }
    });

    if (!document) {
      return res.status(404).json({ error: "Document not found" });
    }

    const isOwner = document.ownerId === userId;
    const userAccess = document.sharedWith.find(s => s.userId === userId);

    if (!isOwner && (!userAccess || userAccess.permission !== "edit")) {
      return res.status(403).json({ error: "No edit permission for this document" });
    }

    const updatedDocument = await prisma.document.update({
      where: { id },
      data: { title: title || document.title }
    });

    res.json(updatedDocument);
  } catch (err) {
    next(err);
  }
});

// DELETE /api/documents/:id - Delete document (owner only)
router.delete("/:id", authenticateToken, async (req: AuthRequest, res: Response, next) => {
  try {
    const { id } = req.params;
    const userId = req.user!.id;

    const document = await prisma.document.findUnique({
      where: { id }
    });

    if (!document) {
      return res.status(404).json({ error: "Document not found" });
    }

    if (document.ownerId !== userId) {
      return res.status(403).json({ error: "Only the document owner can delete this document" });
    }

    await prisma.document.delete({ where: { id } });

    res.json({ success: true, message: "Document deleted successfully" });
  } catch (err) {
    next(err);
  }
});

export default router;
