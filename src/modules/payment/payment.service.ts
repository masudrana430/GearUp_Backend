import { randomUUID } from "node:crypto";
import {
  PaymentProvider,
  PaymentStatus,
  Prisma,
  RentalStatus,
} from "@prisma/client";
import { env } from "../../config/env.js";
import { prisma } from "../../lib/prisma.js";
import { ApiError } from "../../utils/ApiError.js";
import type {
  PaymentQueryInput,
  SSLCallbackPayload,
  SSLSessionResponse,
  SSLValidationResponse,
} from "./payment.interface.js";

const gatewayBaseUrl = env.SSL_IS_LIVE
  ? "https://securepay.sslcommerz.com"
  : "https://sandbox.sslcommerz.com";

const paymentDetailsInclude = {
  rentalOrder: {
    select: {
      id: true,
      orderNumber: true,
      status: true,
      startDate: true,
      endDate: true,
      rentalDays: true,
      totalAmount: true,

      provider: {
        select: {
          id: true,
          name: true,
        },
      },
    },
  },
} as const;

const toJsonValue = (
  value: unknown,
): Prisma.InputJsonValue => {
  return JSON.parse(
    JSON.stringify(value),
  ) as Prisma.InputJsonValue;
};

const createTransactionId = (): string => {
  const randomPart = randomUUID()
    .replaceAll("-", "")
    .slice(0, 6)
    .toUpperCase();

  return `GU${Date.now()}${randomPart}`;
};

const getBaseUrl = (): string => {
  return env.BASE_URL.replace(/\/+$/, "");
};

const isP2034Error = (error: unknown): boolean => {
  return (
    typeof error === "object" &&
    error !== null &&
    "code" in error &&
    error.code === "P2034"
  );
};

const parseGatewayResponse = async <T>(
  response: Response,
): Promise<T> => {
  const responseText = await response.text();

  let parsedResponse: unknown;

  try {
    parsedResponse = JSON.parse(responseText);
  } catch {
    throw new ApiError(
      502,
      "Invalid response from SSLCommerz",
      [
        {
          message:
            "SSLCommerz returned a non-JSON response",
        },
      ],
    );
  }

  if (!response.ok) {
    throw new ApiError(
      502,
      "SSLCommerz request failed",
      [
        {
          message:
            `SSLCommerz responded with HTTP ${response.status}`,
        },
      ],
    );
  }

  return parsedResponse as T;
};

const createGatewaySession = async (
  parameters: Record<string, string>,
): Promise<SSLSessionResponse> => {
  const requestBody = new URLSearchParams();

  for (const [key, value] of Object.entries(
    parameters,
  )) {
    requestBody.set(key, value);
  }

  const response = await fetch(
    `${gatewayBaseUrl}/gwprocess/v4/api.php`,
    {
      method: "POST",

      headers: {
        "Content-Type":
          "application/x-www-form-urlencoded",
      },

      body: requestBody,
    },
  );

  return parseGatewayResponse<SSLSessionResponse>(
    response,
  );
};

const validateGatewayTransaction = async (
  validationId: string,
): Promise<SSLValidationResponse> => {
  const validationUrl = new URL(
    `${gatewayBaseUrl}/validator/api/validationserverAPI.php`,
  );

  validationUrl.searchParams.set(
    "val_id",
    validationId,
  );

  validationUrl.searchParams.set(
    "store_id",
    env.SSL_STORE_ID,
  );

  validationUrl.searchParams.set(
    "store_passwd",
    env.SSL_STORE_PASSWORD,
  );

  validationUrl.searchParams.set("format", "json");
  validationUrl.searchParams.set("v", "1");

  const response = await fetch(validationUrl);

  return parseGatewayResponse<SSLValidationResponse>(
    response,
  );
};

const runSerializableTransaction = async <T>(
  operation: (
    transaction: Prisma.TransactionClient,
  ) => Promise<T>,
): Promise<T> => {
  const maximumAttempts = 3;

  for (
    let attempt = 1;
    attempt <= maximumAttempts;
    attempt += 1
  ) {
    try {
      return await prisma.$transaction(operation, {
        isolationLevel:
          Prisma.TransactionIsolationLevel
            .Serializable,

        maxWait: 5000,
        timeout: 10000,
      });
    } catch (error) {
      if (
        isP2034Error(error) &&
        attempt < maximumAttempts
      ) {
        continue;
      }

      throw error;
    }
  }

  throw new ApiError(
    409,
    "Payment transaction conflict",
  );
};

