import { createDocumentSchema, updateDocumentSchema, shareDocumentSchema } from "../../lib/validators";

describe("Validation Schemas Unit Tests", () => {
  describe("createDocumentSchema", () => {
    it("should validate valid document title", () => {
      const valid = createDocumentSchema.safeParse({ title: "My Document" });
      expect(valid.success).toBe(true);
    });

    it("should allow empty object with optional title", () => {
      const valid = createDocumentSchema.safeParse({});
      expect(valid.success).toBe(true);
    });

    it("should fail on extremely long title", () => {
      const invalid = createDocumentSchema.safeParse({ title: "a".repeat(300) });
      expect(invalid.success).toBe(false);
    });
  });

  describe("shareDocumentSchema", () => {
    it("should validate valid email and view permission", () => {
      const valid = shareDocumentSchema.safeParse({
        email: "bob@test.com",
        permission: "view"
      });
      expect(valid.success).toBe(true);
    });

    it("should validate valid email and edit permission", () => {
      const valid = shareDocumentSchema.safeParse({
        email: "bob@test.com",
        permission: "edit"
      });
      expect(valid.success).toBe(true);
    });

    it("should reject invalid email", () => {
      const invalid = shareDocumentSchema.safeParse({
        email: "not-an-email",
        permission: "view"
      });
      expect(invalid.success).toBe(false);
    });

    it("should reject invalid permission string", () => {
      const invalid = shareDocumentSchema.safeParse({
        email: "bob@test.com",
        permission: "admin"
      });
      expect(invalid.success).toBe(false);
    });
  });
});
