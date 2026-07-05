import type { RequestHandler } from "express";
import type { ZodType } from "zod";
import { ApiError } from "../utils/ApiError.js";

interface ParsedRequest {
  body?: unknown;
  params?: Record<string, string>;
  query?: Record<string, unknown>;
}

export const validateRequest = (schema: ZodType): RequestHandler => {
  return (req, _res, next): void => {
    const result = schema.safeParse({
      body: req.body,
      params: req.params,
      query: req.query,
    });

    if (!result.success) {
      const errorDetails = result.error.issues.map((issue) => ({
        field: issue.path
          .join(".")
          .replace(/^body\./, "")
          .replace(/^params\./, "")
          .replace(/^query\./, ""),
        message: issue.message,
      }));

      next(new ApiError(400, "Validation failed", errorDetails));
      return;
    }

    const parsedData = result.data as ParsedRequest;

    if (parsedData.body !== undefined) {
      req.body = parsedData.body;
    }

    if (parsedData.params !== undefined) {
      req.params = parsedData.params;
    }

    next();
  };
};