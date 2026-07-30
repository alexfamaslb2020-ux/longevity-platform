import { execSync } from "child_process";
import * as path from "path";
import * as fs from "fs";

export default async function globalSetup(): Promise<void> {
  // Load .env file for local development
  const envPath = path.resolve(__dirname, "..", ".env");
  if (fs.existsSync(envPath)) {
    const envContent = fs.readFileSync(envPath, "utf-8");
    for (const line of envContent.split("\n")) {
      const trimmed = line.trim();
      if (trimmed && !trimmed.startsWith("#")) {
        const eqIdx = trimmed.indexOf("=");
        if (eqIdx > 0) {
          const key = trimmed.slice(0, eqIdx).trim();
          const value = trimmed.slice(eqIdx + 1).trim();
          if (!process.env[key]) {
            process.env[key] = value;
          }
        }
      }
    }
  }

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
