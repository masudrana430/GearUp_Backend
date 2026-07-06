import { z } from "zod";

const registerBodySchema = z.object({
  name: z
    .string()
    .trim()
    .min(2, "Name must contain at least 2 characters")
    .max(100, "Name cannot exceed 100 characters"),

  email: z
    .string()
    .trim()
    .email("Please provide a valid email address")
    .transform((email) => email.toLowerCase()),

  password: z
    .string()
    .min(8, "Password must contain at least 8 characters")
    .max(100, "Password cannot exceed 100 characters"),

  phone: z
    .string()
    .trim()
    .min(10, "Phone number is too short")
    .max(20, "Phone number is too long")
    .optional(),

  address: z
    .string()
    .trim()
    .max(250, "Address cannot exceed 250 characters")
    .optional(),

  role: z.enum(["CUSTOMER", "PROVIDER"], {
    error: "Role must be CUSTOMER or PROVIDER",
  }),
});

const loginBodySchema = z.object({
  email: z
    .string()
    .trim()
    .email("Please provide a valid email address")
    .transform((email) => email.toLowerCase()),

  password: z
    .string()
    .min(1, "Password is required"),
});

export const registerValidationSchema = z.object({
  body: registerBodySchema,
});

export const loginValidationSchema = z.object({
  body: loginBodySchema,
});
