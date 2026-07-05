import "dotenv/config";
import { z } from "zod";

const environmentSchema = z.object({
  NODE_ENV: z
    .enum(["development", "production", "test"])
    .default("development"),

  PORT: z.coerce.number().positive().default(5000),

  DATABASE_URL: z.string().min(1, "DATABASE_URL is required"),

  JWT_ACCESS_SECRET: z
    .string()
    .min(32, "JWT_ACCESS_SECRET must contain at least 32 characters"),

  JWT_ACCESS_EXPIRES_IN: z.string().default("7d"),

  BCRYPT_SALT_ROUNDS: z.coerce
    .number()
    .int()
    .min(10)
    .max(15)
    .default(12),

  BASE_URL: z.string().url().default("http://localhost:5000"),

  SSL_STORE_ID: z.string().optional().default(""),

  SSL_STORE_PASSWORD: z.string().optional().default(""),

  SSL_IS_LIVE: z
    .string()
    .default("false")
    .transform((value) => value === "true"),

  ADMIN_EMAIL: z.string().email(),

  ADMIN_PASSWORD: z.string().min(8),
});

const parsedEnvironment = environmentSchema.safeParse(process.env);

if (!parsedEnvironment.success) {
  console.error(
    "Invalid environment variables:",
    parsedEnvironment.error.flatten().fieldErrors,
  );

  process.exit(1);
}

export const env = parsedEnvironment.data;