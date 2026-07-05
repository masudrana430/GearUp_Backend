import { z } from "zod";

const categoryIdParamsSchema = z.object({
  id: z.string().uuid("Category ID must be a valid UUID"),
});

const createCategoryBodySchema = z.object({
  name: z
    .string()
    .trim()
    .min(2, "Category name must contain at least 2 characters")
    .max(100, "Category name cannot exceed 100 characters"),

  description: z
    .string()
    .trim()
    .max(500, "Description cannot exceed 500 characters")
    .optional(),
});

const updateCategoryBodySchema = createCategoryBodySchema
  .partial()
  .extend({
    isActive: z.boolean().optional(),
  })
  .refine((body) => Object.keys(body).length > 0, {
    message: "Provide at least one field to update",
  });

export const createCategoryValidationSchema = z.object({
  body: createCategoryBodySchema,
});

export const updateCategoryValidationSchema = z.object({
  params: categoryIdParamsSchema,
  body: updateCategoryBodySchema,
});

export const categoryIdValidationSchema = z.object({
  params: categoryIdParamsSchema,
});

export type CreateCategoryInput = z.infer<
  typeof createCategoryBodySchema
>;

export type UpdateCategoryInput = z.infer<
  typeof updateCategoryBodySchema
>;