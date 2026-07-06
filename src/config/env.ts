import "dotenv/config";
import { z } from "zod";

const environmentSchema = z.object({
  NODE_ENV: z
    .enum(["development", "production", "test"])
    .default("development"),

  PORT: z.coerce
    .number()
    .int()
    .positive()
    .default(5000),

  DATABASE_URL: z
    .string()
    .trim()
    .min(1, "DATABASE_URL is required"),

  JWT_ACCESS_SECRET: z
    .string()
    .min(
      32,
      "JWT_ACCESS_SECRET must contain at least 32 characters",
    ),

  JWT_ACCESS_EXPIRES_IN: z
    .string()
    .default("7d"),

  BCRYPT_SALT_ROUNDS: z.coerce
    .number()
    .int()
    .min(10)
    .max(15)
    .default(12),

  BASE_URL: z
    .string()
    .trim()
    .url("BASE_URL must be a valid URL"),

  SSL_STORE_ID: z
    .string()
    .trim()
    .min(1, "SSL_STORE_ID is required"),

  SSL_STORE_PASSWORD: z
    .string()
    .trim()
    .min(1, "SSL_STORE_PASSWORD is required"),

  SSL_IS_LIVE: z
    .enum(["true", "false"])
    .default("false")
    .transform((value) => value === "true"),

  ADMIN_EMAIL: z
    .string()
    .trim()
    .email("ADMIN_EMAIL must be valid"),

  ADMIN_PASSWORD: z
    .string()
    .min(
      8,
      "ADMIN_PASSWORD must contain at least 8 characters",
    ),
});

const parsedEnvironment =
  environmentSchema.safeParse(process.env);

if (!parsedEnvironment.success) {
  const errors =
    parsedEnvironment.error.flatten().fieldErrors;

  console.error(
    "Invalid environment variables:",
    errors,
  );

  throw new Error(
    `Invalid environment variables: ${JSON.stringify(errors)}`,
  );
}

export const env = parsedEnvironment.data;