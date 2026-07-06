import type { RequestHandler } from "express";
import { catchAsync } from "../../utils/catchAsync.js";
import { sendResponse } from "../../utils/sendResponse.js";
import { ApiError } from "../../utils/ApiError.js";
import { authService } from "./auth.service.js";

const register: RequestHandler = catchAsync(
  async (req, res) => {
    const result = await authService.registerUser(req.body);

    sendResponse(res, {
      statusCode: 201,
      message: "User registered successfully",
      data: result,
    });
  },
);

const login: RequestHandler = catchAsync(
  async (req, res) => {
    const result = await authService.loginUser(req.body);

    sendResponse(res, {
      statusCode: 200,
      message: "Login successful",
      data: result,
    });
  },
);

const getMe: RequestHandler = catchAsync(
  async (req, res) => {
    if (!req.user) {
      throw new ApiError(401, "Authentication required");
    }

    const user = await authService.getCurrentUser(req.user.id);

    sendResponse(res, {
      statusCode: 200,
      message: "Current user retrieved successfully",
      data: user,
    });
  },
);

export const authController = {
  register,
  login,
  getMe,
};
