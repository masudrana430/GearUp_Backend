import { Router } from "express";
import { authRouter } from "../modules/auth/auth.route.js";

const router = Router();

router.get("/health", (_req, res) => {
  res.status(200).json({
    success: true,
    message: "GearUp API is running",
    data: {
      status: "healthy",
      timestamp: new Date().toISOString(),
    },
  });
});

router.use("/auth", authRouter);

export const apiRouter = router;