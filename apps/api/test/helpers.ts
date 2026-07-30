import { INestApplication, ValidationPipe } from "@nestjs/common";
import { Test, TestingModule } from "@nestjs/testing";
import * as request from "supertest";
import * as bcrypt from "bcryptjs";
import { PrismaClient, UserRole } from "@prisma/client";

import { AppModule } from "../src/app.module";

export interface TestContext {
  app: INestApplication;
  prisma: PrismaClient;
  http: request.SuperTest<request.Test>;
  orgA: { id: string };
  orgB: { id: string };
  adminA: { id: string; token: string };
  adminB: { id: string; token: string };
  salesA: { id: string; token: string };
  salesB: { id: string; token: string };
}

export async function bootstrapApp(): Promise<TestContext> {
  const moduleFixture: TestingModule = await Test.createTestingModule({
    imports: [AppModule],
  }).compile();

  const app = moduleFixture.createNestApplication();
  app.setGlobalPrefix("api/v1");
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    }),
  );

  await app.init();
  const http = request(app.getHttpServer());

  const prisma = new PrismaClient();

  const passwordHash = await bcrypt.hash("test-password-123", 4);

  // Organization A
  const orgA = await prisma.organization.create({
    data: { name: "Org A Test" },
  });

  const adminA = await prisma.user.create({
    data: {
      email: "admin-a@test.local",
      name: "Admin A",
      passwordHash,
      role: UserRole.ADMIN,
      organizationId: orgA.id,
    },
  });

  const salesA = await prisma.user.create({
    data: {
      email: "sales-a@test.local",
      name: "Sales A",
      passwordHash,
      role: UserRole.SALES,
      organizationId: orgA.id,
    },
  });

  // Organization B
  const orgB = await prisma.organization.create({
    data: { name: "Org B Test" },
  });

  const adminB = await prisma.user.create({
    data: {
      email: "admin-b@test.local",
      name: "Admin B",
      passwordHash,
      role: UserRole.ADMIN,
      organizationId: orgB.id,
    },
  });

  const salesB = await prisma.user.create({
    data: {
      email: "sales-b@test.local",
      name: "Sales B",
      passwordHash,
      role: UserRole.SALES,
      organizationId: orgB.id,
    },
  });

  const login = async (email: string) => {
    const res = await http
      .post("/api/v1/auth/login")
      .send({ email, password: "test-password-123" });
    return res.body.access_token;
  };

  return {
    app,
    prisma,
    http,
    orgA: { id: orgA.id },
    orgB: { id: orgB.id },
    adminA: { id: adminA.id, token: await login("admin-a@test.local") },
    adminB: { id: adminB.id, token: await login("admin-b@test.local") },
    salesA: { id: salesA.id, token: await login("sales-a@test.local") },
    salesB: { id: salesB.id, token: await login("sales-b@test.local") },
  };
}

export async function teardownApp(ctx: TestContext): Promise<void> {
  await ctx.prisma.$disconnect();
  await ctx.app.close();
}
