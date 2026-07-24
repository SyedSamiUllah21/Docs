import { z } from "zod";

export const registerSchema = z.object({
  email: z.string().email("Invalid email address"),
  password: z.string().min(6, "Password must be at least 6 characters"),
  name: z.string().min(1, "Name is required").optional()
});

export const loginSchema = z.object({
  email: z.string().email("Invalid email address"),
  password: z.string().min(1, "Password is required")
});

export const createDocumentSchema = z.object({
  title: z.string().min(1, "Title is required").max(255, "Title too long").optional(),
  content: z.string().optional()
});

export const updateDocumentSchema = z.object({
  title: z.string().max(255, "Title too long").optional(),
  content: z.string().optional()
});

export const shareDocumentSchema = z.object({
  email: z.string().email("Invalid email address"),
  permission: z.enum(["admin", "editor", "edit", "commenter", "viewer", "view"], {
    required_error: "Permission must be 'admin', 'editor', 'commenter', or 'viewer'"
  })
});

export const createCommentSchema = z.object({
  content: z.string().min(1, "Comment content cannot be empty")
});

export const createVersionSchema = z.object({
  title: z.string().optional(),
  content: z.string().optional()
});
