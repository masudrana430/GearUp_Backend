import { z } from "zod";

const uuidSchema = z.preprocess(
  (value) => {
    if (typeof value !== "string") {
      return value;
    }

    return value
      .replace(/[\u200B-\u200D\uFEFF]/g, "")
      .trim();
  },
  z.string().uuid("ID must be a valid UUID"),
);

const paginationSchema = {
  page: z.coerce
    .number()
    .int()
    .positive()
    .default(1),

  limit: z.coerce
    .number()
    .int()
    .positive()
    .max(100)
    .default(10),

  sortOrder: z.enum(["asc", "desc"]).default("desc"),
};

export const adminUserQueryValidationSchema =
  z.object({
    query: z.object({
      search: z.string().trim().optional(),

      role: z
        .enum(["CUSTOMER", "PROVIDER", "ADMIN"])
        .optional(),

      status: z
        .enum(["ACTIVE", "SUSPENDED"])
        .optional(),

      ...paginationSchema,
    }),
  });

export const updateUserStatusValidationSchema =
  z.object({
    params: z.object({
      id: uuidSchema,
    }),

    body: z.object({
      status: z.enum(["ACTIVE", "SUSPENDED"]),
    }),
  });

export const adminGearQueryValidationSchema =
  z.object({
    query: z.object({
      search: z.string().trim().optional(),

      isActive: z
        .enum(["true", "false"])
        .transform((value) => value === "true")
        .optional(),

      ...paginationSchema,
    }),
  });

export const updateGearStatusValidationSchema =
  z.object({
    params: z.object({
      id: uuidSchema,
    }),

    body: z.object({
      isActive: z.boolean(),
    }),
  });

export const adminRentalQueryValidationSchema =
  z.object({
    query: z.object({
      status: z
        .enum([
          "PLACED",
          "CONFIRMED",
          "PAID",
          "PICKED_UP",
          "RETURNED",
          "CANCELLED",
        ])
        .optional(),

      ...paginationSchema,
    }),
  });

export const adminPaymentQueryValidationSchema =
  z.object({
    query: z.object({
      status: z
        .enum([
          "PENDING",
          "COMPLETED",
          "FAILED",
          "CANCELLED",
        ])
        .optional(),

      ...paginationSchema,
    }),
  });