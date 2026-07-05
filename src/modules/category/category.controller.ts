import type { RequestHandler } from "express";
import { ApiError } from "../../utils/ApiError.js";
import { catchAsync } from "../../utils/catchAsync.js";
import { sendResponse } from "../../utils/sendResponse.js";
import { categoryService } from "./category.service.js";

const getPublicCategories: RequestHandler = catchAsync(
  async (_req, res) => {
    const categories =
      await categoryService.getPublicCategories();

    sendResponse(res, {
      statusCode: 200,
      message: "Categories retrieved successfully",
      data: categories,
    });
  },
);

const getAllCategories: RequestHandler = catchAsync(
  async (_req, res) => {
    const categories =
      await categoryService.getAllCategories();

    sendResponse(res, {
      statusCode: 200,
      message: "All categories retrieved successfully",
      data: categories,
    });
  },
);

const createCategory: RequestHandler = catchAsync(
  async (req, res) => {
    const category = await categoryService.createCategory(
      req.body,
    );

    sendResponse(res, {
      statusCode: 201,
      message: "Category created successfully",
      data: category,
    });
  },
);

const updateCategory: RequestHandler = catchAsync(
  async (req, res) => {
    const categoryId = req.params.id;

    if (typeof categoryId !== "string") {
      throw new ApiError(400, "Invalid category ID", [
        {
          field: "id",
          message: "Category ID must be a valid string",
        },
      ]);
    }

    const category = await categoryService.updateCategory(
      categoryId,
      req.body,
    );

    sendResponse(res, {
      statusCode: 200,
      message: "Category updated successfully",
      data: category,
    });
  },
);

const deleteCategory: RequestHandler = catchAsync(
  async (req, res) => {
    const categoryId = req.params.id;

    if (typeof categoryId !== "string") {
      throw new ApiError(400, "Invalid category ID", [
        {
          field: "id",
          message: "Category ID must be a valid string",
        },
      ]);
    }

    const category =
      await categoryService.deleteCategory(categoryId);

    sendResponse(res, {
      statusCode: 200,
      message: "Category deactivated successfully",
      data: category,
    });
  },
);

export const categoryController = {
  getPublicCategories,
  getAllCategories,
  createCategory,
  updateCategory,
  deleteCategory,
};