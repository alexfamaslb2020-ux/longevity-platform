import { NestFactory } from "@nestjs/core";
import { ValidationPipe, Logger } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { AppModule } from "./app.module";
import helmet from "helmet";
import { ProductionValidationService } from "./common/production-validation.service";
import * as bodyParser from "body-parser";

async function bootstrap() {
  const logger = new Logger("Bootstrap");

  const app = await NestFactory.create(AppModule, {
    logger: ["log", "error", "warn", "debug", "verbose"],
    rawBody: true,
  });

  const configService = app.get(ConfigService);

  const port = configService.get<number>("app.port", 3001);
  const prefix = configService.get<string>("app.prefix", "/api/v1");
  const nodeEnv = configService.get<string>("app.nodeEnv", "development");

  const isStagingOrProduction =
    nodeEnv === "production" || nodeEnv === "staging";
  const isDemo = nodeEnv === "demo";

  if (isStagingOrProduction && !isDemo) {
    const validator = app.get(ProductionValidationService);
    validator.exitOnErrors();
  }

  app.use(
    helmet({
      contentSecurityPolicy: false,
      crossOriginEmbedderPolicy: false,
      frameguard: { action: "deny" },
      hsts:
        nodeEnv === "production"
          ? { maxAge: 31536000, includeSubDomains: true, preload: true }
          : nodeEnv === "staging"
            ? { maxAge: 3600, includeSubDomains: false }
            : false, // demo and development: no HSTS
      hidePoweredBy: true,
      ieNoOpen: true,
      noSniff: true,
      referrerPolicy: { policy: "strict-origin-when-cross-origin" },
      xssFilter: true,
    }),
  );

  const corsOrigins =
    nodeEnv === "production"
      ? [".longevity.pt", process.env.FRONTEND_URL || ""].filter(Boolean)
      : nodeEnv === "staging"
        ? [process.env.CORS_ORIGIN || "https://staging.longevity.pt"]
        : nodeEnv === "demo"
          ? process.env.CORS_ORIGIN || "*"
          : "*";

  app.enableCors({
    origin: corsOrigins,
    methods: ["GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS"],
    allowedHeaders: [
      "Content-Type",
      "Authorization",
      "X-Request-Id",
      "X-Hub-Signature-256",
      "X-Hub-Timestamp",
    ],
    credentials: true,
  });

  app.setGlobalPrefix(prefix);

  app.use(
    bodyParser.json({
      verify: (req: any, _res, buf) => {
        req.rawBody = buf;
      },
    }),
  );

  app.use(
    "/api/v1/webhooks",
    bodyParser.json({
      verify: (req: any, _res, buf) => {
        req.rawBody = buf;
      },
    }),
  );
  app.use(
    "/api/v1/whatsapp/webhook",
    bodyParser.json({
      verify: (req: any, _res, buf) => {
        req.rawBody = buf;
      },
    }),
  );
  app.use(
    "/api/v1/voice/webhook",
    bodyParser.json({
      verify: (req: any, _res, buf) => {
        req.rawBody = buf;
      },
    }),
  );

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
      transformOptions: { enableImplicitConversion: true },
    }),
  );

  app.enableShutdownHooks();

  await app.listen(port);
  logger.log(`API running on http://localhost:${port}${prefix}`);
  logger.log(`Environment: ${nodeEnv}`);
}

bootstrap().catch((err) => {
  console.error("Failed to start application", err);
  process.exit(1);
});
