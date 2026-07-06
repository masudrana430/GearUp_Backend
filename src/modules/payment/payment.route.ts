import { Router } from "express";
import { auth } from "../../middlewares/auth.js";
import { validateRequest } from "../../middlewares/validateRequest.js";
import { paymentController } from "./payment.controller.js";
import {
  callbackValidationSchema,
  initiatePaymentValidationSchema,
  paymentIdValidationSchema,
  paymentQueryValidationSchema,
  successfulCallbackValidationSchema,
} from "./payment.validation.js";

export const paymentRouter = Router();

/*
 * Public SSLCommerz callbacks
 */

paymentRouter.post(
  "/success",
  validateRequest(
    successfulCallbackValidationSchema,
  ),
  paymentController.handleSuccess,
);

paymentRouter.post(
  "/ipn",
  validateRequest(callbackValidationSchema),
  paymentController.handleIpn,
);

paymentRouter.post(
  "/fail",
  validateRequest(callbackValidationSchema),
  paymentController.handleFailure,
);

paymentRouter.post(
  "/cancel",
  validateRequest(callbackValidationSchema),
  paymentController.handleCancellation,
);

/*
 * Customer-protected endpoints
 */

paymentRouter.use(auth("CUSTOMER"));

paymentRouter.post(
  "/:rentalId/initiate",
  validateRequest(
    initiatePaymentValidationSchema,
  ),
  paymentController.initiatePayment,
);

paymentRouter.get(
  "/",
  validateRequest(
    paymentQueryValidationSchema,
  ),
  paymentController.getCustomerPayments,
);

paymentRouter.get(
  "/:id",
  validateRequest(
    paymentIdValidationSchema,
  ),
  paymentController.getCustomerPaymentById,
);