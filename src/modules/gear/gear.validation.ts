import { z } from "zod";

const gearIdParamsSchema = z.object({
  id: z.string().uuid("Gear ID must be a valid UUID"),
});

const createGearBodySchema = z.object({
  name: z
    .string()
    .trim()
    .min(2, "Gear name must contain at least 2 characters")
    .max(150, "Gear name cannot exceed 150 characters"),

  description: z
    .string()
    .trim()
    .min(10, "Description must contain at least 10 characters")
    .max(2000, "Description cannot exceed 2000 characters"),

  brand: z
    .string()
    .trim()
    .min(2, "Brand must contain at least 2 characters")
    .max(100, "Brand cannot exceed 100 characters"),

  pricePerDay: z.coerce
    .number()
    .positive("Price per day must be greater than zero")
    .max(1000000, "Price per day is too large"),

  stockQuantity: z.coerce
    .number()
    .int("Stock quantity must be an integer")
    .min(1, "Stock quantity must be at least 1"),

  specifications: z
    .record(z.string(), z.unknown())
    .optional(),

  images: z
    .array(z.string().url("Each image must be a valid URL"))
    .max(8, "A maximum of 8 images is allowed")
    .optional(),

  categoryId: z
    .string()
    .uuid("Category ID must be a valid UUID"),
});

const updateGearBodySchema = createGearBodySchema
  .partial()
  .extend({
    stockQuantity: z.coerce
      .number()
      .int("Stock quantity must be an integer")
      .min(0, "Stock quantity cannot be negative")
      .optional(),

    isActive: z.boolean().optional(),
  })
  .refine((body) => Object.keys(body).length > 0, {
    message: "Provide at least one field to update",
  });

const gearQuerySchema = z
  .object({
    search: z.string().trim().optional(),

    category: z.string().trim().optional(),

    brand: z.string().trim().optional(),

    minPrice: z.coerce
      .number()
      .min(0, "Minimum price cannot be negative")
      .optional(),

    maxPrice: z.coerce
      .number()
      .positive("Maximum price must be greater than zero")
      .optional(),

    available: z
      .enum(["true", "false"])
      .transform((value) => value === "true")
      .optional(),

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

    sortBy: z
      .enum(["createdAt", "name", "pricePerDay"])
      .default("createdAt"),

    sortOrder: z.enum(["asc", "desc"]).default("desc"),
  })
  .superRefine((query, context) => {
    if (
      query.minPrice !== undefined &&
      query.maxPrice !== undefined &&
      query.minPrice > query.maxPrice
    ) {
      context.addIssue({
        code: "custom",
        path: ["maxPrice"],
        message:
          "Maximum price must be greater than or equal to minimum price",
      });
    }
  });

export const createGearValidationSchema = z.object({
  body: createGearBodySchema,
});

export const updateGearValidationSchema = z.object({
  params: gearIdParamsSchema,
  body: updateGearBodySchema,
});

export const gearIdValidationSchema = z.object({
  params: gearIdParamsSchema,
});

export const gearQueryValidationSchema = z.object({
  query: gearQuerySchema,
});

export type CreateGearInput = z.infer<
  typeof createGearBodySchema
>;

export type UpdateGearInput = z.infer<
  typeof updateGearBodySchema
>;

export type GearQueryInput = z.infer<typeof gearQuerySchema>;
