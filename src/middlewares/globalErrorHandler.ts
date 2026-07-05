import type { ErrorRequestHandler } from "express";
import { ZodError } from "zod";
import { env } from "../config/env.js";
import { ApiError, type ErrorDetail } from "../utils/ApiError.js";

interface UnknownErrorObject {
  code?: unknown;
  message?: unknown;
  stack?: unknown;
}

const isErrorObject = (error: unknown): error is UnknownErrorObject => {
  return typeof error === "object" && error !== null;
};

export const globalErrorHandler: ErrorRequestHandler = (
  error: unknown,
  _req,
  res,
  next,
): void => {
  if (res.headersSent) {
    next(error);
    return;
  }

  let statusCode = 500;
  let message = "Internal server error";
  let errorDetails: ErrorDetail[] = [
    {
      message: "Something went wrong",
    },
  ];

  if (error instanceof ApiError) {
    statusCode = error.statusCode;
    message = error.message;
    errorDetails =
      error.errorDetails.length > 0
        ? error.errorDetails
        : [{ message: error.message }];
  } else if (error instanceof ZodError) {
    statusCode = 400;
    message = "Validation failed";
    errorDetails = error.issues.map((issue) => ({
      field: issue.path.join("."),
      message: issue.message,
    }));
  } else if (isErrorObject(error) && error.code === "P2002") {
    statusCode = 409;
    message = "Duplicate value";
    errorDetails = [
      {
        message: "A record with this unique value already exists",
      },
    ];
  } else if (isErrorObject(error) && error.code === "P2025") {
    statusCode = 404;
    message = "Record not found";
    errorDetails = [
      {
        message: "The requested database record was not found",
      },
    ];
  } else if (error instanceof Error) {
    errorDetails = [
      {
        message:
          env.NODE_ENV === "development"
            ? error.message
            : "Something went wrong",
      },
    ];
  }

  if (env.NODE_ENV === "development") {
    console.error(error);
  }

  res.status(statusCode).json({
    success: false,
    message,
    errorDetails,
  });
};