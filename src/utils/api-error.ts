export class ApiError extends Error {
  isOperational: boolean;

  statusCode: number;

  code: string;

  type: string;

  field: string;

  constructor(
    statusCode: number,
    message: string,
    isOperational = true,
    stack = "",
  ) {
    super(message);
    this.statusCode = statusCode;
    this.isOperational = isOperational;
    if (stack) {
      this.stack = stack;
    } else {
      Error.captureStackTrace(this, this.constructor);
    }
  }
}
