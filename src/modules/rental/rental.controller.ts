import type { RequestHandler } from "express";
import { ApiError } from "../../utils/ApiError.js";
import { catchAsync } from "../../utils/catchAsync.js";
import { sendResponse } from "../../utils/sendResponse.js";
import type { RentalQueryInput } from "./rental.interface.js";
import { rentalService } from "./rental.service.js";

const getRouteId = (
  value: string | string[] | undefined,
): string => {
  if (typeof value !== "string") {
    throw new ApiError(400, "Invalid rental order ID", [
      {
        field: "id",
        message:
          "Rental order ID must be a valid string",
      },
    ]);
  }

  return value;
};

const createRental: RequestHandler = catchAsync(
  async (req, res) => {
    if (!req.user) {
      throw new ApiError(
        401,
        "Authentication required",
      );
    }

    const rental = await rentalService.createRental(
      req.user.id,
      req.body,
    );

    sendResponse(res, {
      statusCode: 201,
      message: "Rental order created successfully",
      data: rental,
    });
  },
);

const getCustomerRentals: RequestHandler = catchAsync(
  async (req, res) => {
    if (!req.user) {
      throw new ApiError(
        401,
        "Authentication required",
      );
    }

    const query = res.locals.validated
      .query as RentalQueryInput;

    const result =
      await rentalService.getCustomerRentals(
        req.user.id,
        query,
      );

    sendResponse(res, {
      statusCode: 200,
      message:
        "Customer rental orders retrieved successfully",
      data: result,
    });
  },
);

const getCustomerRentalById: RequestHandler =
  catchAsync(async (req, res) => {
    if (!req.user) {
      throw new ApiError(
        401,
        "Authentication required",
      );
    }

    const rentalId = getRouteId(req.params.id);

    const rental =
      await rentalService.getCustomerRentalById(
        req.user.id,
        rentalId,
      );

    sendResponse(res, {
      statusCode: 200,
      message:
        "Rental order retrieved successfully",
      data: rental,
    });
  });

const cancelCustomerRental: RequestHandler =
  catchAsync(async (req, res) => {
    if (!req.user) {
      throw new ApiError(
        401,
        "Authentication required",
      );
    }

    const rentalId = getRouteId(req.params.id);

    const rental =
      await rentalService.cancelCustomerRental(
        req.user.id,
        rentalId,
      );

    sendResponse(res, {
      statusCode: 200,
      message:
        "Rental order cancelled successfully",
      data: rental,
    });
  });

const getProviderOrders: RequestHandler = catchAsync(
  async (req, res) => {
    if (!req.user) {
      throw new ApiError(
        401,
        "Authentication required",
      );
    }

    const query = res.locals.validated
      .query as RentalQueryInput;

    const result =
      await rentalService.getProviderOrders(
        req.user.id,
        query,
      );

    sendResponse(res, {
      statusCode: 200,
      message:
        "Provider rental orders retrieved successfully",
      data: result,
    });
  },
);

const getProviderOrderById: RequestHandler =
  catchAsync(async (req, res) => {
    if (!req.user) {
      throw new ApiError(
        401,
        "Authentication required",
      );
    }

    const rentalId = getRouteId(req.params.id);

    const rental =
      await rentalService.getProviderOrderById(
        req.user.id,
        rentalId,
      );

    sendResponse(res, {
      statusCode: 200,
      message:
        "Provider rental order retrieved successfully",
      data: rental,
    });
  });

const updateProviderOrderStatus: RequestHandler =
  catchAsync(async (req, res) => {
    if (!req.user) {
      throw new ApiError(
        401,
        "Authentication required",
      );
    }

    const rentalId = getRouteId(req.params.id);

    const rental =
      await rentalService.updateProviderOrderStatus(
        req.user.id,
        rentalId,
        req.body,
      );

    sendResponse(res, {
      statusCode: 200,
      message:
        "Rental order status updated successfully",
      data: rental,
    });
  });

export const rentalController = {
  createRental,
  getCustomerRentals,
  getCustomerRentalById,
  cancelCustomerRental,
  getProviderOrders,
  getProviderOrderById,
  updateProviderOrderStatus,
};