const initiatePayment = async (
  customerId: string,
  rentalId: string,
) => {
  const rental = await prisma.rentalOrder.findFirst({
    where: {
      id: rentalId,
      customerId,
    },

    include: {
      customer: {
        select: {
          id: true,
          name: true,
          email: true,
          phone: true,
          address: true,
        },
      },

      items: {
        select: {
          gearNameSnapshot: true,
          quantity: true,
        },
      },

      payments: {
        where: {
          status: PaymentStatus.COMPLETED,
        },

        select: {
          id: true,
          transactionId: true,
        },
      },
    },
  });

  if (!rental) {
    throw new ApiError(
      404,
      "Rental order not found",
      [
        {
          message:
            "The rental does not exist or does not belong to you",
        },
      ],
    );
  }

  if (rental.status !== RentalStatus.CONFIRMED) {
    throw new ApiError(
      409,
      "Rental order is not ready for payment",
      [
        {
          message:
            `Expected status CONFIRMED, but current status is ${rental.status}`,
        },
      ],
    );
  }

  if (rental.payments.length > 0) {
    throw new ApiError(
      409,
      "Rental order has already been paid",
    );
  }

  if (!rental.customer.phone) {
    throw new ApiError(
      400,
      "Customer phone number is required",
      [
        {
          field: "phone",
          message:
            "Add a valid phone number before starting payment",
        },
      ],
    );
  }

  const amount = Number(
    rental.totalAmount.toString(),
  );

  if (
    !Number.isFinite(amount) ||
    amount < 10 ||
    amount > 500000
  ) {
    throw new ApiError(
      400,
      "Unsupported payment amount",
      [
        {
          field: "totalAmount",
          message:
            "Payment must be between 10 and 500000 BDT",
        },
      ],
    );
  }

  const transactionId = createTransactionId();

  const payment = await prisma.payment.create({
    data: {
      transactionId,
      rentalOrderId: rental.id,
      customerId,
      amount: rental.totalAmount,
      currency: "BDT",
      provider: PaymentProvider.SSLCOMMERZ,
      status: PaymentStatus.PENDING,
    },
  });

  const baseUrl = getBaseUrl();

  const productName =
    rental.items
      .map((item) => item.gearNameSnapshot)
      .join(", ")
      .slice(0, 255) || "GearUp Rental";

  const itemCount = rental.items.reduce(
    (total, item) => total + item.quantity,
    0,
  );

  const sessionParameters: Record<string, string> = {
    store_id: env.SSL_STORE_ID,
    store_passwd: env.SSL_STORE_PASSWORD,

    total_amount:
      rental.totalAmount.toFixed(2),

    currency: "BDT",
    tran_id: transactionId,

    success_url:
      `${baseUrl}/api/v1/payments/success`,

    fail_url:
      `${baseUrl}/api/v1/payments/fail`,

    cancel_url:
      `${baseUrl}/api/v1/payments/cancel`,

    ipn_url:
      `${baseUrl}/api/v1/payments/ipn`,

    product_name: productName,
    product_category: "sports-rental",
    product_profile: "physical-goods",

    cus_name: rental.customer.name.slice(0, 50),
    cus_email: rental.customer.email.slice(0, 50),
    cus_add1:
      (rental.customer.address || "Bangladesh").slice(
        0,
        50,
      ),

    cus_city: "Chattogram",
    cus_state: "Chattogram",
    cus_postcode: "4000",
    cus_country: "Bangladesh",
    cus_phone: rental.customer.phone.slice(0, 20),

    shipping_method: "NO",
    num_of_item: String(itemCount),
    emi_option: "0",

    value_a: rental.id,
    value_b: customerId,
    value_c: rental.orderNumber,
  };

  try {
    const sessionResponse =
      await createGatewaySession(
        sessionParameters,
      );

    if (
      sessionResponse.status !== "SUCCESS" ||
      !sessionResponse.sessionkey ||
      !sessionResponse.GatewayPageURL
    ) {
      await prisma.payment.update({
        where: {
          id: payment.id,
        },

        data: {
          status: PaymentStatus.FAILED,
          gatewayResponse:
            toJsonValue(sessionResponse),
        },
      });

      throw new ApiError(
        502,
        "Unable to create payment session",
        [
          {
            message:
              sessionResponse.failedreason ||
              "SSLCommerz rejected the session request",
          },
        ],
      );
    }

    await prisma.payment.update({
      where: {
        id: payment.id,
      },

      data: {
        sessionKey: sessionResponse.sessionkey,
        gatewayResponse:
          toJsonValue(sessionResponse),
      },
    });

    return {
      paymentId: payment.id,
      transactionId,
      amount: rental.totalAmount,
      currency: "BDT",
      sessionKey: sessionResponse.sessionkey,
      gatewayUrl:
        sessionResponse.GatewayPageURL,
    };
  } catch (error) {
    if (error instanceof ApiError) {
      throw error;
    }

    await prisma.payment
      .update({
        where: {
          id: payment.id,
        },

        data: {
          status: PaymentStatus.FAILED,

          gatewayResponse: toJsonValue({
            error:
              error instanceof Error
                ? error.message
                : "Unknown gateway error",
          }),
        },
      })
      .catch(() => undefined);

    throw new ApiError(
      502,
      "Unable to connect to SSLCommerz",
      [
        {
          message:
            error instanceof Error
              ? error.message
              : "Payment gateway connection failed",
        },
      ],
    );
  }
};

