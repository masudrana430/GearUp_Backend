import type { RequestHandler } from "express";
import { ApiError } from "../../utils/ApiError.js";
import { catchAsync } from "../../utils/catchAsync.js";
import { sendResponse } from "../../utils/sendResponse.js";
import type {
  PaymentQueryInput,
  SSLCallbackPayload,
} from "./payment.interface.js";
import { paymentService } from "./payment.service.js";

const getRouteId = (
  value: string | string[] | undefined,
  fieldName: string,
): string => {
  if (typeof value !== "string") {
    throw new ApiError(
      400,
      `Invalid ${fieldName}`,
      [
        {
          field: fieldName,
          message:
            `${fieldName} must be a valid string`,
        },
      ],
    );
  }

  return value;
};

const initiatePayment: RequestHandler = catchAsync(
  async (req, res) => {
    if (!req.user) {
      throw new ApiError(
        401,
        "Authentication required",
      );
    }

    const rentalId = getRouteId(
      req.params.rentalId,
      "rentalId",
    );

    const result =
      await paymentService.initiatePayment(
        req.user.id,
        rentalId,
      );

    sendResponse(res, {
      statusCode: 201,
      message:
        "SSLCommerz payment session created successfully",
      data: result,
    });
  },
);

const handleSuccess: RequestHandler = catchAsync(
  async (req, res) => {
    const result =
      await paymentService.verifySuccessfulPayment(
        req.body as SSLCallbackPayload,
      );

    sendResponse(res, {
      statusCode: 200,
      message:
        "Payment verified successfully",
      data: result,
    });
  },
);

const handleIpn: RequestHandler = catchAsync(
  async (req, res) => {
    const result =
      await paymentService.processIpn(
        req.body as SSLCallbackPayload,
      );

    sendResponse(res, {
      statusCode: 200,
      message:
        "SSLCommerz IPN processed successfully",
      data: result,
    });
  },
);

const handleFailure: RequestHandler = catchAsync(
  async (req, res) => {
    const result =
      await paymentService.markPaymentAsFailed(
        req.body as SSLCallbackPayload,
      );

    sendResponse(res, {
      statusCode: 200,
      message: "Payment marked as failed",
      data: result,
    });
  },
);

const handleCancellation: RequestHandler =
  catchAsync(async (req, res) => {
    const result =
      await paymentService.markPaymentAsCancelled(
        req.body as SSLCallbackPayload,
      );

    sendResponse(res, {
      statusCode: 200,
      message:
        "Payment marked as cancelled",
      data: result,
    });
  });

const getCustomerPayments: RequestHandler =
  catchAsync(async (req, res) => {
    if (!req.user) {
      throw new ApiError(
        401,
        "Authentication required",
      );
    }

    const query = res.locals.validated
      .query as PaymentQueryInput;

    const result =
      await paymentService.getCustomerPayments(
        req.user.id,
        query,
      );

    sendResponse(res, {
      statusCode: 200,
      message:
        "Payment history retrieved successfully",
      data: result,
    });
  });

const getCustomerPaymentById: RequestHandler =
  catchAsync(async (req, res) => {
    if (!req.user) {
      throw new ApiError(
        401,
        "Authentication required",
      );
    }

    const paymentId = getRouteId(
      req.params.id,
      "id",
    );

    const result =
      await paymentService.getCustomerPaymentById(
        req.user.id,
        paymentId,
      );

    sendResponse(res, {
      statusCode: 200,
      message:
        "Payment details retrieved successfully",
      data: result,
    });
  });

export const paymentController = {
  initiatePayment,
  handleSuccess,
  handleIpn,
  handleFailure,
  handleCancellation,
  getCustomerPayments,
  getCustomerPaymentById,
};