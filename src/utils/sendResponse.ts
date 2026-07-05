import type { Response } from "express";

interface ResponseOptions<T> {
  statusCode: number;
  success?: boolean;
  message: string;
  data: T;
}

export const sendResponse = <T>(
  res: Response,
  options: ResponseOptions<T>,
): void => {
  res.status(options.statusCode).json({
    success: options.success ?? true,
    message: options.message,
    data: options.data,
  });
};