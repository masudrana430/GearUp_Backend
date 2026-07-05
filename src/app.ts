import cookieParser from "cookie-parser";
import cors from "cors";
import express from "express";
import helmet from "helmet";
import morgan from "morgan";
import { globalErrorHandler } from "./middlewares/globalErrorHandler.js";
import { notFound } from "./middlewares/notFound.js";
import { apiRouter } from "./routes/index.js";

const app = express();

app.use(helmet());

app.use(
  cors({
    origin: true,
    credentials: true,
  }),
);

app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());
app.use(morgan("dev"));

app.get("/", (_req, res) => {
  res.status(200).json({
    success: true,
    message: "Welcome to GearUp API",
    data: {
      name: "GearUp",
      description: "Rent Sports & Outdoor Gear Instantly",
      version: "1.0.0",
    },
  });
});

app.use("/api/v1", apiRouter);

app.use(notFound);
app.use(globalErrorHandler);

export default app;