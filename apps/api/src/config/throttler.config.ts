import { registerAs } from "@nestjs/config";

export default registerAs("throttler", () => ({
  global: {
    ttl: parseInt(process.env.THROTTLE_TTL || "60000", 10),
    limit: parseInt(process.env.THROTTLE_LIMIT || "100", 10),
  },
  login: {
    ttl: parseInt(process.env.THROTTLE_LOGIN_TTL || "60000", 10),
    limit: parseInt(process.env.THROTTLE_LOGIN_LIMIT || "5", 10),
  },
  register: {
    ttl: parseInt(process.env.THROTTLE_REGISTER_TTL || "3600000", 10),
    limit: parseInt(process.env.THROTTLE_REGISTER_LIMIT || "3", 10),
  },
  passwordReset: {
    ttl: parseInt(process.env.THROTTLE_PASSWORD_RESET_TTL || "3600000", 10),
    limit: parseInt(process.env.THROTTLE_PASSWORD_RESET_LIMIT || "3", 10),
  },
  refresh: {
    ttl: parseInt(process.env.THROTTLE_REFRESH_TTL || "60000", 10),
    limit: parseInt(process.env.THROTTLE_REFRESH_LIMIT || "10", 10),
  },
  webhook: {
    ttl: parseInt(process.env.THROTTLE_WEBHOOK_TTL || "60000", 10),
    limit: parseInt(process.env.THROTTLE_WEBHOOK_LIMIT || "60", 10),
  },
  disabled: process.env.RATE_LIMIT_DISABLED === "true",
}));
