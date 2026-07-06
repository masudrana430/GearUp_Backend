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

const dateOnlySchema = z
  .string()
  .regex(
    /^\d{4}-\d{2}-\d{2}$/,
    "Date must use YYYY-MM-DD format",
  )
  .refine((value) => {
    const date = new Date(`${value}T00:00:00.000Z`);

    return (
      !Number.isNaN(date.getTime()) &&
      date.toISOString().slice(0, 10) === value
    );
  }, "Please provide a valid date");

const rentalItemSchema = z.object({
  gearItemId: uuidSchema,

  quantity: z.coerce
    .number()
    .int("Quantity must be an integer")
    .min(1, "Quantity must be at least 1")
    .max(100, "Quantity cannot exceed 100"),
});

const createRentalBodySchema = z
  .object({
    startDate: dateOnlySchema,
    endDate: dateOnlySchema,

    notes: z
      .string()
      .trim()
      .max(500, "Notes cannot exceed 500 characters")
      .optional(),

    items: z
      .array(rentalItemSchema)
      .min(1, "At least one gear item is required")
      .max(20, "A rental cannot contain more than 20 items"),
  })
  .superRefine((body, context) => {
    const startDate = new Date(
      `${body.startDate}T00:00:00.000Z`,
    );

    const endDate = new Date(
      `${body.endDate}T00:00:00.000Z`,
    );

    const today = new Date();
    today.setUTCHours(0, 0, 0, 0);

    if (startDate < today) {
      context.addIssue({
        code: "custom",
        path: ["startDate"],
        message: "Start date cannot be before today",
      });
    }

    if (endDate < startDate) {
      context.addIssue({
        code: "custom",
        path: ["endDate"],
        message:
          "End date must be equal to or after start date",
      });
    }

    const rentalDays =
      Math.floor(
        (endDate.getTime() - startDate.getTime()) /
          (1000 * 60 * 60 * 24),
      ) + 1;

    if (rentalDays > 90) {
      context.addIssue({
        code: "custom",
        path: ["endDate"],
        message: "A rental cannot exceed 90 days",
      });
    }

    const uniqueGearIds = new Set(
      body.items.map((item) => item.gearItemId),
    );

    if (uniqueGearIds.size !== body.items.length) {
      context.addIssue({
        code: "custom",
        path: ["items"],
        message:
          "The same gear item cannot appear more than once",
      });
    }
  });

const rentalIdParamsSchema = z.object({
  id: uuidSchema,
});

const rentalQuerySchema = z.object({
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

  page: z.coerce.number().int().positive().default(1),

  limit: z.coerce
    .number()
    .int()
    .positive()
    .max(100)
    .default(10),

  sortOrder: z.enum(["asc", "desc"]).default("desc"),
});

const updateRentalStatusBodySchema = z.object({
  status: z.enum([
    "CONFIRMED",
    "PICKED_UP",
    "RETURNED",
  ]),
});

export const createRentalValidationSchema = z.object({
  body: createRentalBodySchema,
});

export const rentalIdValidationSchema = z.object({
  params: rentalIdParamsSchema,
});

export const rentalQueryValidationSchema = z.object({
  query: rentalQuerySchema,
});

export const updateRentalStatusValidationSchema = z.object({
  params: rentalIdParamsSchema,
  body: updateRentalStatusBodySchema,
});