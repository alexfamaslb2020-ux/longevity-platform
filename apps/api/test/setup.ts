import { PrismaClient } from "@prisma/client";

beforeEach(async () => {
  const prisma = new PrismaClient();
  try {
    const tablenames = await prisma.$queryRaw<Array<{ tablename: string }>>`
      SELECT tablename FROM pg_tables WHERE schemaname='public'
    `;
    for (const { tablename } of tablenames) {
      if (tablename !== "_prisma_migrations") {
        await prisma.$executeRawUnsafe(
          `TRUNCATE TABLE "public"."${tablename}" CASCADE`,
        );
      }
    }
  } finally {
    await prisma.$disconnect();
  }
});
