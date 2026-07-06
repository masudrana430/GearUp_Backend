import { Router } from "express";
import { auth } from "../../middlewares/auth.js";
import { validateRequest } from "../../middlewares/validateRequest.js";
import { adminController } from "./admin.controller.js";
import {
  adminGearQueryValidationSchema,
  adminPaymentQueryValidationSchema,
  adminRentalQueryValidationSchema,
  adminUserQueryValidationSchema,
  updateGearStatusValidationSchema,
  updateUserStatusValidationSchema,
} from "./admin.validation.js";

export const adminRouter = Router();

adminRouter.use(auth("ADMIN"));

adminRouter.get(
  "/users",
  validateRequest(adminUserQueryValidationSchema),
  adminController.getUsers,
);

adminRouter.patch(
  "/users/:id/status",
  validateRequest(updateUserStatusValidationSchema),
  adminController.updateUserStatus,
);

adminRouter.get(
  "/gear",
  validateRequest(adminGearQueryValidationSchema),
  adminController.getGear,
);

adminRouter.patch(
  "/gear/:id/status",
  validateRequest(updateGearStatusValidationSchema),
  adminController.updateGearStatus,
);

adminRouter.get(
  "/rentals",
  validateRequest(adminRentalQueryValidationSchema),
  adminController.getRentals,
);

adminRouter.get(
  "/payments",
  validateRequest(adminPaymentQueryValidationSchema),
  adminController.getPayments,
);