const verifySuccessfulPayment = async (
  payload: SSLCallbackPayload,
) => {
  if (!payload.val_id) {
    throw new ApiError(
      400,
      "Validation ID is required",
    );
  }

  const payment = await prisma.payment.findUnique({
    where: {
      transactionId: payload.tran_id,
    },

    include: {
      rentalOrder: true,
    },
  });

  if (!payment) {
    throw new ApiError(
      404,
      "Payment transaction not found",
    );
  }

  if (payment.status === PaymentStatus.COMPLETED) {
    return prisma.payment.findUniqueOrThrow({
      where: {
        id: payment.id,
      },

      include: paymentDetailsInclude,
    });
  }

  const validationResponse =
    await validateGatewayTransaction(
      payload.val_id,
    );

  const successfulStatuses = [
    "VALID",
    "VALIDATED",
  ];

  if (
    !successfulStatuses.includes(
      validationResponse.status,
    )
  ) {
    await prisma.payment.update({
      where: {
        id: payment.id,
      },

      data: {
        gatewayResponse:
          toJsonValue(validationResponse),
      },
    });

    throw new ApiError(
      400,
      "SSLCommerz transaction is not valid",
      [
        {
          message:
            `Validation status: ${validationResponse.status}`,
        },
      ],
    );
  }

  if (
    validationResponse.tran_id !==
    payment.transactionId
  ) {
    throw new ApiError(
      409,
      "Payment transaction ID mismatch",
    );
  }

  if (!validationResponse.amount) {
    throw new ApiError(
      400,
      "Validated payment amount is missing",
    );
  }

  const validatedAmount = new Prisma.Decimal(
    validationResponse.amount,
  );

  if (!payment.amount.equals(validatedAmount)) {
    throw new ApiError(
      409,
      "Payment amount mismatch",
      [
        {
          message:
            `Expected ${payment.amount.toFixed(2)} BDT, ` +
            `but SSLCommerz returned ${validatedAmount.toFixed(2)} BDT`,
        },
      ],
    );
  }

  const validatedCurrency =
    validationResponse.currency_type ??
    validationResponse.currency;

  if (
    validatedCurrency &&
    validatedCurrency !== payment.currency
  ) {
    throw new ApiError(
      409,
      "Payment currency mismatch",
      [
        {
          message:
            `Expected ${payment.currency}, ` +
            `but SSLCommerz returned ${validatedCurrency}`,
        },
      ],
    );
  }

  if (
    validationResponse.value_a &&
    validationResponse.value_a !==
      payment.rentalOrderId
  ) {
    throw new ApiError(
      409,
      "Rental reference mismatch",
    );
  }

  if (
    Number(validationResponse.risk_level ?? 0) ===
    1
  ) {
    await prisma.payment.update({
      where: {
        id: payment.id,
      },

      data: {
        gatewayResponse:
          toJsonValue(validationResponse),
      },
    });

    throw new ApiError(
      409,
      "Payment requires manual review",
      [
        {
          message:
            validationResponse.risk_title ||
            "SSLCommerz marked the transaction as risky",
        },
      ],
    );
  }

  return runSerializableTransaction(
    async (transaction) => {
      const currentPayment =
        await transaction.payment.findUnique({
          where: {
            id: payment.id,
          },
        });

      if (!currentPayment) {
        throw new ApiError(
          404,
          "Payment transaction not found",
        );
      }

      if (
        currentPayment.status ===
        PaymentStatus.COMPLETED
      ) {
        return transaction.payment.findUniqueOrThrow({
          where: {
            id: currentPayment.id,
          },

          include: paymentDetailsInclude,
        });
      }

      const anotherCompletedPayment =
        await transaction.payment.findFirst({
          where: {
            rentalOrderId:
              currentPayment.rentalOrderId,

            status: PaymentStatus.COMPLETED,

            id: {
              not: currentPayment.id,
            },
          },
        });

      if (anotherCompletedPayment) {
        return transaction.payment.findUniqueOrThrow({
          where: {
            id: anotherCompletedPayment.id,
          },

          include: paymentDetailsInclude,
        });
      }

      const rental =
        await transaction.rentalOrder.findUnique({
          where: {
            id: currentPayment.rentalOrderId,
          },
        });

      if (!rental) {
        throw new ApiError(
          404,
          "Rental order not found",
        );
      }

      if (rental.status !== RentalStatus.CONFIRMED) {
        throw new ApiError(
          409,
          "Rental order cannot be marked as paid",
          [
            {
              message:
                `Current rental status is ${rental.status}`,
            },
          ],
        );
      }

      await transaction.payment.update({
        where: {
          id: currentPayment.id,
        },

        data: {
          status: PaymentStatus.COMPLETED,

          validationId:
            validationResponse.val_id ??
            payload.val_id,

          bankTransactionId:
            validationResponse.bank_tran_id,

          method:
            validationResponse.card_type ??
            payload.card_type,

          paidAt: new Date(),

          gatewayResponse:
            toJsonValue(validationResponse),
        },
      });

      await transaction.rentalOrder.update({
        where: {
          id: currentPayment.rentalOrderId,
        },

        data: {
          status: RentalStatus.PAID,
        },
      });

      return transaction.payment.findUniqueOrThrow({
        where: {
          id: currentPayment.id,
        },

        include: paymentDetailsInclude,
      });
    },
  );
};

