import "dotenv/config";
import { z } from "zod";

const schema = z.object({
  NODE_ENV: z
    .enum(["development", "production", "test"])
    .default("development"),

  PORT: z.coerce.number().default(5000),

  MONGODB_URI: z.string().min(1),

  // Access Token
  JWT_ACCESS_SECRET: z.string().min(32),

  JWT_ACCESS_EXPIRES_IN: z.string().default("15m"),

  // Refresh Token
  JWT_REFRESH_SECRET: z.string().min(32),

  JWT_REFRESH_EXPIRES_IN: z.string().default("7d"),

  CLIENT_ORIGIN: z.string().default("http://localhost:3000"),

  GEMINI_API_KEY: z.string().optional(),

  GEMINI_MODEL: z.string().default("gemini-1.5-flash"),

  CLOUDINARY_CLOUD_NAME: z.string().optional(),

  CLOUDINARY_API_KEY: z.string().optional(),

  CLOUDINARY_API_SECRET: z.string().optional(),

  PUPPETEER_EXECUTABLE_PATH: z.string().optional(),
});

export const env = schema.parse(process.env);

export const isProd = env.NODE_ENV === "production";

export const hasCloudinary = Boolean(
  env.CLOUDINARY_CLOUD_NAME &&
  env.CLOUDINARY_API_KEY &&
  env.CLOUDINARY_API_SECRET,
);

export const hasGemini = Boolean(env.GEMINI_API_KEY);
