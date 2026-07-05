import { Router } from "express";
import { auth } from "../../middlewares/auth.js";
import { validateRequest } from "../../middlewares/validateRequest.js";
import { gearController } from "./gear.controller.js";
import {
  createGearValidationSchema,
  gearIdValidationSchema,
  gearQueryValidationSchema,
  updateGearValidationSchema,
} from "./gear.validation.js";

export const publicGearRouter = Router();
export const providerGearRouter = Router();

publicGearRouter.get(
  "/",
  validateRequest(gearQueryValidationSchema),
  gearController.getPublicGear,
);

publicGearRouter.get(
  "/:id",
  validateRequest(gearIdValidationSchema),
  gearController.getGearById,
);

providerGearRouter.use(auth("PROVIDER"));

providerGearRouter.get(
  "/",
  gearController.getProviderGear,
);

providerGearRouter.post(
  "/",
  validateRequest(createGearValidationSchema),
  gearController.createGear,
);

providerGearRouter.patch(
  "/:id",
  validateRequest(updateGearValidationSchema),
  gearController.updateGear,
);

providerGearRouter.delete(
  "/:id",
  validateRequest(gearIdValidationSchema),
  gearController.deleteGear,
);