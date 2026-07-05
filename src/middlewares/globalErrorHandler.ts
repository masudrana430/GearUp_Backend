import type {
  ErrorRequestHandler,
  NextFunction,
  Request,
  Response,
} from "express";
import { env } from "../config/env.js";

export const globalErrorHandler: ErrorRequestHandler = (
  error: unknown,
  _req: Request,
  res: Response,
  _next: NextFunction,
): void => {
  const normalizedError =
    error instanceof Error ? error : new Error("Unknown server error");

  if (env.NODE_ENV === "development") {
    console.error(normalizedError);
  }

  res.status(500).json({
    success: false,
    message: "Internal server error",
    errorDetails: [
      {
        message:
          env.NODE_ENV === "development"
            ? normalizedError.message
            : "Something went wrong",
      },
    ],
  });
};