import { registerAs } from "@nestjs/config";

export default registerAs("database", () => ({
  url:
    process.env.DATABASE_URL ||
    "postgresql://longevity:longevity@localhost:5432/longevity?schema=public",
}));
