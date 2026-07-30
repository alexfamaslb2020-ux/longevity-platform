import { registerAs } from "@nestjs/config";

export default registerAs("app", () => ({
  port: parseInt(process.env.API_PORT || "3001", 10),
  prefix: process.env.API_PREFIX || "/api/v1",
  nodeEnv: process.env.NODE_ENV || "development",
  jwtSecret: process.env.JWT_SECRET || "dev-secret-change-in-production",
  jwtExpiration: process.env.JWT_EXPIRATION || "15m",
  jwtRefreshExpiration: process.env.JWT_REFRESH_EXPIRATION || "7d",
  mfaIssuer: process.env.MFA_ISSUER || "LongevityPlatform",
}));
