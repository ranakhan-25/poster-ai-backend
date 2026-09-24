import express from "express";
import cors from "cors";
import cookieParser from "cookie-parser";
import helmet from "helmet";
import { env } from "./config/env";
import { apiLimiter } from "./middleware/rateLimit";
import { errorHandler, notFound } from "./middleware/error";
import { router } from "./routes";

/** Strips keys starting with `$` or containing `.` to block NoSQL operator injection. */
function sanitize(v: unknown): unknown {
  if (Array.isArray(v)) return v.map(sanitize);
  if (v && typeof v === "object") {
    return Object.fromEntries(
      Object.entries(v)
        .filter(([k]) => !k.startsWith("$") && !k.includes("."))
        .map(([k, x]) => [k, sanitize(x)]),
    );
  }
  return v;
}

export function createApp() {
  const app = express();
  app.use(cookieParser());
  app.set("trust proxy", 1);
  app.use(helmet());
  app.use(
    cors({
      origin: (origin, callback) => {
        const allowedOrigins = env.CLIENT_ORIGIN.split(",")
          .map((item) => item.trim())
          .filter(Boolean);

        // Allow requests without Origin header
        // (health checks, server-to-server requests, etc.)
        if (!origin) {
          return callback(null, true);
        }

        if (allowedOrigins.includes(origin)) {
          return callback(null, true);
        }

        return callback(new Error(`CORS blocked for origin: ${origin}`), false);
      },
      credentials: true,
    }),
  );
  app.use(express.json({ limit: "100kb" }));
  app.use((req, _res, next) => {
    req.body = sanitize(req.body);
    next();
  });
  app.get("/health", (_req, res) =>
    res.json({ success: true, data: { status: "ok" } }),
  );
  app.use("/api", apiLimiter, router);
  app.use(notFound);
  app.use(errorHandler);
  return app;
}
