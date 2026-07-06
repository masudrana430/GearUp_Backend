import { Router } from "express";
import { auth } from "../../middlewares/auth.js";
import { validateRequest } from "../../middlewares/validateRequest.js";
import { authController } from "./auth.controller.js";
import {
  loginValidationSchema,
  registerValidationSchema,
} from "./auth.validation.js";

const router = Router();

router.post(
  "/register",
  validateRequest(registerValidationSchema),
  authController.register,
);

router.post(
  "/login",
  validateRequest(loginValidationSchema),
  authController.login,
);

router.get(
  "/me",
  auth(),
  authController.getMe,
);

export const authRouter = router;
