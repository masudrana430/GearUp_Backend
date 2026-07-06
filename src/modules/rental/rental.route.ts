import { Router } from "express";
import { auth } from "../../middlewares/auth.js";
import { validateRequest } from "../../middlewares/validateRequest.js";
import { rentalController } from "./rental.controller.js";
import {
  createRentalValidationSchema,
  rentalIdValidationSchema,
  rentalQueryValidationSchema,
  updateRentalStatusValidationSchema,
} from "./rental.validation.js";

export const customerRentalRouter = Router();
export const providerOrderRouter = Router();

customerRentalRouter.use(auth("CUSTOMER"));

customerRentalRouter.post(
  "/",
  validateRequest(createRentalValidationSchema),
  rentalController.createRental,
);

customerRentalRouter.get(
  "/",
  validateRequest(rentalQueryValidationSchema),
  rentalController.getCustomerRentals,
);

customerRentalRouter.get(
  "/:id",
  validateRequest(rentalIdValidationSchema),
  rentalController.getCustomerRentalById,
);

customerRentalRouter.patch(
  "/:id/cancel",
  validateRequest(rentalIdValidationSchema),
  rentalController.cancelCustomerRental,
);

providerOrderRouter.use(auth("PROVIDER"));

providerOrderRouter.get(
  "/",
  validateRequest(rentalQueryValidationSchema),
  rentalController.getProviderOrders,
);

providerOrderRouter.get(
  "/:id",
  validateRequest(rentalIdValidationSchema),
  rentalController.getProviderOrderById,
);

providerOrderRouter.patch(
  "/:id/status",
  validateRequest(
    updateRentalStatusValidationSchema,
  ),
  rentalController.updateProviderOrderStatus,
);