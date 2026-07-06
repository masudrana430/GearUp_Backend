import { Router } from "express";
import { auth } from "../../middlewares/auth.js";
import { validateRequest } from "../../middlewares/validateRequest.js";
import { reviewController } from "./review.controller.js";
import {
  createReviewValidationSchema,
  gearReviewValidationSchema,
  reviewIdValidationSchema,
  updateReviewValidationSchema,
} from "./review.validation.js";

export const reviewRouter = Router();

/*
 * Public reviews
 */

reviewRouter.get(
  "/gear/:gearId",
  validateRequest(gearReviewValidationSchema),
  reviewController.getGearReviews,
);

/*
 * Customer review operations
 */

reviewRouter.post(
  "/",
  auth("CUSTOMER"),
  validateRequest(createReviewValidationSchema),
  reviewController.createReview,
);

reviewRouter.patch(
  "/:id",
  auth("CUSTOMER"),
  validateRequest(updateReviewValidationSchema),
  reviewController.updateReview,
);

/*
 * Customer owner or admin deletion
 */

reviewRouter.delete(
  "/:id",
  auth("CUSTOMER", "ADMIN"),
  validateRequest(reviewIdValidationSchema),
  reviewController.deleteReview,
);