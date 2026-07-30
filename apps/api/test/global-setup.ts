import { execSync } from "child_process";
import * as path from "path";

export default async function globalSetup(): Promise<void> {
  const testDbUrl = process.env.DATABASE_URL;
  if (!testDbUrl) {
    throw new Error("DATABASE_URL not set");
  }

  if (!testDbUrl.includes("test")) {
    throw new Error(
      "DATABASE_URL must include 'test' to prevent running migrations against non-test databases. " +
        `Current URL: ${testDbUrl}`,
    );
  }

  const prismaDir = path.resolve(__dirname, "..", "prisma");

  try {
    execSync("npx prisma migrate deploy", {
      cwd: prismaDir,
      env: { ...process.env, DATABASE_URL: testDbUrl },
      stdio: "pipe",
    });
  } catch {
    execSync("npx prisma db push", {
      cwd: prismaDir,
      env: { ...process.env, DATABASE_URL: testDbUrl },
      stdio: "pipe",
    });
  }
}
