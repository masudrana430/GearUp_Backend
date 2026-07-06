import { Router } from "express";
import { authRouter } from "../modules/auth/auth.route.js";
import {
  adminCategoryRouter,
  publicCategoryRouter,
} from "../modules/category/category.route.js";
import {
  providerGearRouter,
  publicGearRouter,
} from "../modules/gear/gear.route.js";
import {
  customerRentalRouter,
  providerOrderRouter,
} from "../modules/rental/rental.route.js";
import { paymentRouter } from "../modules/payment/payment.route.js";
import { reviewRouter } from "../modules/review/review.route.js";
import { adminRouter } from "../modules/admin/admin.route.js";

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

router.use("/categories", publicCategoryRouter);
router.use("/gear", publicGearRouter);
router.use("/reviews", reviewRouter);

router.use(
  "/admin/categories",
  adminCategoryRouter,
);

router.use("/admin", adminRouter);

router.use(
  "/provider/gear",
  providerGearRouter,
);

router.use(
  "/provider/orders",
  providerOrderRouter,
);

router.use(
  "/rentals",
  customerRentalRouter,
);



router.use("/payments", paymentRouter);

export const apiRouter = router;