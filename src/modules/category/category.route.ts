import { Router } from "express";
import { auth } from "../../middlewares/auth.js";
import { validateRequest } from "../../middlewares/validateRequest.js";
import { categoryController } from "./category.controller.js";
import {
  categoryIdValidationSchema,
  createCategoryValidationSchema,
  updateCategoryValidationSchema,
} from "./category.validation.js";

export const publicCategoryRouter = Router();
export const adminCategoryRouter = Router();

publicCategoryRouter.get(
  "/",
  categoryController.getPublicCategories,
);

adminCategoryRouter.use(auth("ADMIN"));

adminCategoryRouter.get(
  "/",
  categoryController.getAllCategories,
);

adminCategoryRouter.post(
  "/",
  validateRequest(createCategoryValidationSchema),
  categoryController.createCategory,
);

adminCategoryRouter.patch(
  "/:id",
  validateRequest(updateCategoryValidationSchema),
  categoryController.updateCategory,
);

adminCategoryRouter.delete(
  "/:id",
  validateRequest(categoryIdValidationSchema),
  categoryController.deleteCategory,
);