import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  console.log("🌱 Seeding FastDocs database...");

  // Clean existing data
  await prisma.attachment.deleteMany({});
  await prisma.documentAccess.deleteMany({});
  await prisma.document.deleteMany({});
  await prisma.user.deleteMany({});

  // Hash password
  const defaultPassword = await bcrypt.hash("password123", 10);

  // Create Users
  const alice = await prisma.user.create({
    data: {
      email: "alice@test.com",
      password: defaultPassword,
      name: "Alice Johnson"
    }
  });

  const bob = await prisma.user.create({
    data: {
      email: "bob@test.com",
      password: defaultPassword,
      name: "Bob Smith"
    }
  });

  console.log(`✅ Created test users:\n  - ${alice.email} (Alice Johnson)\n  - ${bob.email} (Bob Smith)`);

  // Create Documents for Alice
  const doc1 = await prisma.document.create({
    data: {
      title: "Project FastDocs Architecture & Specs",
      content: JSON.stringify({
        type: "doc",
        content: [
          {
            type: "heading",
            attrs: { level: 1 },
            content: [{ type: "text", text: "FastDocs Specification" }]
          },
          {
            type: "paragraph",
            content: [
              {
                type: "text",
                text: "Welcome to FastDocs! This is a modern, lightweight document editor built with Next.js, TipTap, and Express.js."
              }
            ]
          },
          {
            type: "bulletList",
            content: [
              {
                type: "listItem",
                content: [{ type: "paragraph", content: [{ type: "text", text: "Rich text editing with bold, italic, lists, and headings." }] }]
              },
              {
                type: "listItem",
                content: [{ type: "paragraph", content: [{ type: "text", text: "Instant debounced auto-save with persistent SQLite storage." }] }]
              },
              {
                type: "listItem",
                content: [{ type: "paragraph", content: [{ type: "text", text: "Granular document sharing with view or edit permissions." }] }]
              }
            ]
          }
        ]
      }),
      ownerId: alice.id
    }
  });

  const doc2 = await prisma.document.create({
    data: {
      title: "Q3 Product Roadmap",
      content: JSON.stringify({
        type: "doc",
        content: [
          {
            type: "heading",
            attrs: { level: 1 },
            content: [{ type: "text", text: "Q3 Roadmap Objectives" }]
          },
          {
            type: "paragraph",
            content: [{ type: "text", text: "Please review and add feedback on proposed feature milestones below." }]
          }
        ]
      }),
      ownerId: alice.id
    }
  });

  // Create Document for Bob
  const doc3 = await prisma.document.create({
    data: {
      title: "Bob's Weekly Notes",
      content: JSON.stringify({
        type: "doc",
        content: [
          {
            type: "paragraph",
            content: [{ type: "text", text: "Personal task tracker and notes." }]
          }
        ]
      }),
      ownerId: bob.id
    }
  });

  // Share Alice's "Q3 Product Roadmap" with Bob as view access
  await prisma.documentAccess.create({
    data: {
      documentId: doc2.id,
      userId: bob.id,
      permission: "view"
    }
  });

  console.log("🎉 Database seeded successfully with test documents and access grants!");
}

main()
  .catch(e => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
