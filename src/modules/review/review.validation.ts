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

const createReviewBodySchema = z.object({
  rentalOrderId: uuidSchema,
  gearItemId: uuidSchema,

  rating: z.coerce
    .number()
    .int("Rating must be an integer")
    .min(1, "Rating must be at least 1")
    .max(5, "Rating cannot exceed 5"),

  comment: z
    .string()
    .trim()
    .min(3, "Comment must contain at least 3 characters")
    .max(1000, "Comment cannot exceed 1000 characters")
    .optional(),
});

const updateReviewBodySchema = z
  .object({
    rating: z.coerce
      .number()
      .int("Rating must be an integer")
      .min(1)
      .max(5)
      .optional(),

    comment: z
      .string()
      .trim()
      .min(3)
      .max(1000)
      .optional(),
  })
  .refine((body) => Object.keys(body).length > 0, {
    message: "Provide at least one field to update",
  });

const reviewQuerySchema = z.object({
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
});

export const createReviewValidationSchema = z.object({
  body: createReviewBodySchema,
});

export const updateReviewValidationSchema = z.object({
  params: z.object({
    id: uuidSchema,
  }),

  body: updateReviewBodySchema,
});

export const reviewIdValidationSchema = z.object({
  params: z.object({
    id: uuidSchema,
  }),
});

export const gearReviewValidationSchema = z.object({
  params: z.object({
    gearId: uuidSchema,
  }),

  query: reviewQuerySchema,
});