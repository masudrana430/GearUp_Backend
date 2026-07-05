export interface ErrorDetail {
  field?: string;
  path?: string;
  message: string;
}

export class ApiError extends Error {
  public readonly statusCode: number;
  public readonly errorDetails: ErrorDetail[];

  constructor(
    statusCode: number,
    message: string,
    errorDetails: ErrorDetail[] = [],
  ) {
    super(message);

    this.name = "ApiError";
    this.statusCode = statusCode;
    this.errorDetails = errorDetails;

    Object.setPrototypeOf(this, new.target.prototype);
    Error.captureStackTrace(this, this.constructor);
  }
}