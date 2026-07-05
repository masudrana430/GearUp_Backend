import type { Request, Response } from "express";

export const notFound = (req: Request, res: Response): void => {
  res.status(404).json({
    success: false,
    message: "Route not found",
    errorDetails: [
      {
        path: req.originalUrl,
        message: "The requested API endpoint does not exist",
      },
    ],
  });
};