const markPaymentStatus = async (
  payload: SSLCallbackPayload,
  status:
    | typeof PaymentStatus.FAILED
    | typeof PaymentStatus.CANCELLED,
) => {
  const payment = await prisma.payment.findUnique({
    where: {
      transactionId: payload.tran_id,
    },
  });

  if (!payment) {
    throw new ApiError(
      404,
      "Payment transaction not found",
    );
  }

  if (
    payment.status !== PaymentStatus.PENDING
  ) {
    return payment;
  }

  return prisma.payment.update({
    where: {
      id: payment.id,
    },

    data: {
      status,
      gatewayResponse: toJsonValue(payload),
    },
  });
};

const markPaymentAsFailed = async (
  payload: SSLCallbackPayload,
) => {
  return markPaymentStatus(
    payload,
    PaymentStatus.FAILED,
  );
};

const markPaymentAsCancelled = async (
  payload: SSLCallbackPayload,
) => {
  return markPaymentStatus(
    payload,
    PaymentStatus.CANCELLED,
  );
};

const processIpn = async (
  payload: SSLCallbackPayload,
) => {
  const gatewayStatus =
    payload.status?.toUpperCase();

  if (
    gatewayStatus === "VALID" ||
    gatewayStatus === "VALIDATED" ||
    payload.val_id
  ) {
    return verifySuccessfulPayment(payload);
  }

  if (gatewayStatus === "FAILED") {
    return markPaymentAsFailed(payload);
  }

  if (
    gatewayStatus === "CANCELLED" ||
    gatewayStatus === "CANCELED"
  ) {
    return markPaymentAsCancelled(payload);
  }

  throw new ApiError(
    400,
    "Unsupported SSLCommerz IPN status",
    [
      {
        message:
          `Received status: ${payload.status ?? "missing"}`,
      },
    ],
  );
};

const getCustomerPayments = async (
  customerId: string,
  query: PaymentQueryInput,
) => {
  const {
    status,
    page,
    limit,
    sortOrder,
  } = query;

  const where: Prisma.PaymentWhereInput = {
    customerId,

    ...(status
      ? {
          status: status as PaymentStatus,
        }
      : {}),
  };

  const skip = (page - 1) * limit;

  const [payments, total] =
    await prisma.$transaction([
      prisma.payment.findMany({
        where,
        include: paymentDetailsInclude,

        orderBy: {
          createdAt: sortOrder,
        },

        skip,
        take: limit,
      }),

      prisma.payment.count({
        where,
      }),
    ]);

  return {
    items: payments,

    meta: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
    },
  };
};

const getCustomerPaymentById = async (
  customerId: string,
  paymentId: string,
) => {
  const payment = await prisma.payment.findFirst({
    where: {
      id: paymentId,
      customerId,
    },

    include: paymentDetailsInclude,
  });

  if (!payment) {
    throw new ApiError(
      404,
      "Payment not found",
      [
        {
          message:
            "The payment does not exist or does not belong to you",
        },
      ],
    );
  }

  return payment;
};

export const paymentService = {
  initiatePayment,
  verifySuccessfulPayment,
  processIpn,
  markPaymentAsFailed,
  markPaymentAsCancelled,
  getCustomerPayments,
  getCustomerPaymentById,
};