import type { RequestHandler } from "express";
import { ApiError } from "../../utils/ApiError.js";
import { catchAsync } from "../../utils/catchAsync.js";
import { sendResponse } from "../../utils/sendResponse.js";
import type {
  AdminGearQuery,
  AdminPaymentQuery,
  AdminRentalQuery,
  AdminUserQuery,
} from "./admin.interface.js";
import { adminService } from "./admin.service.js";

const getRouteId = (
  value: string | string[] | undefined,
): string => {
  if (typeof value !== "string") {
    throw new ApiError(400, "Invalid resource ID");
  }

  return value;
};

const getUsers: RequestHandler = catchAsync(
  async (_req, res) => {
    const query = res.locals.validated
      .query as AdminUserQuery;

    const result = await adminService.getUsers(query);

    sendResponse(res, {
      statusCode: 200,
      message: "Users retrieved successfully",
      data: result,
    });
  },
);

const updateUserStatus: RequestHandler = catchAsync(
  async (req, res) => {
    if (!req.user) {
      throw new ApiError(
        401,
        "Authentication required",
      );
    }

    const userId = getRouteId(req.params.id);

    const user = await adminService.updateUserStatus(
      req.user.id,
      userId,
      req.body.status,
    );

    sendResponse(res, {
      statusCode: 200,
      message: "User status updated successfully",
      data: user,
    });
  },
);

const getGear: RequestHandler = catchAsync(
  async (_req, res) => {
    const query = res.locals.validated
      .query as AdminGearQuery;

    const result = await adminService.getGear(query);

    sendResponse(res, {
      statusCode: 200,
      message: "Gear listings retrieved successfully",
      data: result,
    });
  },
);

const updateGearStatus: RequestHandler = catchAsync(
  async (req, res) => {
    const gearId = getRouteId(req.params.id);

    const gear = await adminService.updateGearStatus(
      gearId,
      req.body.isActive,
    );

    sendResponse(res, {
      statusCode: 200,
      message: "Gear status updated successfully",
      data: gear,
    });
  },
);

const getRentals: RequestHandler = catchAsync(
  async (_req, res) => {
    const query = res.locals.validated
      .query as AdminRentalQuery;

    const result =
      await adminService.getRentals(query);

    sendResponse(res, {
      statusCode: 200,
      message: "Rental orders retrieved successfully",
      data: result,
    });
  },
);

const getPayments: RequestHandler = catchAsync(
  async (_req, res) => {
    const query = res.locals.validated
      .query as AdminPaymentQuery;

    const result =
      await adminService.getPayments(query);

    sendResponse(res, {
      statusCode: 200,
      message: "Payments retrieved successfully",
      data: result,
    });
  },
);

export const adminController = {
  getUsers,
  updateUserStatus,
  getGear,
  updateGearStatus,
  getRentals,
  getPayments,
};