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

const callbackBodySchema = z
  .object({
    tran_id: z
      .string()
      .trim()
      .min(1, "Transaction ID is required"),

    val_id: z.string().trim().optional(),
    status: z.string().trim().optional(),
    amount: z.string().optional(),
    currency: z.string().optional(),
    card_type: z.string().optional(),
    bank_tran_id: z.string().optional(),
  })
  .passthrough();

const successfulCallbackBodySchema =
  callbackBodySchema.refine(
    (body) => Boolean(body.val_id),
    {
      path: ["val_id"],
      message:
        "Validation ID is required for successful payment verification",
    },
  );

const paymentQuerySchema = z.object({
  status: z
    .enum([
      "PENDING",
      "COMPLETED",
      "FAILED",
      "CANCELLED",
    ])
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

  sortOrder: z.enum(["asc", "desc"]).default("desc"),
});

export const initiatePaymentValidationSchema =
  z.object({
    params: z.object({
      rentalId: uuidSchema,
    }),
  });

export const paymentIdValidationSchema = z.object({
  params: z.object({
    id: uuidSchema,
  }),
});

export const paymentQueryValidationSchema = z.object({
  query: paymentQuerySchema,
});

export const successfulCallbackValidationSchema =
  z.object({
    body: successfulCallbackBodySchema,
  });

export const callbackValidationSchema = z.object({
  body: callbackBodySchema,
});