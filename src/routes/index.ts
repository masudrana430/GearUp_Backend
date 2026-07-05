import { Router } from "express";

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

export const apiRouter = router;