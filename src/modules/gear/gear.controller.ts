import type { RequestHandler } from "express";
import { ApiError } from "../../utils/ApiError.js";
import { catchAsync } from "../../utils/catchAsync.js";
import { sendResponse } from "../../utils/sendResponse.js";
import { gearService } from "./gear.service.js";
import type { GearQueryInput } from "./gear.validation.js";

const getPublicGear: RequestHandler = catchAsync(async (_req, res) => {
  const query = res.locals.validated.query as GearQueryInput;

  const result = await gearService.getPublicGear(query);

  sendResponse(res, {
    statusCode: 200,
    message: "Gear items retrieved successfully",
    data: result,
  });
});

const getGearById: RequestHandler = catchAsync(async (req, res) => {
  const gearId = req.params.id;
  if (typeof gearId !== "string") {
    throw new ApiError(400, "Invalid gear ID");
  }
  const gear = await gearService.getGearById(gearId);

  sendResponse(res, {
    statusCode: 200,
    message: "Gear details retrieved successfully",
    data: gear,
  });
});

const createGear: RequestHandler = catchAsync(async (req, res) => {
  if (!req.user) {
    throw new ApiError(401, "Authentication required");
  }

  const gear = await gearService.createGear(req.user.id, req.body);

  sendResponse(res, {
    statusCode: 201,
    message: "Gear item created successfully",
    data: gear,
  });
});

const getProviderGear: RequestHandler = catchAsync(async (req, res) => {
  if (!req.user) {
    throw new ApiError(401, "Authentication required");
  }

  const gearItems = await gearService.getProviderGear(req.user.id);

  sendResponse(res, {
    statusCode: 200,
    message: "Provider gear retrieved successfully",
    data: gearItems,
  });
});

const updateGear: RequestHandler = catchAsync(async (req, res) => {
  if (!req.user) {
    throw new ApiError(401, "Authentication required");
  }

  const gearId = req.params.id;

  if (typeof gearId !== "string") {
    throw new ApiError(400, "Invalid gear ID");
  }

  const gear = await gearService.updateGear(
    req.user.id,
    gearId,
    req.body,
  );

  sendResponse(res, {
    statusCode: 200,
    message: "Gear item updated successfully",
    data: gear,
  });
});

const deleteGear: RequestHandler = catchAsync(async (req, res) => {
  if (!req.user) {
    throw new ApiError(401, "Authentication required");
  }

  const gearId = req.params.id;

  if (typeof gearId !== "string") {
  throw new ApiError(400, "Invalid gear ID");
}

  const gear = await gearService.deleteGear(req.user.id, gearId);

  sendResponse(res, {
    statusCode: 200,
    message: "Gear item deactivated successfully",
    data: gear,
  });
});

export const gearController = {
  getPublicGear,
  getGearById,
  createGear,
  getProviderGear,
  updateGear,
  deleteGear,
};
