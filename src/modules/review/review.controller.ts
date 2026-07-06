import type { RequestHandler } from "express";
import type { UserRole } from "@prisma/client";
import { ApiError } from "../../utils/ApiError.js";
import { catchAsync } from "../../utils/catchAsync.js";
import { sendResponse } from "../../utils/sendResponse.js";
import type { ReviewQueryInput } from "./review.interface.js";
import { reviewService } from "./review.service.js";

const getRouteId = (
  value: string | string[] | undefined,
  fieldName: string,
): string => {
  if (typeof value !== "string") {
    throw new ApiError(400, `Invalid ${fieldName}`);
  }

  return value;
};

const createReview: RequestHandler = catchAsync(
  async (req, res) => {
    if (!req.user) {
      throw new ApiError(
        401,
        "Authentication required",
      );
    }

    const review = await reviewService.createReview(
      req.user.id,
      req.body,
    );

    sendResponse(res, {
      statusCode: 201,
      message: "Review created successfully",
      data: review,
    });
  },
);

const getGearReviews: RequestHandler = catchAsync(
  async (req, res) => {
    const gearId = getRouteId(
      req.params.gearId,
      "gearId",
    );

    const query = res.locals.validated
      .query as ReviewQueryInput;

    const result = await reviewService.getGearReviews(
      gearId,
      query,
    );

    sendResponse(res, {
      statusCode: 200,
      message: "Gear reviews retrieved successfully",
      data: result,
    });
  },
);

const updateReview: RequestHandler = catchAsync(
  async (req, res) => {
    if (!req.user) {
      throw new ApiError(
        401,
        "Authentication required",
      );
    }

    const reviewId = getRouteId(
      req.params.id,
      "id",
    );

    const review = await reviewService.updateReview(
      req.user.id,
      reviewId,
      req.body,
    );

    sendResponse(res, {
      statusCode: 200,
      message: "Review updated successfully",
      data: review,
    });
  },
);

const deleteReview: RequestHandler = catchAsync(
  async (req, res) => {
    if (!req.user) {
      throw new ApiError(
        401,
        "Authentication required",
      );
    }

    const reviewId = getRouteId(
      req.params.id,
      "id",
    );

    const result = await reviewService.deleteReview(
      req.user.id,
      req.user.role as UserRole,
      reviewId,
    );

    sendResponse(res, {
      statusCode: 200,
      message: "Review deleted successfully",
      data: result,
    });
  },
);

export const reviewController = {
  createReview,
  getGearReviews,
  updateReview,
  deleteReview,
};